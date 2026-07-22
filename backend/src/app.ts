import "express-async-errors";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use("/api", apiRoutes);
  app.use(errorHandler);
  return app;
}
