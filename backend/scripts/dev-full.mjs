// Sobe o banco embutido, espera ele ficar PRONTO e só então sobe a API — tudo num comando.
// Uso: `npm run dev:full`. Ctrl+C encerra a API e o banco de forma limpa.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { startEmbeddedPg } from "./pg-local.mjs";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// 1) Banco primeiro (a API depende dele).
const pg = await startEmbeddedPg();

// 2) API depois, herdando o console (logs aparecem direto).
console.log("Subindo a API (npm run dev)...");
// Comando como string única (com shell) evita o DeprecationWarning DEP0190 do Node.
const api = spawn("npm run dev", {
  cwd: backendDir,
  stdio: "inherit",
  shell: true,
});

let encerrando = false;
async function encerrar(code = 0) {
  if (encerrando) return;
  encerrando = true;
  console.log("\nEncerrando API e banco...");
  // Mata a árvore da API (no Windows, api.kill() não derruba os netos).
  if (api.pid) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(api.pid), "/T", "/F"], { stdio: "ignore", shell: true });
    } else {
      api.kill("SIGTERM");
    }
  }
  try {
    await pg.stop();
  } catch {
    // Se falhar, o Postgres faz recuperação automática no próximo start.
  }
  process.exit(code);
}

process.on("SIGINT", () => encerrar(0));
process.on("SIGTERM", () => encerrar(0));

// Se a API cair sozinha, derruba o banco junto (evita banco órfão).
api.on("exit", (code) => {
  console.log(`API encerrada (código ${code ?? 0}).`);
  encerrar(code ?? 0);
});
