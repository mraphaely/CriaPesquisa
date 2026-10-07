import { prisma } from "../config/prisma.js";
import type { Prisma } from "@prisma/client";
import { montarResposta, type RespostaAvaliavel } from "../helper/motor/avaliadores.js";
import type { FiltrosIndicador } from "../helper/filtrosIndicador.js";

export const indicadorCalculoModel = {
  /** Só respostas aprovadas, não excluídas e de pesquisa não excluída entram em indicador. */
  async carregarRespostas(filtros: FiltrosIndicador): Promise<RespostaAvaliavel[]> {
    const where: Prisma.RespostaWhereInput = { deletedAt: null, status: "APROVADA", pesquisa: { deletedAt: null } };
    if (filtros.pesquisaId) where.pesquisaId = filtros.pesquisaId;
    if (filtros.municipio) where.municipio = filtros.municipio;
    if (filtros.regional) where.regional = filtros.regional;
    if (filtros.de || filtros.ate) {
      where.enviadaEm = {
        ...(filtros.de ? { gte: filtros.de } : {}),
        ...(filtros.ate ? { lte: filtros.ate } : {}),
      };
    }
    // Sexo não é campo da resposta: é resposta a uma pergunta.
    if (filtros.sexo) {
      where.itens = {
        some: {
          pergunta: { enunciado: { contains: "Sexo biológico", mode: "insensitive" } },
          opcoesSelecionadas: { has: filtros.sexo },
        },
      };
    }

    const respostas = await prisma.resposta.findMany({
      where,
      select: {
        id: true,
        pesquisaId: true,
        itens: {
          select: { perguntaId: true, valorTexto: true, valorNumero: true, opcoesSelecionadas: true },
        },
      },
    });

    return respostas.map((r) => montarResposta(r.id, r.itens, r.pesquisaId));
  },

  async perguntasExistentes(): Promise<Set<string>> {
    const perguntas = await prisma.pergunta.findMany({ select: { id: true } });
    return new Set(perguntas.map((p) => p.id));
  },
};
