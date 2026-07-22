import { prisma } from "../config/prisma.js";
import type { AcaoLog, Prisma } from "@prisma/client";

export interface RegistrarLogDados {
  entidade: string;
  entidadeId: string;
  acao: AcaoLog;
  usuarioId: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
  ip?: string;
}

export interface ListarLogsFiltros {
  entidade?: string;
  entidadeId?: string;
  usuarioId?: string;
  de?: Date;
  ate?: Date;
  page?: number;
  pageSize?: number;
}

export const logModel = {
  registrar(dados: RegistrarLogDados) {
    return prisma.logAlteracao.create({
      data: {
        entidade: dados.entidade,
        entidadeId: dados.entidadeId,
        acao: dados.acao,
        usuarioId: dados.usuarioId,
        dadosAntes: dados.dadosAntes as Prisma.InputJsonValue | undefined,
        dadosDepois: dados.dadosDepois as Prisma.InputJsonValue | undefined,
        ip: dados.ip,
      },
    });
  },

  async listar(filtros: ListarLogsFiltros = {}) {
    const { entidade, entidadeId, usuarioId, de, ate, page = 1, pageSize = 20 } = filtros;
    const where: Prisma.LogAlteracaoWhereInput = {};
    if (entidade) where.entidade = entidade;
    if (entidadeId) where.entidadeId = entidadeId;
    if (usuarioId) where.usuarioId = usuarioId;
    if (de || ate) {
      where.createdAt = {
        ...(de ? { gte: de } : {}),
        ...(ate ? { lte: ate } : {}),
      };
    }

    const [total, itens] = await Promise.all([
      prisma.logAlteracao.count({ where }),
      prisma.logAlteracao.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { total, itens };
  },
};
