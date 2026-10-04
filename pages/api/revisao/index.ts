import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import {
  PRIORIDADES,
  STATUS,
  classificarDisciplina,
  normalizarAssunto,
  ordenarParaRevisao,
} from "@/lib/revisao";

function texto(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const status = texto(req.query.status);
    const disciplina = texto(req.query.disciplina);
    const prioridade = texto(req.query.prioridade);

    const itens = await prisma.conteudoRevisao.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(disciplina ? { disciplina } : {}),
        ...(prioridade ? { prioridade } : {}),
      },
      include: {
        logs: { orderBy: { revisadoEm: "desc" }, take: 1 },
        _count: { select: { logs: true } },
      },
    });

    const lista = itens.map(({ logs, _count, ...c }) => ({
      ...c,
      ultimaRevisao: logs[0]?.revisadoEm ?? null,
      ultimaConfianca: logs[0]?.confianca ?? null,
      totalRevisoes: _count.logs,
    }));
    return res.status(200).json(ordenarParaRevisao(lista));
  }

  if (req.method === "POST") {
    const assunto = texto(req.body?.assunto);
    if (!assunto) return res.status(400).json({ error: "Informe o assunto." });

    const prioridade = texto(req.body?.prioridade) ?? "MEDIA";
    if (!(PRIORIDADES as readonly string[]).includes(prioridade)) {
      return res.status(400).json({ error: "Prioridade inválida." });
    }

    const assuntoNorm = normalizarAssunto(assunto);
    const disciplinaInformada = texto(req.body?.disciplina);
    const disciplina = disciplinaInformada ?? classificarDisciplina(assunto);

    // Com disciplina escolhida, duplicata é o par (assunto, disciplina); sem ela,
    // o mesmo assunto em qualquer disciplina já conta.
    const existente = disciplinaInformada
      ? await prisma.conteudoRevisao.findUnique({
          where: { assuntoNorm_disciplina: { assuntoNorm, disciplina } },
        })
      : await prisma.conteudoRevisao.findFirst({ where: { assuntoNorm } });
    if (existente) {
      return res
        .status(200)
        .json({ item: existente, aviso: "Esse conteúdo já estava cadastrado." });
    }

    const item = await prisma.conteudoRevisao.create({
      data: {
        assunto,
        assuntoNorm,
        disciplina,
        prioridade,
        status: STATUS[0],
        origem: "MANUAL",
        observacao: texto(req.body?.observacao),
        areaId: texto(req.body?.areaId),
      },
    });
    return res.status(201).json({ item });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
