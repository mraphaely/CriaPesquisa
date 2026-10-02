/**
 * Ordenação topológica dos indicadores.
 *
 * O MCC precisa existir antes do IDTC, e o IDTC antes das classificações. Sem
 * ordem, o cálculo leria um valor ainda não produzido e devolveria número
 * plausível e errado — o pior resultado possível num painel de política pública.
 */

export class CicloDetectado extends Error {
  constructor(public readonly ciclo: string[]) {
    super(`dependência circular entre indicadores: ${ciclo.join(" → ")}`);
    this.name = "CicloDetectado";
  }
}

const NAO_VISITADO = 0;
const EM_VISITA = 1;
const PRONTO = 2;

export function ordenarPorDependencia(grafo: Map<string, string[]>): string[] {
  const estado = new Map<string, number>();
  const ordem: string[] = [];
  const caminho: string[] = [];

  function visitar(no: string): void {
    if (!grafo.has(no)) return; // dependência fora do subconjunto pedido
    const atual = estado.get(no) ?? NAO_VISITADO;
    if (atual === PRONTO) return;
    if (atual === EM_VISITA) {
      const inicio = caminho.indexOf(no);
      throw new CicloDetectado([...caminho.slice(inicio), no]);
    }

    estado.set(no, EM_VISITA);
    caminho.push(no);
    for (const dependencia of grafo.get(no) ?? []) visitar(dependencia);
    caminho.pop();
    estado.set(no, PRONTO);
    ordem.push(no);
  }

  for (const no of grafo.keys()) visitar(no);
  return ordem;
}
