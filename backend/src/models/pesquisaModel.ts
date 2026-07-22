import { prisma } from "../config/prisma.js";
import type { Prisma, StatusPesquisa } from "@prisma/client";
import type { CriarPesquisaInput, AtualizarPesquisaInput } from "../helper/validators.js";

export interface ListarPesquisasFiltros {
  status?: StatusPesquisa;
  responsavelId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

const secaoOrdenada = { orderBy: { ordem: "asc" as const } };
const perguntaComOpcoes = {
  orderBy: { ordem: "asc" as const },
  include: { opcoes: { orderBy: { ordem: "asc" as const } } },
};

export const pesquisaModel = {
  async listar(filtros: ListarPesquisasFiltros = {}) {
    const { status, responsavelId, q, page = 1, pageSize = 20 } = filtros;
    const where: Prisma.PesquisaWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (responsavelId) where.responsavelId = responsavelId;
    if (q) where.titulo = { contains: q, mode: "insensitive" };

    const [total, itens] = await Promise.all([
      prisma.pesquisa.count({ where }),
      prisma.pesquisa.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { total, itens };
  },

  obterPorId(id: string) {
    return prisma.pesquisa.findFirst({
      where: { id, deletedAt: null },
      include: {
        secoes: secaoOrdenada,
        perguntas: perguntaComOpcoes,
      },
    });
  },

  criar(dados: CriarPesquisaInput, createdById: string) {
    return prisma.pesquisa.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        responsavelId: dados.responsavelId,
        periodoInicio: dados.periodoInicio,
        periodoFim: dados.periodoFim,
        createdById,
      },
    });
  },

  atualizar(id: string, dados: AtualizarPesquisaInput) {
    return prisma.pesquisa.update({
      where: { id },
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        responsavelId: dados.responsavelId,
        periodoInicio: dados.periodoInicio,
        periodoFim: dados.periodoFim,
      },
    });
  },

  mudarStatus(id: string, status: StatusPesquisa, camposExtra?: Prisma.PesquisaUpdateInput) {
    const data: Prisma.PesquisaUpdateInput = { status, ...camposExtra };
    if (status === "PUBLICADA" && data.publicadaEm === undefined) data.publicadaEm = new Date();
    if (status === "ENCERRADA" && data.encerradaEm === undefined) data.encerradaEm = new Date();
    return prisma.pesquisa.update({ where: { id }, data });
  },

  softDelete(id: string, usuarioId: string) {
    return prisma.pesquisa.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: usuarioId },
    });
  },

  restaurar(id: string) {
    return prisma.pesquisa.update({
      where: { id },
      data: { deletedAt: null, deletedById: null },
    });
  },

  contarPerguntas(id: string) {
    return prisma.pergunta.count({ where: { pesquisaId: id } });
  },

  listarVersoes(id: string) {
    return prisma.pesquisaVersao.findMany({
      where: { pesquisaId: id },
      orderBy: { versao: "desc" },
    });
  },
};
