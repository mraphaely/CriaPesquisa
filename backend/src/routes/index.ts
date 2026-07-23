import { Router } from "express";
import { healthRoutes } from "./healthRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { pesquisaRoutes } from "./pesquisaRoutes.js";
import { respostaRoutes } from "./respostaRoutes.js";
import { relatorioRoutes } from "./relatorioRoutes.js";
import { usuarioRoutes } from "./usuarioRoutes.js";
import { logRoutes } from "./logRoutes.js";

export const apiRoutes = Router();
apiRoutes.use(healthRoutes);
apiRoutes.use(authRoutes);
apiRoutes.use(pesquisaRoutes);
apiRoutes.use(respostaRoutes);
apiRoutes.use(relatorioRoutes);
apiRoutes.use(usuarioRoutes);
apiRoutes.use(logRoutes);
