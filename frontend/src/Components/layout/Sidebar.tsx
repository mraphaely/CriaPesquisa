import { NavLink } from "react-router-dom";
import styled from "styled-components";

const NAV = [
  {
    grupo: "Principal",
    itens: [
      { to: "/", rotulo: "Dashboard", icone: "📊" },
      { to: "/pesquisas", rotulo: "Pesquisas", icone: "🗂️" },
    ],
  },
  {
    grupo: "Administração",
    itens: [
      { to: "/usuarios", rotulo: "Usuários", icone: "👥" },
      { to: "/logs", rotulo: "Auditoria", icone: "🧾" },
    ],
  },
];

const Aside = styled.nav`
  background: ${(p) => p.theme.cores.sidebar};
  color: ${(p) => p.theme.cores.sidebarText};
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 22px 14px;
  @media (max-width: 860px) { width: 100%; padding: 14px; }
`;

const Marca = styled.div`
  padding: 0 8px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 10px;
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  span { color: ${(p) => p.theme.cores.accent}; }
`;

const Sub = styled.div`
  font-size: 10px;
  color: ${(p) => p.theme.cores.sidebarMuted};
  margin-top: 5px;
  line-height: 1.4;
`;

const Grupo = styled.div`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: ${(p) => p.theme.cores.sidebarMuted};
  padding: 14px 10px 6px;
`;

const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 10px;
  color: ${(p) => p.theme.cores.sidebarMuted};
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.08); color: ${(p) => p.theme.cores.sidebarText}; }
  &.active { background: ${(p) => p.theme.cores.sidebarActive}; color: #fff; font-weight: 600; }
`;

const Icone = styled.span`
  font-size: 16px;
  width: 20px;
  text-align: center;
`;

export function Sidebar() {
  return (
    <Aside aria-label="navegação principal">
      <Marca>
        <Logo>
          CRIA<span>.</span>
        </Logo>
        <Sub>
          Secretaria da
          <br />
          Primeira Infância · AL
        </Sub>
      </Marca>
      {NAV.map((g) => (
        <div key={g.grupo}>
          <Grupo>{g.grupo}</Grupo>
          {g.itens.map((i) => (
            <Item key={i.to} to={i.to} end={i.to === "/"}>
              <Icone>{i.icone}</Icone>
              {i.rotulo}
            </Item>
          ))}
        </div>
      ))}
    </Aside>
  );
}
