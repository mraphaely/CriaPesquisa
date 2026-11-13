import { describe, it, expect, afterAll } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile, rm } from "node:fs/promises";
import { deflateRawSync } from "node:zlib";
import ExcelJS from "exceljs";
import { COLUNAS, ErroImportacao, lerPlanilha } from "../src/helper/importacao/planilha.js";

/** Planilha gerada aqui, sem dado pessoal real; DtRegistro/Usuario têm valores fictícios. */
const arquivos: string[] = [];

async function gerarXlsx(cabecalho: readonly string[], linhas: Array<Record<string, string | number>>) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Indicadores");
  sheet.addRow([...cabecalho]);
  for (const l of linhas) sheet.addRow(COLUNAS.map((c) => l[c] ?? ""));
  const caminho = join(tmpdir(), `importacao-planilha-${Date.now()}-${Math.random().toString(36).slice(2)}.xlsx`);
  await workbook.xlsx.writeFile(caminho);
  arquivos.push(caminho);
  return caminho;
}

const PESSOAL = { DtRegistro: "2026-04-25", Usuario: "alguem@exemplo.com" };

afterAll(async () => {
  for (const a of arquivos) await rm(a, { force: true });
});

describe("lerPlanilha", () => {
  it("lê só as linhas do Cartão CRIA, divide a apresentação e não lê DtRegistro/Usuario", async () => {
    const caminho = await gerarXlsx(COLUNAS, [
      { ID: 165, Projeto: "Cartão CRIA (Criança)", "Nome do Indicador": "VCRAS", Apresentação: "Escopo", ...PESSOAL },
      { ID: "210", Projeto: "Cartão CRIA (Gestante)", "Nome do Indicador": "VCRAS G", ...PESSOAL },
      { ID: "999", Projeto: "Outro Projeto", "Nome do Indicador": "Fora", Apresentação: "Escopo", ...PESSOAL },
      {
        ID: " 150 ",
        Projeto: "Cartão CRIA (Criança)",
        "Nome do Indicador": "Zona",
        "Pergunta (Descrição)": "4. Zona",
        "Fórmula de Cálculo": "(Zona urbana / Total) × 100",
        Apresentação: "Escopo, Perfil",
        ...PESSOAL,
      },
    ]);

    const linhas = await lerPlanilha(caminho);

    expect(linhas.map((l) => l.id)).toEqual(["165", "210", "150"]);
    expect(linhas.map((l) => l.projeto)).toEqual(["Cartão CRIA (Criança)", "Cartão CRIA (Gestante)", "Cartão CRIA (Criança)"]);
    expect(linhas[0].apresentacao).toEqual(["Escopo"]);
    expect(linhas[1].apresentacao).toEqual([]);
    expect(linhas[2].apresentacao).toEqual(["Escopo", "Perfil"]);
    expect(linhas[2].perguntaDescricao).toBe("4. Zona");
    expect(linhas[2].formulaCalculo).toBe("(Zona urbana / Total) × 100");
    const tudo = JSON.stringify(linhas);
    expect(tudo).not.toContain("alguem@exemplo.com");
    expect(tudo).not.toContain("2026-04-25");
  });

  it("recusa planilha com coluna renomeada", async () => {
    const renomeado = COLUNAS.map((c) => (c === "Pergunta (Descrição)" ? "Pergunta" : c));
    const caminho = await gerarXlsx(renomeado, [{ ID: "165", Projeto: "Cartão CRIA (Criança)" }]);
    await expect(lerPlanilha(caminho)).rejects.toThrow("cabeçalho da planilha mudou");
  });

  it("recusa planilha com coluna faltando", async () => {
    const semColuna = COLUNAS.filter((c) => c !== "Observações");
    const caminho = await gerarXlsx(semColuna, [{ ID: "165", Projeto: "Cartão CRIA (Criança)" }]);
    await expect(lerPlanilha(caminho)).rejects.toThrow("cabeçalho da planilha mudou");
  });

  it("lê a planilha enviada como bytes (upload pela tela), igual à lida do disco", async () => {
    const caminho = await gerarXlsx(COLUNAS, [{ ID: "165", Projeto: "Cartão CRIA (Criança)", "Nome do Indicador": "VCRAS" }]);
    const doDisco = await lerPlanilha(caminho);
    const dosBytes = await lerPlanilha(await readFile(caminho));
    expect(dosBytes).toEqual(doDisco);
    expect(dosBytes).toHaveLength(1);
  });

  it("arquivo que não é .xlsx -> ErroImportacao com recado claro", async () => {
    const erro = await lerPlanilha(Buffer.from("isto não é uma planilha")).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroImportacao);
    expect(erro.message).toMatch(/não é uma planilha .xlsx/);
  });

  it("cabeçalho diferente também é ErroImportacao", async () => {
    const semColuna = COLUNAS.filter((c) => c !== "Observações");
    const caminho = await gerarXlsx(semColuna, []);
    await expect(lerPlanilha(caminho)).rejects.toBeInstanceOf(ErroImportacao);
  });
});

describe("lerPlanilha: proteção contra arquivo malicioso", () => {
  /**
   * Zip de uma entrada só, montado à mão: `conteudo` comprimido com deflate, mas
   * declarando `declarado` bytes descompactados — o arquivo "mente" o tamanho.
   */
  function zipMentiroso(conteudo: Buffer, declarado: number): Buffer {
    const dados = deflateRawSync(conteudo);
    const nome = Buffer.from("xl/worksheets/sheet1.xml");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(dados.length, 18);
    local.writeUInt32LE(declarado, 22);
    local.writeUInt16LE(nome.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(dados.length, 20);
    central.writeUInt32LE(declarado, 24);
    central.writeUInt16LE(nome.length, 28);
    central.writeUInt32LE(0, 42); // offset do cabeçalho local
    const inicioCentral = local.length + nome.length + dados.length;
    const fim = Buffer.alloc(22);
    fim.writeUInt32LE(0x06054b50, 0);
    fim.writeUInt16LE(1, 8);
    fim.writeUInt16LE(1, 10);
    fim.writeUInt32LE(central.length + nome.length, 12);
    fim.writeUInt32LE(inicioCentral, 16);
    return Buffer.concat([local, nome, dados, central, nome, fim]);
  }

  it("recusa bomba de compressão que declara tamanho pequeno (o tamanho real é contado)", async () => {
    // 60 MB de zeros viram poucos KB comprimidos; o arquivo declara só 100 bytes.
    const bomba = zipMentiroso(Buffer.alloc(60 * 1024 * 1024), 100);
    expect(bomba.length).toBeLessThan(200 * 1024);

    const erro = await lerPlanilha(bomba).catch((e) => e);

    expect(erro).toBeInstanceOf(ErroImportacao);
    expect(erro.message).toMatch(/grande demais/);
  });

  it("recusa zip cujo diretório não bate com a contagem declarada", async () => {
    const zip = zipMentiroso(Buffer.from("<x/>"), 4);
    zip.writeUInt16LE(5, zip.length - 22 + 10); // declara 5 entradas, só existe 1

    const erro = await lerPlanilha(zip).catch((e) => e);

    expect(erro).toBeInstanceOf(ErroImportacao);
    expect(erro.message).toMatch(/não é uma planilha .xlsx válida/);
  });

  it("recusa planilha com linhas demais", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Indicadores");
    sheet.addRow([...COLUNAS]);
    sheet.getRow(20_002).getCell(1).value = "x";
    const erro = await lerPlanilha(Buffer.from(await workbook.xlsx.writeBuffer())).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroImportacao);
    expect(erro.message).toMatch(/linhas demais/);
  });
});
