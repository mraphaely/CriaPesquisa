/**
 * Cache em memória dos cálculos, invalidado por evento.
 *
 * Limitação assumida e registrada na spec: com mais de uma réplica da API,
 * cada uma teria seu próprio cache e os números poderiam divergir por alguns
 * segundos até a próxima invalidação.
 */

const cache = new Map<string, unknown>();

export function lerCache<T>(chave: string): T | undefined {
  return cache.get(chave) as T | undefined;
}

export function gravarCache(chave: string, valor: unknown): void {
  cache.set(chave, valor);
}

/** Uma resposta aprovada ou um indicador editado muda todo o conjunto. */
export function invalidarCache(): void {
  cache.clear();
}
