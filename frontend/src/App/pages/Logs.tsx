import { Fragment, useState } from "react";
import styled from "styled-components";
import { ScrollText, ChevronDown, ChevronRight } from "lucide-react";
import { useLogs, type AcaoLog, type FiltrosLogs, type RegistroLog } from "../api/logs.js";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  Card,
  EmptyState,
  EmptyIcon,
  SectionTitle,
  Muted,
  Banner,
  Field,
  Label,
  Select,
  TextInput,
  Button,
  TableWrap,
  Tabela,
  Th,
  Td,
  Tag,
} from "../../Styles/ui.js";

const ACOES: Record<AcaoLog, { label: string; tom: "blue" | "green" | "orange" | "red" | "muted" }> = {
  CREATE: { label: "Criou", tom: "green" },
  UPDATE: { label: "Editou", tom: "blue" },
  DELETE: { label: "Excluiu", tom: "red" },
  RESTORE: { label: "Restaurou", tom: "green" },
  PUBLICAR: { label: "Publicou", tom: "green" },
  ENCERRAR: { label: "Encerrou", tom: "orange" },
  ARQUIVAR: { label: "Arquivou", tom: "muted" },
  DESARQUIVAR: { label: "Desarquivou", tom: "blue" },
  APROVAR: { label: "Aprovou", tom: "green" },
  REPROVAR: { label: "Reprovou", tom: "red" },
};

const ENTIDADES: Record<string, string> = {
  Pesquisa: "Pesquisa",
  Secao: "Seção",
  Pergunta: "Pergunta",
  Resposta: "Resposta",
  Indicador: "Indicador",
  Usuario: "Usuário",
};

/** Campos que mudam em toda gravação ou não dizem nada a quem audita. */
const CAMPOS_OCULTOS = new Set(["id", "createdAt", "updatedAt", "senhaHash", "createdById", "updatedById", "deletedById"]);

const Filtros = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  > * {
    min-width: 150px;
    flex: 1;
  }
`;

const Paginacao = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  flex-wrap: wrap;
`;

const BotaoDetalhes = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  padding: 2px 4px;
  font-size: 12px;
  color: ${(p) => p.theme.cores.accent};
  cursor: pointer;
  white-space: nowrap;
`;

const Diferencas = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, max-content) minmax(0, 1fr) minmax(0, 1fr);
  gap: 6px 16px;
  font-size: 12px;
  padding: 6px 4px 10px;
  overflow-wrap: anywhere;
  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Cabecalho = styled.span`
  font-weight: 700;
  color: ${(p) => p.theme.cores.textMuted};
  text-transform: uppercase;
  font-size: 11px;
`;

const Antes = styled.span`
  color: ${(p) => p.theme.cores.danger};
`;

const Depois = styled.span`
  color: ${(p) => p.theme.cores.success};
`;

type Objeto = Record<string, unknown>;
const comoObjeto = (v: unknown): Objeto => (v && typeof v === "object" && !Array.isArray(v) ? (v as Objeto) : {});

/** Nome legível do registro afetado: título, nome, enunciado ou código; senão o começo do id. */
export function nomeDoRegistro(log: RegistroLog): string {
  const dados = { ...comoObjeto(log.dadosAntes), ...comoObjeto(log.dadosDepois) };
  if (dados.senhaAlterada === true && log.entidade === "Usuario") return "Troca de senha";
  for (const campo of ["titulo", "nome", "enunciado", "codigo", "email"]) {
    if (typeof dados[campo] === "string" && dados[campo]) return dados[campo] as string;
  }
  return `#${log.entidadeId.slice(0, 8)}`;
}

function formatarValor(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (typeof v === "string" || typeof v === "number") return String(v);
  const json = JSON.stringify(v);
  return json.length > 160 ? `${json.slice(0, 159)}…` : json;
}

