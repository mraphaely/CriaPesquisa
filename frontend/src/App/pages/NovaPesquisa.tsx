import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { Plus, Trash2, ArrowLeft, Save, FileText, ListChecks } from "lucide-react";
import { useAuth } from "../auth/useAuth.js";
import {
  useCriarPesquisa,
  useSalvarEdicao,
  usePesquisaBruta,
  type PerguntaPayload,
  type TipoPergunta,
} from "../api/pesquisas.js";
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

const TIPOS: { v: TipoPergunta; l: string }[] = [
  { v: "TEXTO", l: "Texto curto" },
  { v: "CAMPO_ABERTO", l: "Campo aberto (parágrafo)" },
  { v: "NUMERO", l: "Número" },
  { v: "DATA", l: "Data" },
  { v: "ESCOLHA_UNICA", l: "Escolha única" },
  { v: "MULTIPLA_ESCOLHA", l: "Múltipla escolha" },
];

const ehEscolha = (t: TipoPergunta) => t === "ESCOLHA_UNICA" || t === "MULTIPLA_ESCOLHA";

interface PerguntaForm {
  enunciado: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  opcoes: string[];
}

const Linha2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const PerguntaCard = styled.div`
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 14px;
  background: ${(p) => p.theme.cores.surfaceAlt};
`;

const PerguntaTopo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const NumBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: ${(p) => p.theme.cores.accentSoft};
  color: ${(p) => p.theme.cores.primary};
  font-size: 12px;
  font-weight: 700;
`;

const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => p.theme.cores.textMuted};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.danger}18; color: ${(p) => p.theme.cores.danger}; }
`;

const OpcaoLinha = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
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
  max-width: 760px;
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

