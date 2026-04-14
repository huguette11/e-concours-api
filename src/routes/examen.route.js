import { Router }          from "express";
import { ExamenController } from "../controllers/Examen.controller.js";
import { AuthMiddleware }   from "../middleware/AuthMiddleware.js";

const router = Router();
const ctrl   = new ExamenController();

router.use(AuthMiddleware.protect);
router.use(AuthMiddleware.CompteVerifier);
router.get("/concours/:id_concours",  (req, res) => ctrl.getExamensDuConcours(req, res));


router.get("/detail/:id_examen",      (req, res) => ctrl.getExamen(req, res));


router.get("/mes-resultats",          (req, res) => ctrl.getMesResultats(req, res));

export default router;