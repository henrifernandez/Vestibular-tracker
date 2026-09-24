import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type ResultadoInput = {
  areaId: string;
  acertos: number;
  totalQuestoes: number;
  notaEstimada?: number;
  textoRedacao?: string;
  avaliacaoIA?: unknown;
  conteudosErrados?: string[];
};

// Provas que recebem automaticamente uma cópia de cada registro feito na prova "enem"
// (o ENEM-USP e o ENEM/SISU usam exatamente as mesmas áreas e acertos da mesma prova física)
const PROVAS_DESTINO_ENEM = ["enem-usp", "unicamp-sisu"];

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

    const provaSelecionada = await prisma.prova.findUnique({ where: { id: provaId } });
    if (!provaSelecionada) {
      return res.status(400).json({ error: "prova não encontrada" });
    }

    const criarResultados = (resultadosParaCriar: ResultadoInput[]) =>
      resultadosParaCriar.map((r) => ({
        areaId: r.areaId,
        acertos: r.acertos,
        totalQuestoes: r.totalQuestoes,
        notaEstimada: r.notaEstimada,
        textoRedacao: r.textoRedacao,
        avaliacaoIA: r.avaliacaoIA as any,
        conteudosErrados: {
          create: (r.conteudosErrados || [])
            .map((c) => c.trim())
            .filter(Boolean)
            .map((conteudo) => ({ conteudo })),
        },
      }));

    // Registro único de ENEM: copia o mesmo resultado para o ENEM-USP e o ENEM/SISU,
    // casando as áreas pelo nome (as duas provas têm as mesmas 5 áreas do ENEM).
    if (provaSelecionada.slug === "enem") {
      const areasOrigem = await prisma.area.findMany({ where: { provaId: provaSelecionada.id } });
      const nomePorAreaId = new Map(areasOrigem.map((a) => [a.id, a.nome]));

      const destinos = await prisma.prova.findMany({
        where: { slug: { in: PROVAS_DESTINO_ENEM } },
        include: { areas: true },
      });

      const simuladosCriados = [];
      for (const destino of destinos) {
        const areaDestinoPorNome = new Map(destino.areas.map((a) => [a.nome, a]));
        const resultadosDestino = resultados
          .map((r) => {
            const nomeArea = nomePorAreaId.get(r.areaId);
            const areaDestino = nomeArea ? areaDestinoPorNome.get(nomeArea) : undefined;
            if (!areaDestino) return null;
            return { ...r, areaId: areaDestino.id };
          })
          .filter((r): r is ResultadoInput => r !== null);

        if (resultadosDestino.length === 0) continue;

        const s = await prisma.simulado.create({
          data: {
            provaId: destino.id,
            data: new Date(data),
            nome,
            observacao: observacao
              ? `${observacao} (copiado automaticamente do registro único de ENEM)`
              : "Copiado automaticamente do registro único de ENEM",
            resultados: { create: criarResultados(resultadosDestino) },
          },
          include: { resultados: { include: { area: true, conteudosErrados: true } } },
        });
        simuladosCriados.push(s);
      }

      return res.status(201).json({ fanOut: true, simulados: simuladosCriados });
    }

    const simulado = await prisma.simulado.create({
      data: {
        provaId,
        data: new Date(data),
        nome,
        observacao,
        resultados: { create: criarResultados(resultados) },
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
