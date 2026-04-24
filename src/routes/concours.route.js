import { Router } from "express";
import { ConcoursController } from "../controllers/Concours.controller.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { AdminController } from "../controllers/Admin.controller.js";

const router = Router();


router.get("/", ConcoursController.GetCategorieConcours);
router.get("/detail/:id", ConcoursController.DetailConcours);

// Liste des catégories
router.get("/categories", ConcoursController.GetCategorie);


export default router;