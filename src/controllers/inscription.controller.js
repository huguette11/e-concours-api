import { prisma } from "../prisma.js";

export class InscriptionController {

  // ─── POST /api/inscriptions ───────────────────────────────
  async sInscrire(req, res) {
    try {
      const id_candidat = req.user.id;
      const { id_concours } = req.body;

      if (!id_concours) {
        return res.status(400).json({ error: "id_concours est requis" });
      }

      const concours = await prisma.concours.findUnique({
        where: { id_concours },
      });

      if (!concours) {
        return res.status(404).json({ error: "Concours introuvable" });
      }

      if (concours.statut_concours !== "ouvert") {
        return res.status(400).json({
          error: "Ce concours n'est plus ouvert aux inscriptions",
        });
      }

      const aujourd_hui = new Date();
      if (aujourd_hui < concours.date_debut || aujourd_hui > concours.date_fin) {
        return res.status(400).json({
          error: "La période d'inscription est fermée",
        });
      }

      // Vérifier si déjà inscrit — peu importe le statut
      const dejaInscrit = await prisma.inscription.findFirst({
        where: { id_candidat, id_concours },
      });

      if (dejaInscrit) {
        // Message précis selon le statut
        const messageStatut = dejaInscrit.statut_inscription === "validee"
          ? "Vous êtes déjà inscrit et votre paiement est validé"
          : "Vous avez déjà une inscription en attente de paiement";

        return res.status(409).json({
          error: messageStatut,
          id_inscription: dejaInscrit.id_inscription,
        });
      }

      const inscription = await prisma.inscription.create({
        data: {
          id_candidat,
          id_concours,
          statut_inscription: "en_attente",
        },
        select: {
          id_inscription:     true,
          date_inscription:   true,
          statut_inscription: true,
          concours: {
            select: {
              nom:               true,
              frais_inscription: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Inscription créée — en attente de paiement",
        data: {
          id_inscription:     inscription.id_inscription,
          date_inscription:   inscription.date_inscription,
          statut_inscription: inscription.statut_inscription,
          concours:           inscription.concours,
          prochaine_etape:    "Effectuez le paiement pour confirmer votre dossier",
        },
      });

    } catch (err) {
      console.error(err);
      if (err.code === "P2002") {
        return res.status(409).json({
          error: "Vous êtes déjà inscrit à ce concours",
        });
      }
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ─── GET /api/inscriptions/:id_inscription ────────────────
  async getInscription(req, res) {
    try {
      const id_candidat        = req.user.id;
      const { id_inscription } = req.params;

      const inscription = await prisma.inscription.findFirst({
        where: { id_inscription, id_candidat },
        select: {
          id_inscription:     true,
          date_inscription:   true,
          statut_inscription: true,
          concours: {
            select: {
              nom:               true,
              type:              true,
              frais_inscription: true,
              date_debut:        true,
              date_fin:          true,
            },
          },
          paiement: {
            select: {
              statut_paiement:       true,
              mode_paiement:         true,
              montant:               true,
              reference_transaction: true,
              date_paiement:         true,
            },
            orderBy: { date_paiement: "desc" },
            take: 1,
          },
        },
      });

      if (!inscription) {
        return res.status(404).json({ error: "Inscription introuvable" });
      }

      const paiement = inscription.paiement[0] ?? null;

      return res.status(200).json({
        message: "Inscription récupérée",
        data: {
          id_inscription:      inscription.id_inscription,
          date_inscription:    inscription.date_inscription,
          statut_inscription:  inscription.statut_inscription,
          concours:            inscription.concours,
          paiement,
          recepisse_disponible: paiement?.statut_paiement === "reussi",
        },
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
}