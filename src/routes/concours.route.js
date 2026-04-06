import { Router }            from "express";
import { ConcoursController } from "../controllers/Concours.controller.js";
import { AuthMiddleware }     from "../middleware/AuthMiddleware.js";

const router = Router();
const ctrl   = new ConcoursController();

router.use(AuthMiddleware.protect);

router.get("/",    (req, res) => ctrl.getAllConcours(req, res));
router.get("/:id", (req, res) => ctrl.getConcours(req, res));

export default router;