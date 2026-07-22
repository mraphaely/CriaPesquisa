import type { Request, Response } from "express";
import { respostaModel } from "../models/respostaModel.js";
import { pesquisaModel } from "../models/pesquisaModel.js";
import { resumirPesquisa } from "../helper/resumo.js";
import { gerarCsv, gerarXlsx } from "../helper/export.js";
import type { RespostaParaExport } from "../helper/export.js";
import { HttpError } from "../middleware/errorHandler.js";
import { extrairFiltrosBase } from "./respostaController.js";

export async function resumo(req: Request, res: Response) {
  const { id: pesquisaId } = req.params;

  const pesquisa = await pesquisaModel.obterPorId(pesquisaId);
  if (!pesquisa) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");

  const filtros = extrairFiltrosBase(req.query);
  const [total, itens] = await Promise.all([
    respostaModel.contar(pesquisaId, filtros),
    respostaModel.itensPorPergunta(pesquisaId, filtros),
  ]);

  const perguntas = resumirPesquisa(pesquisa.perguntas, itens);
  res.json({ total, perguntas });
}

export async function exportar(req: Request, res: Response) {
  const { id: pesquisaId } = req.params;

  const pesquisa = await pesquisaModel.obterPorId(pesquisaId);
  if (!pesquisa) throw new HttpError(404, "NAO_ENCONTRADA", "Pesquisa não encontrada");

  const filtros = extrairFiltrosBase(req.query);
  const total = await respostaModel.contar(pesquisaId, filtros);
  const [{ itens: respostas }, itensDasRespostas] = await Promise.all([
    respostaModel.listar(pesquisaId, { ...filtros, page: 1, pageSize: Math.max(total, 1) }),
    respostaModel.itensPorPergunta(pesquisaId, filtros),
  ]);

  const itensPorResposta = new Map<string, typeof itensDasRespostas>();
  for (const item of itensDasRespostas) {
    const lista = itensPorResposta.get(item.respostaId) ?? [];
    lista.push(item);
    itensPorResposta.set(item.respostaId, lista);
  }

  const respostasParaExport: RespostaParaExport[] = respostas.map((resposta) => ({
    id: resposta.id,
    municipio: resposta.municipio,
    unidade: resposta.unidade,
    regional: resposta.regional,
    enviadaEm: resposta.enviadaEm,
    itens: itensPorResposta.get(resposta.id) ?? [],
  }));

  const formato = req.query.formato === "csv" ? "csv" : "xlsx";

  if (formato === "csv") {
    const csv = gerarCsv(pesquisa.perguntas, respostasParaExport);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="pesquisa-${pesquisaId}.csv"`);
    res.send(csv);
    return;
  }

  const buffer = await gerarXlsx(pesquisa.perguntas, respostasParaExport);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="pesquisa-${pesquisaId}.xlsx"`);
  res.send(buffer);
}
