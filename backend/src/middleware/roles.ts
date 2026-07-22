import type { RequestHandler } from "express";
import { HttpError } from "./errorHandler.js";

export function exigirPapel(...papeis: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.usuario) throw new HttpError(401, "NAO_AUTENTICADO", "Não autenticado");
    if (!papeis.includes(req.usuario.papel)) throw new HttpError(403, "SEM_PERMISSAO", "Sem permissão");
    next();
  };
}
