import { prisma } from "../prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export class AdminController {
  static async Register(req, res) {
    try {
      const { email, mot_de_passe, nom, prenom, telephone, role } = req.body;

      //verifier s'il a deja un compte si oui lui informer
      if (await prisma.admin.findUnique({ where: { email } })) {
        return res
          .status(409)
          .json({ error: "vous avez deja un compte veuillez vous connecter" });
      }
      const passwordHash = await bcrypt.hash(mot_de_passe, 10);
      const RegisterAdmin = await prisma.$transaction(async ($tx) => {
        const admin = await $tx.admin.create({
          data: {
            email,
            mot_de_passe: passwordHash,
            nom,
            prenom,
            telephone,
            role,
            date_creation: new Date(),
            updated_at: new Date(),
          },
        });
        return admin;
      });

      // peut etre verifier la credibilite de l'admin en l'envoyant un mail de confirmation
      res.status(201).json({
        message: "votre compte a ete creer avec succes",
        id: RegisterAdmin.id_admin,
      });
    } catch (err) {
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }

  static async Login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res
          .status(400)
          .json({ error: "les champs ne sont pas correctement remplis" });

      const admin = await prisma.admin.findUnique({ where: { email } });

      if (!admin) return res.status(404).json({ error: "Aucun Admin trouve" });

      if (admin && admin.actif === false)
        return res.status(401).json({
          error:
            "votre compte n'\a pas ete active. veuillez l\'active pour pouvoir continuer a effectuer des actions",
        });
      if (!(await bcrypt.compare(password, admin.mot_de_passe))) {
        return res
          .status(401)
          .json({ error: "les informations de connexion sont errones" });
      }
      const token = await jwt.sign(
        {
          id: admin.id_admin,
          email: admin.email,
          role: admin.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );

      return res.status(200).json({
        token: token,
        message: "connexion reussi",
      });
    } catch (err) {
      res.status(500).json({ error: "une erreur est survenue " });
    }
  }

  static async Dashboard(req, res) {
    try {
      const [
        nbConcours,
        nbConcoursOuverts,
        nbDepot,
        nbDepotEnAttente,
        nbDepotValides,
        nbDepotRejetes,
        nbCandidats,
        nbCandidatsDirect,
        nbCandidatsProfessionnel,
        nbPaiements,
        nbPaiementsConfirmes,
        nbPaiementsEnAttente,
        montantTotal,
        nbAdmis,
        concoursRecents,
        inscriptionsRecentes,
        paiementsRecents,
        concoursParType,
        inscriptionsParJour,
      ] = await Promise.all([
        prisma.concours.count(),

        prisma.concours.count({
          where: { statut_concours: "ouvert" },
        }),

        prisma.inscription.count(),

        prisma.inscription.count({
          where: { statut_inscription: "en_attente" },
        }),

        prisma.inscription.count({
          where: { statut_inscription: "valide" },
        }),

        prisma.inscription.count({
          where: { statut_inscription: "rejete" },
        }),

        prisma.candidat.count(),

        prisma.candidat.count({
          where: { type_candidat: "DIRECT" },
        }),

        prisma.candidat.count({
          where: { type_candidat: "PROFESSIONNEL" },
        }),

        prisma.paiement.count(),

        prisma.paiement.count({
          where: { statut_paiement: "confirme" },
        }),

        prisma.paiement.count({
          where: { statut_paiement: "en_attente" },
        }),

        prisma.paiement.aggregate({
          _sum: { montant: true },
          where: { statut_paiement: "confirme" },
        }),

        prisma.resultat.count({
          where: { statut: "admis" },
        }),

        prisma.concours.findMany({
          take: 5,
          orderBy: { date_debut: "desc" },
          select: {
            id_concours: true,
            nom: true,
            type: true,
            statut_concours: true,
            date_debut: true,
            date_fin: true,
            nombre_postes: true,
            _count: { select: { inscription: true } },
          },
        }),

        prisma.inscription.findMany({
          take: 10,
          orderBy: { date_inscription: "desc" },
          select: {
            id_inscription: true,
            date_inscription: true,
            statut_inscription: true,
            candidat: {
              select: {
                nom: true,
                prenom: true,
                email: true,
                type_candidat: true,
              },
            },
            concours: {
              select: { nom: true, type: true },
            },
            paiement: {
              select: {
                statut_paiement: true,
                montant: true,
                mode_paiement: true,
              },
            },
          },
        }),

        prisma.paiement.findMany({
          take: 5,
          orderBy: { date_paiement: "desc" },
          select: {
            id_paiement: true,
            montant: true,
            mode_paiement: true,
            statut_paiement: true,
            date_paiement: true,
            reference_transaction: true,
            inscription: {
              select: {
                candidat: { select: { nom: true, prenom: true } },
                concours: { select: { nom: true } },
              },
            },
          },
        }),

        prisma.concours.groupBy({
          by: ["type"],
          _count: { _all: true },
        }),

        prisma.inscription.groupBy({
          by: ["date_inscription"],
          _count: { _all: true },
          orderBy: { date_inscription: "asc" },
          where: {
            date_inscription: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          concours: {
            total: nbConcours,
            ouverts: nbConcoursOuverts,
            fermes: nbConcours - nbConcoursOuverts,
            parType: concoursParType,
            recents: concoursRecents,
          },
          inscriptions: {
            total: nbDepot,
            en_attente: nbDepotEnAttente,
            valides: nbDepotValides,
            rejetes: nbDepotRejetes,
            taux_validation:
              nbDepot > 0
                ? ((nbDepotValides / nbDepot) * 100).toFixed(1) + "%"
                : "0%",
            parJour: inscriptionsParJour,
            recentes: inscriptionsRecentes,
          },
          candidats: {
            total: nbCandidats,
            direct: nbCandidatsDirect,
            professionnel: nbCandidatsProfessionnel,
          },
          paiements: {
            total: nbPaiements,
            confirmes: nbPaiementsConfirmes,
            en_attente: nbPaiementsEnAttente,
            montant_total: montantTotal._sum.montant ?? 0,
            recents: paiementsRecents,
          },
          resultats: {
            total_admis: nbAdmis,
          },
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur serveur" });
    }
  }

  /// methode pour creer un concours ...

  static async CreateConcours(req, res) {
    try {
      const {
        nom,
        type,
        description,
        nombre_postes,
        annee,
        date_debut,
        date_fin,
        statut_concours,
      } = req.body;

      const id_admin = req.admin.id_admin;

      if (!id_admin || req.admin.actif === false) {
        return res.status(401).json({
          error: "vous n'etes pas autoriser a effectuer cette action",
        });
      }

      // voir si un concours du meme nom n'est pas dans la base de donnnes

      const exists = await prisma.concours.findFirst({
        where: {
          nom: {
            equals: nom,
            mode: "insensitive",
          },
        },
      });

      if (exists) {
        return res.status(409).json({ error: "ce concours existe deja" });
      }

      // on va creer le concours en utilisation une transaction au cas ou une erreur surviens
      const ConcoursCreate = await prisma.$transaction(async ($tx) => {
        const concours = await prisma.$tx.concours.create({
          nom,
          type,
          description,
          frais_inscription: 800,
          nombre_postes,
          annee,
          date_debut,
          date_fin,
          statut_concours,
          id_admin,
        });
        return concours;
      });

      return res.status(201).json({
        message: `{ concours ${ConcoursCreate.nom} creer avec succes}`,
      });
    } catch (err) {
      return res.status(500).json({
        error: "une erreur est survenue lors de la creation du concours",
      });
    }
  }

  static async UpdateConcours(req, res) {
    try {
      const {
        id_concours,
        nom,
        type,
        description,
        frais_inscription,
        nombre_postes,
        annee,
        date_debut,
        date_fin,
        statut_concours,
      } = req.body;

      // verifier si le concours existe bel et biens
      const concours = await prisma.concours.findUnique({
        where: { id_concours },
      });
      if (!concours) {
        return res.status(404).json({ error: "Concours non trouve" });
      }

      const updated = await prisma.concours.update({
        where: concours.id_concours,
        data: {
          nom: nom ?? concours.nom,
          type: type ?? concours.type,
          description: description ?? concours.description,
          frais_inscription: frais_inscription ?? concours.frais_inscription,
          nombre_postes: nombre_postes ?? concours.nombre_postes,
          annee: annee ?? concours.annee,
          date_debut: date_debut ?? concours.date_debut,
          date_fin: date_fin ?? concours.date_fin,
          statut_concours: statut_concours ?? concours.statut_concours,
          id_admin,
        },
      });
      return res
        .status(200)
        .json({
          message: "les informations du concours ont ete mises a jours",
        });
    } catch (err) {
        console.log(err);
      return res.status(500).json({ message: "une erreur est survenue " });
      /// voir l'erreur en dev
    
    }
  }

  async DeleteConcours(req, res) {
    try {
      const { id_concours } = req.params;

      const concours = await prisma.concours.findUnique({
        where: { id_concours },
      });
      if (!concours) {
        return res.status(404).json({ error: "concours non trouve" });
      }
      await prisma.concours.delete({ where: { id_concours } });
      return res
        .status(200)
        .json({ message: "concours supprime avec success!" });
    } catch (err) {
        console.log(err);
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }

  async GetAllConcours (res){
    try{

      const concours = await prisma.concours.findMany({
            orderBy: { date_debut: "desc" },
          select: {
            id_concours: true,
            nom: true,
            type: true,
            statut_concours: true,
            date_debut: true,
            date_fin: true,
            nombre_postes: true,
            _count: { select: { inscription: true } },
          },
      });
      res.status(200).json({concours:concours})
    }
    catch(err){

    }
  }
  static async Logout() {}
}
