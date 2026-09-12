import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios.js";
import { type Campo, type TipoCampo } from "../data/pesquisaCrianca.js";

export type TipoPergunta = "TEXTO" | "NUMERO" | "DATA" | "MULTIPLA_ESCOLHA" | "ESCOLHA_UNICA" | "CAMPO_ABERTO";

// ---------------------------------------------------------------------------
// Criação de pesquisa (formulário Nova Pesquisa)
// ---------------------------------------------------------------------------

export interface OpcaoPayload {
  texto: string;
  ordem: number;
}

export interface PerguntaPayload {
  enunciado: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  ordem: number;
  opcoes?: OpcaoPayload[];
}

export interface NovaPesquisaPayload {
  titulo: string;
  descricao?: string;
  responsavelId: string;
  periodoInicio?: string;
  periodoFim?: string;
  perguntas: PerguntaPayload[];
}

export function useCriarPesquisa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: NovaPesquisaPayload) => {
      const { perguntas, ...pesquisa } = dados;
      const { data } = await api.post("/pesquisas", pesquisa);
      const id: string = data?.pesquisa?.id ?? data?.id;
      for (const pergunta of perguntas) {
        await api.post(`/pesquisas/${id}/perguntas`, pergunta);
      }
      return { id };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pesquisas"] }),
  });
}

// ---------------------------------------------------------------------------
// Editar / status / excluir pesquisa
// ---------------------------------------------------------------------------

export interface AtualizarPesquisaMeta {
  titulo?: string;
  descricao?: string;
  periodoInicio?: string;
  periodoFim?: string;
}

/** Pesquisa "crua" (com período e perguntas/opções) para o editor. */
export interface OpcaoBruta {
  id: string;
  texto: string;
  ordem: number;
}
export interface PerguntaBruta {
  id: string;
  enunciado: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  ordem: number;
  opcoes: OpcaoBruta[];
}
export interface PesquisaBruta {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  periodoInicio: string | null;
  periodoFim: string | null;
  perguntas: PerguntaBruta[];
}

export function usePesquisaBruta(id: string | undefined) {
  return useQuery<PesquisaBruta | null>({
    queryKey: ["pesquisa-bruta", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ pesquisa: PesquisaBruta | null }>(`/pesquisas/${id}`);
      return data.pesquisa ?? null;
    },
  });
}

/** Salva a edição: atualiza os metadados e re-sincroniza as perguntas (apenas rascunhos). */
export function useSalvarEdicao(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: { meta: AtualizarPesquisaMeta; perguntas: PerguntaPayload[]; perguntasAntigas: string[] }) => {
      await api.put(`/pesquisas/${id}`, dados.meta);
      for (const pid of dados.perguntasAntigas) await api.delete(`/perguntas/${pid}`);
      for (const pergunta of dados.perguntas) await api.post(`/pesquisas/${id}/perguntas`, pergunta);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pesquisas"] });
      qc.invalidateQueries({ queryKey: ["pesquisa", id] });
      qc.invalidateQueries({ queryKey: ["pesquisa-bruta", id] });
    },
  });
}

export type AcaoStatus = "publicar" | "encerrar" | "arquivar";

export function useMudarStatusPesquisa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, acao }: { id: string; acao: AcaoStatus }) => {
      const { data } = await api.post(`/pesquisas/${id}/${acao}`);
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["pesquisas"] });
      qc.invalidateQueries({ queryKey: ["pesquisa", id] });
      qc.invalidateQueries({ queryKey: ["pesquisa-bruta", id] });
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
  });
}

