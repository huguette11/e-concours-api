import { body } from "express-validator";

export class ConcoursDto {
  static ValidateCreateConcours() {
    return [
      body("type")
        .isString()
        .withMessage("Le type de concours doit etre en chaine de caractere")
        .isIn(["DIRECT", "PROFESSIONNEL", "HANDICAPE"])
        .notEmpty()
        .withMessage("le type du concours ne dois pas etre vide"),
      body("nom")
        .isString("le nom du concours dois etre en chaine de caractere")
        .notEmpty()
        .withMessage("Nom du concours ne dois pas etre vide"),

      body("description")
        .notEmpty()
        .withMessage("Descriptions ne dois pas etre vide"),
      body("nombre_postes")
        .isInt()
        .withMessage("le nombre de postes a promouvoir dois etre en entier")
        .notEmpty()
        .withMessage("le nombre de postes ne dois pas etre vide"),

      body("annee")
        .isInt()
        .withMessage("annee dois etre en entier")
        .notEmpty()
        .withMessage("annee  ne dois pas etre vide"),

      body("date_debut")
        .optional()
        .isDate()
        .withMessage("date debut doit etre une date"),

      body("date_fin")
        .optional()
        .isDate()
        .withMessage("date fin doit etre une date"),

        //Hugutte devrais typer le status_concours pour que je puisse utiliser sanns soucis
      body("statut_concours").optional,
    ];
  }

  static  ValidateUpdateConcours(){
    return[
         body("type")
        .isString()
        .withMessage("Le type de concours doit etre en chaine de caractere")
        .isIn(["DIRECT", "PROFESSIONNEL", "HANDICAPE"])
        .optional()
        .withMessage("le type du concours ne dois pas etre vide"),
      body("nom")
        .isString("le nom du concours dois etre en chaine de caractere")
        .optional()
        .withMessage("Nom du concours ne dois pas etre vide"),

      body("description")
        .notEmpty()
        .withMessage("Descriptions ne dois pas etre vide"),
      body("nombre_postes")
        .isInt()
        .withMessage("le nombre de postes a promouvoir dois etre en entier")
        .optional()
        .withMessage("le nombre de postes ne dois pas etre vide"),

      body("annee")
        .isInt()
        .withMessage("annee dois etre en entier")
        .optional()
        .withMessage("annee  ne dois pas etre vide"),

      body("date_debut")
        .optional()
        .isDate()
        .withMessage("date debut doit etre une date"),

      body("date_fin")
        .optional()
        .isDate()
        .withMessage("date fin doit etre une date"),

        //Hugutte devrais typer le status_concours pour que je puisse utiliser sanns soucis
      body("statut_concours").optional,
    ]
  }
}
