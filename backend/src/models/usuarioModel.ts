import { prisma } from "../config/prisma.js";

const publico = { id: true, nome: true, email: true, papel: true, ativo: true } as const;

export const usuarioModel = {
  buscarPorEmail: (email: string) => prisma.usuario.findUnique({ where: { email } }),
  buscarPublicoPorId: (id: string) => prisma.usuario.findUnique({ where: { id }, select: publico }),
};
