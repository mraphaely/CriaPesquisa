import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App", () => {
  it("renderiza o título do sistema", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /criapesquisa/i })).toBeInTheDocument();
  });
});
