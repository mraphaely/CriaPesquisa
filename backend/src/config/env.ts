import "dotenv/config";

const emProducao = process.env.NODE_ENV === "production";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

// Segredos só podem cair no default fora de produção: um segredo previsível
// (e público, por estar no repositório) permitiria forjar tokens válidos.
function segredoObrigatorio(name: string, fallbackDev: string): string {
  const value = process.env[name];
  if (value) return value;
  if (emProducao) {
    throw new Error(`Variável de ambiente obrigatória em produção: ${name}`);
  }
  return fallbackDev;
}

// Atrás de proxy reverso (nginx, load balancer) todo request chega com o IP do
// proxy: sem isto o rate limit contaria a instituição inteira como um IP só e
// bloquearia todo mundo junto. Continua desligado por padrão — confiar no
// X-Forwarded-For sem proxy na frente deixaria qualquer um forjar o próprio IP.
function trustProxy(): boolean | number | string {
  const valor = process.env.TRUST_PROXY?.trim();
  if (!valor) return false;
  if (valor === "true") return true;
  if (valor === "false") return false;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : valor;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
  TRUST_PROXY: trustProxy(),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: segredoObrigatorio("JWT_SECRET", "dev-secret-local"),
  JWT_EXPIRES: process.env.JWT_EXPIRES ?? "8h",
  // Aceita uma ou mais origens separadas por vírgula (o Vite troca de porta
  // 5173→5174 quando a primeira está ocupada).
  CORS_ORIGIN: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean),
};
