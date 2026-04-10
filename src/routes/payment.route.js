import express from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { PaiementController } from "../controllers/Paiement.controller";
const router = express.Router();

// le callback du payement 
router.post('/callback',PaiementController.Callback);

router.use(AuthMiddleware.protect);
router.post('/init-payment',PaiementController.Init);

export default router;