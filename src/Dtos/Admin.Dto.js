import { body } from "express-validator";

export class AdminDtos {
  static ValidateLogin() {
    return [
      body("username").notEmpty("Le nom est requis").isString(),
      body("password").notEmpty().withMessage("mots de passe requis"),
    ];
  }

  static ValidateRegister(){
    return[
        body('nom').isString().notEmpty().withMessage('Le nom est requis'),
        body('prenom').isString().notEmpty().withMessage('Le nom est requis'),
        body('email').isEmail().withMessage('Le champ requiert une adresse mail valide').notEmpty().withMessage('L\'email est requis'),
        body('mot_de_passe').notEmpty().withMessage('Le mots de passe est requis').isLength({min:8}).withMessage('Le mot de passe dois contenir au moins 8 caracterere').isString(),
        body('telephone').notEmpty().withMessage('Le telephone est requis').isMobilePhone().isLength({min:8, max:8}).withMessage('le numero de telephone dois contenir 8 caractere'),
        body('role').optional().isIn([ 'SUPERADMIN','GESTIONNAIRE']).withMessage('le role que vous avez choisi n\'est pas pris en compte'),
        
    ];
  }
}
