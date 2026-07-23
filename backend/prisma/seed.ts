import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { TipoPergunta } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { hashSenha } from "../src/helper/senha.js";
import { regionalDoMunicipio } from "../src/helper/regionais.js";

const __dir = dirname(fileURLToPath(import.meta.url));

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const FATOR_MES = [0.91, 0.94, 0.96, 0.98, 1.0, 1.02, 1.03, 1.04, 1.05, 1.06, 1.08, 1.1];
const FATOR_ANO: Record<number, number> = { 2024: 0.92, 2025: 1.0, 2026: 1.07 };
const ANOS = [2024, 2025, 2026];

async function seedUsuarios() {
  const base = [
    { nome: "Administrador", email: "admin@cria.al", papel: "ADMIN" as const },
    { nome: "Gestor (PO)", email: "gestor@cria.al", papel: "GESTOR" as const },
    { nome: "Coletador", email: "coletador@cria.al", papel: "COLETADOR" as const },
    { nome: "Visualizador", email: "visualizador@cria.al", papel: "VISUALIZADOR" as const },
  ];
  const senhaHash = await hashSenha("cria123");
  for (const u of base) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: { nome: u.nome, email: u.email, papel: u.papel, senhaHash },
    });
  }
}

async function seedMunicipios() {
  if ((await prisma.municipioMensal.count()) > 0) return;
  const seed = JSON.parse(readFileSync(join(__dir, "..", "data", "seed_municipios.json"), "utf-8")) as Array<{
    municipio: string;
    total_beneficiarios: number;
    criancas: number;
    gestantes: number;
    valor_total: number;
    renda_media: number;
  }>;
  const rows = [];
  for (const d of seed) {
    for (const ano of ANOS) {
      for (let i = 0; i < 12; i++) {
        const f = FATOR_ANO[ano] * FATOR_MES[i];
        rows.push({
          ano,
          mes: i + 1,
          mesNome: MESES[i],
          municipio: d.municipio,
          regional: regionalDoMunicipio(d.municipio),
          totalBeneficiarios: Math.round(d.total_beneficiarios * f),
          criancas: Math.round(d.criancas * f),
          gestantes: Math.round(d.gestantes * f),
          valorTotal: Math.round(d.valor_total * f * 100) / 100,
          rendaMedia: d.renda_media,
        });
      }
    }
  }
  await prisma.municipioMensal.createMany({ data: rows, skipDuplicates: true });
}

async function seedBeneficios() {
  if ((await prisma.beneficioComposicao.count()) > 0) return;
  const base: Array<[string, number]> = [
    ["Bolsa Família", 76445],
    ["BF + PAIF", 6399],
    ["BF + Criança Feliz", 4416],
    ["BF + PL", 3395],
    ["BF + BVG", 1460],
    ["BF + BCN", 1198],
  ];
  await prisma.beneficioComposicao.createMany({
    data: base.map(([label, quantidade]) => ({ ano: 2025, mes: 6, label, quantidade })),
  });
}

interface PerguntaSeed {
  enunciado: string;
  tipo: TipoPergunta;
  obrigatoria?: boolean;
  opcoes?: string[];
}

async function criarPesquisaCRIA(titulo: string, gestorId: string, adminId: string, perguntas: PerguntaSeed[]) {
  const pesquisa = await prisma.pesquisa.create({
    data: {
      titulo,
      descricao: "Pesquisa de acompanhamento do Cartão CRIA — SECRIA/AL.",
      responsavelId: gestorId,
      createdById: adminId,
      status: "PUBLICADA",
      publicadaEm: new Date(),
    },
  });
  const secao = await prisma.secao.create({
    data: { pesquisaId: pesquisa.id, titulo: "Perfil e indicadores", ordem: 0 },
  });
  for (let i = 0; i < perguntas.length; i++) {
    const p = perguntas[i];
    await prisma.pergunta.create({
      data: {
        pesquisaId: pesquisa.id,
        secaoId: secao.id,
        enunciado: p.enunciado,
        tipo: p.tipo,
        obrigatoria: p.obrigatoria ?? false,
        ordem: i,
        opcoes: p.opcoes ? { create: p.opcoes.map((texto, idx) => ({ texto, ordem: idx })) } : undefined,
      },
    });
  }
  return pesquisa;
}

