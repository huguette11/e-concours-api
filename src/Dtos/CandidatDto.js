import { body } from "express-validator";

export class CandidatDto {
   static validateRegister(data) {

    return [
      body('nom')
        .notEmpty().withMessage('Le nom est requis')
        .isLength({ min: 2 }).withMessage('Le nom doit avoir au moins 2 caractères'),
      body('prenom')
        .notEmpty().withMessage('Le prénom est requis')
        .isLength({ min: 2 }).withMessage('Le prénom doit avoir au moins 2 caractères'),
      body('email')
        .notEmpty().withMessage('L’email est requis')
        .isEmail().withMessage('Email invalide'),
      body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
        .isLength({ min: 4 }).withMessage('Le mot de passe doit avoir au moins 4 caractères')
    ];
  }

  static ValidateLogin (){
    return[
        body('email').notEmpty().withMessage('le champ email est reqis')
                     .isEmail().withMessage('le champ doit etre un email'),
        body('mot_de_passe').isLength({min:8}).withMessage('le mot de passe dois contenir au moins 8 caractere')

    ]
  }
}