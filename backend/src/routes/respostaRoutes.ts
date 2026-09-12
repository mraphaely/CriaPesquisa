import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { validar } from "../middleware/validate.js";
import { criarRespostaSchema, atualizarRespostaSchema, reprovarRespostaSchema } from "../helper/validators.js";
import { criar, atualizar, aprovar, reprovar, listar, obter, remover } from "../controllers/respostaController.js";

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
respostaRoutes.put(
  "/respostas/:id",
  autenticar,
  exigirPapel(...COLETA),
  validar(atualizarRespostaSchema),
  atualizar,
);
respostaRoutes.post("/respostas/:id/aprovar", autenticar, exigirPapel(...GESTOR_ADMIN), aprovar);
respostaRoutes.post(
  "/respostas/:id/reprovar",
  autenticar,
  exigirPapel(...GESTOR_ADMIN),
  validar(reprovarRespostaSchema),
  reprovar,
);
respostaRoutes.delete("/respostas/:id", autenticar, exigirPapel(...GESTOR_ADMIN), remover);