async function seedRespostas(pesquisaId: string, coletadorId: string, n: number) {
  const perguntas = await prisma.pergunta.findMany({
    where: { pesquisaId },
    include: { opcoes: { orderBy: { ordem: "asc" } } },
    orderBy: { ordem: "asc" },
  });
  const municipios = ["Maceió", "Arapiraca", "Penedo", "Coruripe", "Piranhas", "União dos Palmares"];
  for (let k = 0; k < n; k++) {
    const municipio = municipios[k % municipios.length];
    const itens = perguntas.map((p) => {
      switch (p.tipo) {
        case "NUMERO":
          return { perguntaId: p.id, valorNumero: 7 + (k % 4) };
        case "DATA":
          return { perguntaId: p.id, valorData: new Date(2025, k % 12, 1 + (k % 27)) };
        case "MULTIPLA_ESCOLHA":
        case "ESCOLHA_UNICA": {
          const op = p.opcoes[k % Math.max(1, p.opcoes.length)];
          return { perguntaId: p.id, opcoesSelecionadas: op ? [op.texto] : [] };
        }
        default:
          return { perguntaId: p.id, valorTexto: `Resposta de exemplo ${k + 1}` };
      }
    });
    await prisma.resposta.create({
      data: {
        pesquisaId,
        coletadorId,
        municipio,
        unidade: "CRAS Central",
        regional: regionalDoMunicipio(municipio),
        itens: { create: itens },
      },
    });
  }
}

async function seedPesquisasCRIA(gestorId: string, adminId: string, coletadorId: string) {
  if ((await prisma.pesquisa.count()) > 0) return;

  const zona = ["Urbana", "Rural"];
  const raca = ["Branca", "Preta", "Parda", "Amarela", "Indígena"];
  const escolaridade = ["Não estudou", "Fundamental", "Médio", "Superior"];
  const refeicoes = ["Sempre", "Quase sempre", "Raramente", "Nunca"];
  const simNao = ["Sim", "Não"];

  const crianca = await criarPesquisaCRIA("Cartão CRIA — Criança", gestorId, adminId, [
    { enunciado: "Nome do responsável", tipo: "TEXTO", obrigatoria: true },
    { enunciado: "Município", tipo: "TEXTO", obrigatoria: true },
    { enunciado: "Zona", tipo: "ESCOLHA_UNICA", obrigatoria: true, opcoes: zona },
    { enunciado: "Raça/cor da criança", tipo: "ESCOLHA_UNICA", opcoes: raca },
    { enunciado: "Escolaridade do responsável", tipo: "ESCOLHA_UNICA", opcoes: escolaridade },
    { enunciado: "Vacinação em dia após o CRIA?", tipo: "ESCOLHA_UNICA", opcoes: simNao },
    { enunciado: "Refeições por dia após o CRIA", tipo: "ESCOLHA_UNICA", opcoes: refeicoes },
    { enunciado: "Consultas de puericultura no ano", tipo: "NUMERO" },
    { enunciado: "Recomendaria o CRIA (0 a 10)?", tipo: "NUMERO" },
  ]);

  const gestante = await criarPesquisaCRIA("Cartão CRIA — Gestante", gestorId, adminId, [
    { enunciado: "Nome da beneficiária", tipo: "TEXTO", obrigatoria: true },
    { enunciado: "Município", tipo: "TEXTO", obrigatoria: true },
    { enunciado: "Zona", tipo: "ESCOLHA_UNICA", obrigatoria: true, opcoes: zona },
    { enunciado: "Raça/cor", tipo: "ESCOLHA_UNICA", opcoes: raca },
    { enunciado: "Início do pré-natal", tipo: "ESCOLHA_UNICA", opcoes: ["Antes de 12 semanas", "Após 12 semanas", "Não fez"] },
    { enunciado: "Refeições por dia após o CRIA", tipo: "ESCOLHA_UNICA", opcoes: refeicoes },
    { enunciado: "Gestação de alto risco?", tipo: "ESCOLHA_UNICA", opcoes: simNao },
    { enunciado: "Recomendaria o CRIA (0 a 10)?", tipo: "NUMERO" },
  ]);

  await seedRespostas(crianca.id, coletadorId, 18);
  await seedRespostas(gestante.id, coletadorId, 12);
}

async function main() {
  await seedUsuarios();
  const [admin, gestor, coletador] = await Promise.all([
    prisma.usuario.findUnique({ where: { email: "admin@cria.al" } }),
    prisma.usuario.findUnique({ where: { email: "gestor@cria.al" } }),
    prisma.usuario.findUnique({ where: { email: "coletador@cria.al" } }),
  ]);
  await seedMunicipios();
  await seedBeneficios();
  if (admin && gestor && coletador) {
    await seedPesquisasCRIA(gestor.id, admin.id, coletador.id);
  }
  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
