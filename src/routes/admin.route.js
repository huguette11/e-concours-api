import express from "express";
import { AdminDto } from "../Dtos/AdminDto.js";
import { ValidateRequest } from "../middleware/ValidateRequest.js";
import { AdminController } from "../controllers/Admin.controller.js";
import { AdminMiddleware } from "../middleware/Admin.Middleware.js";
import { ConcoursDto } from "../Dtos/ConcoursDto.js";
import { CategorieDto } from "../Dtos/CategorieDto.js";
import { PaiementController } from "../controllers/Paiement.controller.js";

const router = express.Router();

// Helper validation
const validate = (dto) => [dto, ValidateRequest.handle];

// Routes publiques (sans middleware)
router.post("/login", ...validate(AdminDto.ValidateLogin()), AdminController.Login);
router.post("/register", ...validate(AdminDto.ValidateRegister()), AdminController.Register);


router.use(AdminMiddleware.handle);

router.get("/dashboard", AdminController.Dashboard);
//concours
router.get("/concours", AdminController.GetAllConcours);
router.get("/concours/:id_concours", AdminController.DetailConcours);
router.delete("/delete-concours", AdminController.DeleteConcours);
router.put("/update-concours", AdminController.UpdateConcours);
router.post("/create-concours", AdminController.CreateConcours);
router.get('/concours/search',AdminController.SearchConcours);
router.post('/concours/switch-status/:id_concours',AdminController.SwitchStatuConcours)

// router.get("/receipt", AdminController.PrintReceipt);

// Routes protégées avec validation
router.post("/create-centre", ...validate(AdminDto.ValidateCreateCentre()), AdminController.CreateCentre);

// categorie concours
router.delete("/delete-categorie-concours", AdminController.DeleteCategorie);
router.post("/create-categorie-concours", ...validate(CategorieDto.CreateCategorie()), AdminController.CreateCategorie);
router.put("/update-categorie-concours",...validate(CategorieDto.UpdateCategorie()),AdminController.UpdateCategorie);
router.get('/concours-by-categorie',AdminController.GetCategorieConcours);
router.get('/get-categorie',AdminController.GetCategorie);
router.put('/paiement-status', AdminController.UpdadePaiemntStatus);
router.get('/detail-paiement',AdminController.DetailPaiement);
router.get('/liste-paiement',AdminController.ListesPaiements);

router.get('/candidats/search',AdminController.SearchCandidat)



/// payer coter admin aussi 




export default router;