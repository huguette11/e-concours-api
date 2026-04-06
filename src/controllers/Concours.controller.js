import { prisma } from "../prisma.js";

export class ConcoursController {

  // ─── GET /api/concours ────────────────────────────────────
  async getAllConcours(req, res) {
    try {
      const id_candidat = req.user.id;
      const { type, statut, q } = req.query;

      const where = {};
      if (type)   where.type            = type.toUpperCase();
      if (statut) where.statut_concours = statut;
      if (q)      where.nom             = { contains: q, mode: "insensitive" };

      const concours = await prisma.concours.findMany({
        where,
        select: {
          id_concours:       true,
          nom:               true,
          type:              true,
          description:       true,
          frais_inscription: true,
          nombre_postes:     true,
          annee:             true,
          date_debut:        true,
          date_fin:          true,
          statut_concours:   true,
          examen: {
            select: {
              id_examen:   true,
              intitule:    true,
              type_examen: true,
              date_examen: true,
              heure:       true,
              lieu:        true,
              coefficient: true,
            },
          },
          inscription: {
            where:  { id_candidat },
            select: {
              id_inscription:     true,
              statut_inscription: true,
            },
          },
        },
        orderBy: { date_debut: "desc" },
      });

      const data = concours.map((c) => {
        const inscription = c.inscription[0] ?? null;

        return {
          id_concours:       c.id_concours,
          nom:               c.nom,
          type:              c.type,
          description:       c.description,
          frais_inscription: c.frais_inscription,
          nombre_postes:     c.nombre_postes,
          annee:             c.annee,
          date_debut:        c.date_debut,
          date_fin:          c.date_fin,
          statut_concours:   c.statut_concours,
          examens:           c.examen,
          // Statut précis de la candidature du candidat connecté
          candidature: inscription === null
            ? { statut: "non_inscrit" }
            : inscription.statut_inscription === "validee"
              ? { statut: "validee",    id_inscription: inscription.id_inscription }
              : { statut: "en_attente", id_inscription: inscription.id_inscription },
        };
      });

      return res.status(200).json({
        message: "Concours récupérés",
        total:   data.length,
        data,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ─── GET /api/concours/:id ────────────────────────────────
  async getConcours(req, res) {
    try {
      const id_candidat = req.user.id;
      const { id }      = req.params;

      const concours = await prisma.concours.findUnique({
        where: { id_concours: id },
        select: {
          id_concours:       true,
          nom:               true,
          type:              true,
          description:       true,
          frais_inscription: true,
          nombre_postes:     true,
          annee:             true,
          date_debut:        true,
          date_fin:          true,
          statut_concours:   true,
          examen: {
            select: {
              id_examen:   true,
              intitule:    true,
              type_examen: true,
              date_examen: true,
              heure:       true,
              lieu:        true,
              coefficient: true,
            },
          },
          inscription: {
            where:  { id_candidat },
            select: {
              id_inscription:     true,
              statut_inscription: true,
            },
          },
        },
      });

      if (!concours) {
        return res.status(404).json({ error: "Concours introuvable" });
      }

      const inscription = concours.inscription[0] ?? null;

      return res.status(200).json({
        message: "Concours récupéré",
        data: {
          id_concours:       concours.id_concours,
          nom:               concours.nom,
          type:              concours.type,
          description:       concours.description,
          frais_inscription: concours.frais_inscription,
          nombre_postes:     concours.nombre_postes,
          annee:             concours.annee,
          date_debut:        concours.date_debut,
          date_fin:          concours.date_fin,
          statut_concours:   concours.statut_concours,
          examens:           concours.examen,
          candidature: inscription === null
            ? { statut: "non_inscrit" }
            : inscription.statut_inscription === "validee"
              ? { statut: "validee",    id_inscription: inscription.id_inscription }
              : { statut: "en_attente", id_inscription: inscription.id_inscription },
        },
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
}