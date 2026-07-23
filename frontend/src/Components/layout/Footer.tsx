import styled, { useTheme } from "styled-components";
import footerLight from "../../assets/Footer-LightMode.png";
import footerDark from "../../assets/Footer-DarkMode.png";

const Rodape = styled.footer`
  border-top: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surface};
  padding: 22px 24px 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
`;

const ImgFooter = styled.img`
  height: 44px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
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
  const t = useTheme();
  const ano = new Date().getFullYear();
  const src = t.modo === "escuro" ? footerDark : footerLight;

  return (
    <Rodape>
      <ImgFooter src={src} alt="CRIA — Primeira Infância de Alagoas" />
      <Copyright>
        © {ano} <Nome>CriaPesquisa</Nome> — Todos os direitos reservados.
        <br />
        Secretaria de Estado da Primeira Infância · Alagoas
      </Copyright>
    </Rodape>
  );
}
