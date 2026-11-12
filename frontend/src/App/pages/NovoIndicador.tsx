import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Plus } from "lucide-react";
import { useCriarIndicador } from "../api/indicadores.js";
import { usePesquisas } from "../api/pesquisas.js";
import { TIPOS_INDICADOR } from "./revisaoIndicador/ConfigPorTipo.js";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  Card,
  SectionTitle,
  Field,
  Label,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Button,
  Banner,
  Muted,
} from "../../Styles/ui.js";

const Form = styled.form`
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
`;

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

/** Lê a mensagem da API (`{ error: { code, message } }`) para o aviso da tela. */
function mensagemDeErro(err: unknown): string {
  const resposta = (err as { response?: { status?: number; data?: { error?: { code?: string; message?: string } } } }).response;
  if (resposta?.data?.error?.code === "CODIGO_DUPLICADO") return "Já existe um indicador com este código.";
  if (resposta?.status === undefined) return "Não foi possível conectar ao servidor. Tente novamente em instantes.";
  return resposta.data?.error?.message ?? "Não foi possível criar o indicador. Tente novamente.";
}

/**
 * Cadastro de indicador: só a identificação. O indicador nasce "para revisar" e a
 * pessoa segue para a tela de revisão, onde escolhe as perguntas e ativa.
 */
export function NovoIndicador() {
  const navigate = useNavigate();
  const criar = useCriarIndicador();
  const { data: pesquisas } = usePesquisas();

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [pesquisaId, setPesquisaId] = useState("");
  const [tipo, setTipo] = useState<string>("PROPORCAO");
  const [apresentacao, setApresentacao] = useState<string[]>([]);
  const [categoria, setCategoria] = useState("");
  const [erro, setErro] = useState("");

  const alternarApresentacao = (valor: string) =>
    setApresentacao((atual) => (atual.includes(valor) ? atual.filter((a) => a !== valor) : [...atual, valor]));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!codigo.trim()) return setErro("Informe o código do indicador.");
    if (!nome.trim()) return setErro("Informe o nome do indicador.");

    try {
      const indicador = await criar.mutateAsync({
        codigo: codigo.trim(),
        nome: nome.trim(),
        tipo,
        apresentacao,
        ...(objetivo.trim() ? { objetivo: objetivo.trim() } : {}),
        ...(pesquisaId ? { pesquisaId } : {}),
        ...(categoria.trim() ? { categoria: categoria.trim() } : {}),
      });
      navigate(`/indicadores/${indicador.id}`);
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }

  return (
    <Form onSubmit={onSubmit}>
      <PageHeader>
        <div>
          <PageTitle>Novo indicador</PageTitle>
          <PageSubtitle>Identifique o indicador; o cálculo é configurado no passo seguinte</PageSubtitle>
        </div>
        <Button type="button" $variant="ghost" onClick={() => navigate("/indicadores")}>
          <ArrowLeft size={16} />
          Voltar
        </Button>
      </PageHeader>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Identificação</SectionTitle>
        <Linha2>
          <Field>
            <Label htmlFor="novo-codigo">Código *</Label>
            <TextInput
              id="novo-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex.: C-VACINA"
              maxLength={60}
            />
          </Field>
          <Field>
            <Label htmlFor="novo-tipo">Tipo de cálculo</Label>
            <Select id="novo-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_INDICADOR.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </Linha2>
        <Field>
          <Label htmlFor="novo-nome">Nome *</Label>
          <TextInput id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do indicador" />
        </Field>
        <Field>
          <Label htmlFor="novo-objetivo">Objetivo (opcional)</Label>
          <Textarea id="novo-objetivo" rows={2} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
        </Field>
        <Linha2>
          <Field>
            <Label htmlFor="novo-pesquisa">Pesquisa</Label>
            <Select id="novo-pesquisa" value={pesquisaId} onChange={(e) => setPesquisaId(e.target.value)}>
              <option value="">Sem pesquisa vinculada</option>
              {pesquisas?.itens.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="novo-categoria">Categoria (opcional)</Label>
            <TextInput
              id="novo-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex.: Saúde"
              maxLength={100}
            />
          </Field>
        </Linha2>
        <Field>
          <Label as="span">Apresentação no painel</Label>
          <div style={{ display: "flex", gap: 16 }}>
            {["Escopo", "Perfil"].map((a) => (
              <Checkbox key={a}>
                <input type="checkbox" checked={apresentacao.includes(a)} onChange={() => alternarApresentacao(a)} />
                {a}
              </Checkbox>
            ))}
          </div>
        </Field>
        <Muted style={{ fontSize: 12 }}>
          Sem pesquisa vinculada, a configuração do cálculo é feita pelo editor JSON na tela de revisão.
        </Muted>
      </Card>

      {erro && (
        <Banner $tone="warn" role="alert" style={{ marginBottom: 16 }}>
          {erro}
        </Banner>
      )}

      <Acoes>
        <Button type="button" $variant="ghost" onClick={() => navigate("/indicadores")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={criar.isPending}>
          <Plus size={16} />
          {criar.isPending ? "Criando…" : "Criar indicador"}
        </Button>
      </Acoes>
    </Form>
  );
}
