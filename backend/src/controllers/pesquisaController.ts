import type { Request, Response } from "express";
import type { StatusPesquisa } from "@prisma/client";
import { pesquisaModel } from "../models/pesquisaModel.js";
import { registrarLog } from "../helper/auditoria.js";
import { snapshotPesquisa } from "../helper/versao.js";
import { HttpError } from "../middleware/errorHandler.js";
import { parsePaginacao } from "../helper/paginacao.js";
import type { CriarPesquisaInput, AtualizarPesquisaInput } from "../helper/validators.js";

function parseQueryString(valor: unknown): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

export async function listar(req: Request, res: Response) {
  const status = parseQueryString(req.query.status) as StatusPesquisa | undefined;
  const q = parseQueryString(req.query.q);
  const { page, pageSize } = parsePaginacao(req.query, 20);

  const { total, itens } = await pesquisaModel.listar({ status, q, page, pageSize });
  res.json({ total, page, pageSize, itens });
}

export async function obter(req: Request, res: Response) {
  const pesquisa = await pesquisaModel.obterPorId(req.params.id);
  if (!pesquisa) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");
  res.json({ pesquisa });
}

export async function criar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const dados = req.body as CriarPesquisaInput;

  const pesquisa = await pesquisaModel.criar(dados, usuario.id);
  await registrarLog({
    entidade: "Pesquisa",
    entidadeId: pesquisa.id,
    acao: "CREATE",
    usuarioId: usuario.id,
    dadosDepois: pesquisa,
    ip: req.ip,
  });
  await snapshotPesquisa(pesquisa.id, usuario.id);

  res.status(201).json({ pesquisa });
}

export async function atualizar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;

  const atual = await pesquisaModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");
  // Edição altera apenas metadados (título, descrição, responsável, período) — não
  // mexe nas perguntas —, então é seguro em qualquer status, exceto arquivada.
  if (atual.status === "ARQUIVADA") {
    throw new HttpError(409, "PESQUISA_ARQUIVADA", "pesquisa arquivada não pode ser editada");
  }

  const dados = req.body as AtualizarPesquisaInput;
  const pesquisa = await pesquisaModel.atualizar(id, dados);
  await registrarLog({
    entidade: "Pesquisa",
    entidadeId: id,
    acao: "UPDATE",
    usuarioId: usuario.id,
    dadosAntes: atual,
    dadosDepois: pesquisa,
    ip: req.ip,
  });
  await snapshotPesquisa(id, usuario.id);

  res.json({ pesquisa });
}

export async function remover(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;

  const atual = await pesquisaModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");

  await pesquisaModel.softDelete(id, usuario.id);
  await registrarLog({
    entidade: "Pesquisa",
    entidadeId: id,
    acao: "DELETE",
    usuarioId: usuario.id,
    dadosAntes: atual,
    ip: req.ip,
  });

  res.status(204).send();
}

export async function publicar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;

  const atual = await pesquisaModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");

  const totalPerguntas = await pesquisaModel.contarPerguntas(id);
  if (totalPerguntas < 1) {
    throw new HttpError(400, "SEM_PERGUNTAS", "não é possível publicar sem perguntas");
  }
  if (atual.status !== "RASCUNHO") {
    throw new HttpError(409, "STATUS_INVALIDO", "pesquisa não está em rascunho");
  }

  const pesquisa = await pesquisaModel.mudarStatus(id, "PUBLICADA");
  await registrarLog({
    entidade: "Pesquisa",
    entidadeId: id,
    acao: "PUBLICAR",
    usuarioId: usuario.id,
    dadosAntes: atual,
    dadosDepois: pesquisa,
    ip: req.ip,
  });

  res.json({ pesquisa });
}

export async function encerrar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;

  const atual = await pesquisaModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");
  if (atual.status !== "PUBLICADA") {
    throw new HttpError(409, "STATUS_INVALIDO", "pesquisa não está publicada");
  }

  const pesquisa = await pesquisaModel.mudarStatus(id, "ENCERRADA");
  await registrarLog({
    entidade: "Pesquisa",
    entidadeId: id,
    acao: "ENCERRAR",
    usuarioId: usuario.id,
    dadosAntes: atual,
    dadosDepois: pesquisa,
    ip: req.ip,
  });

  res.json({ pesquisa });
}

export async function arquivar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;

  const atual = await pesquisaModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");

  const pesquisa = await pesquisaModel.mudarStatus(id, "ARQUIVADA");
  await registrarLog({
    entidade: "Pesquisa",
    entidadeId: id,
    acao: "ARQUIVAR",
    usuarioId: usuario.id,
    dadosAntes: atual,
    dadosDepois: pesquisa,
    ip: req.ip,
  });

  res.json({ pesquisa });
}

export async function restaurar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;

  const pesquisa = await pesquisaModel.restaurar(id);
  await registrarLog({
    entidade: "Pesquisa",
    entidadeId: id,
    acao: "RESTORE",
    usuarioId: usuario.id,
    dadosDepois: pesquisa,
    ip: req.ip,
  });

  res.json({ pesquisa });
}

export async function listarVersoes(req: Request, res: Response) {
  const { id } = req.params;
  const versoes = await pesquisaModel.listarVersoes(id);
  res.json({ versoes });
}
