import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { validar } from "../middleware/validate.js";
import { criarIndicadorSchema, atualizarIndicadorSchema } from "../helper/validators.js";
import { listar, obter, criar, atualizar, remover } from "../controllers/indicadorController.js";

const GESTOR_ADMIN = ["GESTOR", "ADMIN"];

export const indicadorRoutes = Router();

indicadorRoutes.get("/indicadores", autenticar, listar);
indicadorRoutes.get("/indicadores/:id", autenticar, obter);
indicadorRoutes.post("/indicadores", autenticar, exigirPapel(...GESTOR_ADMIN), validar(criarIndicadorSchema), criar);
indicadorRoutes.put("/indicadores/:id", autenticar, exigirPapel(...GESTOR_ADMIN), validar(atualizarIndicadorSchema), atualizar);
indicadorRoutes.delete("/indicadores/:id", autenticar, exigirPapel(...GESTOR_ADMIN), remover);
