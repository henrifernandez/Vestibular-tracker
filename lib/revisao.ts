import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MARCA as MARCA_FICTICIO } from "@/lib/seed-ficticio";

export const DISCIPLINA_PADRAO = "A classificar";

export const PRIORIDADES = ["ALTA", "MEDIA", "BAIXA"] as const;
export const STATUS = ["PENDENTE", "REVISADO"] as const;
export const ORIGENS = ["MANUAL", "SIMULADO"] as const;

export type Prioridade = (typeof PRIORIDADES)[number];
export type StatusRevisao = (typeof STATUS)[number];

export const PESO_PRIORIDADE: Record<string, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2 };

// Marca gravada por registrarSimuladoEnemComFanOut (lib/enem-fanout.ts) nas cópias
// do registro único de ENEM.
const MARCA_COPIA_ENEM = "Copiado automaticamente do registro único de ENEM";

// minúsculas, sem acento, sem pontuação no fim e sem espaços extras
export function normalizarAssunto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;:,\s]+$/, "");
}

// Palavras-chave por disciplina (já sem acento). Casam no início de uma palavra,
// então "gerador" pega "geradores". Vence a disciplina cuja soma dos tamanhos das
// palavras casadas for maior; empate ou nenhum casamento deixa "A classificar".
const PALAVRAS_CHAVE: Record<string, string[]> = {
  Biologia: [
    "ecologia", "ecossistema", "cadeia alimentar", "biogeoquimic", "poluicao", "especiacao",
    "evolucao", "selecao natural", "genetic", "hereditariedade", "mendel", "dna", "rna",
    "acidos nucleicos", "replicacao", "transcricao", "traducao", "mitose", "meiose", "citologia",
    "celula", "organela", "membrana plasmatica", "fotossintese", "respiracao celular", "fermentacao",
    "gimnosperma", "angiosperma", "briofita", "pteridofita", "botanica", "fisiologia vegetal",
    "platyhelminthes", "nematelminto", "anelideo", "artropode", "molusco", "filo ", "zoologia",
    "bacteria", "virus", "fungo", "protozoario", "doencas", "parasit", "vacina",
    "sistema circulatorio", "sistema imune", "imunologia", "endocrin", "hormonio",
    "sistema nervoso", "sistema digestor", "sistema digestorio", "sistema respirat",
    "sistema excretor", "sistema reprodutor", "reproducao", "embriolog", "histologia",
    "engenharia genetica", "biotecnologia", "transgenic", "biodiversidade", "bioma", "bioquimica",
  ],
  Fisica: [
    "pascal", "ohm", "forca magnetica", "campo magnetico", "campo eletrico", "eletromagnet",
    "eletrostatica", "eletrodinamica", "corrente eletrica", "circuito", "resistor", "gerador",
    "capacitor", "indutor", "transformador", "potencial eletrico", "coulomb", "faraday", "lenz",
    "potencia", "trabalho e energia", "energia cinetica", "energia potencial", "energia mecanica",
    "optica", "refracao", "reflexao", "lente", "espelho", "ondulatoria", "onda", "acustica",
    "calorimetria", "termologia", "termometria", "dilatacao", "termodinamica", "gas ideal",
    "movimento uniforme", "cinematica", "dinamica", "newton", "mru", "mruv", "lancamento",
    "queda livre", "impulso", "quantidade de movimento", "colisao", "gravitacao", "hidrostatica",
    "hidrodinamica", "empuxo", "torque", "alavanca", "atrito", "vetores", "mecanica",
    "fisica moderna", "efeito fotoeletrico", "relatividade",
  ],
  Quimica: [
    "estequiometr", "intermolecul", "quimica ambiental", "misturas", "solucoes", "solucao",
    "reacoes", "reacao quimica", "acido", "neutralizacao", "ph e poh", "oxido", "funcoes oxigenadas",
    "funcoes organicas", "organic", "isomeria", "hidrocarbonet", "polimero", "atomo", "atomic",
    "tabela periodica", "ligacao quimica", "ligacoes quimicas", "radioatividade", "termoquimica",
    "entalpia", "cinetica quimica", "equilibrio quimico", "eletroquimica", "pilha", "eletrolise",
    "gases", "mol", "concentracao", "diluicao", "titulacao", "separacao de misturas",
    "propriedades coligativas", "combustive", "petroleo", "nox", "quimica verde",
  ],
  Matematica: [
    "matematica", "funcao do", "funcoes do", "equacao", "geometria", "trigonometria", "logaritmo",
    "progressao", "probabilidade", "estatistica", "analise combinatoria", "porcentagem",
    "razao e proporcao", "regra de tres", "matriz", "determinante", "polinomio", "fracoes",
  ],
};

