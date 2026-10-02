import { describe, it, expect } from "vitest";
import { validarConfig, perguntasReferenciadas, indicadoresReferenciados } from "../src/helper/indicadorConfig.js";

describe("validarConfig", () => {
  it("aceita PROPORCAO com pergunta e opções do numerador", () => {
    const config = validarConfig("PROPORCAO", { perguntaId: "p1", opcoesNumerador: ["Rural"] });
    expect(config).toEqual({ tipo: "PROPORCAO", perguntaId: "p1", opcoesNumerador: ["Rural"] });
  });

  it("recusa PROPORCAO sem nenhuma opção no numerador", () => {
    // Sem numerador o indicador daria 0 para todo mundo, silenciosamente.
    expect(() => validarConfig("PROPORCAO", { perguntaId: "p1", opcoesNumerador: [] })).toThrow();
  });

  it("recusa config de um tipo aplicada a outro", () => {
    expect(() => validarConfig("MEDIA", { perguntaId: "p1", opcoesNumerador: ["x"] })).toThrow();
  });

  it("aceita COMPOSTO com termos ponderados e divisor", () => {
    const config = validarConfig("COMPOSTO", {
      termos: [{ indicadorId: "i1", peso: 3 }, { indicadorId: "i2", peso: 5 }],
      divisor: 8,
    });
    expect(indicadoresReferenciados(config)).toEqual(["i1", "i2"]);
  });

  it("recusa COMPOSTO com divisor zero", () => {
    expect(() => validarConfig("COMPOSTO", { termos: [{ indicadorId: "i1", peso: 1 }], divisor: 0 })).toThrow();
  });

  it("aceita DERIVADA como árvore de expressão, sem texto para avaliar", () => {
    const config = validarConfig("DERIVADA", {
      variaveis: { peso: "p10", altura: "p11" },
      expressao: { op: "/", esq: { var: "peso" }, dir: { op: "*", esq: { var: "altura" }, dir: { var: "altura" } } },
    });
    expect(perguntasReferenciadas(config).sort()).toEqual(["p10", "p11"]);
  });

  it("recusa DERIVADA que usa variável não declarada", () => {
    expect(() =>
      validarConfig("DERIVADA", { variaveis: { peso: "p10" }, expressao: { var: "altura" } }),
    ).toThrow();
  });

  it("aceita CLASSIFICACAO com faixas e devolve o indicador de origem", () => {
    const config = validarConfig("CLASSIFICACAO", {
      indicadorId: "mcc",
      faixas: [
        { rotulo: "Crítico", de: 0, ate: 25 },
        { rotulo: "Baixo", de: 25, ate: 50 },
      ],
    });
    expect(indicadoresReferenciados(config)).toEqual(["mcc"]);
  });

  it("recusa CLASSIFICACAO com faixa invertida", () => {
    expect(() =>
      validarConfig("CLASSIFICACAO", { indicadorId: "mcc", faixas: [{ rotulo: "X", de: 50, ate: 10 }] }),
    ).toThrow();
  });
});
