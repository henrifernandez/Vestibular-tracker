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

// Assunto errado nesta quantidade de vezes (somando todos os simulados) vira prioridade ALTA.
export const MIN_ERROS_PRIORIDADE_ALTA = 2;

// Marca gravada por registrarSimuladoEnemComFanOut (lib/enem-fanout.ts) nas cópias
// do registro único de ENEM.
const MARCA_COPIA_ENEM = "Copiado automaticamente do registro único de ENEM";

// As duas cópias de um mesmo registro nascem no mesmo instante. Cópias criadas com mais
// que esta folga de diferença são de uma importação antiga, já substituída por outra.
const JANELA_REGISTRO_MS = 5 * 60 * 1000;

function textoBase(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;:,\s]+$/, "");
}

// Tabela de apelidos: a plataforma de simulados nem sempre escreve o mesmo tema do mesmo
// jeito (ex: "Dinâmica - Trabalho e Energia" num simulado e "Trabalho e Energia." em outro).
// Cada linha junta as variações sob um nome canônico, que é o que aparece na tela.
// Para juntar mais um par de nomes, acrescente uma linha: [nome canônico, [variações]].
const APELIDOS: [string, string[]][] = [
  ["Trabalho e Energia", ["Dinâmica - Trabalho e Energia", "Dinâmica Trabalho e Energia"]],
];

const MAPA_APELIDOS = new Map<string, { norm: string; nome: string }>();
for (const [canonico, variacoes] of APELIDOS) {
  const norm = textoBase(canonico);
  MAPA_APELIDOS.set(norm, { norm, nome: canonico });
  for (const v of variacoes) MAPA_APELIDOS.set(textoBase(v), { norm, nome: canonico });
}

// Chave de comparação e nome de exibição de um assunto, já com os apelidos aplicados.
export function resolverAssunto(texto: string): { norm: string; nome: string } {
  const t = texto.trim();
  return MAPA_APELIDOS.get(textoBase(t)) ?? { norm: textoBase(t), nome: t };
}

// minúsculas, sem acento, sem pontuação no fim e com os apelidos aplicados
export function normalizarAssunto(texto: string): string {
  return resolverAssunto(texto).norm;
}

