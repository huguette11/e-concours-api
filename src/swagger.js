import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Concours API",
      version: "1.0.0",
      description: "API pour la gestion des concours, candidats, admins, inscriptions et paiements",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Serveur local",
      },
    ],
    components: {
      schemas: {
        ContactRequest: {
          type: "object",
          required: ["nom", "email", "message"],
          properties: {
            nom: { type: "string", example: "Yobi Ba" },
            email: { type: "string", example: "yobi@example.com" },
            message: { type: "string", example: "Bonjour, je teste le contact" },
          },
        },
        Candidat: {
          type: "object",
          properties: {
            nom: { type: "string" },
            prenom: { type: "string" },
            email: { type: "string" },
            sexe: { type: "string", enum: ["HOMME", "FEMME"] },
            type_candidat: { type: "string", enum: ["DIRECT", "PROFESSIONNEL"] },
            telephone: { type: "string" },
            mot_de_passe: { type: "string" },
          },
        },
        Concours: {
          type: "object",
          properties: {
            nom: { type: "string" },
            type: { type: "string", enum: ["DIRECT","PROFESSIONNEL","HANDICAPE"] },
            description: { type: "string" },
            frais_inscription: { type: "number", format: "float" },
            nombre_postes: { type: "integer" },
            annee: { type: "integer" },
            date_debut: { type: "string", format: "date" },
            date_fin: { type: "string", format: "date" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerDocs = (app, port) => {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(` Swagger docs disponibles à http://localhost:${port}/api/docs`);
};