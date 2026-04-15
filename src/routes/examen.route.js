import { Router }          from "express";
import { ExamenController } from "../controllers/Examen.controller.js";
import { AuthMiddleware }   from "../middleware/AuthMiddleware.js";

const router = Router();
const ctrl   = new ExamenController();

router.use(AuthMiddleware.protect);

// Examens d'un concours
router.get("/concours/:id_concours", (req, res) => ctrl.getExamensDuConcours(req, res));

// Détail d'un examen + mon résultat
router.get("/detail/:id_examen",     (req, res) => ctrl.getExamen(req, res));

// Tous mes résultats groupés par concours
router.get("/mes-resultats",         (req, res) => ctrl.getMesResultats(req, res));

export default router;