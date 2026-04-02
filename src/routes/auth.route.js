import express from "express";
import pool from "../index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const result = await pool.query(
      "SELECT id_candidat, email, mot_de_passe FROM candidat WHERE email = $1",
      [email]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidat non trouvé" });
    }

    const candidat = result.rows[0];

    const motDePasseCorrect = await bcrypt.compare(
      mot_de_passe,
      candidat.mot_de_passe
    );

    if (!motDePasseCorrect) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

  
    const token = jwt.sign(
      {
        id: candidat.id_candidat,  
        email: candidat.email,     
        role: "candidat"          
      },
      process.env.JWT_SECRET,       
      { expiresIn: "24h" }        
    );

    
    res.json({
      message: "Connexion réussie",
      token: token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;