export function useRemoverPesquisa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pesquisas/${id}`);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pesquisas"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Listagem de pesquisas
// ---------------------------------------------------------------------------

export interface PesquisaResumo {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  publicadaEm: string | null;
  createdAt: string;
}

export function usePesquisas() {
  return useQuery<{ itens: PesquisaResumo[] }>({
    queryKey: ["pesquisas"],
    queryFn: async () => {
      const { data } = await api.get<{ itens: PesquisaResumo[] }>("/pesquisas");
      return { itens: data.itens };
    },
  });
}

// ---------------------------------------------------------------------------
// Detalhe da pesquisa (normalizado em seções + campos para o formulário)
// ---------------------------------------------------------------------------

interface ApiOpcao {
  id: string;
  texto: string;
  ordem: number;
}
interface ApiPergunta {
  id: string;
  secaoId: string | null;
  enunciado: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  ordem: number;
  ajuda: string | null;
  opcoes: ApiOpcao[];
}
interface ApiSecao {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
}
interface ApiPesquisaDetalhe {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  secoes: ApiSecao[];
  perguntas: ApiPergunta[];
}

/** Campo renderizável pelo formulário; `id` é o perguntaId vindo da API. */
export type CampoView = Campo & { id?: string };
export interface SecaoView {
  titulo: string;
  campos: CampoView[];
}
export interface PesquisaView {
  id: string;
  titulo: string;
  descricao?: string;
  status: string;
  secoes: SecaoView[];
}

const TIPO_API_PARA_CAMPO: Record<TipoPergunta, TipoCampo> = {
  TEXTO: "texto",
  CAMPO_ABERTO: "paragrafo",
  NUMERO: "numero",
  DATA: "data",
  ESCOLHA_UNICA: "unica",
  MULTIPLA_ESCOLHA: "multipla",
};

function normalizar(p: ApiPesquisaDetalhe): PesquisaView {
  const secoesOrd = [...p.secoes].sort((a, b) => a.ordem - b.ordem);
  const perguntasOrd = [...p.perguntas].sort((a, b) => a.ordem - b.ordem);
  let n = 0;
  const campoDe = (q: ApiPergunta): CampoView => ({
    id: q.id,
    n: ++n,
    enunciado: q.enunciado,
    tipo: TIPO_API_PARA_CAMPO[q.tipo],
    obrigatoria: q.obrigatoria,
    ajuda: q.ajuda ?? undefined,
    opcoes: q.opcoes.length ? q.opcoes.map((o) => o.texto) : undefined,
  });

  const secoes: SecaoView[] = [];
  if (secoesOrd.length === 0) {
    secoes.push({ titulo: "Perguntas", campos: perguntasOrd.map(campoDe) });
  } else {
    for (const s of secoesOrd) {
      const campos = perguntasOrd.filter((q) => q.secaoId === s.id).map(campoDe);
      if (campos.length) secoes.push({ titulo: s.titulo, campos });
    }
    const semSecao = perguntasOrd.filter((q) => !q.secaoId).map(campoDe);
    if (semSecao.length) secoes.push({ titulo: "Outras perguntas", campos: semSecao });
  }
  return { id: p.id, titulo: p.titulo, descricao: p.descricao ?? undefined, status: p.status, secoes };
}

export function usePesquisa(id: string | undefined) {
  return useQuery<PesquisaView | null>({
    queryKey: ["pesquisa", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ pesquisa: ApiPesquisaDetalhe | null }>(`/pesquisas/${id}`);
      return data.pesquisa ? normalizar(data.pesquisa) : null;
    },
  });
}

// ---------------------------------------------------------------------------
// Envio de resposta
// ---------------------------------------------------------------------------

export interface ItemRespostaPayload {
  perguntaId: string;
  valorTexto?: string;
  valorNumero?: number;
  valorData?: string;
  opcoesSelecionadas?: string[];
}
export interface RespostaPayload {
  municipio?: string;
  unidade?: string;
  regional?: string;
  itens: ItemRespostaPayload[];
}

export function useEnviarResposta(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: RespostaPayload) => {
      const { data } = await api.post(`/pesquisas/${id}/respostas`, dados);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["painel"] });
      qc.invalidateQueries({ queryKey: ["resumo", id] });
      qc.invalidateQueries({ queryKey: ["respostas", id] });
    },
  });
}

// ---------------------------------------------------------------------------
// Resumo/resultados de uma pesquisa (agregação por pergunta)
// ---------------------------------------------------------------------------

export interface DistribuicaoOpcao {
  opcao: string;
  contagem: number;
  percentual: number;
}
export interface ResumoPergunta {
  perguntaId: string;
  enunciado: string;
  tipo: TipoPergunta;
  totalRespostas: number;
  distribuicao?: DistribuicaoOpcao[];
  media?: number;
  minimo?: number;
  maximo?: number;
  preenchidos?: number;
}
export interface ResumoPesquisa {
  total: number;
  perguntas: ResumoPergunta[];
}

export function useResumo(id: string | undefined) {
  return useQuery<ResumoPesquisa>({
    queryKey: ["resumo", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ResumoPesquisa>(`/pesquisas/${id}/resumo`);
      return data;
    },
  });
}
