import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type TokenPayload = { sub: string; papel: string };

export function gerarToken(payload: TokenPayload): string {
  const opcoes: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, opcoes);
}

export function verificarToken(token: string): TokenPayload {
  const dados = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return { sub: String(dados.sub), papel: String(dados.papel) };
}
