import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { validar } from "../middleware/validate.js";
import { criarPesquisaSchema, atualizarPesquisaSchema, secaoSchema, perguntaSchema, atualizarPerguntaSchema, reordenarSchema } from "../helper/validators.js";
import {
  listar,
  obter,
  criar,
  atualizar,
  remover,
  publicar,
  encerrar,
  arquivar,
  restaurar,
  listarVersoes,
} from "../controllers/pesquisaController.js";
import {
  criarSecao,
  atualizarSecao,
  deletarSecao,
  criarPergunta,
  atualizarPergunta,
  deletarPergunta,
  reordenarPerguntas,
} from "../controllers/perguntaController.js";

const GESTOR_ADMIN = ["GESTOR", "ADMIN"];

export const pesquisaRoutes = Router();

// ---------- Pesquisas: CRUD ----------
pesquisaRoutes.get("/pesquisas", autenticar, listar);
pesquisaRoutes.get("/pesquisas/:id", autenticar, obter);
pesquisaRoutes.post("/pesquisas", autenticar, exigirPapel(...GESTOR_ADMIN), validar(criarPesquisaSchema), criar);
pesquisaRoutes.put("/pesquisas/:id", autenticar, exigirPapel(...GESTOR_ADMIN), validar(atualizarPesquisaSchema), atualizar);
pesquisaRoutes.delete("/pesquisas/:id", autenticar, exigirPapel(...GESTOR_ADMIN), remover);

// ---------- Pesquisas: ciclo de vida ----------
pesquisaRoutes.post("/pesquisas/:id/publicar", autenticar, exigirPapel(...GESTOR_ADMIN), publicar);
pesquisaRoutes.post("/pesquisas/:id/encerrar", autenticar, exigirPapel(...GESTOR_ADMIN), encerrar);
pesquisaRoutes.post("/pesquisas/:id/arquivar", autenticar, exigirPapel(...GESTOR_ADMIN), arquivar);
pesquisaRoutes.post("/pesquisas/:id/restaurar", autenticar, exigirPapel("ADMIN"), restaurar);
pesquisaRoutes.get("/pesquisas/:id/versoes", autenticar, exigirPapel(...GESTOR_ADMIN), listarVersoes);

// ---------- Seções ----------
pesquisaRoutes.post("/pesquisas/:id/secoes", autenticar, exigirPapel(...GESTOR_ADMIN), validar(secaoSchema), criarSecao);
pesquisaRoutes.put("/secoes/:id", autenticar, exigirPapel(...GESTOR_ADMIN), validar(secaoSchema.partial()), atualizarSecao);
pesquisaRoutes.delete("/secoes/:id", autenticar, exigirPapel(...GESTOR_ADMIN), deletarSecao);

// ---------- Perguntas + opções ----------
pesquisaRoutes.post("/pesquisas/:id/perguntas", autenticar, exigirPapel(...GESTOR_ADMIN), validar(perguntaSchema), criarPergunta);
pesquisaRoutes.put("/perguntas/:id", autenticar, exigirPapel(...GESTOR_ADMIN), validar(atualizarPerguntaSchema), atualizarPergunta);
pesquisaRoutes.delete("/perguntas/:id", autenticar, exigirPapel(...GESTOR_ADMIN), deletarPergunta);
pesquisaRoutes.post(
  "/pesquisas/:id/perguntas/reordenar",
  autenticar,
  exigirPapel(...GESTOR_ADMIN),
  validar(reordenarSchema),
  reordenarPerguntas,
);
