import { describe, it, expect, vi } from "vitest";
import request from "supertest";

vi.mock("../src/models/usuarioModel.js");

import { createApp } from "../src/app.js";
import { usuarioModel } from "../src/models/usuarioModel.js";
import { LOGIN_MAX_TENTATIVAS } from "../src/middleware/rateLimit.js";

const app = createApp();

// Credencial sempre inválida: o que está sob teste é a contagem de tentativas,
// não o login em si.
vi.mocked(usuarioModel.buscarPorEmail).mockResolvedValue(null as never);

async function tentarLogin() {
  return request(app).post("/api/auth/login").send({ email: "invasor@exemplo.local", senha: "chute" });
}

describe("rate limit do login", () => {
  it("corta o excesso de tentativas do mesmo IP com 429 (defesa contra força bruta)", async () => {
    for (let i = 0; i < LOGIN_MAX_TENTATIVAS; i++) {
      const permitida = await tentarLogin();
      expect(permitida.status).toBe(401);
    }

    const bloqueada = await tentarLogin();

    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.error.code).toBe("MUITAS_TENTATIVAS");
  });
});
