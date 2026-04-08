import express from "express";
import { AdminDto } from "../Dtos/AdminDto.js";
import { ValidateRequest } from "../middleware/ValidateRequest.js";
import { AdminController } from "../controllers/Admin.controller.js";
import { AdminMiddleware } from "../middleware/Admin.Middleware.js";
import { ConcoursDto } from "../Dtos/ConcoursDto.js";

const router = express.Router();

router.post("/login",AdminDto.ValidateLogin(), ValidateRequest.handle, AdminController.Login);

router.post("/register",AdminDto.ValidateRegister(),ValidateRequest.handle,AdminController.Register);

router.get("/dashboard", AdminMiddleware.handle, AdminController.Dashboard);
router.get("/concours",AdminMiddleware.handle, AdminController.GetAllConcours);
router.get("/concours/:id_concours",AdminMiddleware.handle, AdminController.DetailConcours);
router.delete("/delete-concours",AdminMiddleware.handle, AdminController.DeleteConcours);
router.put("/update-concours",AdminMiddleware.handle, AdminController.UpdateConcours);
router.post("/create-centre",AdminDto.ValidateCreateCentre(),AdminMiddleware.handle, AdminController.CreateCentre);
router.post("/create-concours",AdminMiddleware.handle, AdminController.CreateConcours);

router.get(
  "/receipt",
  AdminController.PrintReceipt
);
export default router;
