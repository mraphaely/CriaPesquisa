import type { ConfigIndicador } from "../indicadorConfig.js";
import type { ValorIndividual } from "./tipos.js";

export type ResultadoIndicador =
  | { status: "OK"; valor: number }
  | { status: "OK_FAIXAS"; faixas: Array<{ rotulo: string; percentual: number }> }
  | { status: "OK_DISTRIBUICAO"; itens: Array<{ opcao: string; contagem: number; percentual: number }> }
  | { status: "SEM_DADOS" }
  | { status: "INCOMPLETO"; motivo: string; dependencia?: string };

function arredondar(valor: number, casas: number): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

function preenchidos(valores: ValorIndividual[]): number[] {
  return valores.filter((v): v is number => v !== null && Number.isFinite(v));
}

function media(valores: number[]): number {
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

export function agregar(
  config: ConfigIndicador,
  valores: ValorIndividual[],
  casasDecimais: number,
): ResultadoIndicador {
  const validos = preenchidos(valores);

  if (config.tipo === "CONTAGEM") {
    return { status: "OK", valor: validos.length };
  }
  // Denominador zero não é zero por cento: é ausência de base.
  if (validos.length === 0) return { status: "SEM_DADOS" };

  return { status: "OK", valor: arredondar(media(validos), casasDecimais) };
}

export function classificar(
  valores: ValorIndividual[],
  faixas: Array<{ rotulo: string; de: number; ate: number }>,
  casasDecimais: number,
): ResultadoIndicador {
  const validos = preenchidos(valores);
  if (validos.length === 0) return { status: "SEM_DADOS" };

  const contagem = new Map(faixas.map((f) => [f.rotulo, 0]));
  const ultima = faixas[faixas.length - 1];

  for (const valor of validos) {
    // `de <= v < ate`, exceto na última faixa, onde o topo é inclusivo —
    // senão o valor máximo (100) não pertenceria a faixa nenhuma.
    const faixa = faixas.find((f) =>
      f === ultima ? valor >= f.de && valor <= f.ate : valor >= f.de && valor < f.ate,
    );
    if (faixa) contagem.set(faixa.rotulo, (contagem.get(faixa.rotulo) ?? 0) + 1);
  }

  const contagens = faixas.map((f) => contagem.get(f.rotulo) ?? 0);
  const percentuais = repartirPercentuais(contagens, validos.length, casasDecimais);
  return {
    status: "OK_FAIXAS",
    faixas: faixas.map((f, i) => ({ rotulo: f.rotulo, percentual: percentuais[i] })),
  };
}

/**
 * Percentuais arredondados que somam exatamente o total classificado (maior resto):
 * arredondar cada faixa isoladamente daria 33,3 + 33,3 + 33,3 = 99,9.
 */
function repartirPercentuais(contagens: number[], base: number, casas: number): number[] {
  const fator = 10 ** casas;
  const bruto = contagens.map((c) => (c / base) * 100 * fator);
  const piso = bruto.map((b) => Math.floor(b + 1e-9));
  const alvo = Math.round((contagens.reduce((s, c) => s + c, 0) / base) * 100 * fator);
  let falta = alvo - piso.reduce((s, p) => s + p, 0);
  const ordem = bruto
    .map((b, i) => ({ i, resto: b - piso[i] }))
    .sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (const { i } of ordem) {
    if (falta <= 0) break;
    piso[i] += 1;
    falta -= 1;
  }
  return piso.map((p) => p / fator);
}

export function agregarDistribuicao(selecoes: string[][], casasDecimais: number): ResultadoIndicador {
  const comResposta = selecoes.filter((s) => s.length > 0);
  if (comResposta.length === 0) return { status: "SEM_DADOS" };

  const contagem = new Map<string, number>();
  for (const selecionadas of comResposta) {
    for (const opcao of selecionadas) contagem.set(opcao, (contagem.get(opcao) ?? 0) + 1);
  }

  return {
    status: "OK_DISTRIBUICAO",
    itens: [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([opcao, quantidade]) => ({
        opcao,
        contagem: quantidade,
        percentual: arredondar((quantidade / comResposta.length) * 100, casasDecimais),
      })),
  };
}
