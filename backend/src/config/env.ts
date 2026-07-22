import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET", "dev-secret"),
  JWT_EXPIRES: process.env.JWT_EXPIRES ?? "8h",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
