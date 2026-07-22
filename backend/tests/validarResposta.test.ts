import { describe, it, expect } from "vitest";
import {
  validarRespostaContraPerguntas,
  type PerguntaParaValidacao,
  type ItemParaValidacao,
} from "../src/helper/validarResposta.js";

const OPCAO_SIM = { id: "op-sim", texto: "Sim" };
const OPCAO_NAO = { id: "op-nao", texto: "Não" };
const OPCAO_TALVEZ = { id: "op-talvez", texto: "Talvez" };

const perguntaObrigatoriaTexto: PerguntaParaValidacao = {
  id: "p-texto",
  enunciado: "Qual seu nome?",
  tipo: "TEXTO",
  obrigatoria: true,
};

const perguntaNumero: PerguntaParaValidacao = {
  id: "p-numero",
  enunciado: "Qual sua idade?",
  tipo: "NUMERO",
  obrigatoria: false,
};

const perguntaEscolhaUnica: PerguntaParaValidacao = {
  id: "p-unica",
  enunciado: "Você recomendaria?",
  tipo: "ESCOLHA_UNICA",
  obrigatoria: true,
  opcoes: [OPCAO_SIM, OPCAO_NAO],
};

const perguntaMultipla: PerguntaParaValidacao = {
  id: "p-multipla",
  enunciado: "Quais serviços você usou?",
  tipo: "MULTIPLA_ESCOLHA",
  obrigatoria: false,
  opcoes: [OPCAO_SIM, OPCAO_NAO, OPCAO_TALVEZ],
};

describe("validarRespostaContraPerguntas", () => {
  it("pergunta obrigatória sem item preenchido -> erro 'resposta obrigatória'", () => {
    const erros = validarRespostaContraPerguntas([perguntaObrigatoriaTexto], []);
    expect(erros).toContain("Qual seu nome?: resposta obrigatória");
  });

  it("pergunta NUMERO com valorTexto no lugar de valorNumero -> erro", () => {
    const itens: ItemParaValidacao[] = [{ perguntaId: "p-numero", valorTexto: "trinta anos" }];
    const erros = validarRespostaContraPerguntas([perguntaNumero], itens);
    expect(erros).toContain("Qual sua idade?: valor numérico inválido");
  });

  it("ESCOLHA_UNICA com opção inexistente -> erro", () => {
    const itens: ItemParaValidacao[] = [{ perguntaId: "p-unica", opcoesSelecionadas: ["op-inexistente"] }];
    const erros = validarRespostaContraPerguntas([perguntaEscolhaUnica], itens);
    expect(erros).toContain("Você recomendaria?: opção inválida");
  });

  it("MULTIPLA_ESCOLHA válida (opções pertencentes à pergunta) -> sem erro", () => {
    const itens: ItemParaValidacao[] = [{ perguntaId: "p-multipla", opcoesSelecionadas: ["op-sim", "op-talvez"] }];
    const erros = validarRespostaContraPerguntas([perguntaMultipla], itens);
    expect(erros).toEqual([]);
  });

  it("resposta completa e válida para todas as perguntas -> []", () => {
    const perguntas = [perguntaObrigatoriaTexto, perguntaNumero, perguntaEscolhaUnica, perguntaMultipla];
    const itens: ItemParaValidacao[] = [
      { perguntaId: "p-texto", valorTexto: "Maria" },
      { perguntaId: "p-numero", valorNumero: 30 },
      { perguntaId: "p-unica", opcoesSelecionadas: ["op-sim"] },
      { perguntaId: "p-multipla", opcoesSelecionadas: ["op-nao"] },
    ];
    expect(validarRespostaContraPerguntas(perguntas, itens)).toEqual([]);
  });

  it("item com perguntaId desconhecido -> erro 'pergunta desconhecida'", () => {
    const itens: ItemParaValidacao[] = [{ perguntaId: "id-que-nao-existe", valorTexto: "x" }];
    const erros = validarRespostaContraPerguntas([perguntaNumero], itens);
    expect(erros).toContain("pergunta desconhecida");
  });

  it("ESCOLHA_UNICA com 2 opções selecionadas -> erro", () => {
    const itens: ItemParaValidacao[] = [{ perguntaId: "p-unica", opcoesSelecionadas: ["op-sim", "op-nao"] }];
    const erros = validarRespostaContraPerguntas([perguntaEscolhaUnica], itens);
    expect(erros).toContain("Você recomendaria?: selecione exatamente uma opção");
  });

  it("pergunta DATA com valorData inválido -> erro", () => {
    const perguntaData: PerguntaParaValidacao = {
      id: "p-data",
      enunciado: "Quando nasceu?",
      tipo: "DATA",
      obrigatoria: false,
    };
    const itens: ItemParaValidacao[] = [{ perguntaId: "p-data", valorData: "nao-e-data" }];
    const erros = validarRespostaContraPerguntas([perguntaData], itens);
    expect(erros).toContain("Quando nasceu?: data inválida");
  });

  it("pergunta opcional não respondida (sem item) -> sem erro", () => {
    const erros = validarRespostaContraPerguntas([perguntaNumero], []);
    expect(erros).toEqual([]);
  });
});
