import { Router } from "express";
import { login, me } from "../controllers/authController.js";
import { autenticar } from "../middleware/auth.js";
import { validar } from "../middleware/validate.js";
import { loginSchema } from "../helper/validators.js";

export const authRoutes = Router();
authRoutes.post("/auth/login", validar(loginSchema), login);
authRoutes.get("/auth/me", autenticar, me);
