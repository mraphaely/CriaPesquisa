import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TrocarSenha } from "./TrocarSenha.js";
import { AuthProvider } from "../auth/AuthContext.js";
import { ThemeModeProvider } from "../theme/ThemeModeContext.js";
import { queryClient } from "../lib/queryClient.js";
import { api } from "../lib/axios.js";

vi.spyOn(api, "put");

const SENHA_BOA = "colina verde 42";

beforeEach(() => {
  localStorage.clear();
  queryClient.clear();
  vi.clearAllMocks();
  localStorage.setItem("token", "t");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ id: "1", nome: "Ana", email: "ana@exemplo.local", papel: "COLETADOR", precisaTrocarSenha: true }),
  );
});

function renderTela() {
  return render(
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter>
            <TrocarSenha />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeModeProvider>,
  );
}

async function preencher(atual: string, nova: string, confirmacao: string) {
  await userEvent.type(screen.getByLabelText(/senha atual/i), atual);
  await userEvent.type(screen.getByLabelText(/^nova senha$/i), nova);
  await userEvent.type(screen.getByLabelText(/confirmar/i), confirmacao);
  await userEvent.click(screen.getByRole("button", { name: /trocar senha/i }));
}

describe("TrocarSenha", () => {
  it("explica por que a troca está sendo pedida quando a senha é provisória", () => {
    renderTela();

    expect(screen.getByRole("alert")).toHaveTextContent(/provis/i);
  });

  it("não envia quando a confirmação não bate", async () => {
    renderTela();

    await preencher("senha provisoria 1", SENHA_BOA, "outra coisa 99");

    expect(api.put).not.toHaveBeenCalled();
    expect(await screen.findByText(/não conferem|nao conferem/i)).toBeInTheDocument();
  });

  it("não envia senha nova curta demais", async () => {
    renderTela();

    await preencher("senha provisoria 1", "curta1", "curta1");

    expect(api.put).not.toHaveBeenCalled();
  });

  it("envia a troca e limpa a pendência do usuário", async () => {
    (api.put as never as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 204 });
    renderTela();

    await preencher("senha provisoria 1", SENHA_BOA, SENHA_BOA);

    expect(api.put).toHaveBeenCalledWith("/auth/senha", {
      senhaAtual: "senha provisoria 1",
      senhaNova: SENHA_BOA,
    });
    await vi.waitFor(() => {
      const guardado = JSON.parse(localStorage.getItem("usuario")!);
      expect(guardado.precisaTrocarSenha).toBe(false);
    });
  });

  it("mostra recado claro quando a senha atual é recusada pela API", async () => {
    (api.put as never as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { status: 400, data: { error: { code: "SENHA_ATUAL_INCORRETA" } } },
    });
    renderTela();

    await preencher("errada demais 1", SENHA_BOA, SENHA_BOA);

    expect(await screen.findByText("A senha atual não confere.")).toBeInTheDocument();
  });
});
