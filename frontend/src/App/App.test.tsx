import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// `router.tsx` cria o `createBrowserRouter` uma única vez, no carregamento do
// módulo, a partir da URL corrente (`window.location`). Por isso cada teste
// ajusta a URL via `history.pushState` e reimporta `App` (com
// `vi.resetModules()`) para que o router seja recriado já na rota desejada —
// evitando um redirecionamento em runtime.
//
// Isso não é só estilo: nesta combinação de Node + jsdom, um redirecionamento
// de fato (ex.: `<Navigate>` disparando `router.navigate()` durante o
// render) aciona `createClientSideRequest`, que monta um `Request` nativo do
// Node com o `AbortSignal` do `AbortController` global — e o ambiente jsdom
// do Vitest substitui `AbortController`/`AbortSignal` globais por uma
// implementação própria, incompatível com o `Request` nativo do Node
// (`RequestInit: Expected signal to be an instance of AbortSignal`). Partindo
// já da rota final, o router nunca precisa navegar durante o teste.
describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("mostra a tela de login quando não autenticado", async () => {
    window.history.pushState({}, "", "/login");
    const { App } = await import("./App.js");
    render(<App />);
    expect(await screen.findByRole("form", { name: /login/i })).toBeInTheDocument();
  });

  it("mostra o layout e o dashboard quando autenticado", async () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("usuario", JSON.stringify({ id: "1", nome: "Ana", email: "ana@cria.org", papel: "ADMIN" }));
    window.history.pushState({}, "", "/");
    const { App } = await import("./App.js");
    render(<App />);
    expect(await screen.findByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
  });
});
