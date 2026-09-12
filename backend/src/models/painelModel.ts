import { prisma } from "../config/prisma.js";

/** Remove acentos e baixa a caixa — para casar enunciados de forma tolerante. */
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const painelModel = {
  /** Período (ano/mês) mais recente com dados agregados de municípios. */
  periodoMaisRecente() {
    return prisma.municipioMensal.findFirst({ orderBy: [{ ano: "desc" }, { mes: "desc" }] });
  },

  municipiosDoPeriodo(ano: number, mes: number) {
    return prisma.municipioMensal.findMany({
      where: { ano, mes },
      orderBy: { totalBeneficiarios: "desc" },
    });
  },

  investimentoPorMes() {
    return prisma.municipioMensal.groupBy({
      by: ["ano", "mes", "mesNome"],
      _sum: { valorTotal: true },
      orderBy: [{ ano: "asc" }, { mes: "asc" }],
    });
  },

  beneficios() {
    return prisma.beneficioComposicao.findMany({ orderBy: { quantidade: "desc" } });
  },

  contarPesquisas() {
    return prisma.$transaction([
      prisma.pesquisa.count({ where: { deletedAt: null } }),
      prisma.pesquisa.count({ where: { deletedAt: null, status: "PUBLICADA" } }),
    ]);
  },

  contarRespostas() {
    return prisma.resposta.count({ where: { deletedAt: null, status: "APROVADA" } });
  },

  contarPendentes() {
    return prisma.resposta.count({ where: { deletedAt: null, status: "PENDENTE" } });
  },

  /**
   * Distribuição das opções escolhidas nas perguntas cujo enunciado contenha `palavra`
   * (ex.: "raça", "zona"). Agrega as opções selecionadas de todas as respostas ativas.
   */
  async distribuicao(palavra: string): Promise<{ labels: string[]; data: number[] }> {
    const alvo = semAcento(palavra);
    const perguntas = await prisma.pergunta.findMany({ select: { id: true, enunciado: true } });
    const ids = perguntas.filter((p) => semAcento(p.enunciado).includes(alvo)).map((p) => p.id);
    if (ids.length === 0) return { labels: [], data: [] };

    const itens = await prisma.itemResposta.findMany({
      where: { perguntaId: { in: ids }, resposta: { deletedAt: null, status: "APROVADA" } },
      select: { opcoesSelecionadas: true },
    });

    const contagem = new Map<string, number>();
    for (const item of itens) {
      for (const opcao of item.opcoesSelecionadas) {
        contagem.set(opcao, (contagem.get(opcao) ?? 0) + 1);
      }
    }
    const ordenado = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
    return { labels: ordenado.map(([k]) => k), data: ordenado.map(([, v]) => v) };
  },
};
