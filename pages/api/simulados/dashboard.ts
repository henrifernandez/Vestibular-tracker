import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const provas = await prisma.prova.findMany({
    where: { slug: { not: "enem" } },
    include: {
      areas: {
        orderBy: { ordem: "asc" },
        include: {
          metas: true,
          resultados: true,
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  const resultado = provas.map((prova) => ({
    id: prova.id,
    slug: prova.slug,
    nome: prova.nome,
    descricao: prova.descricao,
    areas: prova.areas.map((area) => {
      const ultimo = area.resultados[area.resultados.length - 1];
      const melhorMetaAcertos = area.metas.reduce<number | null>((max, m) => {
        if (m.acertosAlvo == null) return max;
        return max == null ? m.acertosAlvo : Math.max(max, m.acertosAlvo);
      }, null);

      return {
        id: area.id,
        nome: area.nome,
        totalQuestoes: area.totalQuestoes,
        metas: area.metas,
        ultimoAcertos: ultimo?.acertos ?? null,
        ultimoTotal: ultimo?.totalQuestoes ?? null,
        progresso:
          ultimo && melhorMetaAcertos
            ? Math.min(100, Math.round((ultimo.acertos / melhorMetaAcertos) * 100))
            : null,
        qtdSimulados: area.resultados.length,
      };
    }),
  }));

  res.status(200).json(resultado);
}
