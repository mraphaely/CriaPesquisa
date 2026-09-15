import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { KeyRound, LogOut } from "lucide-react";
import { useTrocarSenha } from "../api/useTrocarSenha.js";
import { useAuth } from "../auth/useAuth.js";
import { Logo } from "../../Components/ui/Logo.js";
import { Button, Field, Label, TextInput, Muted, Banner } from "../../Styles/ui.js";

/** Espelha a política do backend (helper/politicaSenha.ts) para avisar antes do envio. */
const TAMANHO_MINIMO = 10;

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: ${(p) => p.theme.cores.bg};
`;

const Cartao = styled.div`
  width: 100%;
  max-width: 440px;
  background: ${(p) => p.theme.cores.surface};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 22px;
  padding: 34px 30px 28px;
  box-shadow: ${(p) => p.theme.cores.shadow};
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
`;

const LinhaSair = styled.div`
  margin-top: 16px;
  text-align: center;
`;

const BotaoTexto = styled.button`
  background: none;
  border: none;
  padding: 4px 8px;
  font-size: 12px;
  color: ${(p) => p.theme.cores.textMuted};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;

  &:hover {
    color: ${(p) => p.theme.cores.accent};
  }
`;

export function TrocarSenha() {
  const { usuario, atualizarUsuario, sair } = useAuth();
  const { mutateAsync, isPending } = useTrocarSenha();
  const navigate = useNavigate();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);

  const provisoria = Boolean(usuario?.precisaTrocarSenha);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");

    if (senhaNova.length < TAMANHO_MINIMO) {
      return setErro(`A nova senha precisa ter ao menos ${TAMANHO_MINIMO} caracteres.`);
    }
    if (senhaNova !== confirmacao) {
      return setErro("A nova senha e a confirmação não conferem.");
    }
    if (senhaNova === senhaAtual) {
      return setErro("A nova senha precisa ser diferente da atual.");
    }

    try {
      await mutateAsync({ senhaAtual, senhaNova });
      atualizarUsuario({ precisaTrocarSenha: false });
      setOk(true);
      navigate("/");
    } catch (err) {
      const resposta = (err as { response?: { status?: number; data?: { error?: { code?: string } } } }).response;
      const codigo = resposta?.data?.error?.code;

      if (codigo === "SENHA_ATUAL_INCORRETA") setErro("A senha atual não confere.");
      else if (resposta?.status === 422) {
        setErro("Escolha uma senha menos previsível: evite sequências, repetições e palavras óbvias.");
      } else if (resposta?.status === undefined) {
        setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
      } else setErro("Não foi possível trocar a senha. Tente novamente.");
    }
  }

  return (
    <Page>
      <Cartao>
        <Brand>
          <Logo variante="colorida" altura={42} />
        </Brand>

        {provisoria && (
          <Banner $tone="warn" role="alert" style={{ marginBottom: 16 }}>
            Sua senha é provisória: foi definida por outra pessoa. Escolha uma senha só sua para continuar.
          </Banner>
        )}

        <form onSubmit={onSubmit} aria-label="trocar senha">
          <Field>
            <Label htmlFor="senhaAtual">Senha atual</Label>
            <TextInput
              id="senhaAtual"
              type="password"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="senhaNova">Nova senha</Label>
            <TextInput
              id="senhaNova"
              type="password"
              autoComplete="new-password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
            />
            <Muted style={{ fontSize: 12, marginTop: 6 }}>
              Ao menos {TAMANHO_MINIMO} caracteres. Uma frase curta que só você lembre funciona melhor que
              trocar letra por símbolo.
            </Muted>
          </Field>
          <Field>
            <Label htmlFor="confirmacao">Confirmar nova senha</Label>
            <TextInput
              id="confirmacao"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </Field>

          {erro && (
            <Banner $tone="warn" role="alert" style={{ marginBottom: 14 }}>
              {erro}
            </Banner>
          )}
          {ok && (
            <Banner $tone="info" role="status" style={{ marginBottom: 14 }}>
              Senha alterada.
            </Banner>
          )}

          <Button type="submit" $block disabled={isPending}>
            <KeyRound size={16} />
            {isPending ? "Trocando…" : "Trocar senha"}
          </Button>
        </form>

        <LinhaSair>
          <BotaoTexto type="button" onClick={() => sair()}>
            <LogOut size={14} /> Sair
          </BotaoTexto>
        </LinhaSair>
      </Cartao>
    </Page>
  );
}
