import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const { slug } = req.query;
  if (typeof slug !== "string") return res.status(400).json({ error: "slug inválido" });

  const prova = await prisma.prova.findUnique({
    where: { slug },
    include: {
      areas: {
        orderBy: { ordem: "asc" },
        include: {
          metas: true,
          resultados: {
            include: {
              simulado: true,
              conteudosErrados: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!prova) return res.status(404).json({ error: "prova não encontrada" });

  // Para cada área, agrega a frequência de conteúdos errados (para o "clique dentro da matéria")
  const areasComAgregados = prova.areas.map((area) => {
    const contagem: Record<string, number> = {};
    for (const r of area.resultados) {
      for (const c of r.conteudosErrados) {
        contagem[c.conteudo] = (contagem[c.conteudo] || 0) + 1;
      }
    }
    const conteudosMaisErrados = Object.entries(contagem)
      .map(([conteudo, vezes]) => ({ conteudo, vezes }))
      .sort((a, b) => b.vezes - a.vezes);

    const totalAcertos = area.resultados.reduce((s, r) => s + r.acertos, 0);
    const totalQuestoesRespondidas = area.resultados.reduce((s, r) => s + r.totalQuestoes, 0);
    const percentualMedio =
      totalQuestoesRespondidas > 0 ? (totalAcertos / totalQuestoesRespondidas) * 100 : null;

    return {
      ...area,
      conteudosMaisErrados,
      percentualMedio,
      ultimoResultado: area.resultados[area.resultados.length - 1] || null,
    };
  });

  res.status(200).json({ ...prova, areas: areasComAgregados });
}
