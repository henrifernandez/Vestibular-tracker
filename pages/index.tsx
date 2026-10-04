import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ehRedacao } from "@/lib/redacao";
import CardRevisao from "@/components/CardRevisao";
import {
  estimarTRI,
  corSensor,
  mediaPonderada,
  mediaSimples,
  PESOS_NF_USP,
  SENSOR_DOT,
  SENSOR_BAR,
  SENSOR_TEXT,
  MARGEM_ACERTOS,
  MARGEM_TRI,
  MARGEM_REDACAO_20,
  MARGEM_NOTA_FINAL_10,
} from "@/lib/tri";

type MetaDash = { label: string; acertosAlvo: number | null; notaAlvo: number | null; observacao: string | null };

type AreaDash = {
  id: string;
  nome: string;
  totalQuestoes: number;
  ehRedacao?: boolean;
  ultimaNota?: number | null;
  ultimoAcertos: number | null;
  ultimoTotal: number | null;
  progresso: number | null;
  qtdSimulados: number;
  metas: MetaDash[];
};

type ProvaDash = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  areas: AreaDash[];
};

type SimuladoResultado = {
  acertos: number;
  totalQuestoes: number;
  notaEstimada: number | null;
  area: { nome: string };
};

type SimuladoRow = {
  id: string;
  data: string;
  prova: { nome: string; slug: string };
  resultados: SimuladoResultado[];
};

type PlanoEstudoRow = { feito: boolean; syncedAt: string; materia: string };

// Provas que na prática são a mesma prova física (ENEM), só com peso e nota de
// corte diferentes por universidade — por isso ficam agrupadas visualmente em
// vez de aparecerem como provas independentes. Ver PROVAS_DESTINO_ENEM em
// pages/api/simulados/index.ts, que já faz esse fan-out no registro.
const GRUPOS: Record<string, { label: string; membros: string[] }> = {
  enem: { label: "ENEM", membros: ["enem-usp", "unicamp-sisu"] },
};

function ChevronIcon({ aberto }: { aberto: boolean }) {
  return (
    <span
      className={
        "inline-flex text-ink/40 transition-transform duration-150 " + (aberto ? "rotate-90" : "")
      }
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 6 15 12 9 18"></polyline>
      </svg>
    </span>
  );
}

// Nota final projetada do Provão Paulista Seriado: 1º+2º ano já contam fixo
// (2,33 pontos), o resto vem do 3º ano (questões + redação), conforme a
// fórmula do próprio edital (SEDUC) — Nota Final = 1ºano×0,15 + 2ºano×0,25 +
// 3ºano×0,40 + Redação×0,20.
const CONTRIBUICAO_FIXA_PROVAO = 2.33;
const AREAS_3_ANO_PROVAO = ["Linguagens", "Ciências da Natureza", "Matemática", "Ciências Humanas"];
const META_NOTA_FINAL_PROVAO = 7.3; // meta mais realista (Unicamp CC): 7,2–7,4

function notaFinalProvao(areas: AreaDash[]): number {
  const areas3ano = areas.filter((a) => AREAS_3_ANO_PROVAO.includes(a.nome));
  const acertos3ano = areas3ano.reduce((s, a) => s + (a.ultimoAcertos ?? 0), 0);
  const total3ano = areas3ano.reduce((s, a) => s + a.totalQuestoes, 0);
  const nota3ano10 = total3ano > 0 ? (acertos3ano / total3ano) * 10 : 0;

  const redacao = areas.find((a) => ehRedacao(a.nome));
  const notaRedacao20 = redacao?.ultimaNota ?? 0;
  const notaRedacao10 = (notaRedacao20 / 20) * 10;

  return CONTRIBUICAO_FIXA_PROVAO + nota3ano10 * 0.4 + notaRedacao10 * 0.2;
}

function NotaFinalProvao({ areas }: { areas: AreaDash[] }) {
  const notaFinal = notaFinalProvao(areas);
  const sensor = corSensor(notaFinal, META_NOTA_FINAL_PROVAO, MARGEM_NOTA_FINAL_10);

  return (
    <div className="border border-ink/10 rounded-lg p-3 flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">Nota final projetada</div>
        <div className="text-[11px] text-ink/45 mt-0.5">meta Unicamp CC: 7,2–7,4</div>
      </div>
      <span className={"font-mono text-lg flex items-center gap-2 " + SENSOR_TEXT[sensor]}>
        <span className={"h-2 w-2 rounded-full " + SENSOR_DOT[sensor]} />
        {notaFinal.toFixed(2)}/10
      </span>
    </div>
  );
}

