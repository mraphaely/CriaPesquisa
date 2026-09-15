/**
 * Encerramento gracioso.
 *
 * Em container, um deploy manda SIGTERM. Sem tratar o sinal, o processo morre na
 * hora e derruba as requisições em andamento — uma resposta de campo sendo
 * gravada vira erro para a pessoa que estava preenchendo.
 *
 * A ordem importa: parar de aceitar conexão nova, deixar terminar o que está em
 * voo, só então fechar o banco.
 *
 * A lógica mora aqui, separada do `server.ts`, porque assim ela é testável — o
 * Windows não entrega SIGTERM capturável, então exercitar isso pelo sinal de
 * verdade só seria possível em Linux.
 */

export interface ServidorEncerravel {
  close(cb: (erro?: Error) => void): unknown;
}

export interface OpcoesEncerramento {
  servidor: ServidorEncerravel;
  desconectar: () => Promise<unknown>;
  sair: (codigo: number) => void;
  prazoMs: number;
  registrar?: (mensagem: string) => void;
}

export function criarEncerrador({
  servidor,
  desconectar,
  sair,
  prazoMs,
  registrar = console.log,
}: OpcoesEncerramento) {
  let encerrando = false;

  return function encerrar(sinal: string): void {
    // Dois SIGTERM seguidos (ou SIGTERM logo após Ctrl+C) não podem reiniciar o
    // processo de encerramento no meio.
    if (encerrando) return;
    encerrando = true;

    registrar(`[${sinal}] encerrando: aguardando requisições em andamento…`);

    // Rede de segurança: se uma conexão travar, não ficamos pendurados para
    // sempre — o orquestrador mataria o processo de qualquer forma, e é melhor
    // sair sinalizando falha do que ser morto sem registro.
    const prazo = setTimeout(() => {
      registrar("[encerramento] prazo esgotado, saindo à força");
      sair(1);
    }, prazoMs);
    // Não segura o event loop só por causa deste timer.
    if (typeof prazo === "object" && "unref" in prazo) prazo.unref();

    servidor.close(async (erro) => {
      clearTimeout(prazo);
      if (erro) {
        registrar(`[encerramento] falha ao fechar o servidor: ${erro.message}`);
        return sair(1);
      }
      await desconectar();
      registrar("[encerramento] concluído");
      sair(0);
    });
  };
}
