// Sobe um PostgreSQL local embutido (sem Docker/instalação) para desenvolvimento.
// Uso direto: `node scripts/pg-local.mjs` (mantém vivo; Ctrl+C para parar).
// Também exporta startEmbeddedPg() para o orquestrador `dev-full.mjs`.
import { existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

// Diretório de dados do cluster, fora do repositório e fora do OneDrive (senão dá EBUSY).
// Portátil: LOCALAPPDATA no Windows, ~/.local/share nos demais. Sobrescreva com PGDATA_DIR.
const DATA_DIR =
  process.env.PGDATA_DIR ??
  join(process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"), "criapesquisa-pgdata");
const PORT = Number(process.env.PGPORT_LOCAL ?? 5433);
const PG_USER = process.env.PGUSER_LOCAL ?? "cria_user";
const PG_PASSWORD = process.env.PGPASSWORD_LOCAL ?? "cria_senha";

export async function startEmbeddedPg() {
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: PG_USER,
    password: PG_PASSWORD,
    port: PORT,
    persistent: true,
    // Força o cluster em UTF-8 (o padrão no Windows seria WIN1252, que rejeita
    // caracteres fora do Latin-1, como emoji). --no-locale evita conflito de locale.
    initdbFlags: ["--encoding=UTF8", "--no-locale"],
  });

  const jaInicializado = existsSync(join(DATA_DIR, "PG_VERSION"));

  if (!jaInicializado) {
    console.log("Inicializando cluster PostgreSQL embutido...");
    await pg.initialise();
  }

  await pg.start();

  try {
    await pg.createDatabase("criapesquisa");
    console.log("Banco 'criapesquisa' criado.");
  } catch {
    console.log("Banco 'criapesquisa' já existe.");
  }

  console.log(`PG_PRONTO port=${PORT} db=criapesquisa user=${PG_USER}`);
  return pg;
}

// Execução direta: sobe o banco e mantém o processo (e o Postgres) vivo.
const executadoDireto =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (executadoDireto) {
  const pg = await startEmbeddedPg();
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
  setInterval(() => {}, 1 << 30);
}
