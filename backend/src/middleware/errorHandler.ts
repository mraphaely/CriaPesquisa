import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(422).json({ error: { code: "VALIDACAO", message: "Dados inválidos", details: err.flatten() } });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  // Corpo acima do limite do body-parser (JSON ou upload): recado claro em vez de 500.
  if ((err as { type?: string })?.type === "entity.too.large") {
    return res.status(413).json({ error: { code: "ARQUIVO_GRANDE", message: "O conteúdo enviado é grande demais." } });
  }
  console.error("[500] erro não tratado:", err);
  return res.status(500).json({ error: { code: "ERRO_INTERNO", message: "Erro interno" } });
};
