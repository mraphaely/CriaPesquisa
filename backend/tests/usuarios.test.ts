import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/models/usuarioModel.js");
vi.mock("../src/helper/auditoria.js");
vi.mock("../src/helper/senha.js");

import { createApp } from "../src/app.js";
import { gerarToken } from "../src/helper/token.js";
import { usuarioModel } from "../src/models/usuarioModel.js";
import { hashSenha } from "../src/helper/senha.js";
import { registrarLog } from "../src/helper/auditoria.js";

const app = createApp();
const tokenAdmin = gerarToken({ sub: "a1", papel: "ADMIN" });
const tokenGestor = gerarToken({ sub: "g1", papel: "GESTOR" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usuarios", () => {
  it("ADMIN cria usuário válido -> 201", async () => {
    vi.mocked(usuarioModel.buscarPorEmail).mockResolvedValue(null as never);
    vi.mocked(hashSenha).mockResolvedValue("hash" as never);
    vi.mocked(usuarioModel.criar).mockResolvedValue({ id: "u1", nome: "X", email: "x@cria.al", papel: "COLETADOR", ativo: true } as never);
    vi.mocked(registrarLog).mockResolvedValue(undefined as never);

    const res = await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nome: "X", email: "x@cria.al", senha: "secret1", papel: "COLETADOR" });

    expect(res.status).toBe(201);
    expect(usuarioModel.criar).toHaveBeenCalledOnce();
    expect(registrarLog).toHaveBeenCalledOnce();
  });

  it("não-admin (GESTOR) -> 403", async () => {
    const res = await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send({ nome: "X", email: "x@cria.al", senha: "secret1", papel: "COLETADOR" });
    expect(res.status).toBe(403);
  });

  it("sem token -> 401", async () => {
    const res = await request(app).get("/api/usuarios");
    expect(res.status).toBe(401);
  });

  it("body inválido (senha curta) -> 422", async () => {
    const res = await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nome: "X", email: "x@cria.al", senha: "123", papel: "COLETADOR" });
    expect(res.status).toBe(422);
  });

  it("e-mail duplicado -> 409", async () => {
    vi.mocked(usuarioModel.buscarPorEmail).mockResolvedValue({ id: "e" } as never);
    const res = await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nome: "X", email: "x@cria.al", senha: "secret1", papel: "COLETADOR" });
    expect(res.status).toBe(409);
  });
});
