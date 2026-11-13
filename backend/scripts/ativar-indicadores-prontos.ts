// Ativa os indicadores "definição pronta" pelo terminal. A lógica fica em
// src/helper/importacao/ativar.ts (a importação pela tela já ativa sozinha).
//
// Uso: npx tsx scripts/ativar-indicadores-prontos.ts
// Depois de rodar, reinicie a API (o cache dos indicadores vive no processo dela).
import { fileURLToPath } from "node:url";
import { prisma } from "../src/config/prisma.js";
import { ativarIndicadoresProntos } from "../src/helper/importacao/ativar.js";

export { ativarIndicadoresProntos, MOTIVO_PRONTA } from "../src/helper/importacao/ativar.js";
export type { ResultadoAtivacao } from "../src/helper/importacao/ativar.js";

// Execução direta: atribui as ativações ao primeiro ADMIN ativo.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const admin = await prisma.usuario.findFirstOrThrow({ where: { papel: "ADMIN", ativo: true }, orderBy: { createdAt: "asc" } });
    const r = await ativarIndicadoresProntos(admin.id);
    console.log(`${r.ativados.length} ativados · ${r.recusados.length} recusados`);
    if (r.ativados.length) console.log(`ativados: ${r.ativados.join(", ")}`);
    for (const f of r.recusados) console.log(`recusado ${f.codigo}: ${f.motivo}`);
    if (r.recusados.length) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
