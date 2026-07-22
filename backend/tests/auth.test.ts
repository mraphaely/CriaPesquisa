import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { hashSenha } from "../src/helper/senha.js";

const app = createApp();
const email = `login-${Date.now()}@cria.al`;
let usuarioId: string;

beforeAll(async () => {
  const u = await prisma.usuario.create({
    data: { nome: "Login Teste", email, senhaHash: await hashSenha("senha123"), papel: "COLETADOR" },
  });
  usuarioId = u.id;
});
afterAll(async () => {
  await prisma.usuario.delete({ where: { id: usuarioId } });
  await prisma.$disconnect();
});

describe("auth", () => {
  it("faz login com credenciais válidas", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, senha: "senha123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.usuario.papel).toBe("COLETADOR");
  });
  it("rejeita senha errada com 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, senha: "errada" });
    expect(res.status).toBe(401);
  });
  it("retorna 422 para body inválido", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nao-email" });
    expect(res.status).toBe(422);
  });
  it("me retorna o usuário do token", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, senha: "senha123" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.email).toBe(email);
  });
  it("me sem token retorna 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
