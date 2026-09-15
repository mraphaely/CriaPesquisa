import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.js";
import { AuthProvider, type Usuario } from "./AuthContext.js";

function entrarComo(usuario: Usuario) {
  localStorage.setItem("token", "token-de-teste");
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function renderEm(rota: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[rota]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>painel</p>} />
            <Route path="/pesquisas" element={<p>pesquisas</p>} />
          </Route>
          <Route element={<ProtectedRoute permitirSenhaProvisoria />}>
            <Route path="/trocar-senha" element={<p>tela de troca de senha</p>} />
          </Route>
          <Route path="/login" element={<p>tela de login</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const BASE: Usuario = { id: "1", nome: "Ana", email: "ana@exemplo.local", papel: "COLETADOR" };

beforeEach(() => {
  localStorage.clear();
});

describe("ProtectedRoute", () => {
  it("manda quem não entrou para o login", () => {
    renderEm("/");

    expect(screen.getByText("tela de login")).toBeInTheDocument();
  });

  it("deixa passar quem já trocou a senha", () => {
    entrarComo({ ...BASE, precisaTrocarSenha: false });

    renderEm("/");

    expect(screen.getByText("painel")).toBeInTheDocument();
  });

  it("prende na troca de senha quem ainda está com a senha provisória", () => {
    entrarComo({ ...BASE, precisaTrocarSenha: true });

    renderEm("/pesquisas");

    expect(screen.getByText("tela de troca de senha")).toBeInTheDocument();
    expect(screen.queryByText("pesquisas")).not.toBeInTheDocument();
  });

  it("deixa a própria tela de troca abrir com senha provisória, sem laço de redirecionamento", () => {
    entrarComo({ ...BASE, precisaTrocarSenha: true });

    renderEm("/trocar-senha");

    expect(screen.getByText("tela de troca de senha")).toBeInTheDocument();
  });

  it("exige login mesmo para a tela de troca de senha", () => {
    renderEm("/trocar-senha");

    expect(screen.getByText("tela de login")).toBeInTheDocument();
  });
});
