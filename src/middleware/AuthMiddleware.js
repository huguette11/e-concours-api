import jwt from 'jsonwebtoken';

export class AuthMiddleware {
  static protect(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: "Non autorisé" });

      let decoded;

      try{
         decoded = jwt.verify(token, process.env.JWT_SECRET);
      }
      catch(err){
        if(err.name==="TokenExpiredError"){
          return res.status(401).json({error:'votre token a expirer veuillez vous reconnecter'})
        } 
        return res.status(401).json({error:'token manquant invalide'})

      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Token invalide" });
    }
  }
}