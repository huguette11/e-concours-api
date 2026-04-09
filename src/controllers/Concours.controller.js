import { prisma } from "../prisma.js";

export class ConcoursController {


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

  
}