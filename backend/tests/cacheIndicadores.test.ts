import { describe, it, expect, beforeEach } from "vitest";
import { lerCache, gravarCache, invalidarCache } from "../src/helper/cacheIndicadores.js";

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

  it("invalidar limpa tudo — resposta aprovada muda todo indicador", () => {
    gravarCache("a", { total: 1 });
    gravarCache("b", { total: 2 });
    invalidarCache();
    expect(lerCache("a")).toBeUndefined();
    expect(lerCache("b")).toBeUndefined();
  });
});
