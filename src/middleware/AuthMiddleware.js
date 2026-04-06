import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

export class AuthMiddleware {
  static protect(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: "Non autorisé" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Token invalide" });
    }
  }
}