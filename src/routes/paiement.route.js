import express from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { PaiementController } from "../controllers/Paiement.controller.js";

const router = express.Router();

router.post('/callback', PaiementController.Callback);


router.use(AuthMiddleware.protect);

router.post('/init-payment', PaiementController.Init);

export default router;