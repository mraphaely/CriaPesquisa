import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, ArrowRight, Send, CheckCircle2, Search, ListChecks } from "lucide-react";
import { PESQUISAS_DEMO, totalPerguntas, type Campo, type Secao } from "../data/pesquisaCrianca.js";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  Card,
  Tag,
  Button,
  TextInput,
  Textarea,
  Select,
  Muted,
  Banner,
  TableWrap,
  Tabela,
  Th,
  Td,
} from "../../Styles/ui.js";

type Valor = string | string[] | Record<string, string> | undefined;

const Wrap = styled.div`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
`;

const Busca = styled.div`
  position: relative;
  margin-bottom: 16px;
  svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: ${(p) => p.theme.cores.textMuted}; }
  input { padding-left: 42px; width: 100%; }
`;

const PassoInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.textMuted};
  margin-bottom: 6px;
`;

const Progresso = styled.div`
  height: 6px;
  border-radius: 4px;
  background: ${(p) => p.theme.cores.border};
  overflow: hidden;
  margin-bottom: 18px;
`;

const ProgressoFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: linear-gradient(90deg, ${(p) => p.theme.cores.accent}, ${(p) => p.theme.cores.primary});
  transition: width 0.25s ease;
`;

const SecaoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

const SecIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  flex-shrink: 0;
  background: ${(p) => p.theme.cores.accentSoft};
  color: ${(p) => p.theme.cores.primary};
`;

const SecaoTitulo = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => p.theme.cores.primaryDark};
  margin: 0;
`;

const SecaoBarra = styled.div`
  height: 4px;
  width: 46px;
  border-radius: 3px;
  background: ${(p) => p.theme.cores.accent};
  margin: 4px 0 16px 48px;
`;

const Grade = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 28px;
  @media (min-width: 641px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1040px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Bloco = styled.div<{ $full?: boolean }>`
  grid-column: ${(p) => (p.$full ? "1 / -1" : "auto")};
  padding: 16px 0;
  border-top: 1px solid ${(p) => p.theme.cores.border};
  @media (max-width: 640px) {
    grid-column: 1 / -1;
  }
`;

const EnunciadoLinha = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
`;

const NumBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 7px;
  flex-shrink: 0;
  background: ${(p) => p.theme.cores.accentSoft};
  color: ${(p) => p.theme.cores.primary};
  font-size: 12px;
  font-weight: 700;
`;

const Enunciado = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.text};
  line-height: 1.4;
`;

const Obrig = styled.span`
  color: ${(p) => p.theme.cores.danger};
  margin-left: 4px;
`;

const Ajuda = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.cores.textMuted};
  margin: 2px 0 10px 34px;
  line-height: 1.5;
`;

const CampoBox = styled.div`
  margin-left: 34px;
`;

const Opcao = styled.label`
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: ${(p) => p.theme.cores.text};
  padding: 5px 0;
  cursor: pointer;
  input { width: 15px; height: 15px; accent-color: ${(p) => p.theme.cores.primary}; }
`;

const Escala = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Bolha = styled.button<{ $ativa: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  border: 1.5px solid ${(p) => (p.$ativa ? p.theme.cores.primary : p.theme.cores.border)};
  background: ${(p) => (p.$ativa ? p.theme.cores.primary : "transparent")};
  color: ${(p) => (p.$ativa ? "#fff" : p.theme.cores.textMuted)};
  transition: all 0.12s ease;
  &:hover { border-color: ${(p) => p.theme.cores.accent}; }
`;

const Pills = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Pill = styled.button<{ $ativa: boolean }>`
  min-width: 96px;
  padding: 10px 18px;
  border-radius: 11px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  border: 1.5px solid ${(p) => (p.$ativa ? p.theme.cores.primary : p.theme.cores.border)};
  background: ${(p) => (p.$ativa ? p.theme.cores.primary : "transparent")};
  color: ${(p) => (p.$ativa ? "#fff" : p.theme.cores.text)};
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  &:hover { border-color: ${(p) => p.theme.cores.accent}; }
`;

const Acoes = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const Sucesso = styled(Card)`
  text-align: center;
  padding: 48px 28px;
`;

const CheckBadge = styled.div`
  width: 68px;
  height: 68px;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.theme.cores.success}22;
  color: ${(p) => p.theme.cores.success};
