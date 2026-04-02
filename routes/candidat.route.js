import express from "express";
import pool from "../index.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_candidat, nom, prenom, sexe, email, telephone FROM candidat"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

router.get("/:id_candidat", async (req, res) => {
  try {
    const { id_candidat } = req.params; // on lit l'id dans l'URL

    const result = await pool.query(
      "SELECT id_candidat, nom, prenom, sexe, email, telephone FROM candidat WHERE id_candidat = $1",
      [id_candidat]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidat non trouvé" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      nom,
      prenom,
      sexe,
      date_naissance,
      lieu_naissance,
      pays_naissance,
      numero_cnib,
      date_delivrance,
      telephone,
      email,
      mot_de_passe
    } = req.body;

    
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Email invalide" });
    }

    if (!mot_de_passe || mot_de_passe.length < 6) {
      return res.status(400).json({ error: "Mot de passe trop court" });
    }

    if (nom && nom.length > 50) {
      return res.status(400).json({ error: "Nom trop long" });
    }
    
    const motDePasseHashe = await bcrypt.hash(mot_de_passe, 10);

    const id_candidat = uuidv4();

    const result = await pool.query(
      `INSERT INTO candidat (
        id_candidat, nom, prenom, sexe, date_naissance, lieu_naissance,
        pays_naissance, numero_cnib, date_delivrance, telephone, email, mot_de_passe
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id_candidat, nom, prenom, email, telephone`,
      [id_candidat, nom, prenom, sexe, date_naissance, lieu_naissance,
       pays_naissance, numero_cnib, date_delivrance, telephone, email, motDePasseHashe]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});


router.put("/:id_candidat", async (req, res) => {
  try {
    const id_candidat = req.params.id_candidat;

    const {
      nom,
      prenom,
      nom_jeune_fille,
      sexe,
      date_naissance,
      lieu_naissance,
      pays_naissance,
      numero_cnib,
      date_delivrance,
      telephone,
      email,
      recepisse,
      statut_compte
    } = req.body;

  
    if (email && !email.includes("@")) {
      return res.status(400).json({ error: "Email invalide" });
    }

    const result = await pool.query(
      `UPDATE candidat SET
        nom            = COALESCE($2, nom),
        prenom         = COALESCE($3, prenom),
        nom_jeune_fille= COALESCE($4, nom_jeune_fille),
        sexe           = COALESCE($5, sexe),
        date_naissance = COALESCE($6, date_naissance),
        lieu_naissance = COALESCE($7, lieu_naissance),
        pays_naissance = COALESCE($8, pays_naissance),
        numero_cnib    = COALESCE($9, numero_cnib),
        date_delivrance= COALESCE($10, date_delivrance),
        telephone      = COALESCE($11, telephone),
        email          = COALESCE($12, email),
        recepisse      = COALESCE($13, recepisse),
        statut_compte  = COALESCE($14, statut_compte)
      WHERE id_candidat = $1
      RETURNING id_candidat, nom, prenom, email, telephone`,
      [
        id_candidat,
        nom,
        prenom,
        nom_jeune_fille,
        sexe,
        date_naissance,
        lieu_naissance,
        pays_naissance,
        numero_cnib,
        date_delivrance,
        telephone,
        email,
        recepisse,
        statut_compte
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidat non trouvé" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send({error : "Erreur serveur"});
  }
});


router.delete("/:id_candidat", async (req, res) => {
  try {
    const { id_candidat } = req.params;

    const result = await pool.query(
      // RETURNING * pour confirmer ce qu'on a supprimé
      "DELETE FROM candidat WHERE id_candidat = $1 RETURNING id_candidat, nom, prenom",
      [id_candidat]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidat non trouvé" });
    }

    res.json({
      message: "Candidat supprimé avec succès",
      candidat: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


export default router;
