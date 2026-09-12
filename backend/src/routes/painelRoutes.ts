import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { painel } from "../controllers/painelController.js";

export const painelRoutes = Router();

painelRoutes.get("/painel", autenticar, painel);
