import { Router } from "express";
import { healthRoutes } from "./healthRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { pesquisaRoutes } from "./pesquisaRoutes.js";

export const apiRoutes = Router();
apiRoutes.use(healthRoutes);
apiRoutes.use(authRoutes);
apiRoutes.use(pesquisaRoutes);
