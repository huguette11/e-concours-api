import express from "express";
import { InscriptionController } from "../controllers/inscription.controller.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";

const router = express.Router();
const controller = new InscriptionController();


router.post("/", AuthMiddleware.protect, controller.sInscrire);

router.get("/:id_inscription", AuthMiddleware.protect, controller.getInscription);

export default router;