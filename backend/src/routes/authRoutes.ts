import { Router } from "express";
import { login, me, trocarSenha } from "../controllers/authController.js";
import { autenticar } from "../middleware/auth.js";
import { validar } from "../middleware/validate.js";
import { limiteLogin } from "../middleware/rateLimit.js";
import { loginSchema, trocarSenhaSchema } from "../helper/validators.js";

export const authRoutes = Router();
authRoutes.post("/auth/login", limiteLogin, validar(loginSchema), login);
authRoutes.get("/auth/me", autenticar, me);
authRoutes.put("/auth/senha", autenticar, validar(trocarSenhaSchema), trocarSenha);