`;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Escolha única com mais de 5 opções é renderizada como dropdown.
function unicaComoDropdown(c: Campo): boolean {
  if (c.tipo !== "unica") return false;
  return (c.opcoes?.length ?? 0) + (c.outro ? 1 : 0) > 3;
}

// Campos "pequenos" ocupam meia/terço da largura (ficam lado a lado); os demais, a linha toda.
function ehPequeno(c: Campo): boolean {
  if (c.full) return false;
  if (c.tipo === "texto" || c.tipo === "numero" || c.tipo === "data" || c.tipo === "selecao") return true;
  if (c.tipo === "escala") return (c.escala?.max ?? 10) <= 5;
  if (unicaComoDropdown(c)) return true;
  if (c.tipo === "unica") return (c.opcoes?.length ?? 0) <= 2 && !c.outro;
  return false;
}

export function DetalhePesquisa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pesquisa = PESQUISAS_DEMO.find((p) => p.id === id);
  const [respostas, setRespostas] = useState<Record<number, Valor>>({});
  const [busca, setBusca] = useState("");
  const [passo, setPasso] = useState(0);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  const total = pesquisa ? totalPerguntas(pesquisa) : 0;
  const nSecoes = pesquisa?.secoes.length ?? 0;
  const mostrarBusca = total > 10;
  const buscando = busca.trim().length > 0;

  const resultados = useMemo(() => {
    if (!pesquisa) return [];
    const q = norm(busca.trim());
    if (!q) return [];
    return pesquisa.secoes
      .map((sec) => ({ ...sec, campos: sec.campos.filter((c) => norm(c.enunciado).includes(q)) }))
      .filter((sec) => sec.campos.length > 0);
  }, [pesquisa, busca]);

  function set(n: number, valor: Valor) {
    setRespostas((r) => ({ ...r, [n]: valor }));
  }
  function toggleMultipla(c: Campo, opcao: string) {
    const atual = (respostas[c.n] as string[] | undefined) ?? [];
    const existe = atual.includes(opcao);
    if (!existe && c.limite && atual.length >= c.limite) return;
    set(c.n, existe ? atual.filter((o) => o !== opcao) : [...atual, opcao]);
  }
  function respondido(c: Campo): boolean {
    const v = respostas[c.n];
    if (c.tipo === "multipla") return Array.isArray(v) && v.length > 0;
    if (c.tipo === "grade") return !!v && Object.keys(v).length === (c.grade?.linhas.length ?? 0);
    return v !== undefined && v !== "";
  }
  function faltando(sec: Secao): Campo | null {
    return sec.campos.find((c) => c.obrigatoria && !respondido(c)) ?? null;
  }

  function proximo() {
    if (!pesquisa) return;
    const falta = faltando(pesquisa.secoes[passo]);
    if (falta) return setErro(`Responda a pergunta obrigatória ${falta.n}: “${falta.enunciado}”.`);
    setErro("");
    setPasso((p) => Math.min(p + 1, nSecoes - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function anterior() {
    setErro("");
    setPasso((p) => Math.max(p - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!pesquisa) return;
    for (let i = 0; i < pesquisa.secoes.length; i++) {
      const falta = faltando(pesquisa.secoes[i]);
      if (falta) {
        setBusca("");
        setPasso(i);
        return setErro(`Responda a pergunta obrigatória ${falta.n}: “${falta.enunciado}”.`);
      }
    }
    setEnviado(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!pesquisa) {
    return (
      <Wrap>
        <PageHeader>
          <PageTitle>Pesquisa não encontrada</PageTitle>
          <Button $variant="ghost" onClick={() => navigate("/pesquisas")}>
            <ArrowLeft size={16} /> Voltar
          </Button>
        </PageHeader>
      </Wrap>
    );
  }

  if (enviado) {
    return (
      <Wrap>
        <Sucesso>
          <CheckBadge>
            <CheckCircle2 size={34} />
          </CheckBadge>
          <PageTitle style={{ marginBottom: 8 }}>Resposta registrada!</PageTitle>
          <Muted style={{ marginBottom: 20 }}>
            Obrigada por responder a “{pesquisa.titulo}”. Em modo demonstração a resposta não é
            persistida — conecte o backend para salvar de verdade.
          </Muted>
          <Acoes style={{ justifyContent: "center" }}>
            <Button $variant="ghost" onClick={() => navigate("/pesquisas")}>Voltar às pesquisas</Button>
            <Button onClick={() => { setRespostas({}); setEnviado(false); setPasso(0); }}>
              <Send size={16} /> Nova resposta
            </Button>
          </Acoes>
        </Sucesso>
      </Wrap>
    );
  }

  const secoesVisiveis = buscando ? resultados : [pesquisa.secoes[passo]];
  const ultima = passo === nSecoes - 1;

  return (
    <Wrap>
      <form onSubmit={onSubmit}>
        <PageHeader>
          <div>
            <PageTitle>{pesquisa.titulo}</PageTitle>
            <PageSubtitle>
              {pesquisa.descricao} · {total} perguntas · {nSecoes} seções
            </PageSubtitle>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <Tag $tone="green">{pesquisa.status}</Tag>
              <Tag $tone="blue">{pesquisa.tipo}</Tag>
            </div>
          </div>
          <Button type="button" $variant="ghost" onClick={() => navigate("/pesquisas")}>
            <ArrowLeft size={16} /> Voltar
          </Button>
        </PageHeader>

        {mostrarBusca && (
          <Busca>
            <Search size={17} />
            <TextInput
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Pesquisar entre as ${total} perguntas…`}
              aria-label="pesquisar perguntas"
            />
          </Busca>
        )}

        {!buscando && (
          <>
            <PassoInfo>
              <span>Seção {passo + 1} de {nSecoes}</span>
              <span>{pesquisa.secoes[passo].titulo}</span>
            </PassoInfo>
            <Progresso>
              <ProgressoFill $pct={((passo + 1) / nSecoes) * 100} />
            </Progresso>
          </>
        )}

        {buscando && (
          <Muted style={{ marginBottom: 12 }}>
            {resultados.reduce((s, sec) => s + sec.campos.length, 0)} resultado(s) para “{busca}”. Limpe a
            busca para navegar por seções.
          </Muted>
        )}

        {secoesVisiveis.length === 0 ? (
          <Card>
            <Muted style={{ textAlign: "center" }}>Nenhuma pergunta encontrada para “{busca}”.</Muted>
          </Card>
        ) : (
          secoesVisiveis.map((sec) => (
            <Card key={sec.titulo} style={{ marginBottom: 16 }}>
              <SecaoHeader>
                <SecIcon>
                  <ListChecks size={19} />
                </SecIcon>
                <SecaoTitulo>{sec.titulo}</SecaoTitulo>
              </SecaoHeader>
              <SecaoBarra />
              <Grade>
                {sec.campos.map((c) => (
                  <Bloco key={c.n} $full={!ehPequeno(c)}>
                    <EnunciadoLinha>
                      <NumBadge>{c.n}</NumBadge>
                      <Enunciado>
                        {c.enunciado}
                        {c.obrigatoria && <Obrig>*</Obrig>}
                      </Enunciado>
                    </EnunciadoLinha>
                    {c.ajuda && <Ajuda>{c.ajuda}</Ajuda>}
                    <CampoBox>{renderCampo(c)}</CampoBox>
                  </Bloco>
                ))}
              </Grade>
            </Card>
          ))
        )}

        {erro && <Banner $tone="warn" role="alert" style={{ marginBottom: 16 }}>{erro}</Banner>}

        {buscando ? (
          <Acoes style={{ justifyContent: "flex-end" }}>
            <Button type="submit"><Send size={16} /> Enviar resposta</Button>
          </Acoes>
        ) : (
          <Acoes>
            <Button type="button" $variant="ghost" onClick={anterior} disabled={passo === 0}>
              <ArrowLeft size={16} /> Anterior
            </Button>
            {ultima ? (
              <Button type="submit"><Send size={16} /> Enviar resposta</Button>
            ) : (
              <Button type="button" onClick={proximo}>Próximo <ArrowRight size={16} /></Button>
            )}
          </Acoes>
        )}

        <Muted style={{ textAlign: "center", marginTop: 12, fontSize: 12 }}>
          Campos marcados com <Obrig>*</Obrig> são obrigatórios.
        </Muted>
      </form>
    </Wrap>
  );

  function renderCampo(c: Campo) {
    const v = respostas[c.n];
    switch (c.tipo) {
      case "texto":
        return <TextInput value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} placeholder="Sua resposta" style={{ width: "100%" }} />;
      case "paragrafo":
        return <Textarea value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} placeholder="Sua resposta" style={{ width: "100%" }} />;
      case "numero":
        return <TextInput type="number" value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} style={{ width: "100%" }} />;
      case "data":
        return <TextInput type="date" value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} style={{ width: "100%" }} />;
      case "selecao":
        return (
          <Select value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} style={{ width: "100%" }}>
            <option value="">Selecione…</option>
            {c.opcoes?.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </Select>
        );
      case "unica": {
        const opcoes = [...(c.opcoes ?? []), ...(c.outro ? ["Outro…"] : [])];
        if (opcoes.length > 3) {
          return (
            <Select value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} style={{ maxWidth: 340 }}>
              <option value="">Selecione…</option>
              {opcoes.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          );
        }
        return (
          <Pills>
            {opcoes.map((o) => (
              <Pill key={o} type="button" $ativa={v === o} onClick={() => set(c.n, o)}>
                {o}
              </Pill>
            ))}
          </Pills>
        );
      }
      case "multipla": {
        const sel = (v as string[] | undefined) ?? [];
        const opcoes = [...(c.opcoes ?? []), ...(c.outro ? ["Outro…"] : [])];
        return (
          <div>
            {c.limite && <Ajuda style={{ margin: "0 0 6px" }}>Marcar até {c.limite}</Ajuda>}
            {opcoes.map((o) => (
              <Opcao key={o}>
                <input type="checkbox" checked={sel.includes(o)} onChange={() => toggleMultipla(c, o)} />
                {o}
              </Opcao>
            ))}
          </div>
        );
      }
      case "escala": {
        const { min = 0, max = 5 } = c.escala ?? {};
        const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        return (
          <Escala>
            {nums.map((n) => (
              <Bolha key={n} type="button" $ativa={v === String(n)} onClick={() => set(c.n, String(n))}>
                {n}
              </Bolha>
            ))}
          </Escala>
        );
      }
      case "grade": {
        const g = c.grade!;
        const atual = (v as Record<string, string> | undefined) ?? {};
        return (
          <TableWrap>
            <Tabela>
              <thead>
                <tr>
                  <Th></Th>
                  {g.colunas.map((col) => (
                    <Th key={col} style={{ textAlign: "center" }}>{col}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.linhas.map((lin) => (
                  <tr key={lin}>
                    <Td style={{ fontWeight: 600 }}>{lin}</Td>
                    {g.colunas.map((col) => (
                      <Td key={col} style={{ textAlign: "center" }}>
                        <input
                          type="radio"
                          name={`q${c.n}-${lin}`}
                          checked={atual[lin] === col}
                          onChange={() => set(c.n, { ...atual, [lin]: col })}
                        />
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Tabela>
          </TableWrap>
        );
      }
      default:
        return null;
    }
  }
}
