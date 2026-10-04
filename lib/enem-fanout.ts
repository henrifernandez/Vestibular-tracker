import { prisma } from "@/lib/prisma";

// Slug da prova de "registro único" do ENEM: é só um ponto de entrada. O que
// fica salvo (e aparece no painel) são as cópias nas provas de destino abaixo.
export const SLUG_ENEM_REGISTRO_UNICO = "enem";

// Provas que recebem automaticamente uma cópia de cada registro feito na prova
// "enem" (o ENEM-USP e o ENEM/SISU usam exatamente as mesmas áreas e acertos
// da mesma prova física).
export const PROVAS_DESTINO_ENEM = ["enem-usp", "unicamp-sisu"];

export type ResultadoInput = {
  areaId: string;
  acertos: number;
  totalQuestoes: number;
  notaEstimada?: number;
  textoRedacao?: string;
  avaliacaoIA?: unknown;
  conteudosErrados?: string[];
};

export function montarResultadosCreate(resultados: ResultadoInput[]) {
  return resultados.map((r) => ({
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
}

// Copia um registro da prova "enem" para o ENEM-USP e o ENEM/SISU, casando as
// áreas pelo nome. Vale para simulados parciais: só as áreas que vieram no
// registro (ex: apenas Ciências da Natureza) são copiadas, e cada área do painel
// usa o último resultado que ela tiver, de qualquer simulado.
// Usado tanto pelo formulário (POST /api/simulados) quanto pela importação de CSV.
export async function registrarSimuladoEnemComFanOut(params: {
  provaOrigemId: string;
  data: Date;
  nome?: string | null;
  observacao?: string | null;
  resultados: ResultadoInput[];
}) {
  const { provaOrigemId, data, nome, observacao, resultados } = params;

  const areasOrigem = await prisma.area.findMany({ where: { provaId: provaOrigemId } });
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
        data,
        nome,
        observacao: observacao
          ? `${observacao} (copiado automaticamente do registro único de ENEM)`
          : "Copiado automaticamente do registro único de ENEM",
        resultados: { create: montarResultadosCreate(resultadosDestino) },
      },
      include: { resultados: { include: { area: true, conteudosErrados: true } } },
    });
    simuladosCriados.push(s);
  }

  return simuladosCriados;
}
