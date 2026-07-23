import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { listarLogs } from "../controllers/logController.js";

export const logRoutes = Router();

logRoutes.get("/logs", autenticar, exigirPapel("ADMIN"), listarLogs);
