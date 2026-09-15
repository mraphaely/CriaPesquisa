import { useState, Suspense } from "react";
import styled from "styled-components";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.js";
import { Topbar } from "./Topbar.js";
import { Footer } from "./Footer.js";

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  @media (max-width: 860px) { flex-direction: column; }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Carregando = styled.div`
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: ${(p) => p.theme.cores.textMuted};
`;

const Conteudo = styled.div`
  padding: 24px;
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
`;

export function Layout() {
  const [colapsada, setColapsada] = useState<boolean>(() => localStorage.getItem("sidebar-colapsada") === "1");

  function alternar() {
    setColapsada((v) => {
      const nova = !v;
      localStorage.setItem("sidebar-colapsada", nova ? "1" : "0");
      return nova;
    });
  }

  return (
    <Shell>
      <Sidebar colapsada={colapsada} />
      <Main>
        <Topbar colapsada={colapsada} onToggle={alternar} />
        <Conteudo>
          {/* As telas pesadas (gráficos, construtor) chegam por carregamento
              sob demanda — quem só responde formulário em campo não baixa o
              Chart.js. O Suspense cobre esse intervalo. */}
          <Suspense fallback={<Carregando role="status">Carregando…</Carregando>}>
            <Outlet />
          </Suspense>
        </Conteudo>
        <Footer />
      </Main>
    </Shell>
  );
}
