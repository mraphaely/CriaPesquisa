import { describe, it, expect, vi } from "vitest";
import { criarEncerrador } from "../src/helper/encerramento.js";

/** Servidor falso: guarda o callback do close para dispararmos quando quisermos. */
function servidorFalso() {
  let concluir: ((erro?: Error) => void) | undefined;
  return {
    close: vi.fn((cb: (erro?: Error) => void) => {
      concluir = cb;
    }),
    concluirFechamento: (erro?: Error) => concluir?.(erro),
  };
}

function montar(prazoMs = 10_000) {
  const servidor = servidorFalso();
  const desconectar = vi.fn().mockResolvedValue(undefined);
  const sair = vi.fn();
  const encerrar = criarEncerrador({ servidor, desconectar, sair, prazoMs });
  return { servidor, desconectar, sair, encerrar };
}

describe("encerramento gracioso", () => {
  it("para de aceitar conexões antes de fechar o banco", async () => {
    const { servidor, desconectar, encerrar } = montar();

    encerrar("SIGTERM");

    expect(servidor.close).toHaveBeenCalledOnce();
    // Enquanto as requisições em andamento não terminam, o banco continua de pé.
    expect(desconectar).not.toHaveBeenCalled();
  });

  it("fecha o banco e sai com 0 depois que as requisições terminam", async () => {
    const { servidor, desconectar, sair, encerrar } = montar();

    encerrar("SIGTERM");
    servidor.concluirFechamento();
    await vi.waitFor(() => expect(sair).toHaveBeenCalledWith(0));

    expect(desconectar).toHaveBeenCalledOnce();
  });

  it("sai com 1 quando o servidor falha ao fechar", async () => {
    const { servidor, sair, encerrar } = montar();

    encerrar("SIGTERM");
    servidor.concluirFechamento(new Error("porta travada"));

    await vi.waitFor(() => expect(sair).toHaveBeenCalledWith(1));
  });

  it("ignora sinais repetidos, sem reiniciar o encerramento", () => {
    const { servidor, encerrar } = montar();

    encerrar("SIGTERM");
    encerrar("SIGTERM");
    encerrar("SIGINT");

    expect(servidor.close).toHaveBeenCalledOnce();
  });

  it("não fica pendurado para sempre: estourado o prazo, sai com 1", async () => {
    vi.useFakeTimers();
    const { sair, encerrar } = montar(5_000);

    encerrar("SIGTERM"); // nunca concluímos o fechamento de propósito
    await vi.advanceTimersByTimeAsync(5_000);

    expect(sair).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });
});
