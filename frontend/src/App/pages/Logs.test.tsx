import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { Logs } from "./Logs.js";
import { AuthProvider } from "../auth/AuthContext.js";
import { ThemeModeProvider } from "../theme/ThemeModeContext.js";
import { queryClient } from "../lib/queryClient.js";
import { api } from "../lib/axios.js";

const getSpy = vi.spyOn(api, "get");

const ITENS = [
  {
    id: "l1", entidade: "Pesquisa", entidadeId: "p1", acao: "ARQUIVAR", usuarioId: "u1",
    createdAt: "2026-11-10T14:30:00.000Z", ip: null,
    dadosAntes: { titulo: "Vacina +", status: "PUBLICADA" }, dadosDepois: { titulo: "Vacina +", status: "ARQUIVADA" },
    usuario: { nome: "Guga Lima", email: "guga@exemplo.local" },
  },
  {
    id: "l2", entidade: "Usuario", entidadeId: "u7", acao: "CREATE", usuarioId: "u1",
    createdAt: "2026-11-09T10:00:00.000Z", ip: null,
    dadosAntes: null, dadosDepois: { nome: "Joana Reis", email: "joana@exemplo.local" },
    usuario: { nome: "Guga Lima", email: "guga@exemplo.local" },
  },
];

beforeEach(() => {
  localStorage.clear();
  queryClient.clear();
  getSpy.mockReset();
  localStorage.setItem("token", "t");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ id: "1", nome: "Ana", email: "ana@exemplo.local", papel: "ADMIN", precisaTrocarSenha: false }),
  );
  getSpy.mockResolvedValue({ data: { total: 2, page: 1, pageSize: 20, itens: ITENS } } as never);
});

function renderTela() {
  return render(
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter>
            <Logs />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeModeProvider>,
  );
}

describe("Logs (auditoria)", () => {
  it("lista quem fez o quê em qual registro", async () => {
    renderTela();

    const linha = (await screen.findByText("Vacina +")).closest("tr")!;
    expect(within(linha).getByText("Guga Lima")).toBeInTheDocument();
    expect(within(linha).getByText("Arquivou")).toBeInTheDocument();
    expect(within(linha).getByText("Pesquisa")).toBeInTheDocument();
    expect(screen.getByText("Joana Reis")).toBeInTheDocument();
  });

  it("mostra o antes/depois dos campos alterados", async () => {
    renderTela();

    const linha = (await screen.findByText("Vacina +")).closest("tr")!;
    await userEvent.click(within(linha).getByRole("button", { name: /detalhes/i }));

    expect(await screen.findByText("PUBLICADA")).toBeInTheDocument();
    expect(screen.getByText("ARQUIVADA")).toBeInTheDocument();
  });

  it("filtra por ação na API", async () => {
    renderTela();
    await screen.findByText("Vacina +");

    await userEvent.selectOptions(screen.getByLabelText(/ação/i), "DELETE");

    await vi.waitFor(() =>
      expect(getSpy).toHaveBeenLastCalledWith(
        "/logs",
        expect.objectContaining({ params: expect.objectContaining({ acao: "DELETE" }) }),
      ),
    );
  });
});
