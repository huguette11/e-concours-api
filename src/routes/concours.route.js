import { Router }            from "express";
import { ConcoursController } from "../controllers/Concours.controller.js";
import { AuthMiddleware }     from "../middleware/AuthMiddleware.js";

const router = Router();
const ctrl   = new ConcoursController();

// router.use(AuthMiddleware.protect);

router.get("/",ConcoursController.GetAllConcours);
router.get("/:id",ConcoursController.DetailConcours);

export default router;