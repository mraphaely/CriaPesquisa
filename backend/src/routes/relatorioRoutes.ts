import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { resumo, exportar } from "../controllers/relatorioController.js";

const GESTOR_ADMIN = ["GESTOR", "ADMIN"];

export const relatorioRoutes = Router();

relatorioRoutes.get("/pesquisas/:id/resumo", autenticar, resumo);
relatorioRoutes.get("/pesquisas/:id/export", autenticar, exigirPapel(...GESTOR_ADMIN), exportar);
