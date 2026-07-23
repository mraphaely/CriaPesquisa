import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { LogIn, Eye } from "lucide-react";
import { useLogin } from "../api/useLogin.js";
import { useAuth } from "../auth/useAuth.js";
import { Logo } from "../../Components/ui/Logo.js";
import { Button, Field, Label, TextInput, Muted, Banner } from "../../Styles/ui.js";

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(1100px 550px at 100% -10%, ${(p) => p.theme.cores.accentSoft} 0%, transparent 55%),
    radial-gradient(900px 480px at -10% 110%, ${(p) => p.theme.cores.accentSoft} 0%, transparent 55%),
    repeating-linear-gradient(90deg, ${(p) => p.theme.cores.border}55 0 1px, transparent 1px 44px),
    repeating-linear-gradient(0deg, ${(p) => p.theme.cores.border}55 0 1px, transparent 1px 44px),
    ${(p) => p.theme.cores.bg};
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
  margin-bottom: 22px;
`;

const Sub = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.cores.textMuted};
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const Titulo = styled.h1`
  font-size: 18px;
  text-align: center;
  margin: 0 0 18px;
  color: ${(p) => p.theme.cores.text};
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
        <Titulo>Entrar</Titulo>
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
