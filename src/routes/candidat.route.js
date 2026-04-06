import { Router } from "express";
import { CandidatController } from "../controllers/Candidat.controller.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";

const router = Router();
const ctrl   = new CandidatController();

router.use(AuthMiddleware.protect); 
router.get("/profil",                        (req, res) => ctrl.getProfil(req, res));
router.put("/profil",                        (req, res) => ctrl.updateProfil(req, res));
router.get("/candidatures",                  (req, res) => ctrl.getMesCandidatures(req, res));
router.get("/recepisse/:id_inscription",     (req, res) => ctrl.getRecepisse(req, res));
router.get("/resultats",                     (req, res) => ctrl.getResultats(req, res));

export default router;