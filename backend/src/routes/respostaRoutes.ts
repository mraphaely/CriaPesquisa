import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { validar } from "../middleware/validate.js";
import { criarRespostaSchema } from "../helper/validators.js";
import { criar, listar, obter, remover } from "../controllers/respostaController.js";

const GESTOR_ADMIN = ["GESTOR", "ADMIN"];
const COLETA = ["COLETADOR", "GESTOR", "ADMIN"];

export const respostaRoutes = Router();

respostaRoutes.post(
  "/pesquisas/:id/respostas",
  autenticar,
  exigirPapel(...COLETA),
  validar(criarRespostaSchema),
  criar,
);
respostaRoutes.get("/pesquisas/:id/respostas", autenticar, listar);
respostaRoutes.get("/respostas/:id", autenticar, obter);
respostaRoutes.delete("/respostas/:id", autenticar, exigirPapel(...GESTOR_ADMIN), remover);
