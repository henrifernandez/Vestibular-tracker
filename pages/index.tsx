import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ehRedacao } from "@/lib/redacao";

type AreaDash = {
  id: string;
  nome: string;
  totalQuestoes: number;
  ultimoAcertos: number | null;
  ultimoTotal: number | null;
  progresso: number | null;
  qtdSimulados: number;
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
type RemnoteRow = { materia: string; syncedAt: string; cardsFeitos: number; cardsCorretos: number };
type ResumoMateria = { materia: string; cardsFeitosSemana: number };

// Provas que na prática são a mesma prova física (ENEM), só com peso e nota de
// corte diferentes por universidade — por isso ficam agrupadas visualmente em
// vez de aparecerem como provas independentes. Ver PROVAS_DESTINO_ENEM em
// pages/api/simulados/index.ts, que já faz esse fan-out no registro.
const GRUPOS: Record<string, { label: string; membros: string[] }> = {
  enem: { label: "ENEM", membros: ["enem-usp", "unicamp-sisu"] },
};

const MATERIA_ESTILO: Record<string, { bg: string; sigla: string }> = {
  Biologia: { bg: "bg-bio", sigla: "BIO" },
  Quimica: { bg: "bg-qui", sigla: "QUI" },
  Química: { bg: "bg-qui", sigla: "QUI" },
  Fisica: { bg: "bg-fis", sigla: "FIS" },
  Física: { bg: "bg-fis", sigla: "FIS" },
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
  const [remnote, setRemnote] = useState<RemnoteRow[] | null>(null);
  const [resumo, setResumo] = useState<ResumoMateria[] | null>(null);
  const [abertoId, setAbertoId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/simulados").then((r) => r.json()),
      fetch("/api/notion-sync").then((r) => r.json()),
      fetch("/api/remnote-sync").then((r) => r.json()),
      fetch("/api/resumo-semanal").then((r) => r.json()),
    ]).then(([d, s, p, rn, rs]) => {
      setProvas(d);
      setSimulados(s);
      setPlano(p);
      setRemnote(rn);
      setResumo(rs.porMateria ?? []);
    });
  }, []);

  const membrosAgrupados = useMemo(
    () => new Set(Object.values(GRUPOS).flatMap((g) => g.membros)),
    []
  );

  if (!provas || !simulados || !plano || !remnote || !resumo) {
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

  const cardsRevisadosSemana = resumo.reduce((s, m) => s + m.cardsFeitosSemana, 0);
  const cronogramaFeito = plano.filter((p) => p.feito).length;
  const pctCronograma = plano.length ? Math.round((cronogramaFeito / plano.length) * 100) : null;

  const ultimaSyncNotion = plano.length
    ? plano.reduce((max, p) => (p.syncedAt > max ? p.syncedAt : max), plano[0].syncedAt)
    : null;
  const ultimaSyncRemnote = remnote.length
    ? remnote.reduce((max, r) => (r.syncedAt > max ? r.syncedAt : max), remnote[0].syncedAt)
    : null;

  const materiasNotion = Array.from(new Set(plano.map((p) => p.materia).filter(Boolean)));
  const remnotePorMateria = new Map(remnote.map((r) => [r.materia, r]));

  const simuladosRecentes = simulados.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Painel de evolução</h1>
          <p className="text-sm text-ink/60 mt-1">
            Progresso consolidado de simulados, cronograma e flashcards.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 bg-white border border-ink/10 rounded-full pl-2.5 pr-3 py-1.5 text-xs">
            <span className={"h-1.5 w-1.5 rounded-full " + (ultimaSyncNotion ? "bg-good" : "bg-warn")} />
            <span className="font-medium">Notion</span>
            <span className="font-mono text-ink/50">
              {ultimaSyncNotion ? `sync ${formatHora(ultimaSyncNotion)}` : "nunca"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-ink/10 rounded-full pl-2.5 pr-3 py-1.5 text-xs">
            <span className={"h-1.5 w-1.5 rounded-full " + (ultimaSyncRemnote ? "bg-good" : "bg-warn")} />
            <span className="font-medium">RemNote</span>
            <span className="font-mono text-ink/50">
              {ultimaSyncRemnote ? `sync ${formatHora(ultimaSyncRemnote)}` : "aguardando reconexão"}
            </span>
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Progresso geral</div>
          <div className="font-display text-2xl font-semibold mt-1">
            {progressoGeral != null ? `${progressoGeral}%` : "—"}
          </div>
          <div className="text-xs text-ink/50 mt-1">média entre {provas.length} provas ativas</div>
        </div>
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Simulados registrados</div>
          <div className="font-display text-2xl font-semibold mt-1">{simulados.length}</div>
          <div className="text-xs text-ink/50 mt-1">no total</div>
        </div>
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Cards revisados (7d)</div>
          <div className={"font-display text-2xl font-semibold mt-1 " + (remnote.length ? "" : "text-warn")}>
            {remnote.length ? cardsRevisadosSemana : "—"}
          </div>
          <div className={"text-xs mt-1 " + (remnote.length ? "text-ink/50" : "text-warn")}>
            {remnote.length ? "últimos 7 dias" : "RemNote ainda não sincronizado"}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-ink/10 p-4">
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
                <div key={linha.id} className="bg-white rounded-xl border border-ink/10 overflow-hidden">
                  <button
                    onClick={() => setAbertoId(aberto ? null : linha.id)}
                    className="flex items-center gap-3.5 px-5 py-3.5 w-full text-left hover:bg-paper/60 transition"
                  >
                    <ChevronIcon aberto={aberto} />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[15px] font-medium">{linha.nome}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wide bg-accent/10 text-accent rounded-full px-2 py-0.5">
                        2 metas
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {linha.destinos.map((d) => {
                        const pct = progressoMedio(d);
                        return (
                          <span key={d.id} className="font-mono text-[11px] bg-ink/5 rounded-full px-2.5 py-1">
                            {d.slug === "unicamp-sisu" ? "UNICAMP" : "USP"} {pct != null ? `${pct}%` : "—"}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                  {aberto && (
                    <div className="px-5 pb-4 pl-[50px] grid gap-3 sm:grid-cols-2">
                      <p className="text-xs text-ink/55 sm:col-span-2 -mt-1 mb-1 max-w-xl">
                        Mesma prova física do ENEM — pesos e nota de corte próprios de cada
                        universidade. Registre o simulado uma vez em{" "}
                        <strong>&quot;ENEM (registro único)&quot;</strong>: o resultado é copiado
                        automaticamente para as duas.
                      </p>
                      {linha.destinos.map((d) => {
                        const pct = progressoMedio(d);
                        return (
                          <div key={d.id} className="border border-ink/10 rounded-lg p-3.5">
                            <Link href={`/provas/${d.slug}`} className="text-sm font-semibold hover:text-accent">
                              {d.slug === "unicamp-sisu" ? "UNICAMP (Ciência da Computação)" : "USP (IME — Ciência da Computação)"}
                            </Link>
                            <div className="text-[11px] text-ink/50 mt-0.5">{d.descricao}</div>
                            <div className="flex items-center gap-2 mt-2.5">
                              <div className="flex-1 h-1.5 rounded-full bg-ink/10 overflow-hidden">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${pct ?? 0}%` }} />
                              </div>
                              <span className="font-mono text-xs text-ink/60">{pct != null ? `${pct}%` : "—"}</span>
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
            return (
              <div key={linha.id} className="bg-white rounded-xl border border-ink/10 overflow-hidden">
                <button
                  onClick={() => setAbertoId(aberto ? null : linha.id)}
                  className="flex items-center gap-3.5 px-5 py-3.5 w-full text-left hover:bg-paper/60 transition"
                >
                  <ChevronIcon aberto={aberto} />
                  <div className="flex-1">
                    <div className="text-[15px] font-medium">{prova.nome}</div>
                    {prova.descricao && (
                      <div className="text-xs text-ink/50 mt-0.5">{prova.descricao}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-28 h-1.5 rounded-full bg-ink/10 overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct ?? 0}%` }} />
                    </div>
                    <span className="font-mono text-xs w-9 text-right text-ink/60">
                      {pct != null ? `${pct}%` : "—"}
                    </span>
                  </div>
                </button>
                {aberto && (
                  <div className="px-5 pb-4 pl-[50px] grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {prova.areas.map((area) => (
                      <div key={area.id} className="border border-ink/10 rounded-lg p-2.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{area.nome}</span>
                          <span className="text-ink/50 text-xs">
                            {ehRedacao(area.nome)
                              ? area.ultimoAcertos != null
                                ? `nota ${area.ultimoAcertos}`
                                : "sem dados"
                              : area.ultimoAcertos != null
                                ? `${area.ultimoAcertos}/${area.ultimoTotal}`
                                : "sem dados"}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-ink/10 mt-2 overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${area.progresso ?? 0}%` }} />
                        </div>
                      </div>
                    ))}
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
        <div className="bg-white rounded-xl border border-ink/10 overflow-hidden">
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

      {/* RemNote status */}
      <div className="bg-white rounded-xl border border-ink/10 p-4">
        <div className="flex items-center gap-2 mb-3.5 flex-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ultimaSyncRemnote ? "text-good" : "text-warn"}>
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <h2 className="font-display font-semibold text-base">Flashcards (RemNote)</h2>
          <span className={"text-xs " + (ultimaSyncRemnote ? "text-ink/50" : "text-warn")}>
            {ultimaSyncRemnote
              ? `última sincronização: hoje às ${formatHora(ultimaSyncRemnote)}`
              : "última sincronização: nunca — plugin aguardando reconexão"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {materiasNotion.map((materia) => {
            const estilo = MATERIA_ESTILO[materia] ?? { bg: "bg-ink/60", sigla: materia.slice(0, 3).toUpperCase() };
            const dados = remnotePorMateria.get(materia);
            return (
              <div
                key={materia}
                className={
                  "rounded-lg p-3 flex items-center gap-2.5 " +
                  (dados ? "border border-ink/10" : "border border-dashed border-ink/20")
                }
              >
                <div className={"w-8 h-8 rounded-lg text-white flex items-center justify-center font-mono text-[11px] font-semibold flex-shrink-0 " + estilo.bg}>
                  {estilo.sigla}
                </div>
                <div>
                  <div className="text-sm font-medium">{materia}</div>
                  <div className="text-[11px] text-ink/45">
                    {dados ? `${dados.cardsFeitos} cards · ${dados.cardsCorretos} certos` : "sem dados ainda"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