/** Campos que mudaram entre antes e depois (na criação, tudo é "depois"; na exclusão, tudo é "antes"). */
export function diferencas(log: RegistroLog): Array<{ campo: string; antes: unknown; depois: unknown }> {
  const antes = comoObjeto(log.dadosAntes);
  const depois = comoObjeto(log.dadosDepois);
  const campos = [...new Set([...Object.keys(antes), ...Object.keys(depois)])].filter((c) => !CAMPOS_OCULTOS.has(c));
  return campos
    .filter((c) => JSON.stringify(antes[c]) !== JSON.stringify(depois[c]))
    .map((campo) => ({ campo, antes: antes[campo], depois: depois[campo] }));
}

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export function Logs() {
  const [entidade, setEntidade] = useState("");
  const [acao, setAcao] = useState<"" | AcaoLog>("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [pagina, setPagina] = useState(1);
  const [aberto, setAberto] = useState<string | null>(null);

  // Datas do filtro são dias inteiros no fuso de Brasília.
  const filtros: FiltrosLogs = {};
  if (entidade) filtros.entidade = entidade;
  if (acao) filtros.acao = acao;
  if (de) filtros.de = `${de}T00:00:00-03:00`;
  if (ate) filtros.ate = `${ate}T23:59:59.999-03:00`;

  const { data, isLoading, isError } = useLogs(filtros, pagina);

  const mudar = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPagina(1);
  };

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Auditoria</PageTitle>
          <PageSubtitle>
            Trilha de alterações do sistema: quem fez, quando e o que mudou
            {data ? ` · ${data.total} registro(s)` : ""}
          </PageSubtitle>
        </div>
      </PageHeader>

      <Filtros>
        <Field>
          <Label htmlFor="log-entidade">Registro</Label>
          <Select id="log-entidade" value={entidade} onChange={(e) => mudar(setEntidade)(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ENTIDADES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="log-acao">Ação</Label>
          <Select id="log-acao" value={acao} onChange={(e) => mudar(setAcao)(e.target.value as "" | AcaoLog)}>
            <option value="">Todas</option>
            {(Object.keys(ACOES) as AcaoLog[]).map((a) => (
              <option key={a} value={a}>
                {ACOES[a].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="log-de">De</Label>
          <TextInput id="log-de" type="date" value={de} onChange={(e) => mudar(setDe)(e.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="log-ate">Até</Label>
          <TextInput id="log-ate" type="date" value={ate} onChange={(e) => mudar(setAte)(e.target.value)} />
        </Field>
      </Filtros>

      {isLoading ? (
        <Card>
          <Muted style={{ textAlign: "center", padding: "24px 0" }}>Carregando auditoria…</Muted>
        </Card>
      ) : isError || !data ? (
        <Banner $tone="warn">Não foi possível carregar a auditoria. Verifique se o servidor está no ar.</Banner>
      ) : data.itens.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <ScrollText size={26} />
          </EmptyIcon>
          <SectionTitle>Nenhuma alteração encontrada</SectionTitle>
          <Muted>Ajuste os filtros para ver outros registros.</Muted>
        </EmptyState>
      ) : (
        <Card>
          <TableWrap>
            <Tabela>
              <thead>
                <tr>
                  <Th>Quando</Th>
                  <Th>Quem</Th>
                  <Th>Ação</Th>
                  <Th>Tipo</Th>
                  <Th>Registro</Th>
                  <Th aria-label="detalhes" />
                </tr>
              </thead>
              <tbody>
                {data.itens.map((log) => {
                  const estaAberto = aberto === log.id;
                  const acaoUi = ACOES[log.acao] ?? { label: log.acao, tom: "muted" as const };
                  return (
                    <Fragment key={log.id}>
                      <tr>
                        <Td style={{ whiteSpace: "nowrap" }}>{dataHora(log.createdAt)}</Td>
                        <Td title={log.usuario?.email}>{log.usuario?.nome ?? "—"}</Td>
                        <Td>
                          <Tag $tone={acaoUi.tom}>{acaoUi.label}</Tag>
                        </Td>
                        <Td>{ENTIDADES[log.entidade] ?? log.entidade}</Td>
                        <Td style={{ fontWeight: 600 }}>{nomeDoRegistro(log)}</Td>
                        <Td>
                          <BotaoDetalhes
                            type="button"
                            aria-expanded={estaAberto}
                            onClick={() => setAberto(estaAberto ? null : log.id)}
                          >
                            {estaAberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Detalhes
                          </BotaoDetalhes>
                        </Td>
                      </tr>
                      {estaAberto && (
                        <tr>
                          <Td colSpan={6}>
                            <Detalhes log={log} />
                          </Td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
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

function Detalhes({ log }: { log: RegistroLog }) {
  const linhas = diferencas(log);
  if (linhas.length === 0) {
    return <Muted style={{ margin: "6px 4px" }}>Sem campos alterados registrados.</Muted>;
  }
  return (
    <Diferencas>
      <Cabecalho>Campo</Cabecalho>
      <Cabecalho>Antes</Cabecalho>
      <Cabecalho>Depois</Cabecalho>
      {linhas.map(({ campo, antes, depois }) => (
        <Fragment key={campo}>
          <strong>{campo}</strong>
          <Antes>{formatarValor(antes)}</Antes>
          <Depois>{formatarValor(depois)}</Depois>
        </Fragment>
      ))}
    </Diferencas>
  );
}
