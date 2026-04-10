import jwt, { decode } from "jsonwebtoken";
import prisma from "../prisma.js";

export class AuthMiddleware {
  static async protect(req, res, next) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Non autorisé" });

      let decoded;

      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ error: "votre token a expirer veuillez vous reconnecter" });
        }
        return res.status(401).json({ error: "token manquant invalide" });
      }
      // console.log(decoded);
      const user = await prisma.candidat.findFirst({
        where: {
          OR: [{ id_candidat: decoded.id }, { email: decoded.email }],
        },
      });
      // console.log(user);
      if (!user) {
        return res.status(401).json({ error: "authentifier vous" });
      }
      // console.log(user);
      req.user = user;

      next();
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "Token invalide" });
    }
  }
}
