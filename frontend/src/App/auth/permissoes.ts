// Permissões por papel no frontend — espelham os guardas do backend (exigirPapel).
// ADMIN | GESTOR (PO) | COLETADOR | VISUALIZADOR

export function podeGerenciarPesquisas(papel?: string): boolean {
  return papel === "ADMIN" || papel === "GESTOR";
}

export function podeResponder(papel?: string): boolean {
  return papel === "ADMIN" || papel === "GESTOR" || papel === "COLETADOR";
}

export function podeRevisar(papel?: string): boolean {
  return papel === "ADMIN" || papel === "GESTOR";
}

/** Apenas o Admin gerencia usuários. */
export function podeGerenciarUsuarios(papel?: string): boolean {
  return papel === "ADMIN";
}

export function ehAdmin(papel?: string): boolean {
  return papel === "ADMIN";
}
