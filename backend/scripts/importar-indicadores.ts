// Importa os indicadores do Cartão CRIA da "Exportação Indicadores.xlsx" pelo terminal.
// A mesma importação existe na tela (Indicadores > Importar planilha); a lógica fica em
// src/helper/importacao/importar.ts.
// Uso: npx tsx scripts/importar-indicadores.ts <arquivo.xlsx>
// Depois de rodar, reinicie a API: o cache dos indicadores vive no processo da
// API e não enxerga escrita de outro processo (pela tela isso não é preciso).
import { fileURLToPath } from "node:url";
import { prisma } from "../src/config/prisma.js";
import { importarIndicadores, formatarResumo } from "../src/helper/importacao/importar.js";

export { importarIndicadores, formatarResumo };
export type { ResumoImportacao, OpcoesImportacao } from "../src/helper/importacao/importar.js";

// Execução direta: atribui a importação ao primeiro ADMIN ativo.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const caminho = process.argv[2];
    if (!caminho) throw new Error("uso: npx tsx scripts/importar-indicadores.ts <arquivo.xlsx>");
    const admin = await prisma.usuario.findFirstOrThrow({
      where: { papel: "ADMIN", ativo: true },
      orderBy: { createdAt: "asc" },
    });
    console.log(formatarResumo(await importarIndicadores(caminho, admin.id)));
  } catch (erro) {
    console.error(erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
