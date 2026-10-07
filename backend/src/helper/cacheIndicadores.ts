/**
 * Cache em memória dos cálculos, invalidado por evento.
 *
 * Limitação assumida e registrada na spec: com mais de uma réplica da API,
 * cada uma teria seu próprio cache e os números poderiam divergir por alguns
 * segundos até a próxima invalidação.
 */

const cache = new Map<string, unknown>();

/** Sobe a cada invalidação: distingue um cálculo iniciado antes de uma mudança. */
let geracao = 0;

export function lerCache<T>(chave: string): T | undefined {
  return cache.get(chave) as T | undefined;
}

/** Quem vai calcular captura a geração ANTES de ler o banco e a devolve em gravarCache. */
export function geracaoAtual(): number {
  return geracao;
}

/**
 * Com `geracaoDoCalculo`, só grava se nada foi invalidado desde então: um cálculo
 * lento não pode repor no cache um resultado já velho. Devolve se gravou.
 */
export function gravarCache(chave: string, valor: unknown, geracaoDoCalculo?: number): boolean {
  if (geracaoDoCalculo !== undefined && geracaoDoCalculo !== geracao) return false;
  cache.set(chave, valor);
  return true;
}

/** Uma resposta aprovada ou um indicador editado muda todo o conjunto. */
export function invalidarCache(): void {
  geracao += 1;
  cache.clear();
}
