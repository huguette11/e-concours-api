
import express from "express";
import { AdminDto } from "../Dtos/Admin.Dto";
import { ValidateRequest } from "../middleware/ValidateRequest";
import { AdminController } from "../controllers/Admin.controller";

const router = express.Router();

router.post('/login',AdminDto.ValidateLogin(),ValidateRequest.handle,AdminController.Login);
router.post('/register',AdminDto.ValidateRegister(),ValidateRequest.handle,AdminController.Register);

router.get();
router.post();

export default router;