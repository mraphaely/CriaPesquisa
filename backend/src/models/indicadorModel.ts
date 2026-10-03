import { prisma } from "../config/prisma.js";
import type { Prisma, StatusIndicador } from "@prisma/client";
import type { CriarIndicadorInput, AtualizarIndicadorInput } from "../helper/validators.js";

export interface ListarIndicadoresFiltros {
  status?: StatusIndicador;
  pesquisaId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export const indicadorModel = {
  async listar(filtros: ListarIndicadoresFiltros = {}) {
    const { status, pesquisaId, q, page = 1, pageSize = 50 } = filtros;
    const where: Prisma.IndicadorWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (pesquisaId) where.pesquisaId = pesquisaId;
    if (q) where.nome = { contains: q, mode: "insensitive" };

    const [total, itens] = await Promise.all([
      prisma.indicador.count({ where }),
      prisma.indicador.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { codigo: "asc" },
      }),
    ]);
    return { total, itens };
  },

  obterPorId(id: string) {
    return prisma.indicador.findFirst({ where: { id, deletedAt: null } });
  },

  listarAtivos() {
    return prisma.indicador.findMany({ where: { deletedAt: null, status: { not: "INATIVO" } } });
  },

  async criar(dados: CriarIndicadorInput, usuarioId: string, dependencias: string[]) {
    return prisma.indicador.create({
      data: {
        codigo: dados.codigo,
        nome: dados.nome,
        objetivo: dados.objetivo,
        tipo: dados.tipo,
        unidade: dados.unidade,
        casasDecimais: dados.casasDecimais,
        pesquisaId: dados.pesquisaId,
        config: dados.config as Prisma.InputJsonValue,
        recorte: dados.recorte,
        recorteConfig: dados.recorteConfig as Prisma.InputJsonValue | undefined,
        meta: dados.meta,
        formulaOriginal: dados.formulaOriginal,
        origemPlanilha: dados.origemPlanilha,
        createdById: usuarioId,
        dependeDe: { create: dependencias.map((dependeDeId) => ({ dependeDeId })) },
      },
    });
  },

  async atualizar(id: string, dados: AtualizarIndicadorInput, usuarioId: string, dependencias: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.indicadorDependencia.deleteMany({ where: { indicadorId: id } });
      return tx.indicador.update({
        where: { id },
        data: {
          ...dados,
          config: dados.config as Prisma.InputJsonValue,
          recorteConfig: dados.recorteConfig as Prisma.InputJsonValue | undefined,
          updatedById: usuarioId,
          dependeDe: { create: dependencias.map((dependeDeId) => ({ dependeDeId })) },
        },
      });
    });
  },

  softDelete(id: string, usuarioId: string) {
    return prisma.indicador.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: usuarioId },
    });
  },

  /** indicadorId -> ids de quem ele consome. Base da ordem de cálculo e da recusa de ciclo. */
  async grafoDeDependencias(): Promise<Map<string, string[]>> {
    const arestas = await prisma.indicadorDependencia.findMany({
      where: { indicador: { deletedAt: null } },
    });
    const grafo = new Map<string, string[]>();
    for (const { indicadorId, dependeDeId } of arestas) {
      grafo.set(indicadorId, [...(grafo.get(indicadorId) ?? []), dependeDeId]);
    }
    return grafo;
  },
};
