import { body } from "express-validator";

export class CategorieDto {
  static CreateCategorie() {
    return [
      body("liblle")
        .notEmpty()
        .withMessage("Le libelle est requis")
        .isString()
        .withMessage("Le libelle doit etre en chaine de caractere"),
      body("description").optional(),
    ];
  }

  static UpdateCategorie() {
    return [body("id").notEmpty().withMessage("Id est requis").isInt()];
  }
}
