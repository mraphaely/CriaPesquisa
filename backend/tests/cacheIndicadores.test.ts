import { describe, it, expect, beforeEach } from "vitest";
import { lerCache, gravarCache, invalidarCache, geracaoAtual } from "../src/helper/cacheIndicadores.js";

beforeEach(() => invalidarCache());

describe("cache de indicadores", () => {
  it("devolve o que foi gravado", () => {
    gravarCache("municipio=Maceió", { total: 1 });
    expect(lerCache("municipio=Maceió")).toEqual({ total: 1 });
  });

  it("não mistura filtros diferentes", () => {
    gravarCache("municipio=Maceió", { total: 1 });
    expect(lerCache("municipio=Arapiraca")).toBeUndefined();
  });

  it("cálculo iniciado antes de uma invalidação não grava resultado velho", () => {
    const geracao = geracaoAtual();
    invalidarCache();
    expect(gravarCache("a", { total: 1 }, geracao)).toBe(false);
    expect(lerCache("a")).toBeUndefined();
  });

  it("cálculo sem invalidação no meio grava normalmente", () => {
    const geracao = geracaoAtual();
    expect(gravarCache("a", { total: 1 }, geracao)).toBe(true);
    expect(lerCache("a")).toEqual({ total: 1 });
  });

  it("invalidar limpa tudo — resposta aprovada muda todo indicador", () => {
    gravarCache("a", { total: 1 });
    gravarCache("b", { total: 2 });
    invalidarCache();
    expect(lerCache("a")).toBeUndefined();
    expect(lerCache("b")).toBeUndefined();
  });
});
