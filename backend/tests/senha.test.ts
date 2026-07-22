import { describe, it, expect } from "vitest";
import { hashSenha, conferirSenha } from "../src/helper/senha.js";

describe("helper de senha", () => {
  it("gera hash diferente do texto e confere corretamente", async () => {
    const hash = await hashSenha("segredo123");
    expect(hash).not.toBe("segredo123");
    expect(await conferirSenha("segredo123", hash)).toBe(true);
    expect(await conferirSenha("errada", hash)).toBe(false);
  });
});