// Áreas que representam fases já encerradas (ex: 1º/2º ano do Provão Paulista
// Seriado) — contam ponto fixo na nota final, mas não devem entrar na média de
// "progresso ativo", senão uma fase já 100% cumprida infla artificialmente o
// progresso de áreas que ainda não têm nenhum resultado registrado.
const AREAS_HISTORICAS = new Set(["1º Ano (2023)", "2º Ano (2024)"]);

function progressoMedio(prova: ProvaDash): number | null {
  const valores = prova.areas
    .filter((a) => !AREAS_HISTORICAS.has(a.nome))
    .map((a) => a.progresso)
    .filter((v): v is number => v != null);
  if (valores.length === 0) return null;
  return Math.round(valores.reduce((s, v) => s + v, 0) / valores.length);
}

function metaAcertos(area: AreaDash): number | null {
  const valores = area.metas.map((m) => m.acertosAlvo).filter((v): v is number => v != null);
  return valores.length ? Math.max(...valores) : null;
}

function metaNota(area: AreaDash): number | null {
  const valores = area.metas.map((m) => m.notaAlvo).filter((v): v is number => v != null);
  return valores.length ? Math.max(...valores) : null;
}

// TRI estimada de cada área objetiva do ENEM a partir dos acertos, mais a nota
// real da Redação (correção por IA) — só usado nos destinos do grupo ENEM
// (USP/UNICAMP), ver lib/tri.ts.
function valoresTriPorArea(prova: ProvaDash): Record<string, number | null> {
  const valores: Record<string, number | null> = {};
  for (const area of prova.areas) {
    if (ehRedacao(area.nome)) {
      valores[area.nome] = area.ultimaNota ?? null;
    } else {
      valores[area.nome] = area.ultimoAcertos != null ? estimarTRI(area.nome, area.ultimoAcertos) : null;
    }
  }
  return valores;
}

// USP pondera as áreas (Matemática 3, Linguagens 2, Natureza 2, Redação 2,
// Humanas 1); UNICAMP-SISU é média simples das 5 — cada uma com sua própria
// nota de corte.
const NF_META: Record<string, number> = { "enem-usp": 830, "unicamp-sisu": 750 };

