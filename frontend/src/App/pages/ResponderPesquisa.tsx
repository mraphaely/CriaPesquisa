import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { PESQUISAS_DEMO, type Campo } from "../data/pesquisaCrianca.js";
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
  max-width: 840px;
  margin: 0 auto;
`;

const SecaoTitulo = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => p.theme.cores.primaryDark};
  margin: 0 0 4px;
`;

const SecaoBarra = styled.div`
  height: 4px;
  width: 46px;
  border-radius: 3px;
  background: ${(p) => p.theme.cores.accent};
  margin-bottom: 16px;
`;

const Bloco = styled.div`
  padding: 16px 0;
  border-top: 1px solid ${(p) => p.theme.cores.border};
  &:first-of-type { border-top: none; padding-top: 4px; }
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

const Acoes = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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

export function ResponderPesquisa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pesquisa = PESQUISAS_DEMO.find((p) => p.id === id);
  const [respostas, setRespostas] = useState<Record<number, Valor>>({});
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  function set(n: number, valor: Valor) {
    setRespostas((r) => ({ ...r, [n]: valor }));
  }

  function toggleMultipla(c: Campo, opcao: string) {
    const atual = (respostas[c.n] as string[] | undefined) ?? [];
    const existe = atual.includes(opcao);
    if (!existe && c.limite && atual.length >= c.limite) return; // respeita "marcar até N"
    set(c.n, existe ? atual.filter((o) => o !== opcao) : [...atual, opcao]);
  }

  function respondido(c: Campo): boolean {
    const v = respostas[c.n];
    if (c.tipo === "multipla") return Array.isArray(v) && v.length > 0;
    if (c.tipo === "grade") return !!v && Object.keys(v).length === (c.grade?.linhas.length ?? 0);
    return v !== undefined && v !== "";
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!pesquisa) return;
    for (const sec of pesquisa.secoes) {
      for (const c of sec.campos) {
        if (c.obrigatoria && !respondido(c)) {
          return setErro(`Responda a pergunta obrigatória ${c.n}: “${c.enunciado}”.`);
        }
      }
    }
    // Demo: sem backend, apenas confirmamos. Com backend, aqui vai o POST /respostas.
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
            <Button
              onClick={() => {
                setRespostas({});
                setEnviado(false);
              }}
            >
              <Send size={16} /> Nova resposta
            </Button>
          </Acoes>
        </Sucesso>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <form onSubmit={onSubmit}>
        <PageHeader>
          <div>
            <PageTitle>Responder</PageTitle>
            <PageSubtitle>{pesquisa.titulo}</PageSubtitle>
            <div style={{ marginTop: 8 }}>
              <Tag $tone="blue">{pesquisa.tipo}</Tag>
            </div>
          </div>
          <Button type="button" $variant="ghost" onClick={() => navigate(`/pesquisas/${pesquisa.id}`)}>
            <ArrowLeft size={16} /> Voltar
          </Button>
        </PageHeader>

        {pesquisa.secoes.map((sec) => (
          <Card key={sec.titulo} style={{ marginBottom: 16 }}>
            <SecaoTitulo>{sec.titulo}</SecaoTitulo>
            <SecaoBarra />
            {sec.campos.map((c) => (
              <Bloco key={c.n}>
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
          </Card>
        ))}

        {erro && <Banner $tone="warn" role="alert" style={{ marginBottom: 16 }}>{erro}</Banner>}

        <Acoes>
          <Button type="button" $variant="ghost" onClick={() => navigate(`/pesquisas/${pesquisa.id}`)}>
            Cancelar
          </Button>
          <Button type="submit">
            <Send size={16} /> Enviar resposta
          </Button>
        </Acoes>
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
        return <TextInput value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} placeholder="Sua resposta" />;
      case "paragrafo":
        return <Textarea value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} placeholder="Sua resposta" />;
      case "numero":
        return <TextInput type="number" value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} style={{ maxWidth: 220 }} />;
      case "data":
        return <TextInput type="date" value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} style={{ maxWidth: 220 }} />;
      case "selecao":
        return (
          <Select value={(v as string) ?? ""} onChange={(e) => set(c.n, e.target.value)} style={{ maxWidth: 340 }}>
            <option value="">Selecione…</option>
            {c.opcoes?.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </Select>
        );
      case "unica": {
        const opcoes = [...(c.opcoes ?? []), ...(c.outro ? ["Outro…"] : [])];
        return (
          <div>
            {opcoes.map((o) => (
              <Opcao key={o}>
                <input type="radio" name={`q${c.n}`} checked={v === o} onChange={() => set(c.n, o)} />
                {o}
              </Opcao>
            ))}
          </div>
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
