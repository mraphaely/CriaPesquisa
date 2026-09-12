// Utilitário de dev: aprova respostas que ficaram PENDENTE (ex.: dados anteriores
// à introdução do fluxo de aprovação). Marca o Gestor como revisor.
import { prisma } from "../src/config/prisma.js";

const DOMINIO = process.env.SEED_EMAIL_DOMINIO ?? "@exemplo.local";

const gestor = await prisma.usuario.findUnique({ where: { email: `gestor${DOMINIO}` } });
const r = await prisma.resposta.updateMany({
  where: { status: "PENDENTE", deletedAt: null },
  data: { status: "APROVADA", revisadoPorId: gestor?.id ?? null, revisadoEm: new Date() },
});
console.log("Respostas aprovadas:", r.count);
await prisma.$disconnect();
