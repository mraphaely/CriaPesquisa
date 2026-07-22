import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export function validar(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => { req.body = schema.parse(req.body); next(); };
}
