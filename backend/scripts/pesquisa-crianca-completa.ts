// (Re)cria a pesquisa "Cartão CRIA — Criança" com o questionário real completo.
// Definição em prisma/pesquisas-cartao-cria.ts (fonte da verdade). Idempotente.
import { prisma } from "../src/config/prisma.js";
import { secoesCrianca, criarPesquisaCompleta } from "../prisma/pesquisas-cartao-cria.js";

const DOMINIO = process.env.SEED_EMAIL_DOMINIO ?? "@exemplo.local";

const admin = await prisma.usuario.findUnique({ where: { email: `admin${DOMINIO}` } });
const gestor = await prisma.usuario.findUnique({ where: { email: `gestor${DOMINIO}` } });
if (!admin || !gestor) {
  console.error("admin/gestor não encontrados.");
  process.exit(1);
}

const { totalPerguntas } = await criarPesquisaCompleta({
  titulo: "Cartão CRIA — Criança",
  descricao: "Pesquisa de acompanhamento e avaliação de impacto do Programa Cartão CRIA — perfil da criança beneficiária. SECRIA/AL.",
  secoes: secoesCrianca,
  gestorId: gestor.id,
  adminId: admin.id,
});

console.log(`"Cartão CRIA — Criança" criada: ${secoesCrianca.length} seções, ${totalPerguntas} perguntas.`);
await prisma.$disconnect();
