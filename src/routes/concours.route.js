import { Router } from "express";
import { ConcoursController } from "../controllers/Concours.controller.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { AdminController } from "../controllers/Admin.controller.js";

const router = Router();


router.get("/", ConcoursController.GetAllConcours);
router.get("/:id", ConcoursController.DetailConcours);


router.post("/:id_concours/repartition", AdminController.repartirCandidats);
router.get ("/:id_concours/repartition",AdminController.consulterRepartition);
router.get ("/:id_concours/repartition/candidat/:id_candidat",  AdminController.lieuDuCandidat);

export default router;