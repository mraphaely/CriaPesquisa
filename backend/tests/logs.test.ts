import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/models/logModel.js");

import { createApp } from "../src/app.js";
import { gerarToken } from "../src/helper/token.js";
import { logModel } from "../src/models/logModel.js";

const app = createApp();
const tokenAdmin = gerarToken({ sub: "a1", papel: "ADMIN" });
const tokenGestor = gerarToken({ sub: "g1", papel: "GESTOR" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("logs", () => {
  it("ADMIN lista auditoria -> 200", async () => {
    vi.mocked(logModel.listar).mockResolvedValue({ total: 0, itens: [] } as never);
    const res = await request(app).get("/api/logs").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 0, itens: [] });
  });

  it("GESTOR (sem permissão) -> 403", async () => {
    const res = await request(app).get("/api/logs").set("Authorization", `Bearer ${tokenGestor}`);
    expect(res.status).toBe(403);
  });

  it("sem token -> 401", async () => {
    const res = await request(app).get("/api/logs");
    expect(res.status).toBe(401);
  });
});
