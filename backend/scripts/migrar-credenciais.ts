// Migração única: padroniza as contas-base para o domínio institucional
// e redefine a senha padrão delas.
// A senha vem de SEED_PASSWORD — nunca fixe credencial real no repositório.
// Idempotente: pode rodar mais de uma vez sem duplicar nem quebrar.
import { prisma } from "../src/config/prisma.js";
import { hashSenha } from "../src/helper/senha.js";

const DOMINIO_NOVO = process.env.SEED_EMAIL_DOMINIO ?? "@exemplo.local";
const SENHA_PADRAO = process.env.SEED_PASSWORD;

if (!SENHA_PADRAO) {
  throw new Error(
    "Defina SEED_PASSWORD no ambiente antes de rodar esta migração (ex.: SEED_PASSWORD=... npx tsx scripts/migrar-credenciais.ts)."
  );
}

const mapa = [
  { antigo: "admin@cria.al", novo: `admin${DOMINIO_NOVO}` },
  { antigo: "gestor@cria.al", novo: `gestor${DOMINIO_NOVO}` },
  { antigo: "coletador@cria.al", novo: `coletador${DOMINIO_NOVO}` },
  { antigo: "visualizador@cria.al", novo: `visualizador${DOMINIO_NOVO}` },
];

const senhaHash = await hashSenha(SENHA_PADRAO);

for (const { antigo, novo } of mapa) {
  const atual = await prisma.usuario.findUnique({ where: { email: antigo } });
  const jaExiste = await prisma.usuario.findUnique({ where: { email: novo } });

  if (atual && !jaExiste) {
    await prisma.usuario.update({ where: { id: atual.id }, data: { email: novo, senhaHash } });
    console.log(`renomeado + senha: ${antigo} -> ${novo}`);
  } else if (jaExiste) {
    // Já está no domínio novo (ex.: seed rodou). Só garante a senha padrão.
    await prisma.usuario.update({ where: { id: jaExiste.id }, data: { senhaHash } });
    console.log(`já existia, senha atualizada: ${novo}`);
  } else {
    console.log(`não encontrado (nada a fazer): ${antigo}`);
  }
}

const total = await prisma.usuario.count({ where: { email: { endsWith: DOMINIO_NOVO } } });
console.log(`Usuários com domínio institucional: ${total}`);
await prisma.$disconnect();
