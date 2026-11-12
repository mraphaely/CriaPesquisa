import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AcoesPesquisa } from "./AcoesPesquisa.js";
import { ThemeModeProvider } from "../App/theme/ThemeModeContext.js";
import { queryClient } from "../App/lib/queryClient.js";
import { api } from "../App/lib/axios.js";

const postSpy = vi.spyOn(api, "post");

beforeEach(() => {
  queryClient.clear();
  postSpy.mockReset();
  postSpy.mockResolvedValue({ data: {} } as never);
});

function renderMenu(status: string) {
  render(
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AcoesPesquisa p={{ id: "p1", titulo: "Vacina +", status }} />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeModeProvider>,
  );
}

describe("AcoesPesquisa", () => {
  it("pesquisa arquivada oferece Desarquivar e chama a API", async () => {
    renderMenu("ARQUIVADA");

    await userEvent.click(screen.getByRole("button", { name: /ações da pesquisa/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /desarquivar/i }));

    expect(postSpy).toHaveBeenCalledWith("/pesquisas/p1/desarquivar");
  });

  it("pesquisa publicada não mostra Desarquivar", async () => {
    renderMenu("PUBLICADA");

    await userEvent.click(screen.getByRole("button", { name: /ações da pesquisa/i }));

    expect(screen.queryByRole("menuitem", { name: /desarquivar/i })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /^arquivar$/i })).toBeInTheDocument();
  });
});
