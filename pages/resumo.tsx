import { useEffect, useMemo, useState } from "react";

type ResumoMateria = {
  materia: string;
  cardsFeitosSemana: number;
  cardsCorretosSemana: number;
  taxaAcertoSemana: number | null;
  diasPlanejados: number;
  diasFeitos: number;
};

type Resumo = {
  periodo: { inicio: string; fim: string };
  porMateria: ResumoMateria[];
};

type PlanoDia = {
  id: string;
  materia: string;
  data: string;
  diaSemana: string | null;
  topicos: string | null;
  feito: boolean;
  observacoes: string | null;
  syncedAt: string;
};

const MATERIA_CHIP: Record<string, string> = {
  Biologia: "bg-bio/10 text-bio",
  Quimica: "bg-qui/10 text-qui",
  Fisica: "bg-fis/10 text-fis",
};

const MATERIA_LABEL: Record<string, string> = {
  Biologia: "Biologia",
  Quimica: "Química",
  Fisica: "Física",
};

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function Resumo() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [plano, setPlano] = useState<PlanoDia[] | null>(null);
  const [filtroMateria, setFiltroMateria] = useState<string>("Todas");
  const [soPendentes, setSoPendentes] = useState(false);

  useEffect(() => {
    fetch("/api/resumo-semanal").then((r) => r.json()).then(setResumo);
    fetch("/api/notion-sync").then((r) => r.json()).then(setPlano);
  }, []);

  const listaFiltrada = useMemo(() => {
    if (!plano) return [];
    return plano
      .filter((p) => filtroMateria === "Todas" || p.materia === filtroMateria)
      .filter((p) => !soPendentes || !p.feito)
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [plano, filtroMateria, soPendentes]);

  const totais = useMemo(() => {
    if (!plano) return null;
    const total = plano.length;
    const feitos = plano.filter((p) => p.feito).length;
    return { total, feitos, pct: total ? Math.round((feitos / total) * 100) : 0 };
  }, [plano]);

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Resumo semanal</h1>
        <p className="text-sm text-ink/60 mt-1">
          Cronograma planejado no Notion comparado com o progresso real de flashcards no RemNote.
        </p>
      </div>

      {!resumo || !plano || !totais ? (
        <p className="text-sm text-ink/60">Carregando...</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-white rounded-xl border border-ink/10 p-4">
              <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Dias no cronograma</p>
              <p className="font-display text-3xl font-semibold">{totais.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-ink/10 p-4">
              <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Já estudados</p>
              <p className="font-display text-3xl font-semibold">
                {totais.feitos} <span className="text-base font-sans font-normal text-ink/50">de {totais.total}</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-ink/10 p-4">
              <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Progresso geral</p>
              <p className="font-display text-3xl font-semibold">{totais.pct}%</p>
            </div>
          </div>

          <section>
            <h2 className="text-xs uppercase tracking-wide text-ink/50 mb-3">
              Últimos 7 dias ({fmtData(resumo.periodo.inicio)} – {fmtData(resumo.periodo.fim)})
            </h2>
            {resumo.porMateria.length === 0 ? (
              <p className="text-sm text-ink/50 bg-white rounded-xl border border-ink/10 p-4">
                Nenhum dado de RemNote ou Notion sincronizado ainda.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {resumo.porMateria.map((m) => (
                  <div key={m.materia} className="bg-white rounded-xl border border-ink/10 p-4">
                    <p className="font-medium text-sm mb-2">{MATERIA_LABEL[m.materia] ?? m.materia}</p>
                    <div className="flex items-baseline justify-between text-sm mb-1">
                      <span className="text-ink/60">Cards feitos</span>
                      <span className="font-mono font-medium">{m.cardsFeitosSemana}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm mb-1">
                      <span className="text-ink/60">Taxa de acerto</span>
                      <span className="font-mono font-medium">
                        {m.taxaAcertoSemana != null ? `${m.taxaAcertoSemana}%` : "—"}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink/60">Cronograma</span>
                      <span className="font-mono font-medium">
                        {m.diasFeitos}/{m.diasPlanejados} dias
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h2 className="text-xs uppercase tracking-wide text-ink/50 mr-2">Cronograma completo</h2>
              {["Todas", "Biologia", "Quimica", "Fisica"].map((m) => (
                <button
                  key={m}
                  onClick={() => setFiltroMateria(m)}
                  className={
                    "text-xs px-3 py-1.5 rounded-full border transition " +
                    (filtroMateria === m
                      ? "bg-accent text-white border-accent"
                      : "border-ink/15 text-ink/60 hover:border-accent/50 hover:text-accent")
                  }
                >
                  {m === "Todas" ? "Todas" : MATERIA_LABEL[m]}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-1.5 text-xs text-ink/60">
                <input
                  type="checkbox"
                  checked={soPendentes}
                  onChange={(e) => setSoPendentes(e.target.checked)}
                />
                Só pendentes
              </label>
            </div>

            <div className="space-y-1.5">
              {listaFiltrada.length === 0 && (
                <p className="text-sm text-ink/40 text-center py-8">Nenhum dia com esse filtro.</p>
              )}
              {listaFiltrada.map((item) => {
                const chipClass = MATERIA_CHIP[item.materia] ?? "bg-ink/10 text-ink/70";
                const topicos = (item.topicos ?? "").split(";").map((t) => t.trim()).filter(Boolean);
                const passado = item.data.slice(0, 10) < hoje;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-ink/10 px-3.5 py-2.5 grid grid-cols-[56px_1fr_auto] gap-3 items-start"
                  >
                    <div className="font-mono text-xs text-ink/50 pt-0.5">
                      {fmtData(item.data)}
                      <div className="text-[10px] text-ink/35">{(item.diaSemana ?? "").replace("-feira", "")}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {topicos.map((t) => (
                          <span
                            key={t}
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${chipClass}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-ink/50 line-clamp-2">{item.observacoes}</p>
                    </div>
                    <span
                      className={
                        "text-[11px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap " +
                        (item.feito ? "bg-good/10 text-good" : passado ? "bg-warn/10 text-warn" : "bg-ink/5 text-ink/40")
                      }
                    >
                      {item.feito ? "Feito" : passado ? "Atrasado" : "Pendente"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
