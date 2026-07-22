import { prisma } from "../config/prisma.js";
import type { PapelUsuario } from "@prisma/client";

const publico = { id: true, nome: true, email: true, papel: true, ativo: true } as const;

export interface CriarUsuarioDados {
  nome: string;
  email: string;
  papel: PapelUsuario;
  senhaHash: string;
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
  buscarPublicoPorId: (id: string) => prisma.usuario.findUnique({ where: { id }, select: publico }),

  listar: () => prisma.usuario.findMany({ select: publico, orderBy: { nome: "asc" } }),

  criar: (dados: CriarUsuarioDados) =>
    prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        papel: dados.papel,
        senhaHash: dados.senhaHash,
      },
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
      },
      select: publico,
    }),

  desativar: (id: string) =>
    prisma.usuario.update({ where: { id }, data: { ativo: false }, select: publico }),
};
