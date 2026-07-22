import { describe, it, expect } from "vitest";
import { gerarToken, verificarToken } from "../src/helper/token.js";

describe("helper de token", () => {
  it("gera e verifica um JWT preservando o payload", () => {
    const token = gerarToken({ sub: "u1", papel: "ADMIN" });
    const dados = verificarToken(token);
    expect(dados.sub).toBe("u1");
    expect(dados.papel).toBe("ADMIN");
  });

  it("lança erro em token inválido", () => {
    expect(() => verificarToken("token.invalido")).toThrow();
  });
});
