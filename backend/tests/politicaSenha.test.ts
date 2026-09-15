import { describe, it, expect } from "vitest";
import { senhaForte, SENHA_TAMANHO_MINIMO } from "../src/helper/politicaSenha.js";

function aceita(senha: string) {
  return senhaForte.safeParse(senha).success;
}

describe("política de senha", () => {
  it("exige o tamanho mínimo", () => {
    expect(SENHA_TAMANHO_MINIMO).toBeGreaterThanOrEqual(10);
    expect(aceita("a".repeat(SENHA_TAMANHO_MINIMO - 1) + "1")).toBe(true);
    expect(aceita("Cria2026")).toBe(false);
  });

  it("recusa senhas óbvias mesmo quando são longas", () => {
    expect(aceita("senha123456")).toBe(false);
    expect(aceita("123456789012")).toBe(false);
    expect(aceita("qwertyuiop123")).toBe(false);
    expect(aceita("cria12345678")).toBe(false);
  });

  it("recusa repetição de um único caractere", () => {
    expect(aceita("aaaaaaaaaaaa")).toBe(false);
    expect(aceita("111111111111")).toBe(false);
  });

  it("aceita uma senha longa e comum de frase, sem exigir símbolo", () => {
    // Comprimento protege mais que regra de composição (NIST SP 800-63B):
    // exigir símbolo empurra a pessoa para "Senha@123" e para o post-it.
    expect(aceita("gato azul no telhado 7")).toBe(true);
    expect(aceita("primeirainfancia2026alagoas")).toBe(true);
  });

  it("devolve uma mensagem explicando o motivo da recusa", () => {
    const resultado = senhaForte.safeParse("123");
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toMatch(/caracteres/i);
    }
  });
});
