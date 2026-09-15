import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { criarEncerrador } from "./helper/encerramento.js";

const app = createApp();
const servidor = app.listen(env.PORT, () => console.log(`CriaPesquisa API em http://localhost:${env.PORT}`));

const encerrar = criarEncerrador({
  servidor,
  desconectar: () => prisma.$disconnect(),
  sair: (codigo) => process.exit(codigo),
  prazoMs: 10_000,
});

process.on("SIGTERM", () => encerrar("SIGTERM"));
process.on("SIGINT", () => encerrar("SIGINT"));
