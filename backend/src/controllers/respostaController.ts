import type { Request, Response } from "express";
import { respostaModel } from "../models/respostaModel.js";
import type { ListarRespostasFiltros } from "../models/respostaModel.js";
import { pesquisaModel } from "../models/pesquisaModel.js";
import { registrarLog } from "../helper/auditoria.js";
import { validarRespostaContraPerguntas } from "../helper/validarResposta.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CriarRespostaInput } from "../helper/validators.js";

function parseQueryString(valor: unknown): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

function parseQueryNumber(valor: unknown): number | undefined {
  const texto = parseQueryString(valor);
  if (!texto) return undefined;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : undefined;
}

function parseQueryDate(valor: unknown): Date | undefined {
  const texto = parseQueryString(valor);
  if (!texto) return undefined;
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? undefined : data;
}

/** Filtros comuns (sem paginação) usados por resumo/export além da listagem. */
export function extrairFiltrosBase(query: Request["query"]): Omit<ListarRespostasFiltros, "page" | "pageSize"> {
  return {
    municipio: parseQueryString(query.municipio),
    unidade: parseQueryString(query.unidade),
    de: parseQueryDate(query.de),
    ate: parseQueryDate(query.ate),
  };
}

export function extrairFiltrosListagem(query: Request["query"]): ListarRespostasFiltros {
  return {
    ...extrairFiltrosBase(query),
    page: parseQueryNumber(query.page) ?? 1,
    pageSize: parseQueryNumber(query.pageSize) ?? 20,
  };
}

export async function criar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id: pesquisaId } = req.params;

  const pesquisa = await pesquisaModel.obterPorId(pesquisaId);
  if (!pesquisa) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");
  if (pesquisa.status !== "PUBLICADA") {
    throw new HttpError(409, "PESQUISA_NAO_PUBLICADA", "pesquisa não está publicada");
  }

  const dados = req.body as CriarRespostaInput;
  const erros = validarRespostaContraPerguntas(pesquisa.perguntas, dados.itens);
  if (erros.length > 0) {
    throw new HttpError(422, "VALIDACAO_RESPOSTA", "Resposta inválida", erros);
  }

  const resposta = await respostaModel.criar(pesquisaId, usuario.id, dados);
  await registrarLog({
    entidade: "Resposta",
    entidadeId: resposta.id,
    acao: "CREATE",
    usuarioId: usuario.id,
    dadosDepois: resposta,
    ip: req.ip,
  });

  res.status(201).json({ resposta });
}

export async function listar(req: Request, res: Response) {
  const { id: pesquisaId } = req.params;

  const pesquisa = await pesquisaModel.obterPorId(pesquisaId);
  if (!pesquisa) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");

  const filtros = extrairFiltrosListagem(req.query);
  const { total, itens } = await respostaModel.listar(pesquisaId, filtros);
  res.json({ total, page: filtros.page, pageSize: filtros.pageSize, itens });
}

export async function obter(req: Request, res: Response) {
  const { id } = req.params;
  const resposta = await respostaModel.obterPorId(id);
  if (!resposta) throw new HttpError(404, "NAO_ENCONTRADA", "Resposta não encontrada");
  res.json({ resposta });
}

export async function remover(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;

  const atual = await respostaModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADA", "Resposta não encontrada");

  await respostaModel.softDelete(id, usuario.id);
  await registrarLog({
    entidade: "Resposta",
    entidadeId: id,
    acao: "DELETE",
    usuarioId: usuario.id,
    dadosAntes: atual,
    ip: req.ip,
  });

  res.status(204).send();
}
