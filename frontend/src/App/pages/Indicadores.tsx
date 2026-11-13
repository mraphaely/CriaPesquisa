import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Gauge, Plus, Upload } from "lucide-react";
import {
  useIndicadores,
  useImportarPlanilha,
  type StatusIndicador,
  type FiltrosIndicadores,
  type ResultadoImportacao,
} from "../api/indicadores.js";
import { usePesquisas } from "../api/pesquisas.js";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  Card,
  Muted,
  Banner,
  EmptyState,
  EmptyIcon,
  SectionTitle,
  TableWrap,
  Tabela,
  Th,
  Td,
  Tag,
  Field,
  Label,
  Select,
  TextInput,
  Button,
} from "../../Styles/ui.js";

type FiltroStatus = StatusIndicador | "TODOS";

const STATUS_LABEL: Record<StatusIndicador, string> = {
  DEFINICAO_INCOMPLETA: "Para revisar",
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

const tomDoStatus = (s: StatusIndicador): "orange" | "green" | "muted" =>
  s === "ATIVO" ? "green" : s === "INATIVO" ? "muted" : "orange";

const Filtros = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  > * {
    min-width: 160px;
    flex: 1;
  }
`;

const LinhaClicavel = styled.tr`
  cursor: pointer;
  &:hover {
    background: ${(p) => p.theme.cores.surfaceAlt};
  }
`;

const Paginacao = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
`;

const Chips = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const BotoesTopo = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ListaRecusados = styled.ul`
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 12px;
`;

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Frase do resultado: o que entrou, o que já existia e o que já saiu ativo. */
function resumirImportacao(r: ResultadoImportacao): string {
  const { importadas, jaExistiam } = r.resumo;
  const ativados = r.ativacao.ativados.length;
  if (importadas === 0 && ativados === 0) {
    return `Nenhum indicador novo: os ${jaExistiam} da planilha já estavam cadastrados.`;
  }
  return [
    `Planilha importada: ${plural(importadas, "indicador novo", "indicadores novos")}`,
    jaExistiam > 0 ? `${jaExistiam} já existiam` : null,
    `${plural(ativados, "ativado", "ativados")} automaticamente (definição pronta).`,
  ]
    .filter(Boolean)
    .join(", ")
    .concat(" Os demais ficam “Para revisar”.");
}

/** Mensagem da API (`{ error: { code, message } }`) para o aviso da tela. */
function mensagemDaApi(err: unknown): string {
  const resposta = (err as { response?: { status?: number; data?: { error?: { code?: string; message?: string } } } })
    .response;
  if (resposta?.status === undefined) return "não foi possível conectar ao servidor. Tente novamente em instantes.";
  if (resposta.data?.error?.code === "ARQUIVO_GRANDE") return "o arquivo é grande demais (limite de 10 MB).";
  if (resposta.status === 403) return "seu perfil não pode importar indicadores.";
  return resposta.data?.error?.message ?? "erro inesperado. Tente novamente.";
}

function resumir(texto: string, max = 80) {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

export function Indicadores() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<FiltroStatus>("DEFINICAO_INCOMPLETA");
  const [pesquisaId, setPesquisaId] = useState("");
  const [apresentacao, setApresentacao] = useState<"" | "Escopo" | "Perfil">("");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);

  // Espera a pessoa parar de digitar antes de consultar a API.
  useEffect(() => {
    if (busca === buscaAplicada) return;
    const t = setTimeout(() => {
      setBuscaAplicada(busca);
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busca, buscaAplicada]);

  const filtros: FiltrosIndicadores = {};
  if (status !== "TODOS") filtros.status = status;
  if (pesquisaId) filtros.pesquisaId = pesquisaId;
  if (apresentacao) filtros.apresentacao = apresentacao;
  if (buscaAplicada.trim()) filtros.q = buscaAplicada.trim();

  const { data, isLoading, isError } = useIndicadores(filtros, pagina);
  const { data: pesquisas } = usePesquisas();
  const importar = useImportarPlanilha();
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [retornoImportacao, setRetornoImportacao] = useState<{ ok: ResultadoImportacao } | { erro: string } | null>(null);

  async function enviarPlanilha(arquivo: File) {
    setRetornoImportacao(null);
    try {
      setRetornoImportacao({ ok: await importar.mutateAsync(arquivo) });
    } catch (err) {
      setRetornoImportacao({ erro: mensagemDaApi(err) });
    }
  }
  // Lista vazia por filtro ≠ sistema sem nenhum indicador: os contadores ignoram o filtro de status.
  const semNenhumCadastro =
    data !== undefined && data.contadores.DEFINICAO_INCOMPLETA + data.contadores.ATIVO + data.contadores.INATIVO === 0;

  const cabecalho = (
    <PageHeader>
      <div>
        <PageTitle>Indicadores</PageTitle>
        <PageSubtitle>
          {data
            ? `${data.contadores.DEFINICAO_INCOMPLETA} para revisar · ${data.contadores.ATIVO} ativos · ${data.contadores.INATIVO} inativos`
            : "Cadastre, revise e ative os indicadores"}
        </PageSubtitle>
      </div>
      <BotoesTopo>
        {/* O input fica escondido: o botão abre o seletor de arquivo. */}
        <input
          ref={inputArquivo}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          aria-label="arquivo da planilha de indicadores"
          style={{ display: "none" }}
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = ""; // permite reenviar o mesmo arquivo
            if (arquivo) enviarPlanilha(arquivo);
          }}
        />
        <Button
          type="button"
          $variant="ghost"
          disabled={importar.isPending}
          onClick={() => inputArquivo.current?.click()}
          title="Importa a planilha &quot;Exportação Indicadores&quot; (.xlsx). Reenviar não sobrescreve o que já existe."
        >
          <Upload size={16} />
          {importar.isPending ? "Importando…" : "Importar planilha"}
        </Button>
        <Button type="button" onClick={() => navigate("/indicadores/novo")}>
          <Plus size={16} />
          Novo indicador
        </Button>
      </BotoesTopo>
    </PageHeader>
  );

  const avisoImportacao = retornoImportacao && (
    <Banner
      $tone={"erro" in retornoImportacao ? "warn" : "info"}
      role={"erro" in retornoImportacao ? "alert" : "status"}
      style={{ marginBottom: 16 }}
    >
      {"erro" in retornoImportacao ? (
        <>Não foi possível importar a planilha: {retornoImportacao.erro}</>
      ) : (
        <>
          {resumirImportacao(retornoImportacao.ok)}
          {retornoImportacao.ok.ativacao.recusados.length > 0 && (
            <ListaRecusados>
              {retornoImportacao.ok.ativacao.recusados.map((r) => (
                <li key={r.codigo}>
                  {r.codigo}: {r.motivo}
                </li>
              ))}
            </ListaRecusados>
          )}
        </>
      )}
    </Banner>
  );

  const filtrosUi = (
    <Filtros>
      <Field>
        <Label htmlFor="ind-status">Status</Label>
        <Select id="ind-status" value={status} onChange={(e) => {
            setStatus(e.target.value as FiltroStatus);
            setPagina(1);
          }}
        >
          <option value="DEFINICAO_INCOMPLETA">Para revisar</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
          <option value="TODOS">Todos</option>
        </Select>
      </Field>
      <Field>
        <Label htmlFor="ind-pesquisa">Pesquisa</Label>
        <Select id="ind-pesquisa" value={pesquisaId} onChange={(e) => {
            setPesquisaId(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todas</option>
          {pesquisas?.itens.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titulo}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label htmlFor="ind-apresentacao">Apresentação</Label>
        <Select
          id="ind-apresentacao"
          value={apresentacao}
          onChange={(e) => {
            setApresentacao(e.target.value as "" | "Escopo" | "Perfil");
            setPagina(1);
          }}
        >
          <option value="">Todas</option>
          <option value="Escopo">Escopo</option>
          <option value="Perfil">Perfil</option>
        </Select>
      </Field>
      <Field>
        <Label htmlFor="ind-busca">Buscar por nome</Label>
        <TextInput id="ind-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome do indicador" />
      </Field>
    </Filtros>
  );

  return (
    <div>
      {cabecalho}
      {avisoImportacao}
      {filtrosUi}

      {isLoading ? (
        <Card>
          <Muted style={{ textAlign: "center", padding: "24px 0" }}>Carregando indicadores…</Muted>
        </Card>
      ) : isError || !data ? (
        <Banner $tone="warn">Não foi possível carregar os indicadores. Verifique se o servidor está no ar.</Banner>
      ) : data.itens.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <Gauge size={26} />
          </EmptyIcon>
          {semNenhumCadastro ? (
            <>
              <SectionTitle>Nenhum indicador cadastrado</SectionTitle>
              <Muted>
                Use "Importar planilha" para trazer os indicadores da planilha "Exportação Indicadores", ou cadastre um em "Novo indicador".
              </Muted>
            </>
          ) : (
            <>
              <SectionTitle>Nenhum indicador encontrado</SectionTitle>
              <Muted>Ajuste os filtros para ver outros indicadores.</Muted>
            </>
          )}
        </EmptyState>
      ) : (
        <Card>
          <TableWrap>
            <Tabela>
              <thead>
                <tr>
                  <Th>Código</Th>
                  <Th>Nome</Th>
                  <Th>Tipo</Th>
                  <Th>Apresentação</Th>
                  <Th>Status</Th>
                  <Th>Motivo</Th>
                </tr>
              </thead>
              <tbody>
                {data.itens.map((i) => (
                  <LinhaClicavel key={i.id} onClick={() => navigate(`/indicadores/${i.id}`)}>
                    <Td>{i.codigo}</Td>
                    <Td style={{ fontWeight: 600 }}>{i.nome}</Td>
                    <Td>{i.tipo}</Td>
                    <Td>
                      <Chips>
                        {i.apresentacao.map((a) => (
                          <Tag key={a} $tone="blue">
                            {a}
                          </Tag>
                        ))}
                      </Chips>
                    </Td>
                    <Td>
                      <Tag $tone={tomDoStatus(i.status)}>{STATUS_LABEL[i.status]}</Tag>
                    </Td>
                    <Td>
                      {i.status === "DEFINICAO_INCOMPLETA" && i.motivoIncompleto ? (
                        <Muted as="span" title={i.motivoIncompleto}>
                          {resumir(i.motivoIncompleto)}
                        </Muted>
                      ) : null}
                    </Td>
                  </LinhaClicavel>
                ))}
              </tbody>
            </Tabela>
          </TableWrap>
          <Paginacao>
            <Muted as="span">
              Mostrando {(data.page - 1) * data.pageSize + 1}–{(data.page - 1) * data.pageSize + data.itens.length} de{" "}
              {data.total}
            </Muted>
            <Button type="button" $variant="ghost" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              type="button"
              $variant="ghost"
              disabled={pagina * data.pageSize >= data.total}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </Button>
          </Paginacao>
        </Card>
      )}
    </div>
  );
}
