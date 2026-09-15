import { describe, it, expect } from "vitest";
import { parsePaginacao, PAGE_SIZE_MAX } from "../src/helper/paginacao.js";

describe("parsePaginacao", () => {
  it("limita pageSize ao teto (evita despejar a tabela inteira numa requisição)", () => {
    expect(parsePaginacao({ pageSize: "999999" }, 50).pageSize).toBe(PAGE_SIZE_MAX);
  });

  it("usa o padrão quando pageSize não vem na query", () => {
    expect(parsePaginacao({}, 50).pageSize).toBe(50);
  });

  it("usa o padrão quando pageSize é zero ou negativo", () => {
    expect(parsePaginacao({ pageSize: "0" }, 50).pageSize).toBe(50);
    expect(parsePaginacao({ pageSize: "-10" }, 50).pageSize).toBe(50);
  });

  it("usa o padrão quando pageSize não é um número", () => {
    expect(parsePaginacao({ pageSize: "abc" }, 20).pageSize).toBe(20);
  });

  it("volta para a página 1 quando page é inválida ou menor que 1", () => {
    expect(parsePaginacao({ page: "0" }, 20).page).toBe(1);
    expect(parsePaginacao({ page: "-3" }, 20).page).toBe(1);
    expect(parsePaginacao({ page: "abc" }, 20).page).toBe(1);
    expect(parsePaginacao({}, 20).page).toBe(1);
  });

  it("trunca valores fracionários para inteiros", () => {
    const { page, pageSize } = parsePaginacao({ page: "2.9", pageSize: "10.7" }, 20);
    expect(page).toBe(2);
    expect(pageSize).toBe(10);
  });

  it("mantém valores válidos dentro do teto", () => {
    expect(parsePaginacao({ page: "3", pageSize: "25" }, 50)).toEqual({ page: 3, pageSize: 25 });
  });
});
