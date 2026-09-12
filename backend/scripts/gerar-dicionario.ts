// Gera o dicionário de dados das pesquisas (docs/pesquisas-cartao-cria.md)
// lendo o banco. Rode após alterar as pesquisas para manter o doc fiel.
import { prisma } from "../src/config/prisma.js";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const LABEL: Record<string, string> = {
  TEXTO: "Texto",
  NUMERO: "Número",
  DATA: "Data",
  ESCOLHA_UNICA: "Escolha única",
  MULTIPLA_ESCOLHA: "Múltipla escolha",
  CAMPO_ABERTO: "Campo aberto",
};

const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

const pesquisas = await prisma.pesquisa.findMany({
  where: { deletedAt: null, titulo: { startsWith: "Cartão CRIA" } },
  orderBy: { titulo: "asc" },
  include: {
    secoes: { orderBy: { ordem: "asc" } },
    perguntas: { orderBy: { ordem: "asc" }, include: { opcoes: { orderBy: { ordem: "asc" } } } },
  },
});

const linhas: string[] = [];
linhas.push("# Dicionário de dados — Pesquisas do Cartão CRIA");
linhas.push("");
linhas.push("> Gerado automaticamente por `backend/scripts/gerar-dicionario.ts` a partir do banco.");
linhas.push("> Fonte da verdade das definições: `backend/prisma/pesquisas-cartao-cria.ts`. Não editar à mão.");
linhas.push("");
linhas.push("**Convenções de modelagem** (o sistema não tem tipo grade/matriz):");
linhas.push("- Grades *Antes/Após o Cartão CRIA* e *Gestação anterior/atual* → uma pergunta por linha.");
linhas.push("- Grade de nota 1–5 por dimensão → uma pergunta **Número** por dimensão.");
linhas.push("- Grade de caixas (marcar vários) → **Múltipla escolha** por linha.");
linhas.push('- Opção "Outro:" do Google Forms → opção **Outro** (sem campo de texto acoplado).');
linhas.push("- Escalas 1–5 e 0–10 → **Número** (permite média/funil no painel).");
linhas.push("");

for (const p of pesquisas) {
  const secaoDe = new Map(p.secoes.map((s) => [s.id, s.titulo]));
  const obrig = p.perguntas.filter((q) => q.obrigatoria).length;
  linhas.push(`## ${p.titulo}`);
  linhas.push("");
  linhas.push(`**Status:** ${p.status} · **Seções:** ${p.secoes.length} · **Perguntas:** ${p.perguntas.length} · **Obrigatórias:** ${obrig}`);
  linhas.push("");

  let secaoAtual = "";
  let n = 0;
  for (const q of p.perguntas) {
    const sec = secaoDe.get(q.secaoId ?? "") ?? "(sem seção)";
    if (sec !== secaoAtual) {
      if (secaoAtual !== "") linhas.push("");
      secaoAtual = sec;
      linhas.push(`### ${sec}`);
      linhas.push("");
      linhas.push("| # | Pergunta | Tipo | Obrig. | Opções |");
      linhas.push("|---|---|---|:--:|---|");
    }
    n += 1;
    const ajuda = q.ajuda ? `<br><sub>${esc(q.ajuda)}</sub>` : "";
    const opcoes = q.opcoes.length ? q.opcoes.map((o) => esc(o.texto)).join("; ") : "—";
    linhas.push(`| ${n} | ${esc(q.enunciado)}${ajuda} | ${LABEL[q.tipo] ?? q.tipo} | ${q.obrigatoria ? "✔" : ""} | ${opcoes} |`);
  }
  linhas.push("");
}

const destino = resolve(process.cwd(), "..", "docs", "pesquisas-cartao-cria.md");
writeFileSync(destino, linhas.join("\n"), "utf8");
console.log(`Dicionário gerado: ${destino}`);
console.log(`Pesquisas: ${pesquisas.map((p) => `${p.titulo} (${p.perguntas.length})`).join(", ")}`);
await prisma.$disconnect();
