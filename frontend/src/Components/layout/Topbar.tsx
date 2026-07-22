import { ThemeToggle } from "../ui/ThemeToggle.js";
import { useAuth } from "../../App/auth/useAuth.js";

export function Topbar() {
  const { usuario, sair } = useAuth();
  return (
    <header>
      <span>Visão Geral — Cartão CRIA</span>
      <div>
        <ThemeToggle />
        <span>{usuario?.nome}</span>
        <button type="button" onClick={sair}>Sair</button>
      </div>
    </header>
  );
}
