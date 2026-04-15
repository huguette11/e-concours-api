import { body } from "express-validator";

export class CandidatDto {
  static validateRegister() {
    return [
      body("nom")
        .notEmpty()
        .withMessage("Le nom est requis")
        .isLength({ min: 2, max: 100 })
        .withMessage("Le nom doit avoir entre 2 et 100 caractères"),

      body("prenom")
        .notEmpty()
        .withMessage("Le prénom est requis")
        .isLength({ min: 2, max: 100 })
        .withMessage("Le prénom doit avoir entre 2 et 100 caractères"),

      body("nom_jeune_fille")
        .optional()
        .isLength({ max: 100 })
        .withMessage(
          "Le nom de jeune fille ne doit pas dépasser 100 caractères",
        ),

      body("sexe")
        .notEmpty()
        .withMessage("Le sexe est requis")
        .isIn(["HOMME", "FEMME"])
        .withMessage("Le sexe doit être Homme ou Femme"),

      body("date_naissance")
        .notEmpty()
        .withMessage("La date de naissance est requise")
        .isDate()
        .withMessage("La date de naissance est invalide"),

      body("lieu_naissance")
        .optional()
        .isLength({ max: 150 })
        .withMessage(
          "Le lieu de naissance ne doit pas dépasser 150 caractères",
        ),

      body("pays_naissance")
        .optional()
        .isLength({ max: 150 })
        .withMessage(
          "Le pays de naissance ne doit pas dépasser 150 caractères",
        ),

      body("numero_cnib")
        .notEmpty()
        .withMessage("Le numéro CNIB est requis")
        .isLength({ max: 50 })
        .withMessage("Le numéro CNIB ne doit pas dépasser 50 caractères"),

      body("date_delivrance")
        .optional()
        .isDate()
        .withMessage("La date de délivrance est invalide"),

      body("telephone")
        .notEmpty()
        .withMessage('le numero de telephone est requis')
        .isMobilePhone()
        .withMessage("Le numéro de téléphone est invalide"),

      body("email")
        .notEmpty()
        .withMessage("L'email est requis")
        .isEmail()
        .withMessage("Email invalide")
        .isLength({ max: 150 })
        .withMessage("L'email ne doit pas dépasser 150 caractères"),

      body("mot_de_passe")
        .notEmpty()
        .withMessage("Le mot de passe est requis")
        .isLength({ min: 8 })
        .withMessage("Le mot de passe doit avoir au moins 8 caractères"),

      body("choix").optional().isString().isIn(["sms", "mail"]),
    ];
  }

static ValidateLogin() {
  return [
    body("telephone")
      .notEmpty()
      .withMessage("Le téléphone est requis")
      .withMessage("Numéro de téléphone invalide")
      .isLength({ min: 8, max: 11})
      .withMessage("Le numéro doit contenir exactement 8 chiffres"),

    body("mot_de_passe")
      .notEmpty()
      .withMessage("Le mot de passe est requis")
      .isLength({ min: 8 })
      .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
  ];
}

  static ValidateContactUs() {
    return [
      // Nom
      body("nom")
        .notEmpty()
        .withMessage("Le nom est requis")
        .isString()
        .withMessage("Le nom doit être une chaîne de caractères")
        .isLength({ min: 2 })
        .withMessage("Le nom doit contenir au moins 2 caractères"),

      body("email")
        .notEmpty()
        .withMessage("Le champ email est requis")
        .isEmail()
        .withMessage("Le champ doit être un email valide"),

      body("message").notEmpty().withMessage("Le champ message est requis"),
    ];
  }

  // static ValidateVerify(){
  //   return [
  //     body('telephone').notEmpty().
  //   ];
  // }
}
