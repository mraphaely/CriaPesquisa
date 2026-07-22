import { describe, it, expect } from "vitest";
import { resumirPesquisa, type PerguntaParaResumo, type ItemParaResumo } from "../src/helper/resumo.js";

const perguntaEscolha: PerguntaParaResumo = {
  id: "p-escolha",
  enunciado: "Você recomendaria?",
  tipo: "ESCOLHA_UNICA",
  opcoes: [
    { id: "op-sim", texto: "Sim" },
    { id: "op-nao", texto: "Não" },
  ],
};

const perguntaNumero: PerguntaParaResumo = {
  id: "p-numero",
  enunciado: "Qual sua idade?",
  tipo: "NUMERO",
};

const perguntaTexto: PerguntaParaResumo = {
  id: "p-texto",
  enunciado: "Comentário",
  tipo: "TEXTO",
};

describe("resumirPesquisa", () => {
  it("distribuição de escolha: percentuais somam ~100 e contagens corretas", () => {
    const itens: ItemParaResumo[] = [
      { perguntaId: "p-escolha", opcoesSelecionadas: ["op-sim"] },
      { perguntaId: "p-escolha", opcoesSelecionadas: ["op-sim"] },
      { perguntaId: "p-escolha", opcoesSelecionadas: ["op-nao"] },
    ];

    const [resumo] = resumirPesquisa([perguntaEscolha], itens);

    expect(resumo.totalRespostas).toBe(3);
    expect(resumo.distribuicao).toBeDefined();

    const somaPercentuais = resumo.distribuicao!.reduce((acc, d) => acc + d.percentual, 0);
    expect(somaPercentuais).toBeCloseTo(100, 5);

    const doSim = resumo.distribuicao!.find((d) => d.opcao === "Sim");
    const doNao = resumo.distribuicao!.find((d) => d.opcao === "Não");
    expect(doSim).toEqual({ opcao: "Sim", contagem: 2, percentual: 66.7 });
    expect(doNao).toEqual({ opcao: "Não", contagem: 1, percentual: 33.3 });
  });

  it("média de número calculada corretamente, com mínimo e máximo", () => {
    const itens: ItemParaResumo[] = [
      { perguntaId: "p-numero", valorNumero: 10 },
      { perguntaId: "p-numero", valorNumero: 20 },
      { perguntaId: "p-numero", valorNumero: 30 },
    ];

    const [resumo] = resumirPesquisa([perguntaNumero], itens);

    expect(resumo.totalRespostas).toBe(3);
    expect(resumo.media).toBe(20);
    expect(resumo.minimo).toBe(10);
    expect(resumo.maximo).toBe(30);
  });

  it("TEXTO retorna contagem de preenchidos", () => {
    const itens: ItemParaResumo[] = [
      { perguntaId: "p-texto", valorTexto: "ótimo" },
      { perguntaId: "p-texto", valorTexto: "" },
    ];

    const [resumo] = resumirPesquisa([perguntaTexto], itens);

    expect(resumo.preenchidos).toBe(1);
    expect(resumo.totalRespostas).toBe(1);
  });

  it("pergunta sem nenhum item -> totalRespostas 0 e distribuição zerada", () => {
    const [resumo] = resumirPesquisa([perguntaEscolha], []);
    expect(resumo.totalRespostas).toBe(0);
    expect(resumo.distribuicao).toEqual([
      { opcao: "Sim", contagem: 0, percentual: 0 },
      { opcao: "Não", contagem: 0, percentual: 0 },
    ]);
  });
});
