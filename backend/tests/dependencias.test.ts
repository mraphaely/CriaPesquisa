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
    expect(ordem).toEqual(["vcras", "mcc", "idtc"]);
  });

  it("aceita grafo sem nenhuma dependência", () => {
    const ordem = ordenarPorDependencia(new Map([["a", []], ["b", []]]));
    expect(ordem.sort()).toEqual(["a", "b"]);
  });

  it("não duplica nó já processado (diamante: dois caminhos para o mesmo nó)", () => {
    // a depende de b e c; b depende de d; c depende de d
    // o nó d não deve aparecer duplicado
    const ordem = ordenarPorDependencia(
      new Map([
        ["a", ["b", "c"]],
        ["b", ["d"]],
        ["c", ["d"]],
        ["d", []],
      ]),
    );
    expect(ordem.length).toBe(4);
    expect(new Set(ordem).size).toBe(4); // sem duplicatas
    expect(ordem.indexOf("d")).toBeLessThan(ordem.indexOf("b"));
    expect(ordem.indexOf("d")).toBeLessThan(ordem.indexOf("c"));
    expect(ordem.indexOf("b")).toBeLessThan(ordem.indexOf("a"));
    expect(ordem.indexOf("c")).toBeLessThan(ordem.indexOf("a"));
  });

  it("detecta ciclo e diz quem está nele", () => {
    try {
      ordenarPorDependencia(new Map([["a", ["b"]], ["b", ["a"]]]));
      expect.unreachable("deveria ter lançado CicloDetectado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(CicloDetectado);
      expect((erro as CicloDetectado).ciclo).toEqual(["a", "b", "a"]);
    }
  });

  it("detecta o ciclo de um nó consigo mesmo", () => {
    try {
      ordenarPorDependencia(new Map([["a", ["a"]]]));
      expect.unreachable("deveria ter lançado CicloDetectado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(CicloDetectado);
      expect((erro as CicloDetectado).ciclo).toEqual(["a", "a"]);
    }
  });

  it("reporta ciclo com caminho correto (sem nó intermediário que não fechou o ciclo)", () => {
    // a depende de b e c; b não depende de nada; c depende de a -> ciclo a-c
    // sem caminho.pop(), b fica no caminho e é reportado erroneamente como parte do ciclo
    try {
      ordenarPorDependencia(new Map([["a", ["b", "c"]], ["b", []], ["c", ["a"]]]));
      expect.unreachable("deveria ter lançado CicloDetectado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(CicloDetectado);
      expect((erro as CicloDetectado).ciclo).toEqual(["a", "c", "a"]);
    }
  });

  it("ignora dependência para fora do grafo sem quebrar", () => {
    // Acontece quando se calcula um subconjunto dos indicadores.
    const ordem = ordenarPorDependencia(new Map([["a", ["fora"]]]));
    expect(ordem).toEqual(["a"]);
  });
});
