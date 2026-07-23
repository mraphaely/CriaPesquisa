import type { Request, Response } from "express";
import { logModel } from "../models/logModel.js";

function paramStr(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export async function listarLogs(req: Request, res: Response) {
  const q = req.query;
  const page = q.page ? Number(q.page) : 1;
  const pageSize = q.pageSize ? Number(q.pageSize) : 20;
  const { total, itens } = await logModel.listar({
    entidade: paramStr(q.entidade),
    entidadeId: paramStr(q.entidadeId),
    usuarioId: paramStr(q.usuarioId),
    de: paramStr(q.de) ? new Date(paramStr(q.de)!) : undefined,
    ate: paramStr(q.ate) ? new Date(paramStr(q.ate)!) : undefined,
    page,
    pageSize,
  });
  res.json({ total, page, pageSize, itens });
}
