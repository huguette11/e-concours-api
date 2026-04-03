import { prisma } from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthController {
    
  static async Login(req, res) {
    try {
      const { email, mot_de_passe } = req.body;

      if (!email || !mot_de_passe) {
        return res.status(400).json({ error: "Email et mot de passe requis" });
      }

      const candidat = await prisma.candidat.findUnique({ where: { email } });

      if (!candidat) {
        return res.status(404).json({ message: "Candidat non trouvé" });
      }

      const motDePasseCorrect = await bcrypt.compare(
        mot_de_passe,
        candidat.mot_de_passe,
      );

      if (!motDePasseCorrect) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }

      const token = jwt.sign(
        {
          id: candidat.id_candidat,
          email: candidat.email,
          role: "candidat",
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.json({ message: "Connexion réussie", token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async Register(req, res) {
    // à implémenter
  }

  static async Verify() {}

  static async Logout() {}
}
