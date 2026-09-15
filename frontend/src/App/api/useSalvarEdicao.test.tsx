import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSalvarEdicao } from "./pesquisas.js";
import { queryClient } from "../lib/queryClient.js";
import { api } from "../lib/axios.js";

vi.spyOn(api, "put").mockResolvedValue({ data: {} } as never);
vi.spyOn(api, "post").mockResolvedValue({ data: {} } as never);
vi.spyOn(api, "delete").mockResolvedValue({ data: {} } as never);

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const META = { titulo: "Pesquisa ajustada" };
const PERGUNTAS = [{ enunciado: "Qual sua idade?", tipo: "NUMERO" as const, obrigatoria: true, ordem: 0 }];

beforeEach(() => {
  vi.clearAllMocks();
  queryClient.clear();
});

describe("useSalvarEdicao", () => {
  it("em rascunho, regrava as perguntas junto com os metadados", async () => {
    const { result } = renderHook(() => useSalvarEdicao("p1"), { wrapper });

    await result.current.mutateAsync({
      meta: META,
      perguntas: PERGUNTAS,
      perguntasAntigas: ["antiga-1"],
      perguntasEditaveis: true,
    });

    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/pesquisas/p1", META));
    expect(api.delete).toHaveBeenCalledWith("/perguntas/antiga-1");
    expect(api.post).toHaveBeenCalledWith("/pesquisas/p1/perguntas", PERGUNTAS[0]);
  });

  it("em pesquisa publicada, salva só os metadados e não encosta nas perguntas", async () => {
    // O backend recusa mexer em pergunta fora de rascunho: se tentássemos, o
    // título seria salvo e as perguntas não — uma gravação pela metade.
    const { result } = renderHook(() => useSalvarEdicao("p1"), { wrapper });

    await result.current.mutateAsync({
      meta: META,
      perguntas: PERGUNTAS,
      perguntasAntigas: ["antiga-1"],
      perguntasEditaveis: false,
    });

    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/pesquisas/p1", META));
    expect(api.delete).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });
});
