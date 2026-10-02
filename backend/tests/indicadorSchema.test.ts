import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../src/config/prisma.js";

describe("modelo Indicador", () => {
  afterAll(async () => {
    await prisma.indicador.deleteMany({ where: { codigo: { startsWith: "TESTE_" } } });
    await prisma.$disconnect();
  });

  it("grava e lê um indicador com config em jsonb", async () => {
    const criado = await prisma.indicador.create({
      data: {
        codigo: "TESTE_ZONA_RURAL",
        nome: "% Famílias em zona rural",
        tipo: "PROPORCAO",
        status: "DEFINICAO_INCOMPLETA",
        config: { perguntaId: "p1", opcoesNumerador: ["Rural"] },
      },
    });

    const lido = await prisma.indicador.findUniqueOrThrow({ where: { id: criado.id } });
    expect(lido.config).toEqual({ perguntaId: "p1", opcoesNumerador: ["Rural"] });
    expect(lido.status).toBe("DEFINICAO_INCOMPLETA");
    expect(lido.meta).toBeNull();
  });

  it("recusa dois indicadores com o mesmo código", async () => {
    await prisma.indicador.create({ data: { codigo: "TESTE_DUP", nome: "A", tipo: "CONTAGEM", config: {} } });
    await expect(
      prisma.indicador.create({ data: { codigo: "TESTE_DUP", nome: "B", tipo: "CONTAGEM", config: {} } }),
    ).rejects.toThrow();
  });
});
