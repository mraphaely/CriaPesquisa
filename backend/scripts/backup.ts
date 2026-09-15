/**
 * Backup do banco do CriaPesquisa.
 *
 *   npx tsx scripts/backup.ts
 *
 * Gera `backups/criapesquisa-<data>.dump` no formato custom do Postgres (-Fc),
 * que o `pg_restore` consegue restaurar seletivamente e já vem comprimido.
 * Mantém os `BACKUP_RETENCAO` mais recentes (padrão 30).
 *
 * Precisa do `pg_dump` instalado (pacote cliente do PostgreSQL). O Postgres
 * embutido de desenvolvimento traz só os binários de servidor — aponte
 * `PG_DUMP` para o executável se ele não estiver no PATH.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { parsearConexao, nomeDoBackup, selecionarExpirados } from "../src/helper/backup.js";

const PASTA = process.env.BACKUP_DIR ?? "backups";
const RETENCAO = Number(process.env.BACKUP_RETENCAO ?? 30);
const PG_DUMP = process.env.PG_DUMP ?? "pg_dump";

function abortar(mensagem: string): never {
  console.error(`\n✗ ${mensagem}\n`);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) abortar("DATABASE_URL não definida.");

const conexao = parsearConexao(databaseUrl);
mkdirSync(PASTA, { recursive: true });

const destino = join(PASTA, nomeDoBackup(new Date()));
console.log(`Gerando ${destino} …`);

const resultado = spawnSync(
  PG_DUMP,
  [
    "--host", conexao.host,
    "--port", conexao.porta,
    "--username", conexao.usuario,
    "--dbname", conexao.banco,
    "--format", "custom",
    "--no-owner",
    "--no-privileges",
    "--file", destino,
  ],
  {
    // A senha vai por ambiente, nunca por argumento: argumento aparece no `ps`
    // para qualquer usuário da máquina.
    env: { ...process.env, PGPASSWORD: conexao.senha },
    stdio: ["ignore", "inherit", "inherit"],
  },
);

if (resultado.error && (resultado.error as NodeJS.ErrnoException).code === "ENOENT") {
  abortar(
    `'${PG_DUMP}' não encontrado. Instale o cliente do PostgreSQL ou aponte PG_DUMP para o executável.`,
  );
}
if (resultado.status !== 0) {
  abortar(`pg_dump terminou com código ${resultado.status}. Backup NÃO foi gerado.`);
}

// Um dump de tamanho zero é pior que nenhum: passa despercebido até a hora de
// restaurar. Conferimos antes de considerar o backup bom.
const tamanho = statSync(destino).size;
if (tamanho === 0) abortar(`O arquivo gerado ficou vazio: ${destino}`);

console.log(`✓ Backup concluído (${(tamanho / 1024 / 1024).toFixed(2)} MB)`);

const expirados = selecionarExpirados(readdirSync(PASTA), RETENCAO);
for (const arquivo of expirados) {
  rmSync(join(PASTA, arquivo));
  console.log(`  removido por retenção: ${arquivo}`);
}
console.log(`Retenção: mantendo até ${Math.max(1, RETENCAO)} backups em ${PASTA}/`);
