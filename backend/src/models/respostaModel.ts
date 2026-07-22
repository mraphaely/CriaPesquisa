import { prisma } from "../config/prisma.js";
import type { Prisma } from "@prisma/client";
import type { CriarRespostaInput } from "../helper/validators.js";

export interface ListarRespostasFiltros {
  municipio?: string;
  unidade?: string;
  de?: Date;
  ate?: Date;
  page?: number;
  pageSize?: number;
}

function construirWhere(pesquisaId: string, filtros: ListarRespostasFiltros = {}): Prisma.RespostaWhereInput {
  const where: Prisma.RespostaWhereInput = { pesquisaId, deletedAt: null };
  if (filtros.municipio) where.municipio = filtros.municipio;
  if (filtros.unidade) where.unidade = filtros.unidade;
  if (filtros.de || filtros.ate) {
    where.enviadaEm = {
      ...(filtros.de ? { gte: filtros.de } : {}),
      ...(filtros.ate ? { lte: filtros.ate } : {}),
    };
  }
  return where;
}

export const respostaModel = {
  criar(pesquisaId: string, coletadorId: string, dados: CriarRespostaInput) {
    return prisma.$transaction(async (tx) => {
      const resposta = await tx.resposta.create({
        data: {
          pesquisaId,
          coletadorId,
          municipio: dados.municipio,
          unidade: dados.unidade,
          regional: dados.regional,
        },
      });
      await tx.itemResposta.createMany({
        data: dados.itens.map((item) => ({
          respostaId: resposta.id,
          perguntaId: item.perguntaId,
          valorTexto: item.valorTexto,
          valorNumero: item.valorNumero,
          valorData: item.valorData,
          opcoesSelecionadas: item.opcoesSelecionadas ?? [],
        })),
      });
      return resposta;
    });
  },

  async listar(pesquisaId: string, filtros: ListarRespostasFiltros = {}) {
    const { page = 1, pageSize = 20 } = filtros;
    const where = construirWhere(pesquisaId, filtros);
    const [total, itens] = await Promise.all([
      prisma.resposta.count({ where }),
      prisma.resposta.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { enviadaEm: "desc" },
      }),
    ]);
    return { total, itens };
  },

  obterPorId(id: string) {
    return prisma.resposta.findFirst({ where: { id, deletedAt: null }, include: { itens: true } });
  },

  softDelete(id: string, usuarioId: string) {
    return prisma.resposta.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: usuarioId },
    });
  },

  contar(pesquisaId: string, filtros?: ListarRespostasFiltros) {
    return prisma.resposta.count({ where: construirWhere(pesquisaId, filtros) });
  },

  itensPorPergunta(pesquisaId: string, filtros?: ListarRespostasFiltros) {
    const where = construirWhere(pesquisaId, filtros);
    return prisma.itemResposta.findMany({ where: { resposta: where } });
  },
};
