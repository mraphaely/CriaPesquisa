// Somente leitura: lista as pesquisas ativas do banco com perguntas e opções.
import { prisma } from "../src/config/prisma.js";

const pesquisas = await prisma.pesquisa.findMany({
  where: { deletedAt: null },
  orderBy: { titulo: "asc" },
  include: {
    perguntas: { orderBy: { ordem: "asc" }, include: { opcoes: { orderBy: { ordem: "asc" } } } },
  },
});

for (const p of pesquisas) {
  console.log(`### ${p.titulo}  [${p.status}]  — ${p.perguntas.length} perguntas`);
  for (const q of p.perguntas) {
    const ops = q.opcoes.map((o) => o.texto);
    const extra = ops.length ? `  {${ops.join(", ")}}` : "";
    console.log(`  ${q.ordem}. [${q.tipo}${q.obrigatoria ? ", obrig." : ""}] ${q.enunciado}${extra}`);
  }
  console.log("");
}
await prisma.$disconnect();
