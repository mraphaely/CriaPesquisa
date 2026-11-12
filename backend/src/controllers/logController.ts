import type { Request, Response } from "express";
import { AcaoLog } from "@prisma/client";
import { logModel } from "../models/logModel.js";
import { parsePaginacao } from "../helper/paginacao.js";

function paramStr(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Só aceita ação do enum; valor desconhecido é ignorado (não vira filtro que zera a lista). */
function paramAcao(v: unknown): AcaoLog | undefined {
  const s = paramStr(v);
  return s && (Object.values(AcaoLog) as string[]).includes(s) ? (s as AcaoLog) : undefined;
}

/** Data inválida é ignorada em vez de chegar ao Prisma (que responderia 500). */
function paramData(v: unknown): Date | undefined {
  const s = paramStr(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function listarLogs(req: Request, res: Response) {
  const q = req.query;
  const { page, pageSize } = parsePaginacao(q, 20);
  const { total, itens } = await logModel.listar({
    entidade: paramStr(q.entidade),
    entidadeId: paramStr(q.entidadeId),
    usuarioId: paramStr(q.usuarioId),
    acao: paramAcao(q.acao),
    de: paramData(q.de),
    ate: paramData(q.ate),
    page,
    pageSize,
  });
  res.json({ total, page, pageSize, itens });
}
