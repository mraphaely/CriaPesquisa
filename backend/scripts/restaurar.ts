/**
 * Restauração do banco a partir de um backup.
 *
 *   npx tsx scripts/restaurar.ts backups/criapesquisa-2026-09-12T05-30-00.dump --confirmar
 *
 * DESTRUTIVO: substitui o conteúdo atual do banco pelo do arquivo. Por isso
 * exige `--confirmar` — restaurar por engano num banco de produção apaga o que
 * foi coletado desde aquele backup.
 *
 * Um backup que nunca foi restaurado não é um backup: é um arquivo. Vale
 * exercitar este caminho num banco de teste de tempos em tempos.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { parsearConexao } from "../src/helper/backup.js";

const PG_RESTORE = process.env.PG_RESTORE ?? "pg_restore";

function abortar(mensagem: string): never {
  console.error(`\n✗ ${mensagem}\n`);
  process.exit(1);
}

const [arquivo, ...resto] = process.argv.slice(2);
const confirmado = resto.includes("--confirmar");

if (!arquivo) abortar("Uso: npx tsx scripts/restaurar.ts <arquivo.dump> --confirmar");
if (!existsSync(arquivo)) abortar(`Arquivo não encontrado: ${arquivo}`);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) abortar("DATABASE_URL não definida.");

const conexao = parsearConexao(databaseUrl);

if (!confirmado) {
  abortar(
    `Isto substitui TODO o conteúdo do banco '${conexao.banco}' em ${conexao.host}:${conexao.porta}.\n` +
      `  Se é isso mesmo, repita o comando com --confirmar.`,
  );
}

console.log(`Restaurando ${arquivo} em '${conexao.banco}' (${conexao.host}:${conexao.porta}) …`);

const resultado = spawnSync(
  PG_RESTORE,
  [
    "--host", conexao.host,
    "--port", conexao.porta,
    "--username", conexao.usuario,
    "--dbname", conexao.banco,
    // Recria os objetos: sem isto a restauração falha em cima do schema atual.
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    arquivo,
  ],
  {
    env: { ...process.env, PGPASSWORD: conexao.senha },
    stdio: ["ignore", "inherit", "inherit"],
  },
);

if (resultado.error && (resultado.error as NodeJS.ErrnoException).code === "ENOENT") {
  abortar(`'${PG_RESTORE}' não encontrado. Instale o cliente do PostgreSQL ou aponte PG_RESTORE.`);
}
if (resultado.status !== 0) {
  abortar(`pg_restore terminou com código ${resultado.status}.`);
}

console.log("✓ Restauração concluída. Confira os dados antes de liberar o acesso.");
