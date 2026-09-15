/**
 * Apoio à rotina de backup. Só lógica pura aqui — a chamada ao `pg_dump` fica
 * em `scripts/backup.ts`, para que o que decide "o que apagar" seja testável
 * sem tocar em disco nem em banco.
 */

export interface ConexaoPostgres {
  host: string;
  porta: string;
  usuario: string;
  senha: string;
  banco: string;
}

const PREFIXO = "criapesquisa-";
const EXTENSAO = ".dump";

/**
 * Quebra a DATABASE_URL nos campos que o pg_dump espera. Parseamos em vez de
 * repassar a URL inteira porque a senha vai por `PGPASSWORD`: argumento de
 * processo é visível para qualquer usuário da máquina (`ps`), variável de
 * ambiente do processo filho, não.
 */
export function parsearConexao(databaseUrl: string): ConexaoPostgres {
  const url = new URL(databaseUrl);
  if (!url.protocol.startsWith("postgres")) {
    throw new Error(`DATABASE_URL não aponta para um Postgres: ${url.protocol}`);
  }

  return {
    host: url.hostname,
    porta: url.port || "5432",
    // O construtor de URL já devolve estes dois percent-decoded.
    usuario: decodeURIComponent(url.username),
    senha: decodeURIComponent(url.password),
    banco: url.pathname.replace(/^\//, ""),
  };
}

/** `criapesquisa-2026-09-12T05-30-00.dump` — ordenável por nome. */
export function nomeDoBackup(quando: Date): string {
  const carimbo = quando.toISOString().slice(0, 19).replace(/:/g, "-");
  return `${PREFIXO}${carimbo}${EXTENSAO}`;
}

function ehBackupNosso(arquivo: string): boolean {
  return arquivo.startsWith(PREFIXO) && arquivo.endsWith(EXTENSAO);
}

/**
 * Dado o conteúdo da pasta de backups, devolve os que já podem sair.
 *
 * Duas travas deliberadas: só mexemos em arquivo com a nossa cara (a pasta pode
 * ter outras coisas dentro) e nunca devolvemos a lista inteira — uma retenção
 * mal configurada não pode ser o que apaga o último backup existente.
 */
export function selecionarExpirados(arquivos: string[], manter: number): string[] {
  const nossos = arquivos.filter(ehBackupNosso).sort();
  const quantosManter = Math.max(1, Math.floor(manter));
  if (nossos.length <= quantosManter) return [];
  return nossos.slice(0, nossos.length - quantosManter);
}