const NOME_DISCIPLINA: Record<string, string> = {
  Biologia: "Biologia",
  Fisica: "Física",
  Quimica: "Química",
  Matematica: "Matemática",
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const REGEX_PALAVRAS = Object.entries(PALAVRAS_CHAVE).map(([disc, palavras]) => ({
  disc,
  itens: palavras.map((p) => ({
    peso: p.trim().length,
    re: new RegExp("(^|[^a-z0-9])" + escapeRegex(p.trim())),
  })),
}));

// Decide a disciplina a partir do texto do assunto e, quando conhecida, da área da
// prova em que o erro foi registrado (áreas que não são Natureza já dizem a disciplina).
export function classificarDisciplina(assunto: string, areaNome?: string | null): string {
  const area = normalizarAssunto(areaNome || "");
  if (area.includes("matematica")) return "Matemática";
  if (area.includes("linguagens")) return "Linguagens";
  if (area.includes("humanas")) return "Ciências Humanas";
  if (area.includes("redacao")) return "Redação";

  const texto = normalizarAssunto(assunto);
  let melhor: { disc: string; pontos: number } | null = null;
  let empate = false;
  for (const { disc, itens } of REGEX_PALAVRAS) {
    const pontos = itens.reduce((s, it) => (it.re.test(texto) ? s + it.peso : s), 0);
    if (pontos === 0) continue;
    if (!melhor || pontos > melhor.pontos) {
      melhor = { disc, pontos };
      empate = false;
    } else if (pontos === melhor.pontos) {
      empate = true;
    }
  }
  if (!melhor || empate) return DISCIPLINA_PADRAO;
  return NOME_DISCIPLINA[melhor.disc] ?? DISCIPLINA_PADRAO;
}

export function ordenarParaRevisao<
  T extends { status: string; prioridade: string; vezesErrado: number },
>(itens: T[]): T[] {
  return [...itens].sort((a, b) => {
    const sa = a.status === "PENDENTE" ? 0 : 1;
    const sb = b.status === "PENDENTE" ? 0 : 1;
    if (sa !== sb) return sa - sb;
    const pa = PESO_PRIORIDADE[a.prioridade] ?? 1;
    const pb = PESO_PRIORIDADE[b.prioridade] ?? 1;
    if (pa !== pb) return pa - pb;
    return b.vezesErrado - a.vezesErrado;
  });
}

// Só entram na revisão os assuntos que apareceram em pelo menos esta quantidade de
// simulados diferentes (erro repetido, não um deslize isolado).
export const MIN_SIMULADOS = 2;

export type ResultadoSincronizacao = {
  criados: number;
  atualizados: number;
  reabertos: number;
  removidos: number;
};

export type GrupoAssunto = {
  assunto: string;
  vezes: number; // ocorrências do erro (mesmo simulado pode repetir)
  simulados: number; // em quantos simulados diferentes o assunto apareceu
  areaId: string;
  areaNome: string;
};

type ResultadoComErros = {
  areaId: string;
  area: { nome: string };
  simulado: { id: string; data: Date; nome: string | null; observacao: string | null };
  conteudosErrados: { conteudo: string }[];
};

// Junta os erros por assunto normalizado. O registro único de ENEM grava uma cópia
// no ENEM-USP e outra no ENEM/SISU; conta só uma cópia por (data, nome, área) para
// o erro não valer em dobro, e as duas cópias contam como um simulado só.
// Recebe os resultados em ordem de criação.
export function agruparErros(resultados: ResultadoComErros[]): Map<string, GrupoAssunto> {
  const copiasVistas = new Set<string>();
  const grupos = new Map<string, GrupoAssunto>();
  const simuladosPorAssunto = new Map<string, Set<string>>();

  for (const r of resultados) {
    // simulados de "dados fictícios" (seed de teste) não entram na revisão
    if (r.simulado.observacao?.startsWith(MARCA_FICTICIO)) continue;
    let idSimulado = r.simulado.id;
    if (r.simulado.observacao?.includes(MARCA_COPIA_ENEM)) {
      const dia = r.simulado.data.toISOString().slice(0, 10);
      const chave = `${dia}|${r.simulado.nome ?? ""}|${r.area.nome}`;
      if (copiasVistas.has(chave)) continue;
      copiasVistas.add(chave);
      idSimulado = `enem|${dia}|${r.simulado.nome ?? ""}`;
    }
    for (const c of r.conteudosErrados) {
      const assunto = c.conteudo.trim();
      const norm = normalizarAssunto(assunto);
      if (!norm) continue;
      const g = grupos.get(norm);
      if (g) g.vezes++;
      else
        grupos.set(norm, { assunto, vezes: 1, simulados: 0, areaId: r.areaId, areaNome: r.area.nome });
      const ids = simuladosPorAssunto.get(norm) ?? new Set<string>();
      ids.add(idSimulado);
      simuladosPorAssunto.set(norm, ids);
    }
  }
  for (const [norm, ids] of simuladosPorAssunto) grupos.get(norm)!.simulados = ids.size;
  return grupos;
}

// Lê os ConteudoErrado e leva para ConteudoRevisao. Idempotente: rodar de novo com
// os mesmos dados não muda nada. Usado só por /api/revisao/importar-simulados.
export async function sincronizarSimulados(): Promise<ResultadoSincronizacao> {
  const resultados = await prisma.resultado.findMany({
    where: { conteudosErrados: { some: {} } },
    include: {
      conteudosErrados: true,
      area: true,
      simulado: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const grupos = agruparErros(resultados);

  const existentes = await prisma.conteudoRevisao.findMany({
    include: { _count: { select: { logs: true } } },
  });
  const porNorm = new Map<string, typeof existentes>();
  for (const e of existentes) {
    const lista = porNorm.get(e.assuntoNorm);
    if (lista) lista.push(e);
    else porNorm.set(e.assuntoNorm, [e]);
  }

  // Itens que a própria importação criou, ninguém mexeu e que não aparecem mais em
  // MIN_SIMULADOS simulados saem da lista. O que foi revisado, comentado ou teve a
  // prioridade ajustada fica.
  const removiveis = new Set<string>();
  for (const e of existentes) {
    if (e.origem !== "SIMULADO") continue;
    const g = grupos.get(e.assuntoNorm);
    if (g && g.simulados >= MIN_SIMULADOS) continue;
    const intocado =
      e.status === "PENDENTE" && e._count.logs === 0 && !e.observacao && e.prioridade === "MEDIA";
    if (intocado) removiveis.add(e.id);
  }

  const novos: Prisma.ConteudoRevisaoCreateManyInput[] = [];
  const atualizacoes: ReturnType<typeof prisma.conteudoRevisao.update>[] = [];
  let atualizados = 0;
  let reabertos = 0;

  for (const [norm, g] of grupos) {
    const disciplina = classificarDisciplina(g.assunto, g.areaNome);
    const lista = (porNorm.get(norm) ?? []).filter((e) => !removiveis.has(e.id));

    if (lista.length === 0) {
      if (g.simulados < MIN_SIMULADOS) continue;
      novos.push({
        assunto: g.assunto,
        assuntoNorm: norm,
        disciplina,
        areaId: g.areaId,
        origem: "SIMULADO",
        vezesErrado: g.vezes,
      });
      continue;
    }

    // Casa pelo assunto em qualquer disciplina, para um ajuste manual de disciplina
    // não gerar duplicata na próxima sincronização.
    const atual = lista.find((e) => e.origem === "SIMULADO") ?? lista[0];
    const data: Prisma.ConteudoRevisaoUpdateInput = {};
    let reabriu = false;

    if (g.vezes !== atual.vezesErrado) {
      data.vezesErrado = g.vezes;
      if (g.vezes > atual.vezesErrado && atual.status === "REVISADO") {
        data.status = "PENDENTE";
        data.revisadoEm = null;
        reabriu = true;
      }
    }
    // só mexe na disciplina se ainda não foi definida (nunca sobrescreve ajuste do usuário)
    if (atual.disciplina === DISCIPLINA_PADRAO && disciplina !== DISCIPLINA_PADRAO) {
      data.disciplina = disciplina;
    }
    if (!atual.areaId) data.area = { connect: { id: g.areaId } };

    if (Object.keys(data).length === 0) continue;
    atualizacoes.push(prisma.conteudoRevisao.update({ where: { id: atual.id }, data }));
    if (reabriu) reabertos++;
    else atualizados++;
  }

  await prisma.$transaction([
    ...(removiveis.size
      ? [prisma.conteudoRevisao.deleteMany({ where: { id: { in: [...removiveis] } } })]
      : []),
    ...(novos.length ? [prisma.conteudoRevisao.createMany({ data: novos })] : []),
    ...atualizacoes,
  ]);

  return { criados: novos.length, atualizados, reabertos, removidos: removiveis.size };
}

export async function resumoRevisao() {
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [pendentes, revisados, logs, disciplinas] = await Promise.all([
    prisma.conteudoRevisao.count({ where: { status: "PENDENTE" } }),
    prisma.conteudoRevisao.count({ where: { status: "REVISADO" } }),
    prisma.revisaoLog.groupBy({ by: ["conteudoId"], where: { revisadoEm: { gte: seteDiasAtras } } }),
    prisma.conteudoRevisao.findMany({ select: { disciplina: true }, distinct: ["disciplina"] }),
  ]);
  const total = pendentes + revisados;
  return {
    pendentes,
    revisados,
    total,
    pctRevisado: total > 0 ? Math.round((revisados / total) * 100) : null,
    revisadosUltimos7Dias: logs.length,
    disciplinas: disciplinas.map((d) => d.disciplina).sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}
