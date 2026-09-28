// Carrega/limpa simulados FICTÍCIOS para simular evolução nos gráficos.
// Todo simulado criado aqui leva MARCA na observação, então dá para apagar só eles.
import type { PrismaClient } from "@prisma/client";
import { SERIES_FICTICIAS, type LinhaFicticia } from "./dados-ficticios";

export const MARCA = "[dados fictícios]";

export type Relatorio = { criados: Record<string, number>; avisos: string[]; apagados: number };

export async function limparFicticios(prisma: PrismaClient): Promise<number> {
  const r = await prisma.simulado.deleteMany({ where: { observacao: { startsWith: MARCA } } });
  return r.count;
}

async function garantirEnem(prisma: PrismaClient) {
  const prova = await prisma.prova.upsert({
    where: { slug: "enem" },
    update: {},
    create: {
      slug: "enem",
      nome: "ENEM (registro único)",
      descricao:
        "Registre aqui os acertos do ENEM uma única vez. O resultado é copiado automaticamente para o ENEM-USP e para o ENEM/SISU (Unicamp), já que é a mesma prova.",
    },
  });
  const areas: [string, number, number][] = [
    ["Matemática", 45, 1],
    ["Ciências da Natureza", 45, 2],
    ["Ciências Humanas", 45, 3],
    ["Linguagens", 45, 4],
    ["Redação", 1, 5],
  ];
  for (const [nome, totalQuestoes, ordem] of areas) {
    await prisma.area.upsert({
      where: { provaId_nome: { provaId: prova.id, nome } },
      update: {},
      create: { provaId: prova.id, nome, totalQuestoes, ordem },
    });
  }
}

async function criarSerie(
  prisma: PrismaClient,
  slug: string,
  linhas: LinhaFicticia[],
  extra: string,
  rel: Relatorio
) {
  const prova = await prisma.prova.findUnique({ where: { slug }, include: { areas: true } });
  if (!prova) {
    rel.avisos.push(`Prova "${slug}" não existe no banco, pulada.`);
    return;
  }
  const areaPorNome = new Map(prova.areas.map((a) => [a.nome, a.id]));
  let ordem = prova.areas.length;
  for (const [, , area, , total] of linhas) {
    if (!areaPorNome.has(area)) {
      const a = await prisma.area.create({
        data: { provaId: prova.id, nome: area, totalQuestoes: total, ordem: ++ordem },
      });
      areaPorNome.set(area, a.id);
      rel.avisos.push(`Área "${area}" criada em ${prova.nome}.`);
    }
  }
  const grupos = new Map<string, LinhaFicticia[]>();
  for (const l of linhas) grupos.set(l[0], [...(grupos.get(l[0]) ?? []), l]);

  let n = 0;
  for (const [nome, ls] of grupos) {
    await prisma.simulado.create({
      data: {
        provaId: prova.id,
        data: new Date(`${ls[0][1]}T12:00:00.000Z`),
        nome,
        observacao: `${MARCA}${extra}`,
        resultados: {
          create: ls.map(([, , area, acertos, total, erros]) => ({
            areaId: areaPorNome.get(area)!,
            acertos,
            totalQuestoes: total,
            conteudosErrados: { create: erros.map((conteudo) => ({ conteudo })) },
          })),
        },
      },
    });
    n++;
  }
  rel.criados[prova.nome] = n;
}

export async function carregarFicticios(prisma: PrismaClient): Promise<Relatorio> {
  const rel: Relatorio = { criados: {}, avisos: [], apagados: 0 };
  rel.apagados = await limparFicticios(prisma); // evita duplicar ao rodar de novo
  await garantirEnem(prisma);
  for (const s of SERIES_FICTICIAS) {
    await criarSerie(prisma, s.slug, s.linhas, "", rel);
    for (const destino of s.copiarPara) {
      await criarSerie(prisma, destino, s.linhas, " (copiado do registro único de ENEM)", rel);
    }
  }
  return rel;
}
