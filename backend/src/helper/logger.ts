import pinoHttp from "pino-http";
import type { DestinationStream } from "pino";

/**
 * Log de acesso da API. Num sistema que trata dados de beneficiários, a trilha
 * de requisições é o que permite responder "quem acessou o quê e quando".
 *
 * O que nunca entra no log: credenciais e tokens. O pino-http serializa os
 * headers por padrão, então `Authorization` e `Cookie` vão redigidos — log é
 * copiado, exportado e lido por gente que não deveria poder se passar por
 * ninguém.
 */
export function criarLogMiddleware(destino?: DestinationStream) {
  return pinoHttp(
    {
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers['set-cookie']",
        ],
        censor: "[REDIGIDO]",
      },
      // Requisição comum não precisa virar ruído; o que importa é erro.
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      // O padrão do pino-http despeja todos os headers de ida e volta — em
      // produção isso repetiria a política inteira do helmet em cada linha.
      // Guardamos só o que serve para investigar um acesso depois.
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          ip: req.raw?.ip ?? req.remoteAddress,
          userAgent: req.headers?.["user-agent"],
        }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    },
    destino,
  );
}
