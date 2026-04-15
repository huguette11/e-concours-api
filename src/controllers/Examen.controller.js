import { prisma } from "../prisma.js";

export class ExamenController {


   static async getByConcours(req, res) {
    try {
      const { id_concours } = req.params;

      const examens = await prisma.examen.findMany({
        where: { id_concours: parseInt(id_concours) }
      });

      return res.status(200).json(examens);

    } catch (err) {
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ─── GET /api/examens/concours/:id_concours ───────────────
  static async getExamensDuConcours(req, res) {
    try {
      // parseInt car id_concours est un Int dans le schéma
      const id_concours = parseInt(req.params.id_concours);

      if (isNaN(id_concours)) {
        return res.status(400).json({ error: "id_concours invalide" });
      }

      const concours = await prisma.concours.findUnique({
        where: { id_concours },
        select: { id_concours: true, nom: true },
      });

      if (!concours) {
        return res.status(404).json({ error: "Concours introuvable" });
      }

      const examens = await prisma.examen.findMany({
        where: { id_concours },
        select: {
          id_examen:   true,
          intitule:    true,
          type_examen: true,
          date_examen: true,
          heure:       true,
          lieu:        true,
          coefficient: true,
        },
        orderBy: { date_examen: "asc" },
      });

      return res.status(200).json({
        message: "Examens récupérés",
        concours: concours.nom,
        total:    examens.length,
        data:     examens,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ─── GET /api/examens/detail/:id_examen ──────────────────
  async getExamen(req, res) {
    try {
      const id_candidat = req.user.id;
      // parseInt car id_examen est un Int dans le schéma
      const id_examen   = parseInt(req.params.id_examen);

      if (isNaN(id_examen)) {
        return res.status(400).json({ error: "id_examen invalide" });
      }

      const examen = await prisma.examen.findUnique({
        where: { id_examen },
        select: {
          id_examen:   true,
          intitule:    true,
          type_examen: true,
          date_examen: true,
          heure:       true,
          lieu:        true,
          coefficient: true,
          concours: {
            select: {
              id_concours: true,
              nom:         true,
            },
          },
          resultat: {
            where:  { id_candidat },
            select: {
              note:             true,
              moyenne_generale: true,
              statut:           true,
            },
          },
        },
      });

      if (!examen) {
        return res.status(404).json({ error: "Examen introuvable" });
      }

      const monResultat = examen.resultat[0] ?? null;

      return res.status(200).json({
        message: "Examen récupéré",
        data: {
          id_examen:    examen.id_examen,
          intitule:     examen.intitule,
          type_examen:  examen.type_examen,
          date_examen:  examen.date_examen,
          heure:        examen.heure,
          lieu:         examen.lieu,
          coefficient:  examen.coefficient,
          concours:     examen.concours,
          mon_resultat: monResultat,
        },
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ─── GET /api/examens/mes-resultats ──────────────────────
  async getMesResultats(req, res) {
    try {
      const id_candidat = req.user.id;

      const resultats = await prisma.resultat.findMany({
        where: { id_candidat },
        select: {
          note:             true,
          moyenne_generale: true,
          statut:           true,
          examen: {
            select: {
              id_examen:   true,
              intitule:    true,
              type_examen: true,
              date_examen: true,
              lieu:        true,
              coefficient: true,
              concours: {
                select: {
                  nom:  true,
                  type: true,
                },
              },
            },
          },
        },
      });

      const parConcours = resultats.reduce((acc, r) => {
        const nomConcours = r.examen.concours.nom;
        if (!acc[nomConcours]) {
          acc[nomConcours] = {
            concours: r.examen.concours,
            examens:  [],
          };
        }
        acc[nomConcours].examens.push({
          id_examen:        r.examen.id_examen,
          intitule:         r.examen.intitule,
          type_examen:      r.examen.type_examen,
          date_examen:      r.examen.date_examen,
          lieu:             r.examen.lieu,
          coefficient:      r.examen.coefficient,
          note:             r.note,
          moyenne_generale: r.moyenne_generale,
          statut:           r.statut,
        });
        return acc;
      }, {});

      return res.status(200).json({
        message: "Résultats récupérés",
        data:    Object.values(parConcours),
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
}