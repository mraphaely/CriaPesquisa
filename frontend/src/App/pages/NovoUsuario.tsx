import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Save, User } from "lucide-react";
import { useCriarUsuario, type Papel } from "../api/usuarios.js";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  Card,
  SectionTitle,
  Field,
  Label,
  TextInput,
  Select,
  Button,
  Banner,
  Muted,
} from "../../Styles/ui.js";

const PAPEIS: { v: Papel; l: string }[] = [
  { v: "ADMIN", l: "Administrador" },
  { v: "GESTOR", l: "Gestor (PO)" },
  { v: "COLETADOR", l: "Coletador" },
  { v: "VISUALIZADOR", l: "Visualizador" },
];

const Linha2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const Acoes = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const Form = styled.form`
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
`;

const SecHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
`;

const SecIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: ${(p) => p.theme.cores.accentSoft};
  color: ${(p) => p.theme.cores.primary};
  flex-shrink: 0;
`;

export function NovoUsuario() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCriarUsuario();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<Papel>("COLETADOR");
  const [erro, setErro] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!nome.trim()) return setErro("Informe o nome.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErro("Informe um e-mail válido.");
    if (senha.length < 6) return setErro("A senha deve ter ao menos 6 caracteres.");

    try {
      await mutateAsync({ nome: nome.trim(), email: email.trim(), senha, papel });
      navigate("/usuarios");
    } catch {
      setErro("Não foi possível salvar. Conecte o backend + PostgreSQL para cadastrar o usuário.");
    }
  }

  return (
    <Form onSubmit={onSubmit}>
      <PageHeader>
        <div>
          <PageTitle>Novo usuário</PageTitle>
          <PageSubtitle>Cadastre um membro da equipe e defina o papel de acesso</PageSubtitle>
        </div>
        <Button type="button" $variant="ghost" onClick={() => navigate("/usuarios")}>
          <ArrowLeft size={16} />
          Voltar
        </Button>
      </PageHeader>

      <Card style={{ marginBottom: 16 }}>
        <SecHeader>
          <SecIcon><User size={19} /></SecIcon>
          <SectionTitle style={{ margin: 0 }}>Dados do usuário</SectionTitle>
        </SecHeader>
        <Field>
          <Label htmlFor="nome">Nome *</Label>
          <TextInput id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
        </Field>
        <Field>
          <Label htmlFor="email">E-mail *</Label>
          <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@cria.al" />
        </Field>
        <Linha2>
          <Field>
            <Label htmlFor="senha">Senha *</Label>
            <TextInput id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </Field>
          <Field>
            <Label htmlFor="papel">Papel</Label>
            <Select id="papel" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
              {PAPEIS.map((p) => (
                <option key={p.v} value={p.v}>{p.l}</option>
              ))}
            </Select>
          </Field>
        </Linha2>
      </Card>

      {erro && <Banner $tone="warn" role="alert" style={{ marginBottom: 16 }}>{erro}</Banner>}

      <Acoes>
        <Button type="button" $variant="ghost" onClick={() => navigate("/usuarios")}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          <Save size={16} />
          {isPending ? "Salvando…" : "Salvar usuário"}
        </Button>
      </Acoes>
      <Muted style={{ marginTop: 12, fontSize: 12 }}>
        Em modo demonstração o usuário não é persistido — conecte o backend para cadastrar de verdade.
      </Muted>
    </Form>
  );
}
