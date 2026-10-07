import { describe, it, expect } from "vitest";
import { montarResposta, avaliar, ItemDuplicado } from "../src/helper/motor/avaliadores.js";
import { validarConfig } from "../src/helper/indicadorConfig.js";

const vazio = new Map<string, number | null>();

function resposta(itens: Array<{ perguntaId: string; valorNumero?: number | null; opcoesSelecionadas?: string[] }>) {
  return montarResposta("r1", itens);
}

describe("PROPORCAO", () => {
  const config = validarConfig("PROPORCAO", { perguntaId: "p1", opcoesNumerador: ["Rural"] });

  it("dá 100 quando a opção está no numerador", () => {
    expect(avaliar(config, resposta([{ perguntaId: "p1", opcoesSelecionadas: ["Rural"] }]), vazio)).toBe(100);
  });

  it("dá 0 quando respondeu outra coisa", () => {
    expect(avaliar(config, resposta([{ perguntaId: "p1", opcoesSelecionadas: ["Urbana"] }]), vazio)).toBe(0);
  });

  it("dá null quando não respondeu — sai do denominador", () => {
    expect(avaliar(config, resposta([{ perguntaId: "p1", opcoesSelecionadas: [] }]), vazio)).toBeNull();
    expect(avaliar(config, resposta([]), vazio)).toBeNull();
  });
});

describe("MEDIA", () => {
  const config = validarConfig("MEDIA", { perguntaId: "renda" });

  it("devolve o número respondido", () => {
    expect(avaliar(config, resposta([{ perguntaId: "renda", valorNumero: 1200 }]), vazio)).toBe(1200);
  });

  it("zero é resposta válida, não branco", () => {
    // Renda declarada zero não pode sair do denominador: muda a média da amostra.
    expect(avaliar(config, resposta([{ perguntaId: "renda", valorNumero: 0 }]), vazio)).toBe(0);
  });

  it("null é branco", () => {
    expect(avaliar(config, resposta([{ perguntaId: "renda", valorNumero: null }]), vazio)).toBeNull();
  });
});

describe("DERIVADA", () => {
  const imc = validarConfig("DERIVADA", {
    variaveis: { peso: "peso", altura: "altura" },
    expressao: { op: "/", esq: { var: "peso" }, dir: { op: "*", esq: { var: "altura" }, dir: { var: "altura" } } },
  });

  it("calcula o IMC", () => {
    const r = resposta([{ perguntaId: "peso", valorNumero: 64 }, { perguntaId: "altura", valorNumero: 1.6 }]);
    expect(avaliar(imc, r, vazio)).toBeCloseTo(25, 5);
  });

  it("altura zero não vira Infinity: vira sem dados", () => {
    const r = resposta([{ perguntaId: "peso", valorNumero: 64 }, { perguntaId: "altura", valorNumero: 0 }]);
    expect(avaliar(imc, r, vazio)).toBeNull();
  });

  it("falta de uma das variáveis vira sem dados", () => {
    expect(avaliar(imc, resposta([{ perguntaId: "peso", valorNumero: 64 }]), vazio)).toBeNull();
  });
});

describe("CRUZAMENTO", () => {
  const config = validarConfig("CRUZAMENTO", {
    condicoes: [
      { perguntaId: "idade", operador: "<", valor: 18 },
      { perguntaId: "escolaridade", opcoes: ["Fundamental incompleto"] },
    ],
  });

  it("dá 100 só quando todas as condições valem", () => {
    const r = resposta([
      { perguntaId: "idade", valorNumero: 16 },
      { perguntaId: "escolaridade", opcoesSelecionadas: ["Fundamental incompleto"] },
    ]);
    expect(avaliar(config, r, vazio)).toBe(100);
  });

  it("dá 0 quando uma condição falha", () => {
    const r = resposta([
      { perguntaId: "idade", valorNumero: 30 },
      { perguntaId: "escolaridade", opcoesSelecionadas: ["Fundamental incompleto"] },
    ]);
    expect(avaliar(config, r, vazio)).toBe(0);
  });

  it("dá null quando falta o dado de alguma condição", () => {
    expect(avaliar(config, resposta([{ perguntaId: "idade", valorNumero: 16 }]), vazio)).toBeNull();
  });

  it("dá null quando falta o dado numérico, mesmo com a outra condição falhando", () => {
    const r = resposta([{ perguntaId: "escolaridade", opcoesSelecionadas: ["Superior"] }]);
    expect(avaliar(config, r, vazio)).toBeNull();
  });
});

describe("COMPOSTO", () => {
  const mcc = validarConfig("COMPOSTO", {
    termos: [
      { indicadorId: "vcras", peso: 3 },
      { indicadorId: "cvac", peso: 5 },
      { indicadorId: "cpuer", peso: 5 },
    ],
    divisor: 13,
  });

  it("soma ponderada dividida pelo divisor", () => {
    const deps = new Map([["vcras", 100], ["cvac", 100], ["cpuer", 100]]);
    expect(avaliar(mcc, resposta([]), deps)).toBeCloseTo(100, 6);
  });

  it("dá null se qualquer termo estiver sem valor", () => {
    const deps = new Map<string, number | null>([["vcras", 100], ["cvac", null], ["cpuer", 100]]);
    expect(avaliar(mcc, resposta([]), deps)).toBeNull();
  });
});

describe("montarResposta", () => {
  it("recusa dois itens para a mesma pergunta", () => {
    // Dado sujo: sem isso, o último item venceria em silêncio.
    expect(() =>
      montarResposta("r1", [
        { perguntaId: "p1", valorNumero: 1 },
        { perguntaId: "p1", valorNumero: 2 },
      ]),
    ).toThrow(ItemDuplicado);
  });
});
