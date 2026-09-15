import "express-async-errors";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { criarLogMiddleware } from "./helper/logger.js";
import { env } from "./config/env.js";

export function createApp(): Express {
  const app = express();
  app.set("trust proxy", env.TRUST_PROXY);
  // Nos testes o log de acesso só atrapalharia a leitura da saída; o middleware
  // tem cobertura própria em tests/logger.test.ts.
  if (process.env.NODE_ENV !== "test") app.use(criarLogMiddleware());
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use("/api", apiRoutes);
  app.use(errorHandler);
  return app;
}
