import express from "express";
import pool from "../index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ValidateRequest } from '../middleware/ValidateRequest.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { AuthController } from "../controllers/Auth.controller.js";
import { CandidatDto } from "../Dtos/CandidatDto.js";
const router = express.Router();


router.post(
  '/login',
  CandidatDto.ValidateLogin(),
  ValidateRequest.handle,
  AuthController.Login
);
export default router;