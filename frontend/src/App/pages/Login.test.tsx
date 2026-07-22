import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { Login } from "./Login.js";
import { AuthProvider } from "../auth/AuthContext.js";
import { queryClient } from "../lib/queryClient.js";
import { api } from "../lib/axios.js";

vi.spyOn(api, "post");
beforeEach(() => { localStorage.clear(); queryClient.clear(); });

function renderLogin() {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider><MemoryRouter><Login /></MemoryRouter></AuthProvider>
    </QueryClientProvider>
  );
}

describe("Login", () => {
  it("mostra erro quando as credenciais são inválidas", async () => {
    (api.post as any).mockRejectedValueOnce(new Error("401"));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/e-mail/i), "x@y.z");
    await userEvent.type(screen.getByLabelText(/senha/i), "errada");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/inválidos/i);
  });

  it("guarda o token ao logar com sucesso", async () => {
    (api.post as any).mockResolvedValueOnce({ data: { token: "abc", usuario: { id: "1", nome: "A", email: "x@y.z", papel: "ADMIN" } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/e-mail/i), "x@y.z");
    await userEvent.type(screen.getByLabelText(/senha/i), "cria123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await vi.waitFor(() => expect(localStorage.getItem("token")).toBe("abc"));
  });
});
