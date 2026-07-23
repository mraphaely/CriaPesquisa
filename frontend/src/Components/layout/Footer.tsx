import styled from "styled-components";
import { Logo } from "../ui/Logo.js";

const Rodape = styled.footer`
  border-top: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surface};
  padding: 22px 24px 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
`;

const Logos = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const Copyright = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.cores.textMuted};
  line-height: 1.6;
`;

const Nome = styled.span`
  font-weight: 700;
  color: ${(p) => p.theme.cores.primaryDark};
`;

export function Footer() {
  const ano = new Date().getFullYear();
  return (
    <Rodape>
      <Logos>
        <Logo variante="colorida" altura={34} />
      </Logos>
      <Copyright>
        © {ano} <Nome>CriaPesquisa</Nome> — Todos os direitos reservados.
        <br />
        Secretaria de Estado da Primeira Infância · Alagoas
      </Copyright>
    </Rodape>
  );
}