export function NovaPesquisa() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editando = Boolean(id);
  const { usuario } = useAuth();
  const criar = useCriarPesquisa();
  const salvar = useSalvarEdicao(id);
  const { data: bruta } = usePesquisaBruta(id);
  const isPending = editando ? salvar.isPending : criar.isPending;
  // Depois de publicada, a pesquisa já tem respostas atreladas às perguntas:
  // mexer nelas invalidaria o que foi coletado. Metadados seguem editáveis.
  const perguntasEditaveis = !editando || !bruta || bruta.status === "RASCUNHO";

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([
    { enunciado: "", tipo: "TEXTO", obrigatoria: false, opcoes: [] },
  ]);
  const [erro, setErro] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // Ao editar, carrega os dados da pesquisa uma vez.
  useEffect(() => {
    if (!editando || !bruta || prefilled) return;
    setTitulo(bruta.titulo);
    setDescricao(bruta.descricao ?? "");
    setInicio(bruta.periodoInicio ? bruta.periodoInicio.slice(0, 10) : "");
    setFim(bruta.periodoFim ? bruta.periodoFim.slice(0, 10) : "");
    setPerguntas(
      bruta.perguntas.length
        ? bruta.perguntas.map((p) => ({
            enunciado: p.enunciado,
            tipo: p.tipo,
            obrigatoria: p.obrigatoria,
            opcoes: p.opcoes.map((o) => o.texto),
          }))
        : [{ enunciado: "", tipo: "TEXTO", obrigatoria: false, opcoes: [] }],
    );
    setPrefilled(true);
  }, [editando, bruta, prefilled]);

  function atualizarPergunta(i: number, patch: Partial<PerguntaForm>) {
    setPerguntas((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function mudarTipo(i: number, tipo: TipoPergunta) {
    const opcoes = ehEscolha(tipo) ? (perguntas[i].opcoes.length ? perguntas[i].opcoes : ["", ""]) : [];
    atualizarPergunta(i, { tipo, opcoes });
  }
  function addPergunta() {
    setPerguntas((ps) => [...ps, { enunciado: "", tipo: "TEXTO", obrigatoria: false, opcoes: [] }]);
  }
  function removePergunta(i: number) {
    setPerguntas((ps) => ps.filter((_, idx) => idx !== i));
  }
  function addOpcao(i: number) {
    atualizarPergunta(i, { opcoes: [...perguntas[i].opcoes, ""] });
  }
  function updateOpcao(i: number, j: number, valor: string) {
    atualizarPergunta(i, { opcoes: perguntas[i].opcoes.map((o, idx) => (idx === j ? valor : o)) });
  }
  function removeOpcao(i: number, j: number) {
    atualizarPergunta(i, { opcoes: perguntas[i].opcoes.filter((_, idx) => idx !== j) });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!titulo.trim()) return setErro("Informe o título da pesquisa.");
    if (!perguntas.length) return setErro("Adicione ao menos uma pergunta.");
    for (const [i, p] of perguntas.entries()) {
      if (!p.enunciado.trim()) return setErro(`A pergunta ${i + 1} está sem enunciado.`);
      if (ehEscolha(p.tipo)) {
        const validas = p.opcoes.filter((o) => o.trim());
        if (validas.length < 2) return setErro(`A pergunta ${i + 1} precisa de ao menos 2 opções.`);
      }
    }

    const perguntasPayload = perguntas.map<PerguntaPayload>((p, i) => ({
      enunciado: p.enunciado.trim(),
      tipo: p.tipo,
      obrigatoria: p.obrigatoria,
      ordem: i,
      opcoes: ehEscolha(p.tipo)
        ? p.opcoes.filter((o) => o.trim()).map((texto, ordem) => ({ texto: texto.trim(), ordem }))
        : undefined,
    }));

    try {
      if (editando) {
        await salvar.mutateAsync({
          meta: {
            titulo: titulo.trim(),
            descricao: descricao.trim() || undefined,
            periodoInicio: inicio || undefined,
            periodoFim: fim || undefined,
          },
          perguntas: perguntasPayload,
          perguntasAntigas: bruta?.perguntas.map((p) => p.id) ?? [],
          perguntasEditaveis,
        });
        navigate(`/pesquisas/${id}`);
      } else {
        await criar.mutateAsync({
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          responsavelId: usuario?.id ?? "",
          periodoInicio: inicio || undefined,
          periodoFim: fim || undefined,
          perguntas: perguntasPayload,
        });
        navigate("/pesquisas");
      }
    } catch {
      setErro("Não foi possível salvar. Verifique a conexão com o servidor.");
    }
  }

  if (editando && !prefilled) {
    return (
      <Form as="div">
        <Card>
          <Muted style={{ textAlign: "center", padding: "28px 0" }}>Carregando pesquisa…</Muted>
        </Card>
      </Form>
    );
  }

  return (
    <Form onSubmit={onSubmit}>
      <PageHeader>
        <div>
          <PageTitle>{editando ? "Editar pesquisa" : "Nova pesquisa"}</PageTitle>
          <PageSubtitle>
            {!editando
              ? "Monte o formulário com perguntas de vários tipos"
              : perguntasEditaveis
                ? "Ajuste os detalhes e as perguntas desta pesquisa"
                : "Ajuste os detalhes — as perguntas ficam travadas depois da publicação"}
          </PageSubtitle>
        </div>
        <Button type="button" $variant="ghost" onClick={() => navigate("/pesquisas")}>
          <ArrowLeft size={16} />
          Voltar
        </Button>
      </PageHeader>

      <Card style={{ marginBottom: 16 }}>
        <SecHeader>
          <SecIcon><FileText size={19} /></SecIcon>
          <SectionTitle style={{ margin: 0 }}>Detalhes da pesquisa</SectionTitle>
        </SecHeader>
        <Field>
          <Label htmlFor="titulo">Título *</Label>
          <TextInput id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Cartão CRIA — Criança" />
        </Field>
        <Field>
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Objetivo e público da pesquisa…" />
        </Field>
        <Linha2>
          <Field>
            <Label htmlFor="inicio">Início da coleta</Label>
            <TextInput id="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="fim">Fim da coleta</Label>
            <TextInput id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </Field>
        </Linha2>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SecHeader>
          <SecIcon><ListChecks size={19} /></SecIcon>
          <SectionTitle style={{ margin: 0 }}>Perguntas</SectionTitle>
        </SecHeader>
        {!perguntasEditaveis && (
          <Banner $tone="warn" role="status" style={{ marginBottom: 14 }}>
            Esta pesquisa já foi publicada: as perguntas não podem mais ser alteradas, porque há respostas
            ligadas a elas. Para mudar o questionário, crie uma nova pesquisa.
          </Banner>
        )}
        {perguntas.map((p, i) => (
          <PerguntaCard key={i}>
            <PerguntaTopo>
              <NumBadge>{i + 1}</NumBadge>
              <IconBtn type="button" onClick={() => removePergunta(i)} title="Remover pergunta" aria-label="remover pergunta">
                <Trash2 size={16} />
              </IconBtn>
            </PerguntaTopo>
            <Field>
              <Label>Enunciado</Label>
              <TextInput value={p.enunciado} onChange={(e) => atualizarPergunta(i, { enunciado: e.target.value })} placeholder="Escreva a pergunta…" />
            </Field>
            <Linha2>
              <Field>
                <Label>Tipo</Label>
                <Select value={p.tipo} onChange={(e) => mudarTipo(i, e.target.value as TipoPergunta)}>
                  {TIPOS.map((t) => (
                    <option key={t.v} value={t.v}>{t.l}</option>
                  ))}
                </Select>
              </Field>
              <Field style={{ justifyContent: "flex-end" }}>
                <Label>&nbsp;</Label>
                <Checkbox>
                  <input type="checkbox" checked={p.obrigatoria} onChange={(e) => atualizarPergunta(i, { obrigatoria: e.target.checked })} />
                  Resposta obrigatória
                </Checkbox>
              </Field>
            </Linha2>
            {ehEscolha(p.tipo) && (
              <div>
                <Label>Opções</Label>
                {p.opcoes.map((o, j) => (
                  <OpcaoLinha key={j}>
                    <TextInput style={{ flex: 1 }} value={o} onChange={(e) => updateOpcao(i, j, e.target.value)} placeholder={`Opção ${j + 1}`} />
                    <IconBtn type="button" onClick={() => removeOpcao(i, j)} title="Remover opção" aria-label="remover opção">
                      <Trash2 size={15} />
                    </IconBtn>
                  </OpcaoLinha>
                ))}
                <Button type="button" $variant="ghost" onClick={() => addOpcao(i)}>
                  <Plus size={15} />
                  Adicionar opção
                </Button>
              </div>
            )}
          </PerguntaCard>
        ))}
        <Button type="button" $variant="ghost" onClick={addPergunta}>
          <Plus size={16} />
          Adicionar pergunta
        </Button>
      </Card>

      {erro && <Banner $tone="warn" role="alert" style={{ marginBottom: 16 }}>{erro}</Banner>}

      <Acoes>
        <Button type="button" $variant="ghost" onClick={() => navigate("/pesquisas")}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          <Save size={16} />
          {isPending ? "Salvando…" : "Salvar pesquisa"}
        </Button>
      </Acoes>
    </Form>
  );
}
