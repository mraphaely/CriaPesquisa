import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/config/prisma.js", () => ({
  prisma: { resposta: { findMany: vi.fn() }, pergunta: { findMany: vi.fn() } },
}));

import { prisma } from "../src/config/prisma.js";
import { indicadorCalculoModel } from "../src/models/indicadorCalculoModel.js";

function whereUsado(): Record<string, unknown> {
  const chamada = vi.mocked(prisma.resposta.findMany).mock.calls[0]![0] as { where: Record<string, unknown> };
  return chamada.where;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.resposta.findMany).mockResolvedValue([] as never);
});

describe("indicadorCalculoModel.carregarRespostas", () => {
  it("sem filtros: só aprovadas e não excluídas", async () => {
    await indicadorCalculoModel.carregarRespostas({});
    expect(whereUsado()).toEqual({ deletedAt: null, status: "APROVADA" });
  });

  it("aplica pesquisa, município, regional e período", async () => {
    const de = new Date("2026-01-01");
    const ate = new Date("2026-06-30");
    await indicadorCalculoModel.carregarRespostas({
      pesquisaId: "ps1",
      municipio: "Maceió",
      regional: "1ª Regional",
      de,
      ate,
    });
    expect(whereUsado()).toMatchObject({
      pesquisaId: "ps1",
      municipio: "Maceió",
      regional: "1ª Regional",
      enviadaEm: { gte: de, lte: ate },
    });
  });

  it("sexo filtra pelos itens da pergunta de sexo biológico", async () => {
    await indicadorCalculoModel.carregarRespostas({ sexo: "Feminino" });
    expect(whereUsado().itens).toEqual({
      some: {
        pergunta: { enunciado: { contains: "Sexo biológico", mode: "insensitive" } },
        opcoesSelecionadas: { has: "Feminino" },
      },
    });
  });

  it("monta RespostaAvaliavel com mapa de itens por pergunta", async () => {
    vi.mocked(prisma.resposta.findMany).mockResolvedValue([
      { id: "r1", pesquisaId: "ps1", itens: [{ perguntaId: "p1", valorTexto: null, valorNumero: 0, opcoesSelecionadas: [] }] },
    ] as never);
    const [r] = await indicadorCalculoModel.carregarRespostas({});
    expect(r!.id).toBe("r1");
    expect(r!.pesquisaId).toBe("ps1");
    const select = (vi.mocked(prisma.resposta.findMany).mock.calls[0]![0] as { select: Record<string, unknown> }).select;
    expect(select.pesquisaId).toBe(true);
    expect(r!.itens.get("p1")?.valorNumero).toBe(0);
  });
});

describe("indicadorCalculoModel.perguntasExistentes", () => {
  it("devolve o conjunto de ids", async () => {
    vi.mocked(prisma.pergunta.findMany).mockResolvedValue([{ id: "a" }, { id: "b" }] as never);
    expect(await indicadorCalculoModel.perguntasExistentes()).toEqual(new Set(["a", "b"]));
  });
});
