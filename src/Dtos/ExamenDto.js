import { body } from "express-validator";

export class ExaenDto {
  static ValidateCreateExam() {
    return [
      body("intitule")
        .isString()
        .withMessage("L'intitule dois etre une chaine de carractere")
        .notEmpty()
        .withMessage("le champ ne dois pas etre null"),

      body("type_examen")
        .notEmpty()
        .withMessage("le type de l'examen est requis")
        .isIn(["ORAL", "ECRIT"]),

      body("coefficient")
        .notEmpty()
        .withMessage("Le coefficient est requis")
        .isInt()
        .withMessage("le coefficient doit etre en entier"),

      body("heure").optional(),
      body("id_concours")
        .notEmpty()
        .withMessage("les references du concours sont requises"),
    ];
  }
}
