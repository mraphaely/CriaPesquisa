import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./Layout.js";
import { ThemeModeProvider } from "../../App/theme/ThemeModeContext.js";
import { AuthProvider } from "../../App/auth/AuthContext.js";

function renderLayout() {
  return render(
    <ThemeModeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes><Route element={<Layout />}><Route path="/" element={<p>conteúdo</p>} /></Route></Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeModeProvider>
  );
}

describe("Layout", () => {
  it("mostra a navegação e o conteúdo", () => {
    renderLayout();
    expect(screen.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("alterna o tema ao clicar no toggle", async () => {
    renderLayout();
    expect(document.documentElement.getAttribute("data-theme")).toBe("claro");
    await userEvent.click(screen.getByRole("button", { name: /alternar tema/i }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("escuro");
  });
});
