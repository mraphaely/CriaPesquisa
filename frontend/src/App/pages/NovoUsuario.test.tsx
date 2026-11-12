import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { NovoUsuario } from "./NovoUsuario.js";
import { AuthProvider } from "../auth/AuthContext.js";
import { ThemeModeProvider } from "../theme/ThemeModeContext.js";
import { queryClient } from "../lib/queryClient.js";
import { api } from "../lib/axios.js";

const postSpy = vi.spyOn(api, "post");

beforeEach(() => {
  localStorage.clear();
  queryClient.clear();
  postSpy.mockReset();
  postSpy.mockResolvedValue({ data: { usuario: { id: "u9" } } } as never);
  localStorage.setItem("token", "t");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ id: "1", nome: "Ana", email: "ana@exemplo.local", papel: "ADMIN", precisaTrocarSenha: false }),
  );
});

function renderTela() {
  return render(
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter>
            <NovoUsuario />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeModeProvider>,
  );
}

describe("NovoUsuario", () => {
  it("sugere o e-mail institucional a partir do nome", async () => {
    renderTela();

    await userEvent.type(screen.getByLabelText(/nome/i), "Maria da Silva");

    expect(screen.getByLabelText(/e-mail/i)).toHaveValue("maria.silva@exemplo.local");
  });

  it("aceita e-mail de outro domínio", async () => {
    renderTela();

    await userEvent.type(screen.getByLabelText(/nome/i), "Joao Souza");
    const email = screen.getByLabelText(/e-mail/i);
    await userEvent.clear(email);
    await userEvent.type(email, "joao.souza@saude.al.gov.br");
    await userEvent.clear(screen.getByLabelText(/senha/i));
    await userEvent.type(screen.getByLabelText(/senha/i), "senha forte 123");
    await userEvent.click(screen.getByRole("button", { name: /salvar usuário/i }));

    expect(postSpy).toHaveBeenCalledWith(
      "/usuarios",
      expect.objectContaining({ email: "joao.souza@saude.al.gov.br" }),
    );
  });
});
