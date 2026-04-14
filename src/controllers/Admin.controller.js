import { prisma } from "../prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateReceipt, GenererListCandidat } from "../services/Upload-file.service.js";
import { connection as redis } from "../config/redis.js";
import { json } from "express";

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
        { expiresIn: "24h" },
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
            mode: "insensitive",
          },
        },
      });

      if (centresExistants.length > 0) {
        return res
          .status(400)
          .json({ error: "Un centre avec ce nom existe déjà" });
      }

      // Créer le centre
      const nouveauCentre = await prisma.centre.create({
        data: { nom },
      });

      return res.status(201).json(nouveauCentre);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Une erreur est survenue" });
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
        categorieId,
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
            categorieId,
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
              categorie: { select: { libelle: true } },
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
          centres: {
            select: {
              centre: {
                select: {
                  nom: true,
                  id_centre: true,
                },
              },
            },
          },
          categorie: {
            select: {
              id: true,
              libelle: true,
              description: true,
            },
          },
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

      const cacheKey = `concours:page${page}:limit:${limit}`;
      const concoursCached = await redis.get(cacheKey);
      if(concoursCached){
        return res.status(200).json(JSON.parse(concoursCached));
      }

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
            categorie: {
              select: {
                id: true,
                libelle: true,
                description: true,
              },
            },
          },
        }),
        prisma.concours.count(),
      ]);

      const response = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: concours,
      };
      await redis.set(cacheKey,JSON.stringify(response),'EX',300)
      res.status(200).json(response);
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

 static async SearchCandidat(req, res) {
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

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const cacheKey = `paiements:${pageNumber}:${limitNumber}:${statut_paiement || ""}:${mode_paiement || ""}:${annee_concours || ""}:${nom_candidat || ""}:${prenom_candidat || ""}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

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

      if (nom_candidat) {
        where.inscription.candidat.nom = {
          contains: nom_candidat,
          mode: "insensitive",
        };
      }

      if (prenom_candidat) {
        where.inscription.candidat.prenom = {
          contains: prenom_candidat,
          mode: "insensitive",
        };
      }
    }

    const [paiements, nombrePaiement] = await Promise.all([
      prisma.paiement.findMany({
        where,
        skip,
        take: limitNumber,
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

    const response = {
      page: pageNumber,
      limit: limitNumber,
      total: nombrePaiement,
      totalPages: Math.ceil(nombrePaiement / limitNumber),
      data: paiements,
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 60);

    return res.status(200).json(response);
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
  // static async PrintReceipt(req, res) {
  //   const data = {
  //     centre: "Ouagadougou",
  //     concours: "Eaux et Forêts",
  //     nom: "Doe",
  //     prenom: "John",
  //     date_naissance: "20/08/2004",
  //     lieu_naissance: "Ouagadougou",
  //     sexe: "M",
  //     cnib: "B15333744",
  //     telephone: "50783257",
  //     qr: JSON.stringify({
  //       nom: "BA",
  //       prenom: "yobi",
  //     }),
  //   };

  //   await generateReceipt(data, res);
  // }
  static async DeleteCandidat(req, res) {
    try {
      const { id_candidat } = req.body;
      const candidat = await prisma.candidat.findUnique({
        where: { id_candidat },
      });

      if (!candidat)
        return res.status(404).json({ error: "Candidat non trouver" });

      await prisma.candidat.update({
        where: { id_candidat },
        data: {
          deletedAt: new Date(),
        },
      });

          for(let page=1; page++; page<=10){
        const cacheKey = `candidat:${page}:limit:${limit}`;
        await redis.del(cacheKey);
      }

      return res
        .status(200)
        .json({ message: "candidat supprimer avec succes" });
    } catch (err) {
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }

  static async CreateCategorie(req, res) {
    try {
      const { libelle } = req.body;

      const libelles = (Array.isArray(libelle) ? libelle : libelle.split(","))
        .map((l) => l.trim())
        .filter(Boolean);

      const categorieExist = await prisma.categorieConcours.findUnique({
        where: {
          libelle: {
            in: libelles,
            mode: "insensitive",
          },
        },
        select: {
          libelle: true,
        },
      });
      if (categorieExist.length > 0) {
        const doublons = categorieExist.map((c) => c.libelle).join(", ");

        return res.status(409).json({
          message: `plusieurs doublons trouves: ${doublons}`,
        });
      }

      // creons la categories maintenant separer par les virgules

      await prisma.$transaction(async (tx) => {
        const categorie = await tx.categorieConcours.createMany({
          data: libelles.map((l) => ({ libelle: l })),
          skipDuplicates: true,
        });
        return categorie;
      });
          for(let page=1; page++; page<=10){
        const cacheKey = `categorieConcours:${page}:limit:${limit}`;
        await redis.del(cacheKey);
      }
      return res.status(201).json({
        message: "categorie de concours crerr avec succes",
      });
    } catch (err) {
      console.log("une erreur est survenue ...", err);
      return res.status(500).json({
        error: "une erreur est survenue",
      });
    }
  }
  static async DeleteCategorie(req, res) {
    try {
      const id_categorie = parseInt(req.params.id_categorie);
      if (!id_categorie)
        return res
          .status(400)
          .json({ error: "la reference de l'id est manquante" });

      const categorie = await prisma.categorieConcours.findUnique({
        where: { id_categorie },
      });
      if (!categorie)
        return res.status(404).json({ error: "Aucune categorie trouvee" });

      await prisma.categorieConcours.delete({
        where: { id_categorie },
      });
      for (let page = 1; page++; page <= 10) {
        const cacheKey = `categorie:page:${page}:limit:10`;
        await redis.del(cacheKey);
      }

      return res
        .status(200)
        .json({ message: "categorie supprimer avec succces" });
    } catch (err) {
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }
  static async UpdateCategorie(req, res) {
    try {
      const { id, libelle } = req.body;

      const categorie = await prisma.findUnique({ where: { id } });
      if (!categorie)
        return res.status(404).json({ error: "Aucune categorie trouvee" });

      await prisma.$transaction(async (tx) => {
        const update = tx.candidat.update({
          where: { id },
          data: {
            libelle: libelle ?? categorie.libelle,
          },
        });
        return update;
      });

      for(let page=1; page++; page<=10){
        const cacheKey = `categorieConcours:${page}:limit:${limit}`;
        await redis.del(cacheKey);
      }
      return res
        .status(200)
        .json({ message: "Categorie modifier avec succes" });
    } catch (err) {
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }

  static async GetCategorieConcours(req, res) {
    try {
      const page = parseInt(req.params.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const cacheKey = `categorieConcours:${page}:limit:${limit}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        // console.log('cache recuperer',cached)
        return res.status(200).json(JSON.parse(cached));

      }

      const [concours, total] = await Promise.all([
        await prisma.categorieConcours.findMany({
          take: limit,
          skip,
          orderBy: { createdDate: "desc" },
          select: {
            id: true,
            libelle: true,
            concours: {
              select: {
                id_concours: true,
                nom: true,
              },
            },
          },
        }),
        await prisma.categorieConcours.count(),
      ]);

      if (!concours) {
        return res.status(404).json({ error: "aucun concours trouver" });
      }

      const response = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: concours,
      };

      await redis.set(cacheKey, JSON.stringify(response), "EX", 60);
      return res.status(200).json(response);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }

  // comment update

  static async UpdateCategorieConcours(req, res) {
    try {
      const { id_categorie, libelle, description } = req.body;

      const categorie = await prisma.categorieConcours.findUnique({
        where: { where: { id: id_categorie } },
      });
      if (!categorie)
        return res.status(404).json({ error: "Aucune categorie trouver" });
      await prisma.categorieConcours.update({
        where: {
          where: { id: id_categorie },
        },
        data: {
          libelle: libelle ?? categorie.libelle,
          description: description ?? categorie.description,
          lastModifiedBy: req.admin.id,
          lastModifiedDate: new Date(),
        },
      });

      for (let page = 1; page <= 10; page++) {
        const cacheKey = `categorie:page:${page}:limit:10`;
        await redis.del(cacheKey);
      }

      return res
        .status(200)
        .json({ message: "categorie modifier avec succes" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ erro: "une erreur est survenue" });
    }
  }

  static async GetCategorie(req, res) {
    try {
      const page = parseInt(req.params.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const cacheKey = `categorie:page:${page}:limit:${limit}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(" Cache hit pour categorie");
        return res.status(200).json(JSON.parse(cached));
      }

      console.log("Cache miss pour categorie → DB call");

      const [categorie, total] = await Promise.all([
        prisma.categorieConcours.findMany({
          take: limit,
          skip,
          select: {
            id: true,
            libelle: true,
            description: true,
            flgActif: true,
          },
        }),
        prisma.categorieConcours.count(),
      ]);

      if (!categorie || categorie.length === 0) {
        return res.status(404).json({ message: "Aucune categorie trouvee" });
      }

      const response = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: categorie,
      };

      await redis.set(cacheKey, JSON.stringify(response), "EX", 60);

      return res.status(200).json(response);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }

  static async CreateLieuxComposition(req,res) {
    try{

    }
    catch(err){

    }
  }

  // verifie et repartie les centres

      // elaborer un algo de repartition automatique 
      // peut etre une ia qui sais 
      //trier les candidats par centre en commencant par le premier centre en db 
      // verifier pour chaque inscription <<valider>> le centre ou les centres compatibles
      // trouver les candidats qui sont dans un centre precis 
      // les repartir selon un quota du nombre de concours dans la ville 
      //le quota sera determiner par le nombre d'inscrit par candidat et les repartirs equitablemeent 
      // tout en laisssant une petie marge ie le quota ne dois pas etre completement atteint 
      // sauf au cas ou un candidat precis n'a pas de lieux de compositions dans un centre precis

      // apres sauvegarder les repatitions en bases de donnes et tirer une listes officielles de la repatition 
      // ou encore plus precis chaque candidats recevra un sms et ou un mail pour l'indiquer le lieux de compositions 

      /// aucune information n'est unitile a celui qui va  lire ma logique merci de me rectifier 
      // si ma logique consomme trop de ressources ou si elle ne match pas avec le projets 
      // merci de laisser un commentaire ou un mail (yobibah7295@gmail) pour m'apprendre de nouvelles methode choses ..
      // et au passage j'aime bien apprendre , j'ai la soif d'apprentissage (~:~)

      //nb: une marge de 10% est laisser pour repartition manuelle(a revoir ) pour eviiter les debordement au cas ou 
      // le quota venait a etre inferieur au quota attendu 

  static async repartirCandidats(req, res) {
    const id_concours = parseInt(req.params.id_concours);
    if (isNaN(id_concours)) {
      return res.status(400).json({ error: 'id_concours invalide' });
    }
 
    try {
     
      const concours = await prisma.concours.findUnique({
        where: { id_concours },
      });
      if (!concours) {
        return res.status(404).json({ error: 'Concours introuvable' });
      }
 
      // await prisma.inscription.updateMany({
      //   where:{statut_inscription:'EN_ATTENTE'},
      //   data:{
      //     statut_inscription:'VALIDEE'
      //   }
      // });
      const inscriptions = await prisma.inscription.findMany({
        where: {
          id_concours,
          statut_inscription: 'VALIDEE',
        },
        select: {
          id_inscription: true,
          id_candidat:    true,
          id_centre:      true,
          candidat: {
            select: { nom: true, prenom: true },
          },
        },
      });
 
      if (inscriptions.length === 0) {
        return res.status(404).json({
          error: 'Aucune inscription valid3e pour ce concours',
        });
      }
 
   
      //       L'occupation compte TOUS les concours pour respecter
      //       la capacité physique réelle du lieu
      const lieux = await prisma.lieuxComposition.findMany({
        include: {
          centre: true,
          compositions: {
            select: { id_composer: true }, // on ne recup que le count
          },
        },
      });
 
      if (lieux.length === 0) {
        return res.status(404).json({
          error: 'Aucun lieu de composition disponible',
        });
      }
 
      //       avec capacite effective (quota × marge) et occupation réelle
      const MARGE = 0.90; // ne pas remplir au-delà de 90% du quota
 
      // Map<centreId, LieuAvecCapacite[]>
      const lieuxParCentre = new Map();
 
      for (const lieu of lieux) {
        if (!lieuxParCentre.has(lieu.id_centre)) {
          lieuxParCentre.set(lieu.id_centre, []);
        }
        lieuxParCentre.get(lieu.id_centre).push({
          id_lieux:  lieu.id_lieux,
          nom:       lieu.nom,
          id_centre: lieu.id_centre,
          capacite:  Math.floor(lieu.quota * MARGE),
          occupation: lieu.compositions.length, // occupation reelle multi-concours
        });
      }
 
     
      const aAffecter   = [];  // { id_candidat, id_concours, id_lieux }
      const debordement = [];  // candidats sans place dans leur centre
 
      for (const inscription of inscriptions) {
        const lieuxDuCentre = lieuxParCentre.get(inscription.id_centre) ?? [];
 
        // Chercher un lieu avec de la place dans le centre choisi
        // Trier par occupation croissante pour équilibrer la charge
        const lieu = lieuxDuCentre
          .filter(l => l.occupation < l.capacite)
          .sort((a, b) => a.occupation - b.occupation)[0];
 
        if (lieu) {
          lieu.occupation++;
          aAffecter.push({
            id_candidat: inscription.id_candidat,
            id_concours,
            id_lieux:    lieu.id_lieux,
          });
        } else {
          debordement.push(inscription);
        }
      }
 
      // gerer et eviter les debordements
      //       Chercher dans n'importe quel centre, lieu le moins chargé
      let forceAffectes = 0;
 
      for (const inscription of debordement) {
        // Tous les lieux tieer par taux de remplissage (occupation/capacite)
        const tousLesLieux = [...lieuxParCentre.values()]
          .flat()
          .sort((a, b) => (a.occupation / a.capacite) - (b.occupation / b.capacite));
 
        // D'abord les lieux encore dans la marge
        let lieu = tousLesLieux.find(l => l.occupation < l.capacite);
 
        // Si tout est plein, forcer dans le lieu le moins rempli (dépasse la marge)
        if (!lieu) {
          lieu = tousLesLieux[0];
          forceAffectes++;
        }
 
        if (lieu) {
          lieu.occupation++;
          aAffecter.push({
            id_candidat: inscription.id_candidat,
            id_concours,
            id_lieux:    lieu.id_lieux,
          });
        }
      }
 
 
      //       On supprime d'abord les anciennes répartitions de ce concours
      //       pour permettre de relancer sans doublons
      const [suppression, creation] = await prisma.$transaction([
        prisma.composer.deleteMany({
          where: { id_concours },
        }),
        prisma.composer.createMany({
          data: aAffecter,
        }),
      ]);
 
    
      const resumeParLieu = {};
      for (const affectation of aAffecter) {
        const lieu = lieux.find(l => l.id_lieux === affectation.id_lieux);
        const cle  = `[${lieu.centre.nom}] ${lieu.nom}`;
        resumeParLieu[cle] = (resumeParLieu[cle] ?? 0) + 1;
      }
 
      return res.status(200).json({
        message:           'Répartition effectuée avec succès',
        concours:          concours.nom,
        total_inscrits:    inscriptions.length,
        total_affectes:    aAffecter.length,
        debordements:      debordement.length,
        force_affectes:    forceAffectes,
        anciens_supprimes: suppression.count,
        repartition_par_lieu: resumeParLieu,
      });
 
    } catch (err) {
      console.error('[RepartitionController.repartirCandidats]', err);
      return res.status(500).json({ error: 'Une erreur est survenue lors de la répartition' });
    }
  }
 

static async consulterRepartition(req, res) {
  const id_concours = parseInt(req.params.id_concours);

  if (isNaN(id_concours)) {
    return res.status(400).json({ error: 'id_concours invalide' });
  }

  try {
    //  récupérer le concours (IMPORTANT)
    const concours = await prisma.concours.findUnique({
      where: { id_concours }
    });

    if (!concours) {
      return res.status(404).json({ error: "Concours introuvable" });
    }

    const repartitions = await prisma.composer.findMany({
      where: { id_concours },
      select: {
        id_composer: true,
        candidat: {
          select: {
            nom: true,
            prenom: true,
            numero_cnib: true,
            date_naissance: true,
          },
        },
        lieux: {
          select: {
            nom: true,
            quota: true,
            centre: { select: { nom: true } },
          },
        },
      },
      orderBy: [
        { id_lieux: 'asc' },
        { candidat: { nom: 'asc' } },
      ],
    });

    if (repartitions.length === 0) {
      return res.status(404).json({
        error: "Aucune répartition trouvée pour ce concours",
      });
    }

    //  Grouper par lieu
    const parLieu = {};

    for (const r of repartitions) {
      const cle = `${r.lieux.centre.nom} — ${r.lieux.nom}`;

      if (!parLieu[cle]) {
        parLieu[cle] = {
          lieu: r.lieux.nom,
          centre: r.lieux.centre.nom,
          quota: r.lieux.quota,
          candidats: [],
        };
      }

      parLieu[cle].candidats.push({
        nom: r.candidat.nom,
        prenom: r.candidat.prenom,
        numero_cnib: r.candidat.numero_cnib,
        date_naissance: r.candidat.date_naissance,
      });
    }


    return await GenererListCandidat({
      concours: concours.nom,
      annee: concours.annee,
      lieux: Object.values(parLieu),
    }, res);

  } catch (err) {
    console.error('[RepartitionController.consulterRepartition]', err);
    return res.status(500).json({ error: 'Une erreur est survenue' });
  }
}


  static async lieuDuCandidat(req, res) {
    const id_concours = parseInt(req.params.id_concours);
    const { id_candidat } = req.params;
 
    if (isNaN(id_concours)) {
      return res.status(400).json({ error: 'id_concours invalide' });
    }
 
    try {
      const affectation = await prisma.composer.findUnique({
        where: {
          id_candidat_id_concours: { // nom de la contrainte @@unique
            id_candidat,
            id_concours,
          },
        },
        select: {
          candidat: {
            select: {
              nom:         true,
              prenom:      true,
              numero_cnib: true,
              email:       true,
              telephone:   true,
            },
          },
          concours: {
            select: { nom: true, date_debut: true },
          },
          lieux: {
            select: {
              nom:    true,
              centre: { select: { nom: true } },
            },
          },
        },
      });
 
      if (!affectation) {
        return res.status(404).json({
          error: 'Aucune affectation trouvée pour ce candidat dans ce concours',
        });
      }
 
      
      return res.status(200).json({
        candidat:  `${affectation.candidat.prenom} ${affectation.candidat.nom}`,
        cnib:      affectation.candidat.numero_cnib,
        concours:  affectation.concours.nom,
        date:      affectation.concours.date_debut,
        centre:    affectation.lieux.centre.nom,
        lieu:      affectation.lieux.nom,
      });
 
    } catch (err) {
      console.error('[RepartitionController.lieuDuCandidat]', err);
      return res.status(500).json({ error: 'Une erreur est survenue' });
    }
  }
  static async createLieuCompo(req, res) {
    try{
      const{nom, id_centre,quota} = req.body;

      const centre = await prisma.findUnique({where:{
        id_centre
      }});

      if(!centre){
        return res.status(404).json({error:'aucun centre trouver'})
      }

      await prisma.$transaction(async(tx)=>{
       const lieux =  await tx.lieuxComposition.create({
          data:{
            nom:nom,
            id_centre:id_centre,
            quota:quota
          }
        })
        return lieux;
      });
      return res.status(201).json({message:'un lieux de composition ajouter avec succes'})
    }
    catch(err){
      console.log(err);
    }
  }

// static async Composer(req,res){}

  static async Logout() {}
}
