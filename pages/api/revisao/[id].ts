import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PRIORIDADES, STATUS, normalizarAssunto } from "@/lib/revisao";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id);

  if (req.method === "DELETE") {
    try {
      await prisma.conteudoRevisao.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        return res.status(404).json({ error: "Conteúdo não encontrado." });
      }
      throw e;
    }
    return res.status(204).end();
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).end();
  }

  const atual = await prisma.conteudoRevisao.findUnique({ where: { id } });
  if (!atual) return res.status(404).json({ error: "Conteúdo não encontrado." });

  const body = req.body ?? {};
  const data: Prisma.ConteudoRevisaoUpdateInput = {};

  if (body.assunto !== undefined) {
    const assunto = typeof body.assunto === "string" ? body.assunto.trim() : "";
    if (!assunto) return res.status(400).json({ error: "O assunto não pode ficar vazio." });
    data.assunto = assunto;
    data.assuntoNorm = normalizarAssunto(assunto);
  }
  if (body.disciplina !== undefined) {
    const disciplina = typeof body.disciplina === "string" ? body.disciplina.trim() : "";
    if (!disciplina) return res.status(400).json({ error: "A disciplina não pode ficar vazia." });
    data.disciplina = disciplina;
  }
  if (body.prioridade !== undefined) {
    if (!(PRIORIDADES as readonly string[]).includes(body.prioridade)) {
      return res.status(400).json({ error: "Prioridade inválida." });
    }
    data.prioridade = body.prioridade;
  }
  if (body.observacao !== undefined) {
    data.observacao = typeof body.observacao === "string" && body.observacao.trim() ? body.observacao.trim() : null;
  }

  let confianca: number | null = null;
  if (body.confianca !== undefined && body.confianca !== null) {
    confianca = Number(body.confianca);
    if (![1, 2, 3].includes(confianca)) {
      return res.status(400).json({ error: "A confiança deve ser 1, 2 ou 3." });
    }
  }

  const marcarRevisado = body.status === "REVISADO";
  if (body.status !== undefined) {
    if (!(STATUS as readonly string[]).includes(body.status)) {
      return res.status(400).json({ error: "Status inválido." });
    }
    data.status = body.status;
    // reabrir limpa a data, mas o histórico (RevisaoLog) fica
    data.revisadoEm = marcarRevisado ? new Date() : null;
  }

  try {
    const [item] = await prisma.$transaction([
      prisma.conteudoRevisao.update({ where: { id }, data }),
      ...(marcarRevisado
        ? [prisma.revisaoLog.create({ data: { conteudoId: id, confianca } })]
        : []),
    ]);
    return res.status(200).json({ item });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(409).json({ error: "Já existe um conteúdo com esse assunto e disciplina." });
    }
    throw e;
  }
}
