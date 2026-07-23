import type { Request, Response } from "express";
import { usuarioModel } from "../models/usuarioModel.js";
import { hashSenha } from "../helper/senha.js";
import { registrarLog } from "../helper/auditoria.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CriarUsuarioInput, AtualizarUsuarioInput } from "../helper/validators.js";

export async function listarUsuarios(_req: Request, res: Response) {
  const itens = await usuarioModel.listar();
  res.json({ itens });
}

export async function criarUsuario(req: Request, res: Response) {
  const dados = req.body as CriarUsuarioInput;
  const existente = await usuarioModel.buscarPorEmail(dados.email);
  if (existente) throw new HttpError(409, "EMAIL_EM_USO", "E-mail já cadastrado");

  const senhaHash = await hashSenha(dados.senha);
  const usuario = await usuarioModel.criar({
    nome: dados.nome,
    email: dados.email,
    papel: dados.papel,
    senhaHash,
  });
  await registrarLog({
    entidade: "Usuario",
    entidadeId: usuario.id,
    acao: "CREATE",
    usuarioId: req.usuario!.id,
    dadosDepois: usuario,
    ip: req.ip,
  });
  res.status(201).json({ usuario });
}

export async function atualizarUsuario(req: Request, res: Response) {
  const { id } = req.params;
  const dados = req.body as AtualizarUsuarioInput;
  const senhaHash = dados.senha ? await hashSenha(dados.senha) : undefined;
  const usuario = await usuarioModel.atualizar(id, {
    nome: dados.nome,
    email: dados.email,
    papel: dados.papel,
    ativo: dados.ativo,
    senhaHash,
  });
  await registrarLog({
    entidade: "Usuario",
    entidadeId: id,
    acao: "UPDATE",
    usuarioId: req.usuario!.id,
    dadosDepois: usuario,
    ip: req.ip,
  });
  res.json({ usuario });
}

export async function desativarUsuario(req: Request, res: Response) {
  const { id } = req.params;
  await usuarioModel.desativar(id);
  await registrarLog({
    entidade: "Usuario",
    entidadeId: id,
    acao: "DELETE",
    usuarioId: req.usuario!.id,
    ip: req.ip,
  });
  res.status(204).end();
}
