import { describe, it, expect } from "vitest";
import { agregar, classificar, agregarDistribuicao } from "../src/helper/motor/agregacao.js";
import { validarConfig } from "../src/helper/indicadorConfig.js";

const FAIXAS = [
  { rotulo: "Crítico", de: 0, ate: 25 },
  { rotulo: "Baixo", de: 25, ate: 50 },
  { rotulo: "Moderado", de: 50, ate: 75 },
  { rotulo: "Alto", de: 75, ate: 100 },
];

describe("agregar", () => {
  it("PROPORCAO é a média dos 0/100, ignorando os brancos", () => {
    const config = validarConfig("PROPORCAO", { perguntaId: "p1", opcoesNumerador: ["Rural"] });
    // 2 de 4 preenchidos = 50%; os dois nulos não entram no denominador.
    expect(agregar(config, [100, 0, 100, 0, null, null], 1)).toEqual({ status: "OK", valor: 50 });
  });

  it("MEDIA arredonda conforme as casas decimais do indicador", () => {
    const config = validarConfig("MEDIA", { perguntaId: "renda" });
    expect(agregar(config, [1000, 1001, 1003], 2)).toEqual({ status: "OK", valor: 1001.33 });
  });

  it("devolve SEM_DADOS quando o denominador é zero", () => {
    const config = validarConfig("MEDIA", { perguntaId: "renda" });
    expect(agregar(config, [null, null], 1)).toEqual({ status: "SEM_DADOS" });
    expect(agregar(config, [], 1)).toEqual({ status: "SEM_DADOS" });
  });

  it("CONTAGEM conta os preenchidos", () => {
    const config = validarConfig("CONTAGEM", {});
    expect(agregar(config, [1, 1, null], 0)).toEqual({ status: "OK", valor: 2 });
  });

  it("zero é valor, não branco", () => {
    const config = validarConfig("MEDIA", { perguntaId: "renda" });
    expect(agregar(config, [0, 0], 1)).toEqual({ status: "OK", valor: 0 });
  });

  it("valor não finito não entra na conta", () => {
    const config = validarConfig("MEDIA", { perguntaId: "renda" });
    expect(agregar(config, [10, Number.NaN, Infinity], 1)).toEqual({ status: "OK", valor: 10 });
  });
});

describe("classificar", () => {
  it("distribui os indivíduos nas faixas", () => {
    const r = classificar([10, 30, 60, 90], FAIXAS, 1);
    expect(r).toEqual({
      status: "OK_FAIXAS",
      faixas: [
        { rotulo: "Crítico", percentual: 25 },
        { rotulo: "Baixo", percentual: 25 },
        { rotulo: "Moderado", percentual: 25 },
        { rotulo: "Alto", percentual: 25 },
      ],
    });
  });

  it("valor na fronteira cai numa faixa só, e a soma fecha em 100", () => {
    // 25 pertence a "Baixo" (de <= v < ate), não a "Crítico".
    const r = classificar([25, 50, 75], FAIXAS, 1);
    if (r.status !== "OK_FAIXAS") throw new Error("esperava faixas");
    const porRotulo = Object.fromEntries(r.faixas.map((f) => [f.rotulo, f.percentual]));
    expect(porRotulo["Crítico"]).toBe(0);
    expect(r.faixas.reduce((s, f) => s + f.percentual, 0)).toBeCloseTo(100, 6);
  });

  it("o limite superior da última faixa é inclusivo", () => {
    // 100 precisa contar como "Alto"; senão some da conta.
    const r = classificar([100], FAIXAS, 1);
    if (r.status !== "OK_FAIXAS") throw new Error("esperava faixas");
    expect(r.faixas.find((f) => f.rotulo === "Alto")?.percentual).toBe(100);
  });

  it("sem ninguém classificável devolve SEM_DADOS", () => {
    expect(classificar([null, null], FAIXAS, 1)).toEqual({ status: "SEM_DADOS" });
  });

  it("brancos saem do denominador", () => {
    const r = classificar([10, null, null, 90], FAIXAS, 1);
    if (r.status !== "OK_FAIXAS") throw new Error("esperava faixas");
    expect(r.faixas.find((f) => f.rotulo === "Crítico")?.percentual).toBe(50);
  });
});

describe("agregarDistribuicao", () => {
  it("percentual por opção sobre quem respondeu", () => {
    const r = agregarDistribuicao([["Parda"], ["Parda"], ["Branca"], []], 1);
    expect(r).toEqual({
      status: "OK_DISTRIBUICAO",
      itens: [
        { opcao: "Parda", contagem: 2, percentual: 66.7 },
        { opcao: "Branca", contagem: 1, percentual: 33.3 },
      ],
    });
  });

  it("sem ninguém que respondeu devolve SEM_DADOS", () => {
    expect(agregarDistribuicao([[], []], 1)).toEqual({ status: "SEM_DADOS" });
  });
});
