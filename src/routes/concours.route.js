import { Router }            from "express";
import { ConcoursController } from "../controllers/Concours.controller.js";
import { AuthMiddleware }     from "../middleware/AuthMiddleware.js";

const router = Router();

router.use(AuthMiddleware.protect);


// Liste de tous les concours
router.get("/",                        (req, res) => ConcoursController.GetAllConcours(req, res));

// Détail d'un concours
router.get("/detail/:id_concours",     (req, res) => ConcoursController.DetailConcours(req, res));

// Liste des catégories
router.get("/categories",              (req, res) => ConcoursController.GetCategorie(req, res));

export default router;