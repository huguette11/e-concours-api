import { Router } from "express";
import { CandidatController } from "../controllers/Candidat.controller.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();
// const ctrl   = new CandidatController();

router.use(AuthMiddleware.protect); 


router.get("/profil",CandidatController.getProfil);
router.put("/profil",CandidatController.updateProfil);
// router.get("/candidatures",CandidatController.getMesCandidatures);
// router.get("/recepisse/:id_inscription",CandidatController.getRecepisse);
router.get("/resultats", CandidatController.getResultats);
router.post('/documents',upload.array('documents', 5),CandidatController.uploadDocuments);
export default router;