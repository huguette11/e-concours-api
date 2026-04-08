import { prisma } from "../prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateReceipt } from "../services/Upload-file.service.js";

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
      const RegisterAdmin = await prisma.$transaction(async (tx) => {
        const admin = await tx.admin.create({
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
      const { email, mot_de_passe } = req.body;

      if (!email || !mot_de_passe)
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
      if (!(await bcrypt.compare(mot_de_passe, admin.mot_de_passe))) {
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
          where: { statut_paiement: "REUSSI" },
        }),

        prisma.paiement.count({
          where: { statut_paiement: "ATTENTE" },
        }),

        prisma.paiement.aggregate({
          _sum: { montant: true },
          where: { statut_paiement: "REUSSI" },
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

static async CreateCentre(req, res) {
  try {
    const { nom } = req.body;

    // Verifier centre
    const centresExistants = await prisma.centre.findMany({
      where: {
        nom: {
          contains: nom,
          mode: "insensitive"
        }
      }
    });

    if (centresExistants.length > 0) {
      return res.status(400).json({ error: 'Un centre avec ce nom existe déjà' });
    }

    // Créer le centre
    const nouveauCentre = await prisma.centre.create({
      data: { nom }
    });

    return res.status(201).json(nouveauCentre);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Une erreur est survenue' });
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
      centres, 
    } = req.body;

    const id_admin = req.admin.id_admin;

    if (!id_admin || req.admin.actif === false) {
      return res.status(401).json({
        error: "Vous n'êtes pas autorisé à effectuer cette action",
      });
    }

    // verifions si le centre nomme existe deja ou pas
    const exists = await prisma.concours.findFirst({
      where: {
        nom: {
          equals: nom,
          mode: "insensitive",
        },
      },
    });

    if (exists) {
      return res.status(409).json({ error: "Ce concours existe déjà" });
    }

// creation du centre avec tous les liens
    const concoursCreate = await prisma.$transaction(async (tx) => {
      const concours = await tx.concours.create({
        data: {
          nom,
          type,
          description,
          frais_inscription: 800,
          nombre_postes,
          annee,
          date_debut: new Date(date_debut),
          date_fin: new Date(date_fin),
          statut_concours,
          id_admin,

          centres: {
            create: centres.map((id_centre) => ({
              centre: { connect: { id_centre } },
            })),
          },
        },
        include: {
          centres: {
            select: {
              centre: { select: { nom: true, id_centre: true } },
            },
          },
        },
      });

      return concours;
    });

    return res.status(201).json({
      message: `Concours ${concoursCreate.nom} créé avec succès`,
      data: concoursCreate,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Une erreur est survenue lors de la création du concours",
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
      return res.status(200).json({
        message: "les informations du concours ont ete mises a jours",
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "une erreur est survenue " });
      /// voir l'erreur en dev
    }
  }

  static async DeleteConcours(req, res) {
    try {
      const { id_concours } = req.body;

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

  static async DetailConcours(req, res) {
    try {
      const id_concours = parseInt(req.params.id_concours);

      const concours = await prisma.concours.findUnique({
        where: { id_concours },
        select: {
          id_concours: true,
          nom: true,
          type: true,
          description: true,
          frais_inscription: true,
          nombre_postes: true,
          annee: true,
          date_debut: true,
          date_fin: true,
          statut_concours: true,

          examen: {
            select: {
              type_examen: true,
              date_examen: true,
              lieu: true,
            },
          },
          _count: {
            select: { inscription: true },
          },
          centres:{
            select:{
              centre:{
                select:{
                  nom:true,
                id_centre:true
                }
                
              }
            }
          }
        },
      });
      if (!concours) {
        return res.status(404).json({ error: "aucun concours trouver" });
      }

      return res.status(200).json({ data: concours });
    } catch (err) {
      console.log("une erreur est survenue", err);
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }
  static async GetAllConcours(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const [concours, total] = await Promise.all([
        prisma.concours.findMany({
          skip,
          take: limit,
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
        prisma.concours.count(),
      ]);

      res.status(200).json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: concours,
      });
    } catch (err) {
      console.error("Une erreur est survenue:", err);
      res.status(500).json({ error: "Impossible de récupérer les concours." });
    }
  }

  static async SwitchStatuConcours(req, res) {
    try {
      const { statut_concours } = req.body;
      const { id_concours } = req.params;
      if (!id_concours) {
        return res.status(400).json({ error: "id manquant" });
      }

      const concours = await prisma.concours.findUnique({
        where: { id_concours },
      });
      if (!concours) {
        return res.status(404).json({ error: "concours non trouve" });
      }

      await prisma.concours.update({
        where: { id_concours },
        data: {
          statut_concours,
        },
      });
      return res.status(200).json({ message: "status changer avec succes" });
    } catch (err) {
      console.log("une erreur est survenue :", err);
      return res.status(500).json({ error: "une erreur est surveue" });
    }
  }

  static async SearchConcours(req, res) {
    try {
      const { type, nom, annee, date_debut, date_fin } = req.query;

      const concours = await prisma.concours.findMany({
        where: {
          ...(nom && {
            nom: {
              contains: nom,
              mode: "insensitive",
            },
            ...(type && { type }),
            ...(annee && { annee }),
            ...(date_debut && { date_debut: { gte: new Date(date_debut) } }),
            ...(date_fin && { date_fin: { lte: new Date(date_fin) } }),
          }),
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
        },
      });

      if (concours.length === 0) {
        return res.status(404).json({ err: "aucun concous trouve" });
      }

      return res.status(200).json({ concours });
    } catch (err) {
      console.log("une erreur est survenue");

      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }
  // CRUD et gestions candidat

  async SearchCandidat(req, res) {
    try {
      const { nom, prenom, sexe, pays_naissance, email, status, matricule } =
        req.query;
      const candidat = await prisma.candidat.findMany({
        where: {
          ...(nom && {
            nom: {
              contains: nom,
              mode: "insensitive",
            },
          }),
          ...(prenom && {
            prenom: {
              contains: prenom,
              mode: "insensitive",
            },
          }),

          ...(sexe && { sexe }),
          ...(pays_naissance && { pays_naissance }),
          ...(email && {
            email: {
              contains: email,
              mode: "insensitive",
            },
          }),
          ...(status && { status }),
          ...(matricule & { matricule }),

          delete_at: null,
        },

        orderBy: { date_creation: "desc" },
        select: {
          nom: true,
          prenom: true,
          sexe: true,
          date_naissance: true,
          telephone: true,
          email: true,
        },
      });

      if (candidat.length === 0) {
        return res.status(404).json({ error: "aucun candidat trouver" });
      }

      return res.status(200).json({ candidat });
    } catch (err) {
      console.log("une erreur est survenue", err);
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }

  static async ListesPaiements(req, res) {
    try {
      const {
        statut_paiement,
        mode_paiement,
        annee_concours,
        nom_candidat,
        prenom_candidat,
        page = 1,
        limit = 10,
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};

      if (statut_paiement) where.statut_paiement = statut_paiement;
      if (mode_paiement) where.mode_paiement = mode_paiement;
      if (annee_concours) {
        where.inscription = {
          concours: { annee: parseInt(annee_concours) },
        };
      }
      if (nom_candidat || prenom_candidat) {
        where.inscription = {
          ...where.inscription,
          candidat: {},
        };
        if (nom_candidat)
          where.inscription.candidat.nom = {
            contains: nom_candidat,
            mode: "insensitive",
          };
        if (prenom_candidat)
          where.inscription.candidat.prenom = {
            contains: prenom_candidat,
            mode: "insensitive",
          };
      }

      const [paiements, nombrePaiement] = await Promise.all([
        prisma.paiement.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { date_paiement: "desc" },
          select: {
            id_paiement: true,
            montant: true,
            date_paiement: true,
            mode_paiement: true,
            reference_transaction: true,
            statut_paiement: true,
            inscription: {
              select: {
                id_inscription: true,
                statut_inscription: true,
                date_inscription: true,
                candidat: {
                  select: {
                    id_candidat: true,
                    nom: true,
                    prenom: true,
                    email: true,
                  },
                },
                concours: {
                  select: {
                    id_concours: true,
                    nom: true,
                    annee: true,
                  },
                },
              },
            },
          },
        }),
        prisma.paiement.count({ where }),
      ]);

      return res.status(200).json({
        page: parseInt(page),
        limit: parseInt(limit),
        total: nombrePaiement,
        totalPages: Math.ceil(nombrePaiement / limit),
        data: paiements,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Erreur lors de la récupération des paiements",
      });
    }
  }

  static async DetailPaiement(req, res) {
    try {
      const { id_paiement } = req.query;
      if (!id_paiement)
        return res.status(400).json({ error: "id_paiement est requis" });
      const paiement = await prisma.paiement.findUnique({
        where: { id_paiement },
        select: {
          montant: true,
          date_paiement: true,
          mode_paiement: true,
          reference_transaction: true,
          statut_paiement: true,
          inscription: {
            date_inscription: true,
            statut_inscription: true,

            concours: {
              annee: true,
              type: true,
              nombre_postes: true,
              nom: true,
            },
            candidat: {
              nom: true,
              prenom: true,
              numero_cnib: true,
              date_naissance: true,
            },
          },
        },
      });
      if (!paiement) {
        return res.status(404).json({ error: "aucun paiement trouver" });
      }

      return res.status(200).json({ data: paiement });
    } catch (err) {
      console.log("une erreur est survenue", err);
      return res.status(500).json({ error: "une erreur est survenue " });
    }
  }

  static async UpdadePaiemntStatus(req, res) {
    try {
      const { id_paiement, id_candidat, status } = req.body;


      const [candidat, paiement] = await Promise.all([
        prisma.candidat.findUnique({ where: { id_candidat } }),
        prisma.paiement.findUnique({ where: { id_paiement } }),
      ]);
      if (!candidat)
        return res
          .status(404)
          .json({ error: "aucun candidat associer a ce paiement" });
      if (!paiement)
        return res.status(404).json({ error: "aucun paiement trouve" });

      await prisma.paiement.update({
        where: { id_paiement },
        data: {
          statut_paiement: status ?? paiement.status_paiement,
        },
      });

      return res
        .status(200)
        .json({ message: "status paiement modifier avec succes" });
    } catch (err) {
      console.log("une erreur est survenue", err);
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }

  // methode de test pour verifier si la generation passe
  static async PrintReceipt(req, res) {
  const data = {
    centre: "Ouagadougou",
    concours: "Eaux et Forêts",
    nom: "YOBI",
    prenom: "Cheick Omar",
    date_naissance: "20/08/2004",
    lieu_naissance: "Ouagadougou",
    sexe: "M",
    cnib: "B15333744",
    telephone: "50783257",
qr: JSON.stringify({
  nom: "BA",
  prenom: "yobi"
})
  };

  await generateReceipt(data, res);
}
static async DeleteCandidat(req,res){
  try{
    const{id_candidat} = req.body;
    const candidat = await prisma.candidat.findUnique({
      where:{id_candidat}
    }); 

    if(!candidat) return res.status(404).json({error:'Candidat non trouver'});

    await prisma.candidat.update({
    where:{id_candidat},
    data:{
      deletedAt: new Date()
    }
    });

    return res.status(200).json({message:'candidat supprimer avec succes'});

  }
  catch(err){
        return res.status(500).json({error:'une erreur est survenue'});
  }
}
static async CreateLieuxComposition (){}

static async repartitionParcentre(req,res){

}

static async GetListes(req,res){

}

  static async Logout() {}
}
