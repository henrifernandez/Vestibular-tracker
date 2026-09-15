import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type ResultadoInput = {
  areaId: string;
  acertos: number;
  totalQuestoes: number;
  notaEstimada?: number;
  conteudosErrados?: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const simulados = await prisma.simulado.findMany({
      include: {
        prova: true,
        resultados: { include: { area: true, conteudosErrados: true } },
      },
      orderBy: { data: "desc" },
    });
    return res.status(200).json(simulados);
  }

  if (req.method === "POST") {
    const { provaId, data, nome, observacao, resultados } = req.body as {
      provaId: string;
      data: string;
      nome?: string;
      observacao?: string;
      resultados: ResultadoInput[];
    };

    if (!provaId || !data || !Array.isArray(resultados) || resultados.length === 0) {
      return res.status(400).json({ error: "provaId, data e resultados são obrigatórios" });
    }

    const simulado = await prisma.simulado.create({
      data: {
        provaId,
        data: new Date(data),
        nome,
        observacao,
        resultados: {
          create: resultados.map((r) => ({
            areaId: r.areaId,
            acertos: r.acertos,
            totalQuestoes: r.totalQuestoes,
            notaEstimada: r.notaEstimada,
            conteudosErrados: {
              create: (r.conteudosErrados || [])
                .map((c) => c.trim())
                .filter(Boolean)
                .map((conteudo) => ({ conteudo })),
            },
          })),
        },
      },
      include: {
        resultados: { include: { area: true, conteudosErrados: true } },
      },
    });

    return res.status(201).json(simulado);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}
