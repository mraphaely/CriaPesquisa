import type { TipoPergunta } from "@prisma/client";

export interface OpcaoParaResumo {
  id: string;
  texto: string;
}

export interface PerguntaParaResumo {
  id: string;
  enunciado: string;
  tipo: TipoPergunta;
  opcoes?: OpcaoParaResumo[];
}

export interface ItemParaResumo {
  perguntaId: string;
  valorTexto?: string | null;
  valorNumero?: number | null;
  valorData?: Date | string | null;
  opcoesSelecionadas?: string[] | null;
}

export interface DistribuicaoOpcao {
  opcao: string;
  contagem: number;
  percentual: number;
}

export interface ResumoPergunta {
  perguntaId: string;
  enunciado: string;
  tipo: TipoPergunta;
  totalRespostas: number;
  distribuicao?: DistribuicaoOpcao[];
  media?: number;
  minimo?: number;
  maximo?: number;
  preenchidos?: number;
}

function estaPreenchido(item: ItemParaResumo): boolean {
  const temTexto = typeof item.valorTexto === "string" && item.valorTexto.trim() !== "";
  const temNumero = item.valorNumero !== null && item.valorNumero !== undefined;
  const temData = item.valorData !== null && item.valorData !== undefined;
  const temOpcoes = (item.opcoesSelecionadas?.length ?? 0) > 0;
  return temTexto || temNumero || temData || temOpcoes;
}

function arredondar1Casa(valor: number): number {
  return Math.round(valor * 10) / 10;
}

function rotuloOpcao(pergunta: PerguntaParaResumo, valor: string): string {
  const opcao = (pergunta.opcoes ?? []).find((o) => o.id === valor || o.texto === valor);
  return opcao?.texto ?? valor;
}

function montarDistribuicao(pergunta: PerguntaParaResumo, itensPreenchidos: ItemParaResumo[]): DistribuicaoOpcao[] {
  const contagemPorRotulo = new Map<string, number>();
  for (const opcao of pergunta.opcoes ?? []) {
    contagemPorRotulo.set(opcao.texto, 0);
  }
  for (const item of itensPreenchidos) {
    for (const valor of item.opcoesSelecionadas ?? []) {
      const rotulo = rotuloOpcao(pergunta, valor);
      contagemPorRotulo.set(rotulo, (contagemPorRotulo.get(rotulo) ?? 0) + 1);
    }
  }

  const total = itensPreenchidos.length;
  return Array.from(contagemPorRotulo.entries()).map(([opcao, contagem]) => ({
    opcao,
    contagem,
    percentual: total > 0 ? arredondar1Casa((contagem / total) * 100) : 0,
  }));
}

function montarResumoNumero(itensPreenchidos: ItemParaResumo[]): { media: number; minimo: number; maximo: number } {
  const valores = itensPreenchidos
    .map((item) => item.valorNumero)
    .filter((valor): valor is number => typeof valor === "number" && Number.isFinite(valor));

  if (valores.length === 0) return { media: 0, minimo: 0, maximo: 0 };

  const soma = valores.reduce((acc, v) => acc + v, 0);
  return {
    media: arredondar1Casa(soma / valores.length),
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
  };
}

/**
 * Agrega os itens de resposta por pergunta. Função pura: não acessa banco de
 * dados. `itens` deve conter apenas itens de respostas já filtradas.
 */
export function resumirPesquisa(perguntas: PerguntaParaResumo[], itens: ItemParaResumo[]): ResumoPergunta[] {
  const itensPorPergunta = new Map<string, ItemParaResumo[]>();
  for (const item of itens) {
    const lista = itensPorPergunta.get(item.perguntaId) ?? [];
    lista.push(item);
    itensPorPergunta.set(item.perguntaId, lista);
  }

  return perguntas.map((pergunta) => {
    const itensDaPergunta = itensPorPergunta.get(pergunta.id) ?? [];
    const itensPreenchidos = itensDaPergunta.filter(estaPreenchido);
    const totalRespostas = itensPreenchidos.length;

    const base: ResumoPergunta = {
      perguntaId: pergunta.id,
      enunciado: pergunta.enunciado,
      tipo: pergunta.tipo,
      totalRespostas,
    };

    switch (pergunta.tipo) {
      case "MULTIPLA_ESCOLHA":
      case "ESCOLHA_UNICA":
        return { ...base, distribuicao: montarDistribuicao(pergunta, itensPreenchidos) };
      case "NUMERO":
        return { ...base, ...montarResumoNumero(itensPreenchidos) };
      case "TEXTO":
      case "DATA":
      case "CAMPO_ABERTO":
      default:
        return { ...base, preenchidos: totalRespostas };
    }
  });
}
