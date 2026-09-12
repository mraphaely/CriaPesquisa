// Somente leitura: conta os registros de cada tabela para inspeção.
import { prisma } from "../src/config/prisma.js";

const [
  usuarios,
  pesquisas,
  secoes,
  perguntas,
  opcoes,
  respostas,
  itens,
  versoes,
  logs,
  municipios,
  beneficios,
] = await Promise.all([
  prisma.usuario.count(),
  prisma.pesquisa.count(),
  prisma.secao.count(),
  prisma.pergunta.count(),
  prisma.opcaoPergunta.count(),
  prisma.resposta.count(),
  prisma.itemResposta.count(),
  prisma.pesquisaVersao.count(),
  prisma.logAlteracao.count(),
  prisma.municipioMensal.count(),
  prisma.beneficioComposicao.count(),
]);

console.log(JSON.stringify({
  usuarios,
  pesquisas,
  secoes,
  perguntas,
  opcoes,
  respostas,
  itens,
  versoes,
  logs,
  municipios,
  beneficios,
}, null, 2));

await prisma.$disconnect();
