import type { RequestHandler } from "express";
import { verificarToken } from "../helper/token.js";
import { HttpError } from "./errorHandler.js";

export const autenticar: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "NAO_AUTENTICADO", "Token ausente");
  try {
    const { sub, papel } = verificarToken(header.slice(7));
    req.usuario = { id: sub, papel };
    next();
  } catch {
    throw new HttpError(401, "TOKEN_INVALIDO", "Token inválido ou expirado");
  }
};
