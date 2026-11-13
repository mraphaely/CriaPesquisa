import express, { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { validar } from "../middleware/validate.js";
import { criarIndicadorSchema, atualizarIndicadorSchema } from "../helper/validators.js";
import { listar, obter, criar, atualizar, remover, calculo } from "../controllers/indicadorController.js";
import { importarPlanilha } from "../controllers/importacaoController.js";

const GESTOR_ADMIN = ["GESTOR", "ADMIN"];

export const indicadorRoutes = Router();

indicadorRoutes.get("/indicadores", autenticar, listar);
// Antes de /indicadores/:id, senão "calculo" é lido como id.
indicadorRoutes.get("/indicadores/calculo", autenticar, calculo);
indicadorRoutes.get("/indicadores/:id", autenticar, obter);
// Corpo = o próprio .xlsx. O raw vem depois da autenticação: quem não pode importar
// é recusado antes de o arquivo ser lido. A planilha real tem poucas centenas de KB.
indicadorRoutes.post(
  "/indicadores/importar",
  autenticar,
  exigirPapel(...GESTOR_ADMIN),
  express.raw({ type: () => true, limit: "10mb" }),
  importarPlanilha,
);
indicadorRoutes.post("/indicadores", autenticar, exigirPapel(...GESTOR_ADMIN), validar(criarIndicadorSchema), criar);
indicadorRoutes.put("/indicadores/:id", autenticar, exigirPapel(...GESTOR_ADMIN), validar(atualizarIndicadorSchema), atualizar);
indicadorRoutes.delete("/indicadores/:id", autenticar, exigirPapel(...GESTOR_ADMIN), remover);
