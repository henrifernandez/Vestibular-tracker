import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function csvEscape(valor: string): string {
  if (valor.includes(",") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ error: "id inválido" });

  const simulado = await prisma.simulado.findUnique({
    where: { id },
    include: {
      prova: true,
      resultados: {
        include: { area: true, conteudosErrados: true },
        orderBy: { area: { ordem: "asc" } },
      },
    },
  });

  if (!simulado) return res.status(404).json({ error: "simulado não encontrado" });

  const linhas: string[] = [];
  linhas.push(
    ["Prova", "Simulado", "Data", "Área", "Acertos", "Total de questões", "% de acertos", "Conteúdos errados"]
      .map(csvEscape)
      .join(",")
  );

  const dataFormatada = new Date(simulado.data).toLocaleDateString("pt-BR");

  for (const r of simulado.resultados) {
    const percentual = r.totalQuestoes > 0 ? ((r.acertos / r.totalQuestoes) * 100).toFixed(1) : "";
    const conteudos = r.conteudosErrados.map((c) => c.conteudo).join("; ");
    linhas.push(
      [
        simulado.prova.nome,
        simulado.nome || "",
        dataFormatada,
        r.area.nome,
        String(r.acertos),
        String(r.totalQuestoes),
        percentual,
        conteudos,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = "\uFEFF" + linhas.join("\r\n"); // BOM para o Excel abrir acentos corretamente

  const nomeArquivo = `simulado_${simulado.prova.slug}_${simulado.data.toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.status(200).send(csv);
}
