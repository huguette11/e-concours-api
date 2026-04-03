import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
export class AdminMiddleware {


  static async handle(req, res) {

    const Authheaders = await req.headers.authorization;

    if (!Authheaders || !Authheaders.startsWith("Bearer"))
      return res.status(401).json({ error: "token manquant." });

    const token = Authheaders.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // trouver l'admin courant ..

    const admin = await prisma.admin.findUnique({ id: decoded.id });

    if (!admin) return res.status(404).json({ error: "Admin non trouver" });

    if (admin.status !== true)
      return res.status(403).json({ error: "Compte Actif non actif" });

    req.admin = admin;
    next();
  }

  // methode pour verifier s'il est super admin
  static async SuperAdmin(req, res, next) {

    try {
      if (req.admin?.role !== "SuperAdmon")
        return res
          .status(401)
          .json({ error: "acces reserver uniquement qu'aux super admin" });
      next();
    } catch (err) {
        
      return res.status(500).json({ error: "une erreur est survenue" });
    }
  }
}
