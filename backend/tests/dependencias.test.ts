import { describe, it, expect } from "vitest";
import { ordenarPorDependencia, CicloDetectado } from "../src/helper/dependencias.js";

describe("ordenarPorDependencia", () => {
  it("coloca a dependência antes de quem depende dela", () => {
    // idtc depende de mcc; mcc depende de vcras
    const ordem = ordenarPorDependencia(
      new Map([
        ["idtc", ["mcc"]],
        ["mcc", ["vcras"]],
        ["vcras", []],
      ]),
    );
    expect(ordem.indexOf("vcras")).toBeLessThan(ordem.indexOf("mcc"));
    expect(ordem.indexOf("mcc")).toBeLessThan(ordem.indexOf("idtc"));
  });

  it("aceita grafo sem nenhuma dependência", () => {
    const ordem = ordenarPorDependencia(new Map([["a", []], ["b", []]]));
    expect(ordem.sort()).toEqual(["a", "b"]);
  });

  it("detecta ciclo e diz quem está nele", () => {
    try {
      ordenarPorDependencia(new Map([["a", ["b"]], ["b", ["a"]]]));
      expect.unreachable("deveria ter lançado CicloDetectado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(CicloDetectado);
      expect((erro as CicloDetectado).ciclo).toContain("a");
      expect((erro as CicloDetectado).ciclo).toContain("b");
    }
  });

  it("detecta o ciclo de um nó consigo mesmo", () => {
    expect(() => ordenarPorDependencia(new Map([["a", ["a"]]]))).toThrow(CicloDetectado);
  });

  it("ignora dependência para fora do grafo sem quebrar", () => {
    // Acontece quando se calcula um subconjunto dos indicadores.
    const ordem = ordenarPorDependencia(new Map([["a", ["fora"]]]));
    expect(ordem).toEqual(["a"]);
  });
});
