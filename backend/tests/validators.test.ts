import { describe, it, expect } from "vitest";
import {
  criarPesquisaSchema,
  perguntaSchema,
  criarRespostaSchema,
  criarUsuarioSchema,
} from "../src/helper/validators.js";

const UUID = "11111111-1111-1111-1111-111111111111";

describe("perguntaSchema", () => {
  it("TEXTO sem opções é válido", () => {
    const resultado = perguntaSchema.safeParse({
      enunciado: "Qual seu nome?",
      tipo: "TEXTO",
      ordem: 0,
    });
    expect(resultado.success).toBe(true);
  });

  it("MULTIPLA_ESCOLHA com menos de 2 opções é inválido", () => {
    const resultado = perguntaSchema.safeParse({
      enunciado: "Escolha uma opção",
      tipo: "MULTIPLA_ESCOLHA",
      ordem: 0,
      opcoes: [{ texto: "Única", ordem: 0 }],
    });
    expect(resultado.success).toBe(false);
  });

  it("ESCOLHA_UNICA com 2 opções é válido", () => {
    const resultado = perguntaSchema.safeParse({
      enunciado: "Escolha uma opção",
      tipo: "ESCOLHA_UNICA",
      ordem: 0,
      opcoes: [
        { texto: "Sim", ordem: 0 },
        { texto: "Não", ordem: 1 },
      ],
    });
    expect(resultado.success).toBe(true);
  });

  it("TEXTO com opções é inválido", () => {
    const resultado = perguntaSchema.safeParse({
      enunciado: "Qual seu nome?",
      tipo: "TEXTO",
      ordem: 0,
      opcoes: [{ texto: "Sim", ordem: 0 }],
    });
    expect(resultado.success).toBe(false);
  });
});

describe("criarRespostaSchema", () => {
  it("itens vazio é inválido", () => {
    const resultado = criarRespostaSchema.safeParse({ itens: [] });
    expect(resultado.success).toBe(false);
  });

  it("1 item com perguntaId uuid é válido", () => {
    const resultado = criarRespostaSchema.safeParse({
      itens: [{ perguntaId: UUID, valorTexto: "resposta" }],
    });
    expect(resultado.success).toBe(true);
  });
});

describe("criarUsuarioSchema", () => {
  it("senha curta é inválida", () => {
    const resultado = criarUsuarioSchema.safeParse({
      nome: "Teste",
      email: "teste@cria.al",
      senha: "123",
      papel: "ADMIN",
    });
    expect(resultado.success).toBe(false);
  });

  it("email inválido é inválido", () => {
    const resultado = criarUsuarioSchema.safeParse({
      nome: "Teste",
      email: "nao-e-email",
      senha: "colina verde 42",
      papel: "ADMIN",
    });
    expect(resultado.success).toBe(false);
  });

  it("dados completos válidos são aceitos", () => {
    const resultado = criarUsuarioSchema.safeParse({
      nome: "Teste",
      email: "teste@cria.al",
      senha: "colina verde 42",
      papel: "GESTOR",
    });
    expect(resultado.success).toBe(true);
  });

  it("papel fora do enum é inválido", () => {
    const resultado = criarUsuarioSchema.safeParse({
      nome: "Teste",
      email: "teste@cria.al",
      senha: "colina verde 42",
      papel: "SUPERUSUARIO",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("criarPesquisaSchema", () => {
  it("sem titulo é inválido", () => {
    const resultado = criarPesquisaSchema.safeParse({
      responsavelId: UUID,
    });
    expect(resultado.success).toBe(false);
  });

  it("com titulo e responsavelId uuid é válido", () => {
    const resultado = criarPesquisaSchema.safeParse({
      titulo: "Pesquisa de satisfação",
      responsavelId: UUID,
    });
    expect(resultado.success).toBe(true);
  });
});
