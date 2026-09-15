import { describe, it, expect } from "vitest";
import { parsearConexao, selecionarExpirados, nomeDoBackup } from "../src/helper/backup.js";

describe("parsearConexao", () => {
  it("separa host, porta, usuário, senha e banco da DATABASE_URL", () => {
    const c = parsearConexao("postgresql://cria_user:cria_senha@localhost:5433/criapesquisa?schema=public");

    expect(c).toEqual({
      host: "localhost",
      porta: "5433",
      usuario: "cria_user",
      senha: "cria_senha",
      banco: "criapesquisa",
    });
  });

  it("assume a porta padrão do Postgres quando ela não vem na URL", () => {
    expect(parsearConexao("postgresql://u:p@db.interno:/criapesquisa").porta).toBe("5432");
  });

  it("decodifica caracteres escapados na senha", () => {
    // Senha institucional com @ ou / precisa vir percent-encoded na URL.
    expect(parsearConexao("postgresql://u:s%40nha%2Fforte@h:5432/d").senha).toBe("s@nha/forte");
  });

  it("recusa uma URL que não seja de Postgres", () => {
    expect(() => parsearConexao("mysql://u:p@h:3306/d")).toThrow(/postgres/i);
  });
});

describe("selecionarExpirados", () => {
  const arquivos = [
    "criapesquisa-2026-09-01T03-00-00.dump",
    "criapesquisa-2026-09-02T03-00-00.dump",
    "criapesquisa-2026-09-03T03-00-00.dump",
    "criapesquisa-2026-09-04T03-00-00.dump",
  ];

  it("mantém os mais recentes e devolve os antigos para remoção", () => {
    expect(selecionarExpirados(arquivos, 2)).toEqual([
      "criapesquisa-2026-09-01T03-00-00.dump",
      "criapesquisa-2026-09-02T03-00-00.dump",
    ]);
  });

  it("não remove nada quando há menos backups que a retenção", () => {
    expect(selecionarExpirados(arquivos, 10)).toEqual([]);
  });

  it("ignora arquivos que não são backup nosso", () => {
    const comIntrusos = [...arquivos, "README.md", "planilha-da-equipe.xlsx"];

    const expirados = selecionarExpirados(comIntrusos, 2);

    expect(expirados).not.toContain("README.md");
    expect(expirados).not.toContain("planilha-da-equipe.xlsx");
  });

  it("nunca apaga tudo, mesmo com retenção zero ou negativa", () => {
    expect(selecionarExpirados(arquivos, 0)).toEqual(arquivos.slice(0, 3));
    expect(selecionarExpirados(arquivos, -5)).toEqual(arquivos.slice(0, 3));
  });
});

describe("nomeDoBackup", () => {
  it("gera nome ordenável por data, sem caractere inválido em sistema de arquivos", () => {
    const nome = nomeDoBackup(new Date("2026-09-12T05:30:00Z"));

    expect(nome).toBe("criapesquisa-2026-09-12T05-30-00.dump");
    expect(nome).not.toContain(":");
  });
});
