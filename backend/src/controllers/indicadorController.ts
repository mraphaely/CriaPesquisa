import type { Request, Response } from "express";
import type { StatusIndicador } from "@prisma/client";
import { indicadorModel } from "../models/indicadorModel.js";
import { registrarLog } from "../helper/auditoria.js";
import { HttpError } from "../middleware/errorHandler.js";
import { parsePaginacao } from "../helper/paginacao.js";
import { validarConfig, indicadoresReferenciados } from "../helper/indicadorConfig.js";
import { ordenarPorDependencia, CicloDetectado } from "../helper/dependencias.js";
import type { CriarIndicadorInput, AtualizarIndicadorInput } from "../helper/validators.js";

/** Valida a config contra o tipo e devolve de quais indicadores este depende. */
function conferirConfig(tipo: CriarIndicadorInput["tipo"], config: unknown): string[] {
  return indicadoresReferenciados(validarConfig(tipo, config));
}

/**
 * Recusa o salvamento se a nova aresta fechar um ciclo.
 *
 * `id` precisa ser o uuid do indicador, porque é por uuid que as arestas são
 * gravadas. Na criação o uuid ainda não existe, então entra um nó sentinela:
 * ciclo na criação é impossível (nada consegue referenciar um id inexistente),
 * mas a checagem fica no mesmo caminho para não divergir das regras da edição.
 */
async function conferirCiclo(id: string, dependencias: string[]): Promise<void> {
  const grafo = await indicadorModel.grafoDeDependencias();
  grafo.set(id, dependencias);
  try {
    ordenarPorDependencia(grafo);
  } catch (erro) {
    if (erro instanceof CicloDetectado) {
      throw new HttpError(409, "DEPENDENCIA_CIRCULAR", erro.message, { ciclo: erro.ciclo });
    }
    throw erro;
  }
}

export async function listar(req: Request, res: Response) {
  const status = (typeof req.query.status === "string" ? req.query.status : undefined) as StatusIndicador | undefined;
  const { page, pageSize } = parsePaginacao(req.query, 50);
  const { total, itens } = await indicadorModel.listar({ status, page, pageSize });
  res.json({ total, page, pageSize, itens });
}

export async function obter(req: Request, res: Response) {
  const indicador = await indicadorModel.obterPorId(req.params.id);
  if (!indicador) throw new HttpError(404, "NAO_ENCONTRADO", "Indicador não encontrado");
  res.json({ indicador });
}

export async function criar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const dados = req.body as CriarIndicadorInput;

  const dependencias = conferirConfig(dados.tipo, dados.config);
  await conferirCiclo("__novo__", dependencias);

  const indicador = await indicadorModel.criar(dados, usuario.id, dependencias);
  await registrarLog({
    entidade: "Indicador",
    entidadeId: indicador.id,
    acao: "CREATE",
    usuarioId: usuario.id,
    dadosDepois: indicador,
    ip: req.ip,
  });
  res.status(201).json({ indicador });
}

export async function atualizar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;
  const atual = await indicadorModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADO", "Indicador não encontrado");

  const dados = req.body as AtualizarIndicadorInput;
  const tipo = dados.tipo ?? (atual.tipo as CriarIndicadorInput["tipo"]);
  const dependencias = conferirConfig(tipo, dados.config ?? atual.config);
  await conferirCiclo(id, dependencias);

  const indicador = await indicadorModel.atualizar(id, dados, usuario.id, dependencias);
  await registrarLog({
    entidade: "Indicador",
    entidadeId: id,
    acao: "UPDATE",
    usuarioId: usuario.id,
    dadosAntes: atual,
    dadosDepois: indicador,
    ip: req.ip,
  });
  res.json({ indicador });
}

export async function remover(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;
  const atual = await indicadorModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADO", "Indicador não encontrado");

  // Apagar um MCC em silêncio deixaria o IDTC e as classificações sem base.
  const grafo = await indicadorModel.grafoDeDependencias();
  const dependentes = [...grafo.entries()].filter(([, deps]) => deps.includes(id)).map(([quem]) => quem);
  if (dependentes.length > 0) {
    throw new HttpError(409, "INDICADOR_EM_USO", "Outros indicadores dependem deste", { dependentes });
  }

  await indicadorModel.softDelete(id, usuario.id);
  await registrarLog({
    entidade: "Indicador",
    entidadeId: id,
    acao: "DELETE",
    usuarioId: usuario.id,
    dadosAntes: atual,
    ip: req.ip,
  });
  res.status(204).end();
}
