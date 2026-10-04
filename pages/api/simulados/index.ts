import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import {
  SLUG_ENEM_REGISTRO_UNICO,
  montarResultadosCreate,
  registrarSimuladoEnemComFanOut,
  type ResultadoInput,
} from "@/lib/enem-fanout";

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

    // Registro único de ENEM: copia o mesmo resultado para o ENEM-USP e o ENEM/SISU
    // (ver lib/enem-fanout.ts, também usado pela importação de CSV).
    if (provaSelecionada.slug === SLUG_ENEM_REGISTRO_UNICO) {
      const simuladosCriados = await registrarSimuladoEnemComFanOut({
        provaOrigemId: provaSelecionada.id,
        data: new Date(data),
        nome,
        observacao,
        resultados,
      });
      return res.status(201).json({ fanOut: true, simulados: simuladosCriados });
    }

    const simulado = await prisma.simulado.create({
      data: {
        provaId,
        data: new Date(data),
        nome,
        observacao,
        resultados: { create: montarResultadosCreate(resultados) },
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
