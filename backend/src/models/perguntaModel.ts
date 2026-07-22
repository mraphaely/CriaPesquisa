import { prisma } from "../config/prisma.js";
import type { SecaoInput, PerguntaInput } from "../helper/validators.js";

export const perguntaModel = {
  criarSecao(pesquisaId: string, dados: SecaoInput) {
    return prisma.secao.create({
      data: { pesquisaId, titulo: dados.titulo, descricao: dados.descricao, ordem: dados.ordem },
    });
  },

  atualizarSecao(id: string, dados: Partial<SecaoInput>) {
    return prisma.secao.update({
      where: { id },
      data: { titulo: dados.titulo, descricao: dados.descricao, ordem: dados.ordem },
    });
  },

  deletarSecao(id: string) {
    return prisma.secao.delete({ where: { id } });
  },

  criarPergunta(pesquisaId: string, dados: PerguntaInput) {
    return prisma.$transaction(async (tx) => {
      const pergunta = await tx.pergunta.create({
        data: {
          pesquisaId,
          secaoId: dados.secaoId,
          enunciado: dados.enunciado,
          tipo: dados.tipo,
          obrigatoria: dados.obrigatoria,
          ordem: dados.ordem,
          ajuda: dados.ajuda,
        },
      });
      if (dados.opcoes?.length) {
        await tx.opcaoPergunta.createMany({
          data: dados.opcoes.map((opcao) => ({ perguntaId: pergunta.id, texto: opcao.texto, ordem: opcao.ordem })),
        });
      }
      return tx.pergunta.findUniqueOrThrow({ where: { id: pergunta.id }, include: { opcoes: true } });
    });
  },

  atualizarPergunta(id: string, dados: Partial<PerguntaInput>) {
    return prisma.$transaction(async (tx) => {
      const pergunta = await tx.pergunta.update({
        where: { id },
        data: {
          secaoId: dados.secaoId,
          enunciado: dados.enunciado,
          tipo: dados.tipo,
          obrigatoria: dados.obrigatoria,
          ordem: dados.ordem,
          ajuda: dados.ajuda,
        },
      });
      if (dados.opcoes) {
        await tx.opcaoPergunta.deleteMany({ where: { perguntaId: id } });
        if (dados.opcoes.length) {
          await tx.opcaoPergunta.createMany({
            data: dados.opcoes.map((opcao) => ({ perguntaId: id, texto: opcao.texto, ordem: opcao.ordem })),
          });
        }
      }
      return tx.pergunta.findUniqueOrThrow({ where: { id: pergunta.id }, include: { opcoes: true } });
    });
  },

  deletarPergunta(id: string) {
    return prisma.pergunta.delete({ where: { id } });
  },

  reordenarPerguntas(pesquisaId: string, idsNaOrdem: string[]) {
    return prisma.$transaction(
      idsNaOrdem.map((id, index) => prisma.pergunta.update({ where: { id, pesquisaId }, data: { ordem: index } })),
    );
  },
};