function calcularNF(prova: ProvaDash): number | null {
  const valores = valoresTriPorArea(prova);
  return prova.slug === "enem-usp" ? mediaPonderada(valores, PESOS_NF_USP) : mediaSimples(valores);
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function resumoSimulado(s: SimuladoRow): { texto: string; pct: number | null } {
  if (s.resultados.length === 0) return { texto: "sem resultados", pct: null };

  if (s.resultados.length === 1) {
    const r = s.resultados[0];
    if (ehRedacao(r.area.nome)) {
      return {
        texto: `${r.area.nome} — nota ${r.notaEstimada ?? "?"}`,
        pct: r.notaEstimada != null ? Math.round((r.notaEstimada / 1000) * 100) : null,
      };
    }
    return {
      texto: `${r.area.nome} — ${r.acertos}/${r.totalQuestoes}`,
      pct: r.totalQuestoes > 0 ? Math.round((r.acertos / r.totalQuestoes) * 100) : null,
    };
  }

  const objetivas = s.resultados.filter((r) => !ehRedacao(r.area.nome));
  const totalAcertos = objetivas.reduce((sum, r) => sum + r.acertos, 0);
  const totalQuestoes = objetivas.reduce((sum, r) => sum + r.totalQuestoes, 0);
  const pct = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : null;
  return { texto: `${s.resultados.length} áreas — média ${pct ?? "?"}%`, pct };
}

export default function Dashboard() {
  const [provas, setProvas] = useState<ProvaDash[] | null>(null);
  const [simulados, setSimulados] = useState<SimuladoRow[] | null>(null);
  const [plano, setPlano] = useState<PlanoEstudoRow[] | null>(null);
  const [abertoId, setAbertoId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/simulados").then((r) => r.json()),
      fetch("/api/notion-sync").then((r) => r.json()),
    ]).then(([d, s, p]) => {
      setProvas(d);
      setSimulados(s);
      setPlano(p);
    });
  }, []);

  const membrosAgrupados = useMemo(
    () => new Set(Object.values(GRUPOS).flatMap((g) => g.membros)),
    []
  );

  if (!provas || !simulados || !plano) {
    return <p className="text-sm text-ink/60">Carregando...</p>;
  }

  const provasPorSlug = new Map(provas.map((p) => [p.slug, p]));

  const linhas = [
    ...Object.entries(GRUPOS).map(([id, grupo]) => ({
      id,
      tipo: "grupo" as const,
      nome: grupo.label,
      destinos: grupo.membros
        .map((slug) => provasPorSlug.get(slug))
        .filter((p): p is ProvaDash => !!p),
    })),
    ...provas
      .filter((p) => !membrosAgrupados.has(p.slug))
      .map((p) => ({ id: p.slug, tipo: "simples" as const, prova: p })),
  ];

  const progressos = provas.map(progressoMedio).filter((v): v is number => v != null);
  const progressoGeral = progressos.length
    ? Math.round(progressos.reduce((s, v) => s + v, 0) / progressos.length)
    : null;

  const cronogramaFeito = plano.filter((p) => p.feito).length;
  const pctCronograma = plano.length ? Math.round((cronogramaFeito / plano.length) * 100) : null;

  const ultimaSyncNotion = plano.length
    ? plano.reduce((max, p) => (p.syncedAt > max ? p.syncedAt : max), plano[0].syncedAt)
    : null;

  const simuladosRecentes = simulados.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Painel de evolução</h1>
          <p className="text-sm text-ink/60 mt-1">
            Progresso consolidado de simulados, cronograma e revisão.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 bg-surface border border-ink/10 rounded-full pl-2.5 pr-3 py-1.5 text-xs">
            <span className={"h-1.5 w-1.5 rounded-full " + (ultimaSyncNotion ? "bg-good" : "bg-brand")} />
            <span className="font-medium">Notion</span>
            <span className="font-mono text-ink/50">
              {ultimaSyncNotion ? `sync ${formatHora(ultimaSyncNotion)}` : "nunca"}
            </span>
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-surface rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Progresso geral</div>
          <div className="font-display text-2xl font-semibold mt-1">
            {progressoGeral != null ? `${progressoGeral}%` : "—"}
          </div>
          <div className="text-xs text-ink/50 mt-1">média entre {provas.length} provas ativas</div>
        </div>
        <div className="bg-surface rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Simulados registrados</div>
          <div className="font-display text-2xl font-semibold mt-1">{simulados.length}</div>
          <div className="text-xs text-ink/50 mt-1">no total</div>
        </div>
        <CardRevisao />
        <div className="bg-surface rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Cronograma cumprido</div>
          <div className="font-display text-2xl font-semibold mt-1">
            {plano.length ? `${cronogramaFeito}/${plano.length}` : "—"}
          </div>
          <div className="text-xs text-ink/50 mt-1">
            {pctCronograma != null ? `${pctCronograma}% do planejado no Notion` : "sem dados ainda"}
          </div>
        </div>
      </div>

      {/* Provas */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">Provas</h2>
          <span className="text-xs text-ink/45">clique em uma prova para ver o progresso por área</span>
        </div>

        <div className="space-y-2.5">
          {linhas.map((linha) => {
            const aberto = abertoId === linha.id;

            if (linha.tipo === "grupo") {
              return (
                <div key={linha.id} className="bg-surface rounded-xl border border-ink/10 overflow-hidden">
                  <button
                    onClick={() => setAbertoId(aberto ? null : linha.id)}
                    className="flex items-center gap-3.5 px-5 py-3.5 w-full text-left hover:bg-paper/60 transition"
                  >
                    <ChevronIcon aberto={aberto} />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[15px] font-medium">{linha.nome}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wide bg-accent/10 text-brand rounded-full px-2 py-0.5">
                        2 metas
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {linha.destinos.map((d) => {
                        const nf = calcularNF(d);
                        const meta = NF_META[d.slug];
                        const sensor = nf != null ? corSensor(nf, meta, MARGEM_TRI) : null;
                        return (
                          <span
                            key={d.id}
                            className={"font-mono text-[11px] rounded-full px-2.5 py-1 " + (sensor ? SENSOR_TEXT[sensor] + " bg-ink/5" : "bg-ink/5 text-ink/40")}
                          >
                            {d.slug === "unicamp-sisu" ? "UNICAMP" : "USP"} {nf ?? "—"}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                  {aberto && (
                    <div className="px-5 pb-4 pl-[50px] grid gap-3 sm:grid-cols-2">
                      {linha.destinos.map((d) => {
                        const nf = calcularNF(d);
                        const meta = NF_META[d.slug];
                        const sensorNF = nf != null ? corSensor(nf, meta, MARGEM_TRI) : null;
                        return (
                          <div key={d.id} className="border border-ink/10 rounded-lg p-3.5">
                            <div className="flex items-center justify-between">
                              <Link href={`/provas/${d.slug}`} className="text-sm font-semibold hover:text-brand">
                                {d.slug === "unicamp-sisu" ? "UNICAMP (Ciência da Computação)" : "USP (IME — Ciência da Computação)"}
                              </Link>
                              <span className={"font-mono text-xs flex items-center gap-1.5 " + (sensorNF ? SENSOR_TEXT[sensorNF] : "text-ink/40")}>
                                {sensorNF && <span className={"h-1.5 w-1.5 rounded-full " + SENSOR_DOT[sensorNF]} />}
                                TRI média {nf ?? "—"} / {meta}
                              </span>
                            </div>
                            <div className="mt-3 space-y-2.5">
                              {d.areas.map((area) => {
                                const redacao = ehRedacao(area.nome);
                                const valor = redacao ? area.ultimaNota ?? null : area.ultimoAcertos;
                                const meta = redacao ? metaNota(area) : metaAcertos(area);
                                const margem = redacao ? MARGEM_TRI : MARGEM_ACERTOS;
                                const sensor = valor != null && meta != null ? corSensor(valor, meta, margem) : null;
                                return (
                                  <div key={area.id}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="text-ink/60">{area.nome}</span>
                                      <span className={"font-mono flex items-center gap-1.5 " + (sensor ? SENSOR_TEXT[sensor] : "text-ink/35")}>
                                        {sensor && <span className={"h-1.5 w-1.5 rounded-full " + SENSOR_DOT[sensor]} />}
                                        {valor != null ? (redacao ? `nota ${valor}` : `${valor}/${area.totalQuestoes}`) : "sem dados"}
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                                      <div
                                        className={"h-full rounded-full " + (sensor ? SENSOR_BAR[sensor] : "bg-accent")}
                                        style={{ width: `${area.progresso ?? 0}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const prova = linha.prova;
            const pct = progressoMedio(prova);
            const areasVisiveis = prova.areas.filter((a) => !AREAS_HISTORICAS.has(a.nome));
            const historico = prova.areas.filter((a) => AREAS_HISTORICAS.has(a.nome));

            // Sensor do cabeçalho: Provão usa a nota final projetada; provas de
            // área única (Fuvest, Comvest) usam a própria área contra sua meta.
            let sensorHeader: ReturnType<typeof corSensor> | null = null;
            if (prova.slug === "provao") {
              sensorHeader = corSensor(notaFinalProvao(prova.areas), META_NOTA_FINAL_PROVAO, MARGEM_NOTA_FINAL_10);
            } else {
              // Agrega acertos e meta de todas as áreas objetivas (soma bate com
              // a meta original da prova, já que foi rateada por área) — funciona
              // tanto pra prova de área única quanto pra várias áreas.
              const naoRedacao = areasVisiveis.filter((a) => !ehRedacao(a.nome));
              const somaAcertos = naoRedacao.reduce((s, a) => s + (a.ultimoAcertos ?? 0), 0);
              const somaMeta = naoRedacao.reduce((s, a) => s + (metaAcertos(a) ?? 0), 0);
              const temDados = naoRedacao.some((a) => a.ultimoAcertos != null);
              sensorHeader = temDados && somaMeta > 0 ? corSensor(somaAcertos, somaMeta, MARGEM_ACERTOS) : null;
            }

            return (
              <div key={linha.id} className="bg-surface rounded-xl border border-ink/10 overflow-hidden">
                <button
                  onClick={() => setAbertoId(aberto ? null : linha.id)}
                  className="flex items-center gap-3.5 px-5 py-3.5 w-full text-left hover:bg-paper/60 transition"
                >
                  <ChevronIcon aberto={aberto} />
                  <div className="flex-1">
                    <div className="text-[15px] font-medium">{prova.nome}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-28 h-2 rounded-full bg-ink/10 overflow-hidden">
                      <div
                        className={"h-full rounded-full " + (sensorHeader ? SENSOR_BAR[sensorHeader] : "bg-accent")}
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </div>
                    <span className={"font-mono text-xs w-9 text-right " + (sensorHeader ? SENSOR_TEXT[sensorHeader] : "text-ink/60")}>
                      {pct != null ? `${pct}%` : "—"}
                    </span>
                  </div>
                </button>
                {aberto && (
                  <div className="px-5 pb-4 pl-[50px] space-y-3">
                    {prova.slug === "provao" && <NotaFinalProvao areas={prova.areas} />}
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {areasVisiveis.map((area) => {
                        const redacao = ehRedacao(area.nome);
                        const valor = redacao ? area.ultimaNota ?? null : area.ultimoAcertos;
                        const meta = redacao ? metaNota(area) : metaAcertos(area);
                        const margem = redacao ? MARGEM_REDACAO_20 : MARGEM_ACERTOS;
                        const sensor = valor != null && meta != null ? corSensor(valor, meta, margem) : null;
                        return (
                          <div key={area.id} className="border border-ink/10 rounded-lg p-2.5">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">{area.nome}</span>
                              <span className={"text-xs flex items-center gap-1.5 " + (sensor ? SENSOR_TEXT[sensor] : "text-ink/50")}>
                                {sensor && <span className={"h-1.5 w-1.5 rounded-full " + SENSOR_DOT[sensor]} />}
                                {valor != null
                                  ? redacao
                                    ? `nota ${valor}`
                                    : `${valor}/${area.ultimoTotal}`
                                  : "sem dados"}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-ink/10 mt-2 overflow-hidden">
                              <div
                                className={"h-full rounded-full " + (sensor ? SENSOR_BAR[sensor] : "bg-accent")}
                                style={{ width: `${area.progresso ?? 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {historico.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {historico.map((a) => (
                          <span key={a.id} title={a.metas[0]?.observacao ?? undefined} className="font-mono text-[11px] text-ink/45 bg-ink/5 rounded-full px-2.5 py-1">
                            {a.nome}: {a.ultimoAcertos}/{a.ultimoTotal}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulados recentes */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Simulados recentes</h2>
        <div className="bg-surface rounded-xl border border-ink/10 overflow-hidden">
          {simuladosRecentes.length === 0 && (
            <p className="text-sm text-ink/50 px-5 py-4">Nenhum simulado registrado ainda.</p>
          )}
          {simuladosRecentes.map((s) => {
            const { texto, pct } = resumoSimulado(s);
            const cor = pct == null ? "text-ink/40" : pct >= 60 ? "text-good" : "text-warn";
            return (
              <Link
                key={s.id}
                href={`/provas/${s.prova.slug}`}
                className="flex items-center gap-3.5 px-5 py-2.5 border-b border-ink/[0.06] last:border-b-0 hover:bg-paper/60 transition text-sm"
              >
                <span className={"h-1.5 w-1.5 rounded-full flex-shrink-0 " + (pct == null ? "bg-ink/20" : pct >= 60 ? "bg-good" : "bg-warn")} />
                <span className="font-medium w-44 flex-shrink-0 truncate">{s.prova.nome}</span>
                <span className="font-mono text-xs text-ink/45 w-14 flex-shrink-0">
                  {new Date(s.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
                <span className="text-ink/70 flex-1 truncate">{texto}</span>
                <span className={"text-xs font-medium flex-shrink-0 " + cor}>
                  {pct != null ? `${pct}%` : ""}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
