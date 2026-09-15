import { describe, it, expect } from "vitest";
import { Writable } from "node:stream";
import express from "express";
import helmet from "helmet";
import request from "supertest";
import { criarLogMiddleware } from "../src/helper/logger.js";

/** Sobe um app mínimo cujo log vai para a memória, para podermos inspecioná-lo. */
async function capturarLog(preparar: (req: request.Test) => request.Test) {
  const linhas: string[] = [];
  const destino = new Writable({
    write(chunk, _enc, cb) {
      linhas.push(String(chunk));
      cb();
    },
  });

  // helmet entra aqui porque é ele quem enche a resposta de headers de
  // segurança — sem isso o teste de volume de log não exercitaria nada.
  const app = express();
  app.use(criarLogMiddleware(destino));
  app.use(helmet());
  app.get("/protegido", (_req, res) => {
    res.json({ ok: true });
  });

  await preparar(request(app).get("/protegido"));
  return linhas.join("");
}

describe("log de requisições", () => {
  it("registra método e rota de cada requisição", async () => {
    const saida = await capturarLog((req) => req);

    expect(saida).toContain("GET");
    expect(saida).toContain("/protegido");
  });

  it("nunca escreve o token de autenticação no log", async () => {
    const saida = await capturarLog((req) => req.set("Authorization", "Bearer token-secreto-do-usuario"));

    expect(saida).not.toContain("token-secreto-do-usuario");
  });

  it("nunca escreve o cookie da requisição no log", async () => {
    const saida = await capturarLog((req) => req.set("Cookie", "sessao=valor-sigiloso"));

    expect(saida).not.toContain("valor-sigiloso");
  });

  it("registra o status e o tempo de resposta", async () => {
    const saida = await capturarLog((req) => req);

    expect(saida).toContain('"statusCode":200');
    expect(saida).toContain("responseTime");
  });

  it("não repete os headers de segurança em toda linha (log de produção é volume)", async () => {
    const saida = await capturarLog((req) => req);

    expect(saida).not.toContain("content-security-policy");
    expect(saida).not.toContain("strict-transport-security");
  });
});
