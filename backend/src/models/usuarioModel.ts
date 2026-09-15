import { prisma } from "../config/prisma.js";
import type { PapelUsuario } from "@prisma/client";

const publico = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  ativo: true,
  precisaTrocarSenha: true,
} as const;

export interface CriarUsuarioDados {
  nome: string;
  email: string;
  papel: PapelUsuario;
  senhaHash: string;
  precisaTrocarSenha?: boolean;
}

export interface AtualizarUsuarioDados {
  nome?: string;
  email?: string;
  papel?: PapelUsuario;
  ativo?: boolean;
  senhaHash?: string;
}

export const usuarioModel = {
  buscarPorEmail: (email: string) => prisma.usuario.findUnique({ where: { email } }),
  /** Registro completo, com o hash — para conferir a senha atual numa troca. */
  buscarPorId: (id: string) => prisma.usuario.findUnique({ where: { id } }),
  buscarPublicoPorId: (id: string) => prisma.usuario.findUnique({ where: { id }, select: publico }),

  listar: () => prisma.usuario.findMany({ select: publico, orderBy: { nome: "asc" } }),

  criar: (dados: CriarUsuarioDados) =>
    prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        papel: dados.papel,
        senhaHash: dados.senhaHash,
        precisaTrocarSenha: dados.precisaTrocarSenha ?? true,
      },
      select: publico,
    }),

  /** Troca feita pela própria pessoa: some a pendência de senha provisória. */
  atualizarSenha: (id: string, senhaHash: string) =>
    prisma.usuario.update({
      where: { id },
      data: { senhaHash, precisaTrocarSenha: false },
      select: publico,
    }),

  atualizar: (id: string, dados: AtualizarUsuarioDados) =>
    prisma.usuario.update({
      where: { id },
      data: {
        nome: dados.nome,
        email: dados.email,
        papel: dados.papel,
        ativo: dados.ativo,
        senhaHash: dados.senhaHash,
        // Senha redefinida por admin é provisória por definição — quem definiu
        // conhece o valor. A pessoa troca no próximo acesso.
        ...(dados.senhaHash ? { precisaTrocarSenha: true } : {}),
      },
      select: publico,
    }),

  desativar: (id: string) =>
    prisma.usuario.update({ where: { id }, data: { ativo: false }, select: publico }),
};
