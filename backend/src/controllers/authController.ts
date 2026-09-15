import type { Request, Response } from "express";
import { usuarioModel } from "../models/usuarioModel.js";
import { conferirSenha, hashSenha } from "../helper/senha.js";
import { gerarToken } from "../helper/token.js";
import { registrarLog } from "../helper/auditoria.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { TrocarSenhaInput } from "../helper/validators.js";

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body as { email: string; senha: string };
  const usuario = await usuarioModel.buscarPorEmail(email);
  if (!usuario || !usuario.ativo || !(await conferirSenha(senha, usuario.senhaHash))) {
    throw new HttpError(401, "CREDENCIAIS_INVALIDAS", "E-mail ou senha inválidos");
  }
  const token = gerarToken({ sub: usuario.id, papel: usuario.papel });
  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      precisaTrocarSenha: usuario.precisaTrocarSenha,
    },
  });
}

export async function me(req: Request, res: Response) {
  const usuario = await usuarioModel.buscarPublicoPorId(req.usuario!.id);
  if (!usuario) throw new HttpError(404, "NAO_ENCONTRADO", "Usuário não encontrado");
  res.json({ usuario });
}

/**
 * Troca de senha pela própria pessoa. É o que separa "o admin criou a conta" de
 * "só esta pessoa sabe entrar nela" — sem isso a trilha de auditoria não
 * consegue afirmar quem agiu, porque quem cadastrou também conhece a senha.
 */
export async function trocarSenha(req: Request, res: Response) {
  const { id } = req.usuario!;
  const { senhaAtual, senhaNova } = req.body as TrocarSenhaInput;

  const usuario = await usuarioModel.buscarPorId(id);
  if (!usuario) throw new HttpError(404, "NAO_ENCONTRADO", "Usuário não encontrado");

  if (!(await conferirSenha(senhaAtual, usuario.senhaHash))) {
    throw new HttpError(400, "SENHA_ATUAL_INCORRETA", "A senha atual não confere");
  }

  await usuarioModel.atualizarSenha(id, await hashSenha(senhaNova));
  // O log registra que houve troca e quando — nunca a senha nem o hash.
  await registrarLog({
    entidade: "Usuario",
    entidadeId: id,
    acao: "UPDATE",
    usuarioId: id,
    dadosDepois: { senhaAlterada: true },
    ip: req.ip,
  });

  res.status(204).send();
}
