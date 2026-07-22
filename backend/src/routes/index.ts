import { Router } from "express";
import { healthRoutes } from "./healthRoutes.js";
import { authRoutes } from "./authRoutes.js";

export const apiRoutes = Router();
apiRoutes.use(healthRoutes);
apiRoutes.use(authRoutes);
