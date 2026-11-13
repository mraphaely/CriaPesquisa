import ExcelJS from "exceljs";

/**
 * Cabeçalho exato da "Exportação Indicadores.xlsx". Se mudar, a importação para
 * antes de gravar qualquer coisa: coluna renomeada é sinal de que o significado
 * pode ter mudado também.
 */
export const COLUNAS = [
  "ID", "Setor", "Projeto", "Nome do Indicador", "Formula Descritiva", "Fórmula de Cálculo",
  "Tipo de Indicador", "Objetivo do Indicador / O que mede", "Meta", "Nº Pergunta", "Pergunta (Descrição)",
  "Observações", "Táticos relacionados", "Operacionais relacionados", "Apresentação", "DtRegistro", "Usuario",
] as const;

export const PROJETOS = ["Cartão CRIA (Criança)", "Cartão CRIA (Gestante)"] as const;
export type ProjetoPlanilha = (typeof PROJETOS)[number];

export type LinhaPlanilha = {
  id: string; // "" quando a célula está vazia: o importador pula e lista a linha
  numeroLinha: number; // linha na planilha (o cabeçalho é a 1)
  projeto: ProjetoPlanilha;
  nome: string;
  formulaDescritiva: string;
  formulaCalculo: string;
  categoria: string;
  objetivo: string;
  perguntaDescricao: string;
  observacoes: string;
  apresentacao: Array<"Escopo" | "Perfil">;
};

// Posição (1-based) de cada coluna lida. A última lida é "Apresentação" (15):
// DtRegistro (16) e Usuario (17) são dados pessoais e nunca são lidos.
const COL = {
  id: 1,
  projeto: 3,
  nome: 4,
  formulaDescritiva: 5,
  formulaCalculo: 6,
  categoria: 7,
  objetivo: 8,
  perguntaDescricao: 11,
  observacoes: 12,
  apresentacao: 15,
} as const;
const ULTIMA_COLUNA_LIDA = COLUNAS.indexOf("Apresentação") + 1;

function texto(row: ExcelJS.Row, coluna: number): string {
  if (coluna > ULTIMA_COLUNA_LIDA) throw new Error(`coluna ${coluna} não pode ser lida`);
  const cell = row.getCell(coluna);
  if (cell.value === null || cell.value === undefined) return "";
  return String(cell.text ?? "").trim();
}

function ehProjetoCartaoCria(valor: string): valor is ProjetoPlanilha {
  return (PROJETOS as readonly string[]).includes(valor);
}

/**
 * Problema no arquivo ou nos dados de que a importação depende — quem chama pela
 * tela recebe a mensagem como está (422), diferente de falha interna (500).
 */
export class ErroImportacao extends Error {}

/**
 * Limites do arquivo enviado pela tela. A planilha real tem ~300 linhas e
 * descompacta para menos de 1 MB; os limites ficam muito acima disso e só
 * barram arquivo malicioso ou errado.
 */
const MAX_DESCOMPACTADO = 50 * 1024 * 1024;
const MAX_ENTRADAS_ZIP = 2_000;
const MAX_LINHAS = 20_000;

/**
 * Um .xlsx é um zip: antes de entregar ao ExcelJS (que descompacta tudo em
 * memória), soma os tamanhos descompactados declarados no diretório central e
 * recusa "bomba de compressão" — arquivo pequeno que se expande para gigabytes.
 * Zip64 (tamanho 0xFFFFFFFF) não faz sentido para essa planilha e é recusado.
 */
function conferirZip(buf: Buffer): void {
  const FIM_DIRETORIO = 0x06054b50;
  const ENTRADA = 0x02014b50;
  let fim = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === FIM_DIRETORIO) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new ErroImportacao("o arquivo enviado não é uma planilha .xlsx válida");

  const entradas = buf.readUInt16LE(fim + 10);
  if (entradas > MAX_ENTRADAS_ZIP) throw new ErroImportacao("o arquivo enviado é grande demais para uma planilha de indicadores");
  let pos = buf.readUInt32LE(fim + 16);
  let total = 0;
  for (let n = 0; n < entradas; n++) {
    if (pos + 46 > buf.length || buf.readUInt32LE(pos) !== ENTRADA) {
      throw new ErroImportacao("o arquivo enviado não é uma planilha .xlsx válida");
    }
    const tamanho = buf.readUInt32LE(pos + 24);
    total += tamanho;
    if (tamanho === 0xffffffff || total > MAX_DESCOMPACTADO) {
      throw new ErroImportacao("o arquivo enviado é grande demais para uma planilha de indicadores");
    }
    pos += 46 + buf.readUInt16LE(pos + 28) + buf.readUInt16LE(pos + 30) + buf.readUInt16LE(pos + 32);
  }
}

/**
 * Lê a primeira aba, do disco (script) ou dos bytes enviados (tela).
 * Lança `ErroImportacao` se o arquivo não for .xlsx, passar dos limites ou o
 * cabeçalho não for exatamente `COLUNAS`.
 */
export async function lerPlanilha(fonte: string | Buffer): Promise<LinhaPlanilha[]> {
  const workbook = new ExcelJS.Workbook();
  if (typeof fonte === "string") {
    await workbook.xlsx.readFile(fonte);
  } else {
    conferirZip(fonte);
    try {
      await workbook.xlsx.load(fonte as unknown as ArrayBuffer);
    } catch {
      throw new ErroImportacao("o arquivo enviado não é uma planilha .xlsx válida");
    }
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ErroImportacao("cabeçalho da planilha mudou: planilha sem abas");
  if (sheet.rowCount > MAX_LINHAS) {
    throw new ErroImportacao(`a planilha tem linhas demais (${sheet.rowCount}; o limite é ${MAX_LINHAS})`);
  }

  // Só o cabeçalho das 17 colunas é conferido (o nome da coluna, não o conteúdo).
  const cabecalho = sheet.getRow(1);
  const lido = COLUNAS.map((_, i) => String(cabecalho.getCell(i + 1).text ?? "").trim());
  const diferentes = COLUNAS.flatMap((esperado, i) =>
    lido[i] === esperado ? [] : [`coluna ${i + 1}: esperado "${esperado}", veio "${lido[i]}"`],
  );
  const extra = String(cabecalho.getCell(COLUNAS.length + 1).text ?? "").trim();
  if (extra) diferentes.push(`coluna ${COLUNAS.length + 1} a mais: "${extra}"`);
  if (diferentes.length > 0) throw new ErroImportacao(`cabeçalho da planilha mudou: ${diferentes.join("; ")}`);

  const linhas: LinhaPlanilha[] = [];
  for (let n = 2; n <= sheet.rowCount; n++) {
    const row = sheet.getRow(n);
    const projeto = texto(row, COL.projeto);
    if (!ehProjetoCartaoCria(projeto)) continue;
    linhas.push({
      id: texto(row, COL.id),
      numeroLinha: n,
      projeto,
      nome: texto(row, COL.nome),
      formulaDescritiva: texto(row, COL.formulaDescritiva),
      formulaCalculo: texto(row, COL.formulaCalculo),
      categoria: texto(row, COL.categoria),
      objetivo: texto(row, COL.objetivo),
      perguntaDescricao: texto(row, COL.perguntaDescricao),
      observacoes: texto(row, COL.observacoes),
      apresentacao: texto(row, COL.apresentacao)
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is "Escopo" | "Perfil" => s === "Escopo" || s === "Perfil"),
    });
  }
  return linhas;
}
