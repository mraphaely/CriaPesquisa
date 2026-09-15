import rateLimit from "express-rate-limit";

/**
 * Tentativas de login malsucedidas toleradas por IP dentro da janela.
 * Login que dá certo não conta (`skipSuccessfulRequests`), então quem sabe a
 * senha nunca esbarra no limite — só quem está chutando.
 */
export const LOGIN_MAX_TENTATIVAS = 10;
export const LOGIN_JANELA_MS = 15 * 60 * 1000;

export const limiteLogin = rateLimit({
  windowMs: LOGIN_JANELA_MS,
  limit: LOGIN_MAX_TENTATIVAS,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "MUITAS_TENTATIVAS",
        message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
      },
    });
  },
});
