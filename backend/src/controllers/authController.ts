import type { Request, Response } from "express";
import { usuarioModel } from "../models/usuarioModel.js";
import { conferirSenha } from "../helper/senha.js";
import { gerarToken } from "../helper/token.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body as { email: string; senha: string };
  const usuario = await usuarioModel.buscarPorEmail(email);
  if (!usuario || !usuario.ativo || !(await conferirSenha(senha, usuario.senhaHash))) {
    throw new HttpError(401, "CREDENCIAIS_INVALIDAS", "E-mail ou senha inválidos");
  }
  const token = gerarToken({ sub: usuario.id, papel: usuario.papel });
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel } });
}

export async function me(req: Request, res: Response) {
  const usuario = await usuarioModel.buscarPublicoPorId(req.usuario!.id);
  if (!usuario) throw new HttpError(404, "NAO_ENCONTRADO", "Usuário não encontrado");
  res.json({ usuario });
}
