import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NovoIndicador } from "./NovoIndicador.js";
import { AuthProvider } from "../auth/AuthContext.js";
import { ThemeModeProvider } from "../theme/ThemeModeContext.js";
import { queryClient } from "../lib/queryClient.js";
import { api } from "../lib/axios.js";

const getSpy = vi.spyOn(api, "get");
const postSpy = vi.spyOn(api, "post");

const PESQUISA_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  localStorage.clear();
  queryClient.clear();
  getSpy.mockReset();
  postSpy.mockReset();
  localStorage.setItem("token", "t");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ id: "1", nome: "Ana", email: "ana@exemplo.local", papel: "GESTOR", precisaTrocarSenha: false }),
  );
  getSpy.mockResolvedValue({ data: { itens: [{ id: PESQUISA_ID, titulo: "Criança", status: "PUBLICADA" }] } } as never);
  postSpy.mockResolvedValue({ data: { indicador: { id: "novo1" } } } as never);
});

function renderTela() {
  return render(
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/indicadores/novo"]}>
            <Routes>
              <Route path="/indicadores/novo" element={<NovoIndicador />} />
              <Route path="/indicadores/:id" element={<p>tela de revisão</p>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeModeProvider>,
  );
}

describe("NovoIndicador", () => {
  it("cria o indicador para revisar e abre a tela de configuração", async () => {
    renderTela();
    await screen.findByRole("option", { name: "Criança" });

    await userEvent.type(screen.getByLabelText(/código/i), "C-NOVO");
    await userEvent.type(screen.getByLabelText(/^nome/i), "Crianças com vacina em dia");
    await userEvent.selectOptions(screen.getByLabelText(/pesquisa/i), "Criança");
    await userEvent.selectOptions(screen.getByLabelText(/tipo/i), "PROPORCAO");
    await userEvent.click(screen.getByRole("button", { name: /criar indicador/i }));

    expect(postSpy).toHaveBeenCalledWith(
      "/indicadores",
      expect.objectContaining({
        codigo: "C-NOVO",
        nome: "Crianças com vacina em dia",
        tipo: "PROPORCAO",
        pesquisaId: PESQUISA_ID,
        status: "DEFINICAO_INCOMPLETA",
      }),
    );
    expect(await screen.findByText("tela de revisão")).toBeInTheDocument();
  });

  it("não envia sem código e nome", async () => {
    renderTela();

    await userEvent.click(screen.getByRole("button", { name: /criar indicador/i }));

    expect(postSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
