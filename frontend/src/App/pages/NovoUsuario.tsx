import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Save, User } from "lucide-react";
import { useCriarUsuario, useAtualizarUsuario, useUsuario, type Papel } from "../api/usuarios.js";
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

// Senha padrão sugerida para novos usuários (o admin pode alterar antes de salvar).
// Vem de VITE_SENHA_PADRAO: nunca fixe credencial no código — ela iria para o
// bundle publicado e para o repositório. Sem a variável, o campo começa vazio.
const SENHA_PADRAO = import.meta.env.VITE_SENHA_PADRAO ?? "";
// Domínio usado para montar o e-mail institucional. Vem de VITE_EMAIL_DOMINIO
// para não fixar o domínio real no repositório.
const DOMINIO = import.meta.env.VITE_EMAIL_DOMINIO ?? "@exemplo.local";

const PAPEIS: { v: Papel; l: string }[] = [
  { v: "ADMIN", l: "Administrador" },
  { v: "GESTOR", l: "Gestor (PO)" },
  { v: "COLETADOR", l: "Coletador" },
  { v: "VISUALIZADOR", l: "Visualizador" },
];

// "Maryana Silva" -> "maryana.silva" (primeiro + último nome, sem acento).
function slug(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function localDeNome(nome: string): string {
  const toks = nome.trim().split(/\s+/).filter(Boolean);
  if (!toks.length) return "";
  const primeiro = slug(toks[0]);
  const ultimo = toks.length > 1 ? slug(toks[toks.length - 1]) : "";
  return ultimo ? `${primeiro}.${ultimo}` : primeiro;
}

const Linha2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const EmailGrupo = styled.div`
  display: flex;
  align-items: stretch;
  input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    min-width: 0;
  }
`;

const Sufixo = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid ${(p) => p.theme.cores.border};
  border-left: none;
  border-radius: 0 10px 10px 0;
  background: ${(p) => p.theme.cores.surfaceAlt};
  color: ${(p) => p.theme.cores.textMuted};
  font-size: 13px;
  white-space: nowrap;
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
  const { id } = useParams();
  const editando = Boolean(id);
  const criar = useCriarUsuario();
  const atualizar = useAtualizarUsuario();
  const { data: usuario } = useUsuario(id);
  const isPending = editando ? atualizar.isPending : criar.isPending;

  const [nome, setNome] = useState("");
  const [emailLocal, setEmailLocal] = useState(""); // parte antes do @ (criação)
  const [email, setEmail] = useState(""); // e-mail completo (edição)
  const [emailTocado, setEmailTocado] = useState(false);
  const [senha, setSenha] = useState(editando ? "" : SENHA_PADRAO);
  const [papel, setPapel] = useState<Papel>("COLETADOR");
  const [erro, setErro] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // Ao criar, gera o e-mail a partir do nome (até o admin editar manualmente).
  useEffect(() => {
    if (editando || emailTocado) return;
    setEmailLocal(localDeNome(nome));
  }, [nome, editando, emailTocado]);

  // Ao editar, carrega os dados uma vez.
  useEffect(() => {
    if (!editando || !usuario || prefilled) return;
    setNome(usuario.nome);
    setEmail(usuario.email);
    setPapel(usuario.papel);
    setSenha("");
    setEmailTocado(true);
    setPrefilled(true);
  }, [editando, usuario, prefilled]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    const emailFinal = editando ? email.trim() : `${emailLocal.trim()}${DOMINIO}`;

    if (!nome.trim()) return setErro("Informe o nome.");
    if (!editando && !emailLocal.trim()) return setErro("Informe a parte do e-mail antes do @.");
    if (!/^\S+@\S+\.\S+$/.test(emailFinal)) return setErro("Informe um e-mail válido.");
    if (!editando && senha.length < 6) return setErro("A senha deve ter ao menos 6 caracteres.");
    if (editando && senha.length > 0 && senha.length < 6) return setErro("A nova senha deve ter ao menos 6 caracteres.");

    try {
      if (editando) {
        await atualizar.mutateAsync({
          id: id!,
          dados: { nome: nome.trim(), email: emailFinal, papel, ...(senha ? { senha } : {}) },
        });
      } else {
        await criar.mutateAsync({ nome: nome.trim(), email: emailFinal, senha, papel });
      }
      navigate("/usuarios");
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) setErro("Este e-mail já está cadastrado.");
      else setErro("Não foi possível salvar. Tente novamente.");
    }
  }

  if (editando && !prefilled) {
    return (
      <Form as="div">
        <Card>
          <Muted style={{ textAlign: "center", padding: "28px 0" }}>Carregando usuário…</Muted>
        </Card>
      </Form>
    );
  }

  return (
    <Form onSubmit={onSubmit}>
      <PageHeader>
        <div>
          <PageTitle>{editando ? "Editar usuário" : "Novo usuário"}</PageTitle>
          <PageSubtitle>
            {editando ? "Atualize os dados e o papel de acesso" : "Cadastre um membro da equipe e defina o papel de acesso"}
          </PageSubtitle>
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
          {editando ? (
            <TextInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailTocado(true); }}
              placeholder={`nome.sobrenome${DOMINIO}`}
            />
          ) : (
            <>
              <EmailGrupo>
                <TextInput
                  id="email"
                  value={emailLocal}
                  onChange={(e) => { setEmailLocal(e.target.value.trim().toLowerCase()); setEmailTocado(true); }}
                  placeholder="nome.sobrenome"
                />
                <Sufixo>{DOMINIO}</Sufixo>
              </EmailGrupo>
              <Muted style={{ fontSize: 11, marginTop: 4 }}>Gerado a partir do nome — ajuste se precisar.</Muted>
            </>
          )}
        </Field>
        <Linha2>
          <Field>
            <Label htmlFor="senha">{editando ? "Nova senha" : "Senha *"}</Label>
            <TextInput
              id="senha"
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={editando ? "Deixe em branco para manter a atual" : "Mínimo 6 caracteres"}
            />
            {!editando && (
              <Muted style={{ fontSize: 11, marginTop: 4 }}>Senha padrão preenchida — o usuário poderá trocá-la depois.</Muted>
            )}
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
          {isPending ? "Salvando…" : editando ? "Salvar alterações" : "Salvar usuário"}
        </Button>
      </Acoes>
    </Form>
  );
}
