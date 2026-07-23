import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { LogIn, Eye } from "lucide-react";
import { useLogin } from "../api/useLogin.js";
import { useAuth } from "../auth/useAuth.js";
import { Logo } from "../../Components/ui/Logo.js";
import { Button, Field, Label, TextInput, Muted, Banner } from "../../Styles/ui.js";

// Padrão de fundo (estrelas, luas, corações, brilhos, carinhas e rabiscos) —
// vetorial, sutil e tematizável. "Quase transparente, mas visível".
const estrela = (x: number, y: number, s: number, r: number) =>
  `<path transform='translate(${x} ${y}) scale(${s}) rotate(${r})' d='M0 -10 L2.9 -3.1 L10 -2.4 L4.5 2.5 L6.2 9.5 L0 5.8 L-6.2 9.5 L-4.5 2.5 L-10 -2.4 L-2.9 -3.1 Z'/>`;
const brilho = (x: number, y: number, s: number) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M0 -9 C0 -3 -3 0 -9 0 C-3 0 0 3 0 9 C0 3 3 0 9 0 C3 0 0 -3 0 -9 Z'/>`;
const coracao = (x: number, y: number, s: number) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M0 6 C0 6 -8 1 -8 -4 C-8 -7 -5.5 -8.5 -3 -8.5 C-1.5 -8.5 0 -7.5 0 -6 C0 -7.5 1.5 -8.5 3 -8.5 C5.5 -8.5 8 -7 8 -4 C8 1 0 6 0 6 Z'/>`;
const lua = (x: number, y: number, s: number) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M6 -8 A8 8 0 1 0 6 8 A6 6 0 1 1 6 -8 Z'/>`;
const carinha = (x: number, y: number, s: number, cor: string, op: number) =>
  `<g transform='translate(${x} ${y}) scale(${s})'>` +
  `<circle r='9' fill='none' stroke='${cor}' stroke-opacity='${op}' stroke-width='1.5'/>` +
  `<path d='M-4.5 2.5 Q0 7 4.5 2.5' fill='none' stroke='${cor}' stroke-opacity='${op}' stroke-width='1.5' stroke-linecap='round'/>` +
  `<circle cx='-3.4' cy='-2.4' r='1.4'/><circle cx='3.4' cy='-2.4' r='1.4'/></g>`;
const rabisco = (x: number, y: number, s: number, cor: string, op: number) =>
  `<path transform='translate(${x} ${y}) scale(${s})' fill='none' stroke='${cor}' stroke-opacity='${op}' stroke-width='1.5' stroke-linecap='round' d='M-7 2 A4 4 0 1 1 -1 5 A7 7 0 1 0 8 -2'/>`;

function fundoPadrao(cor: string, opacidade: number): string {
  const formas = [
    estrela(22, 26, 1, 12), estrela(118, 44, 0.7, -14), estrela(176, 108, 1.05, 22),
    estrela(74, 150, 0.85, 4), estrela(30, 118, 0.6, 30), estrela(148, 178, 0.75, -8),
    brilho(92, 92, 1), brilho(186, 28, 0.8), brilho(12, 86, 0.7), brilho(122, 132, 0.7),
    coracao(56, 54, 0.85), coracao(190, 66, 0.6), coracao(98, 188, 0.7), coracao(160, 150, 0.6),
    lua(150, 20, 1), lua(40, 182, 0.85), lua(196, 120, 0.7),
    carinha(104, 68, 1, cor, opacidade), carinha(28, 174, 0.8, cor, opacidade),
    carinha(184, 158, 0.9, cor, opacidade), carinha(66, 20, 0.72, cor, opacidade),
    rabisco(150, 108, 0.9, cor, opacidade), rabisco(14, 52, 0.8, cor, opacidade),
    "<circle cx='96' cy='22' r='2'/><circle cx='120' cy='176' r='2.2'/><circle cx='14' cy='150' r='1.8'/><circle cx='70' cy='104' r='1.6'/><circle cx='196' cy='188' r='1.8'/>",
  ].join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='210' height='210' viewBox='0 0 210 210'><g fill='${cor}' fill-opacity='${opacidade}'>${formas}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background-color: ${(p) => p.theme.cores.bg};
  background-image:
    ${(p) => fundoPadrao(p.theme.modo === "escuro" ? "#FFFFFF" : "#1756B8", p.theme.modo === "escuro" ? 0.05 : 0.06)},
    radial-gradient(1100px 550px at 100% -10%, ${(p) => p.theme.cores.accentSoft} 0%, transparent 55%),
    radial-gradient(900px 480px at -10% 110%, ${(p) => p.theme.cores.accentSoft} 0%, transparent 55%);
  background-repeat: repeat, no-repeat, no-repeat;
`;

const Cartao = styled.div`
  width: 100%;
  max-width: 410px;
  background: ${(p) => p.theme.cores.surface};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 22px;
  padding: 36px 30px;
  box-shadow: ${(p) => p.theme.cores.shadow};
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const Sub = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.cores.textMuted};
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const Divisor = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0 14px;
  color: ${(p) => p.theme.cores.textMuted};
  font-size: 11px;
  &::before, &::after { content: ""; flex: 1; height: 1px; background: ${(p) => p.theme.cores.border}; }
`;

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { mutateAsync, isPending } = useLogin();
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      const { token, usuario } = await mutateAsync({ email, senha });
      entrar(token, usuario);
      navigate("/");
    } catch {
      setErro("E-mail ou senha inválidos");
    }
  }

  function verDemonstracao() {
    entrar("demo-token", { id: "demo", nome: "Visitante", email: "demo@cria.al", papel: "ADMIN" });
    navigate("/");
  }

  return (
    <Page>
      <Cartao>
        <Brand>
          <Logo variante="colorida" altura={46} />
          <Sub>Pesquisa · Primeira Infância de Alagoas</Sub>
        </Brand>
        <form onSubmit={onSubmit} aria-label="login">
          <Field>
            <Label htmlFor="email">E-mail</Label>
            <TextInput id="email" type="email" placeholder="voce@cria.al" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="senha">Senha</Label>
            <TextInput id="senha" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </Field>
          {erro && <Banner $tone="warn" role="alert" style={{ marginBottom: 14 }}>{erro}</Banner>}
          <Button type="submit" $block disabled={isPending}>
            <LogIn size={16} />
            {isPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        <Divisor>ou</Divisor>
        <Button type="button" $variant="ghost" $block onClick={verDemonstracao}>
          <Eye size={16} />
          Ver demonstração
        </Button>
        <Muted style={{ textAlign: "center", marginTop: 14, fontSize: 12 }}>
          O login real requer o backend conectado. A demonstração abre o sistema sem servidor.
        </Muted>
      </Cartao>
    </Page>
  );
}
