import express from "express";
import { ValidateRequest } from '../middleware/ValidateRequest.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { CandidatDto } from "../Dtos/CandidatDto.js";
import { authController } from "../container.js";
import { AuthController } from "../controllers/Auth.controller.js";

const router = express.Router();

//  Routes publiques (guest)
router.post('/login', CandidatDto.ValidateLogin(), ValidateRequest.handle, authController.Login);
router.post('/register', CandidatDto.validateRegister(), ValidateRequest.handle, authController.Register);
router.post('/verify', ValidateRequest.handle, authController.VerifierOtp);
router.post('/contact-us',CandidatDto.ValidateContactUs(),ValidateRequest.handle,authController.ContactUS);




export default router;