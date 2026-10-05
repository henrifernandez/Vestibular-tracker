import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { ehRedacao } from "@/lib/redacao";

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
      // melhor resultado da área entre todos os simulados (usado na nota do ENEM)
      const melhor = area.resultados.reduce<(typeof area.resultados)[number] | undefined>(
        (m, r) => (!m || r.acertos > m.acertos ? r : m),
        undefined
      );
      const melhorNota = area.resultados.reduce<number | null>(
        (m, r) => (r.notaEstimada == null ? m : m == null ? r.notaEstimada : Math.max(m, r.notaEstimada)),
        null
      );
      const redacao = ehRedacao(area.nome);

      // Redação: progresso vem da nota estimada (IA) contra a meta de nota,
      // não de acertos/totalQuestoes (que pra Redação é um valor fixo sem sentido).
      if (redacao) {
        const melhorMetaNota = area.metas.reduce<number | null>((max, m) => {
          if (m.notaAlvo == null) return max;
          return max == null ? m.notaAlvo : Math.max(max, m.notaAlvo);
        }, null);

        return {
          id: area.id,
          nome: area.nome,
          totalQuestoes: area.totalQuestoes,
          metas: area.metas,
          ehRedacao: true,
          ultimaNota: ultimo?.notaEstimada ?? null,
          melhorNota,
          ultimoAcertos: null,
          ultimoTotal: null,
          progresso:
            ultimo?.notaEstimada != null && melhorMetaNota
              ? Math.min(100, Math.round((ultimo.notaEstimada / melhorMetaNota) * 100))
              : null,
          qtdSimulados: area.resultados.length,
        };
      }

      const melhorMetaAcertos = area.metas.reduce<number | null>((max, m) => {
        if (m.acertosAlvo == null) return max;
        return max == null ? m.acertosAlvo : Math.max(max, m.acertosAlvo);
      }, null);

      return {
        id: area.id,
        nome: area.nome,
        totalQuestoes: area.totalQuestoes,
        metas: area.metas,
        ehRedacao: false,
        ultimoAcertos: ultimo?.acertos ?? null,
        ultimoTotal: ultimo?.totalQuestoes ?? null,
        melhorAcertos: melhor?.acertos ?? null,
        melhorTotal: melhor?.totalQuestoes ?? null,
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
