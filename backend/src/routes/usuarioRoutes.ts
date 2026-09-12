import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { validar } from "../middleware/validate.js";
import { criarUsuarioSchema, atualizarUsuarioSchema } from "../helper/validators.js";
import {
  listarUsuarios,
  obterUsuario,
  criarUsuario,
  atualizarUsuario,
  desativarUsuario,
} from "../controllers/usuarioController.js";

export const usuarioRoutes = Router();

usuarioRoutes.get("/usuarios", autenticar, exigirPapel("ADMIN"), listarUsuarios);
usuarioRoutes.get("/usuarios/:id", autenticar, exigirPapel("ADMIN"), obterUsuario);
usuarioRoutes.post("/usuarios", autenticar, exigirPapel("ADMIN"), validar(criarUsuarioSchema), criarUsuario);
usuarioRoutes.put("/usuarios/:id", autenticar, exigirPapel("ADMIN"), validar(atualizarUsuarioSchema), atualizarUsuario);
usuarioRoutes.delete("/usuarios/:id", autenticar, exigirPapel("ADMIN"), desativarUsuario);
