import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useLogin } from "../api/useLogin.js";
import { useAuth } from "../auth/useAuth.js";
import { Button, Field, Label, TextInput, Muted, Banner } from "../../Styles/ui.js";

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(1200px 600px at 100% -10%, ${(p) => p.theme.cores.accentSoft} 0%, transparent 55%),
    radial-gradient(900px 500px at -10% 110%, ${(p) => p.theme.cores.accentSoft} 0%, transparent 55%),
    ${(p) => p.theme.cores.bg};
`;

const Cartao = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${(p) => p.theme.cores.surface};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 20px;
  padding: 34px 30px;
  box-shadow: ${(p) => p.theme.cores.shadow};
`;

const Brand = styled.div`
  text-align: center;
  margin-bottom: 22px;
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 30px;
  font-weight: 700;
  color: ${(p) => p.theme.cores.primaryDark};
  letter-spacing: -0.5px;
  span { color: ${(p) => p.theme.cores.accent}; }
`;

const Sub = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.cores.textMuted};
  margin-top: 4px;
  letter-spacing: 0.4px;
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
          <Logo>CRIA<span>.</span></Logo>
          <Sub>PESQUISA · Primeira Infância de Alagoas</Sub>
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
          <Button type="submit" $block disabled={isPending}>{isPending ? "Entrando…" : "Entrar"}</Button>
        </form>
        <Divisor>ou</Divisor>
        <Button type="button" $variant="ghost" $block onClick={verDemonstracao}>Ver demonstração</Button>
        <Muted style={{ textAlign: "center", marginTop: 14, fontSize: 12 }}>
          O login real requer o backend conectado. A demonstração abre o sistema sem servidor.
        </Muted>
      </Cartao>
    </Page>
  );
}
