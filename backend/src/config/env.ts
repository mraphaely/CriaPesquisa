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

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
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
