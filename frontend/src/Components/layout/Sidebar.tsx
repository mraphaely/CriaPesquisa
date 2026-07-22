import { NavLink } from "react-router-dom";

const ITENS = [
  { to: "/", rotulo: "Dashboard" },
  { to: "/entrevistas", rotulo: "Entrevistas" },
  { to: "/criancas", rotulo: "Crianças" },
  { to: "/gestantes", rotulo: "Gestantes" },
  { to: "/saude", rotulo: "Saúde" },
  { to: "/alimentacao", rotulo: "Alimentação" },
  { to: "/indicadores", rotulo: "Indicadores" },
];

export function Sidebar() {
  return (
    <nav aria-label="navegação principal">
      <strong>CRIA.</strong>
      <ul>
        {ITENS.map((i) => (
          <li key={i.to}><NavLink to={i.to} end={i.to === "/"}>{i.rotulo}</NavLink></li>
        ))}
      </ul>
    </nav>
  );
}