// Palavras-chave por disciplina (já sem acento). Casam no início de uma palavra, então
// "gerador" pega "geradores". O peso padrão é o tamanho da palavra; [palavra, peso] força
// um peso maior. Vence a disciplina com a maior soma; empate ou nenhum casamento deixa
// "A classificar".
type Chave = string | [string, number];
const PALAVRAS_CHAVE: Record<string, Chave[]> = {
  Biologia: [
    "ecologia", "ecossistema", "cadeia alimentar", "biogeoquimic", "poluicao", "especiacao",
    "evolucao", "selecao natural", "genetic", "hereditariedade", "mendel", "dna", "rna",
    "acidos nucleicos", "replicacao", "transcricao", "traducao", "mitose", "meiose", "citologia",
    "celula", "organela", "membrana plasmatica", "fotossintese", "respiracao celular", "fermentacao",
    "gimnosperma", "angiosperma", "briofita", "pteridofita", "botanica", "fisiologia vegetal",
    "platyhelminthes", "nematelminto", "anelideo", "artropode", "molusco", "filo", "zoologia",
    "bacteria", "virus", "fungo", "protozoario", "doencas", "parasit", "vacina",
    "sistema circulatorio", "sistema imune", "imunologia", "endocrin", "hormonio",
    "sistema nervoso", "sistema digestor", "sistema digestorio", "sistema respirat",
    "sistema excretor", "sistema reprodutor", "reproducao", "embriolog", "histologia",
    "engenharia genetica", "biotecnologia", "transgenic", "biodiversidade", "bioma", "bioquimica",
    ["genealogia", 20], ["heredograma", 20], ["probabilidade em genetica", 30],
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
    "fisica moderna", "efeito fotoeletrico", "relatividade", "grandezas fisicas",
  ],
  Quimica: [
    "estequiometr", "intermolecul", "quimica ambiental", "misturas", "solucoes", "solucao",
    "reacoes", "reacao quimica", "acido", "neutralizacao", "ph e poh", "oxido", "funcoes oxigenadas",
    "funcoes organicas", "organic", "isomeria", "hidrocarbonet", "polimero", "atomo", "atomic",
    "tabela periodica", "ligacao", "ligacoes", "ligacoes quimicas", "radioatividade", "termoquimica",
    "entalpia", "cinetica quimica", "equilibrio quimico", "eletroquimica", "pilha", "eletrolise",
    "gases", "mol", "concentracao", "diluicao", "titulacao", "separacao de misturas",
    "propriedades coligativas", "combustive", "petroleo", "nox", "quimica verde",
    "grandezas quimicas", "quimic",
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

const DISCIPLINAS_NATUREZA = ["Biologia", "Fisica", "Quimica"];

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const REGEX_PALAVRAS = Object.entries(PALAVRAS_CHAVE).map(([disc, chaves]) => ({
  disc,
  itens: chaves.map((c) => {
    const [palavra, peso] = typeof c === "string" ? [c, c.length] : c;
    return { peso, re: new RegExp("(^|[^a-z0-9])" + escapeRegex(palavra)) };
  }),
}));

// Decide a disciplina a partir do texto do assunto e, quando conhecida, da área da prova
// em que o erro foi registrado. Áreas que não são Natureza já dizem a disciplina, e em
// Natureza só Biologia, Física e Química concorrem (Matemática não).
export function classificarDisciplina(assunto: string, areaNome?: string | null): string {
  const area = textoBase(areaNome || "");
  if (area.includes("matematica")) return "Matemática";
  if (area.includes("linguagens")) return "Linguagens";
  if (area.includes("humanas")) return "Ciências Humanas";
  if (area.includes("redacao")) return "Redação";
  const soNatureza = area.includes("natureza");

  const texto = textoBase(assunto);
  let melhor: { disc: string; pontos: number } | null = null;
  let empate = false;
  for (const { disc, itens } of REGEX_PALAVRAS) {
    if (soNatureza && !DISCIPLINAS_NATUREZA.includes(disc)) continue;
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

export type ResultadoSincronizacao = {
  criados: number;
  atualizados: number;
  reabertos: number;
  removidos: number;
};

export type GrupoAssunto = {
  assunto: string; // nome de exibição (já com apelido aplicado)
  vezes: number; // ocorrências do erro (o mesmo simulado pode repetir)
  simulados: number; // em quantos simulados diferentes o assunto apareceu
  areaId: string;
  areaNome: string;
};

type ResultadoComErros = {
  areaId: string;
  area: { nome: string };
  simulado: { id: string; data: Date; nome: string | null; observacao: string | null; createdAt: Date };
  conteudosErrados: { conteudo: string }[];
};

// Junta os erros por assunto (com apelidos aplicados). O registro único de ENEM grava uma
// cópia no ENEM-USP e outra no ENEM/SISU: elas contam uma vez só, como um simulado só. Se o
// mesmo simulado foi importado de novo, vale a importação mais recente. Recebe os
// resultados em ordem de criação.
export function agruparErros(resultados: ResultadoComErros[]): Map<string, GrupoAssunto> {
  const ehFicticio = (r: ResultadoComErros) => !!r.simulado.observacao?.startsWith(MARCA_FICTICIO);
  const ehCopia = (r: ResultadoComErros) => !!r.simulado.observacao?.includes(MARCA_COPIA_ENEM);
  const dia = (r: ResultadoComErros) => r.simulado.data.toISOString().slice(0, 10);
  const chaveCopia = (r: ResultadoComErros) => `${dia(r)}|${r.simulado.nome ?? ""}|${r.area.nome}`;

  const ultimoRegistro = new Map<string, number>();
  for (const r of resultados) {
    if (ehFicticio(r) || !ehCopia(r)) continue;
    const k = chaveCopia(r);
    ultimoRegistro.set(k, Math.max(ultimoRegistro.get(k) ?? 0, r.simulado.createdAt.getTime()));
  }

  const copiasVistas = new Set<string>();
  const grupos = new Map<string, GrupoAssunto>();
  const simuladosPorAssunto = new Map<string, Set<string>>();

  for (const r of resultados) {
    // simulados de "dados fictícios" (seed de teste) não entram na revisão
    if (ehFicticio(r)) continue;
    let idSimulado = r.simulado.id;
    if (ehCopia(r)) {
      const k = chaveCopia(r);
      if (ultimoRegistro.get(k)! - r.simulado.createdAt.getTime() > JANELA_REGISTRO_MS) continue;
      if (copiasVistas.has(k)) continue;
      copiasVistas.add(k);
      idSimulado = `enem|${dia(r)}|${r.simulado.nome ?? ""}`;
    }
    for (const c of r.conteudosErrados) {
      const { norm, nome } = resolverAssunto(c.conteudo);
      if (!norm) continue;
      const g = grupos.get(norm);
      if (g) g.vezes++;
      else grupos.set(norm, { assunto: nome, vezes: 1, simulados: 0, areaId: r.areaId, areaNome: r.area.nome });
      const ids = simuladosPorAssunto.get(norm) ?? new Set<string>();
      ids.add(idSimulado);
      simuladosPorAssunto.set(norm, ids);
    }
  }
  for (const [norm, ids] of simuladosPorAssunto) grupos.get(norm)!.simulados = ids.size;
  return grupos;
}

// Lê os ConteudoErrado de todos os simulados e agrupa por assunto. Só leitura.
export async function carregarGrupos(): Promise<Map<string, GrupoAssunto>> {
  const resultados = await prisma.resultado.findMany({
    where: { conteudosErrados: { some: {} } },
    include: { conteudosErrados: true, area: true, simulado: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return agruparErros(resultados);
}

export type PlanoSincronizacao = {
  grupos: Map<string, GrupoAssunto>;
  novos: Prisma.ConteudoRevisaoCreateManyInput[];
  atualizacoes: { id: string; assunto: string; data: Prisma.ConteudoRevisaoUpdateInput; reabriu: boolean }[];
  remover: { id: string; assunto: string }[];
};

// Calcula o que a sincronização faria, sem gravar nada. Todo assunto errado em algum
// simulado entra na Revisão: MEDIA se errou uma vez, ALTA se errou 2 ou mais vezes.
// O que o usuário já mexeu (revisado, comentado, prioridade ajustada, disciplina definida)
// é preservado.
export async function planejarSincronizacao(): Promise<PlanoSincronizacao> {
  const grupos = await carregarGrupos();

  const existentes = await prisma.conteudoRevisao.findMany({
    include: { _count: { select: { logs: true } } },
  });
  const porNorm = new Map<string, typeof existentes>();
  for (const e of existentes) {
    const lista = porNorm.get(e.assuntoNorm);
    if (lista) lista.push(e);
    else porNorm.set(e.assuntoNorm, [e]);
  }

  // Itens que a própria importação criou, ninguém mexeu e cujo assunto sumiu dos simulados
  // (simulado apagado) saem da lista. Prioridade igual à que a importação daria conta como
  // "ninguém mexeu".
  const remover: PlanoSincronizacao["remover"] = [];
  const removiveis = new Set<string>();
  for (const e of existentes) {
    if (e.origem !== "SIMULADO" || grupos.has(e.assuntoNorm)) continue;
    const prioridadeEsperada = e.vezesErrado >= MIN_ERROS_PRIORIDADE_ALTA ? "ALTA" : "MEDIA";
    const intocado =
      e.status === "PENDENTE" && e._count.logs === 0 && !e.observacao && e.prioridade === prioridadeEsperada;
    if (intocado) {
      removiveis.add(e.id);
      remover.push({ id: e.id, assunto: e.assunto });
    }
  }

  const novos: PlanoSincronizacao["novos"] = [];
  const atualizacoes: PlanoSincronizacao["atualizacoes"] = [];

  for (const [norm, g] of grupos) {
    const disciplina = classificarDisciplina(g.assunto, g.areaNome);
    const lista = (porNorm.get(norm) ?? []).filter((e) => !removiveis.has(e.id));

    if (lista.length === 0) {
      novos.push({
        assunto: g.assunto,
        assuntoNorm: norm,
        disciplina,
        areaId: g.areaId,
        origem: "SIMULADO",
        vezesErrado: g.vezes,
        prioridade: g.vezes >= MIN_ERROS_PRIORIDADE_ALTA ? "ALTA" : "MEDIA",
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
    // Sobe para ALTA só no momento em que o assunto passa a se repetir e a prioridade ainda
    // é a padrão. Assim, uma prioridade que o usuário escolheu depois não é desfeita.
    if (
      g.vezes >= MIN_ERROS_PRIORIDADE_ALTA &&
      atual.vezesErrado < MIN_ERROS_PRIORIDADE_ALTA &&
      atual.prioridade === "MEDIA"
    ) {
      data.prioridade = "ALTA";
    }
    // só mexe na disciplina se ainda não foi definida (nunca sobrescreve ajuste do usuário)
    if (atual.disciplina === DISCIPLINA_PADRAO && disciplina !== DISCIPLINA_PADRAO) {
      data.disciplina = disciplina;
    }
    if (!atual.areaId) data.area = { connect: { id: g.areaId } };

    if (Object.keys(data).length === 0) continue;
    atualizacoes.push({ id: atual.id, assunto: atual.assunto, data, reabriu });
  }

  return { grupos, novos, atualizacoes, remover };
}

// Aplica o plano no banco. Idempotente: rodar de novo com os mesmos dados não muda nada.
export async function sincronizarSimulados(): Promise<ResultadoSincronizacao> {
  const { novos, atualizacoes, remover } = await planejarSincronizacao();

  await prisma.$transaction([
    ...(remover.length
      ? [prisma.conteudoRevisao.deleteMany({ where: { id: { in: remover.map((r) => r.id) } } })]
      : []),
    ...(novos.length ? [prisma.conteudoRevisao.createMany({ data: novos })] : []),
    ...atualizacoes.map((a) => prisma.conteudoRevisao.update({ where: { id: a.id }, data: a.data })),
  ]);

  const reabertos = atualizacoes.filter((a) => a.reabriu).length;
  return {
    criados: novos.length,
    atualizados: atualizacoes.length - reabertos,
    reabertos,
    removidos: remover.length,
  };
}

// Usada logo depois de importar ou registrar simulados. Nunca derruba quem chamou: se a
// sincronização falhar, o simulado já está salvo e devolvemos null para a tela avisar.
export async function sincronizarSeguro(): Promise<ResultadoSincronizacao | null> {
  try {
    return await sincronizarSimulados();
  } catch (e) {
    console.error("Falha ao sincronizar a Revisão após salvar o simulado:", e);
    return null;
  }
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
