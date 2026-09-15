import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/config/prisma.js", () => ({
  prisma: { $queryRaw: vi.fn() },
}));

import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/health", () => {
  it("com o banco respondendo -> 200 e status ok", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }] as never);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.banco).toBe("ok");
  });

  it("com o banco fora -> 503, para o balanceador parar de mandar tráfego", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("connection refused"));

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degradado");
    expect(res.body.banco).toBe("fora");
  });

  it("não vaza detalhe da falha do banco na resposta", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(
      new Error("connection to server at 10.0.0.7 port 5432 failed: senha do usuário cria_user"),
    );

    const res = await request(app).get("/api/health");

    const corpo = JSON.stringify(res.body);
    expect(corpo).not.toContain("10.0.0.7");
    expect(corpo).not.toContain("cria_user");
  });
});
