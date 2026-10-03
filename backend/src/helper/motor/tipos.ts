/** Uma resposta reduzida ao que o motor precisa: nada de Prisma aqui dentro. */
export interface ItemAvaliavel {
  valorTexto?: string | null;
  valorNumero?: number | null;
  opcoesSelecionadas?: string[] | null;
}

export interface RespostaAvaliavel {
  id: string;
  /** Pesquisa de origem: indicador com pesquisaId só enxerga as respostas dela. */
  pesquisaId: string | null;
  itens: Map<string, ItemAvaliavel>;
}

/**
 * Valor de um indicador para um indivíduo.
 * `null` = branco ou não aplicável: sai do numerador E do denominador.
 */
export type ValorIndividual = number | null;
