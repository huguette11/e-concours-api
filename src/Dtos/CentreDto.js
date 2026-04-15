import { body } from "express-validator";

export class CentreDto {
  static ValidateCreateCentre() {
    return [
      body("nom")
        .notEmpty()
        .withMessage("Le nom du centre est requis")
        .isString()
        .withMessage("le type ne corespond au type attendu"),
    ];
  }

  static ValidateUpdateCentre() {
    return [
      body("id_centre")
        .notEmpty()
        .withMessage("le nom du centre est requis")
        .isInt()
        .withMessage("le type ne correspond pas au type attendu"),

      body("nom")
        .notEmpty()
        .withMessage("Le nom du centre est requis")
        .isString()
        .withMessage("le type ne corespond au type attendu"),
    ];
  }

  static ValidateDeleteCentre() {
    return [
      body("id_centre")
        .notEmpty()
        .withMessage("le nom du centre est requis")
        .isInt()
        .withMessage("le type ne correspond pas au type attendu"),
    ];
  }
}
