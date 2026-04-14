import { prisma } from "../prisma.js";
import bcrypt from "bcrypt";

export class CandidatController {

 
 static async getProfil(req, res) {
    try {
      const id_candidat = req.user.id;

      const candidat = await prisma.candidat.findUnique({
        where: { id_candidat },
        select: {
          nom:             true,
          prenom:          true,
          nom_jeune_fille: true,
          sexe:            true,
          date_naissance:  true,
          lieu_naissance:  true,
          pays_naissance:  true,
          numero_cnib:     true,
          date_delivrance: true,
          telephone:       true,
          email:           true,
          type_candidat:   true,
          emploi:          true,
          matricule:       true,
          ministere:       true,
          statut_compte:   true,
          recepisse:       true,
          date_creation:   true,
          document: {
            select: {
              type_document: true,
              fichier:       true,
              date_upload:   true,
            },
          },
        },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Candidat introuvable" });
      }

      return res.status(200).json({
        message: "Profil récupéré",
        data: candidat,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

 static  async updateProfil(req, res) {
    try {
      const id_candidat = req.user.id;
      const {
        telephone,
        lieu_naissance,
        nom_jeune_fille,
        ancien_mot_de_passe,
        nouveau_mot_de_passe,
        emploi,
        ministere,
        matricule,
      } = req.body;

      const candidat = await prisma.candidat.findUnique({
        where: { id_candidat },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Candidat introuvable" });
      }

      const dataToUpdate = {};
      if (telephone)       dataToUpdate.telephone       = telephone;
      if (lieu_naissance)  dataToUpdate.lieu_naissance  = lieu_naissance;
      if (nom_jeune_fille) dataToUpdate.nom_jeune_fille = nom_jeune_fille;
      if (emploi)          dataToUpdate.emploi          = emploi;
      if (ministere)       dataToUpdate.ministere       = ministere;
      if (matricule)       dataToUpdate.matricule       = matricule;

      if (nouveau_mot_de_passe) {
        if (!ancien_mot_de_passe) {
          return res.status(400).json({
            error: "L'ancien mot de passe est requis",
          });
        }
        const correct = await bcrypt.compare(
          ancien_mot_de_passe,
          candidat.mot_de_passe
        );
        if (!correct) {
          return res.status(401).json({
            error: "Ancien mot de passe incorrect",
          });
        }
        dataToUpdate.mot_de_passe = await bcrypt.hash(nouveau_mot_de_passe, 10);
      }

      if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({
          error: "Aucune donnée à mettre à jour",
        });
      }

      const updated = await prisma.candidat.update({
        where: { id_candidat },
        data:  dataToUpdate,
        select: {
          nom:             true,
          prenom:          true,
          email:           true,
          telephone:       true,
          lieu_naissance:  true,
          nom_jeune_fille: true,
          emploi:          true,
          matricule:       true,
          ministere:       true,
        },
      });

      return res.status(200).json({
        message: "Profil mis à jour",
        data: updated,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }


  static async getMesCandidatures(req, res) {
    try {
      const id_candidat = req.user.id;

      const inscriptions = await prisma.inscription.findMany({
        where: { id_candidat },
        include: {
          concours: {
            select: {
              nom:               true,
              type:              true,
              frais_inscription: true,
              statut_concours:   true,
            },
          },
          paiement: {
            select: {
              statut_paiement:       true,
              reference_transaction: true,
              mode_paiement:         true,
              date_paiement:         true,
              montant:               true,
            },
            orderBy: { date_paiement: "desc" },
            take: 1,
          },
        },
        orderBy: { date_inscription: "desc" },
      });

      const data = inscriptions.map((insc) => {
        const dernierPaiement = insc.paiement[0] ?? null;
        return {
          date_inscription:    insc.date_inscription,
          statut_inscription:  insc.statut_inscription,
          concours:            insc.concours,
          paiement:            dernierPaiement,
          recepisse_disponible: dernierPaiement?.statut_paiement === "REUSSI",
        };
      });

      return res.status(200).json({
        message: "Candidatures récupérées",
        data,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }


  static async getRecepisse(req, res) {
    try {
      const id_candidat    = req.user.id;
      const id_inscription = parseInt(req.params.id_inscription);

      if (isNaN(id_inscription)) {
        return res.status(400).json({ error: "id_inscription invalide" });
      }

      const inscription = await prisma.inscription.findFirst({
        where: { id_inscription, id_candidat },
        include: {
          concours: { select: { nom: true } },
          paiement: {
            orderBy: { date_paiement: "desc" },
            take: 1,
          },
        },
      });

      if (!inscription) {
        return res.status(404).json({ error: "Inscription introuvable" });
      }

      const paiement = inscription.paiement[0] ?? null;

      if (!paiement || paiement.statut_paiement !== "REUSSI") {
        return res.status(404).json({
          error: "Récépissé non disponible, paiement en attente",
        });
      }

      const candidat = await prisma.candidat.findUnique({
        where: { id_candidat },
        select: { nom: true, prenom: true, numero_cnib: true },
      });

      return res.status(200).json({
        message: "Données récépissé",
        data: {
          candidat:              `${candidat.nom} ${candidat.prenom}`,
          numero_cnib:           candidat.numero_cnib,
          concours:              inscription.concours.nom,
          date_inscription:      inscription.date_inscription,
          montant_paye:          paiement.montant,
          reference_transaction: paiement.reference_transaction,
        },
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  
   static async getResultats(req, res) {
    try {
      const id_candidat = req.user.id;

      const resultats = await prisma.resultat.findMany({
        where: { id_candidat },
        include: {
          examen: {
            select: {
              intitule:    true,
              date_examen: true,
              lieu:        true,
              type_examen: true,
              coefficient: true,
              concours: {
                select: { nom: true, type: true },
              },
            },
          },
        },
      });

      // Grouper par concours
      const parConcours = resultats.reduce((acc, r) => {
        const nomConcours = r.examen.concours.nom;

        if (!acc[nomConcours]) {
          acc[nomConcours] = {
            concours: r.examen.concours,
            examens:  [],
          };
        }

        acc[nomConcours].examens.push({
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