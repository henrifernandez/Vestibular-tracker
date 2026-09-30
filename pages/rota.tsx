import { useEffect, useMemo, useState } from "react";
import {
  EVENTOS,
  MARCOS_PROVA,
  PROPOSTA,
  SEMANAS,
  type Categoria,
  type EventoRota,
} from "@/lib/rota-eventos";

type SimuladoApi = {
  id: string;
  nome: string | null;
  data: string;
  prova: { nome: string };
  resultados: { acertos: number; totalQuestoes: number }[];
};

const MATERIAS: { cat: Categoria; label: string; cor: string }[] = [
  { cat: "fis", label: "Física", cor: "#6B4FA0" },
  { cat: "mat", label: "Matemática", cor: "#2B5F58" },
  { cat: "quim", label: "Química", cor: "#2E6E8E" },
  { cat: "nat", label: "Natureza", cor: "#3F7D53" },
  { cat: "hum", label: "Humanas", cor: "#A8631C" },
  { cat: "ling", label: "Linguagens", cor: "#9C3D6B" },
  { cat: "red", label: "Redação", cor: "#B8860B" },
  { cat: "rev", label: "Erros e simulados", cor: "#5B6663" },
];
const COR: Record<string, string> = Object.fromEntries(MATERIAS.map((m) => [m.cat, m.cor]));

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const utc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const somar = (iso: string, n: number) => toIso(utc(iso) + n * 86400000);
const hm = (s: string) => {
  const [h, m] = s.split(":");
  return `${Number(h)}h${m === "00" ? "" : m}`;
};
const limpar = (t: string) => t.replace(/^(Estudo|Marco):\s*/, "");
const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const POR_DIA = new Map<string, EventoRota[]>();
for (const e of EVENTOS) {
  const l = POR_DIA.get(e.d) ?? [];
  l.push(e);
  POR_DIA.set(e.d, l);
}

function Pilula({
  ativo,
  onClick,
  cor,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  cor?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition " +
        (ativo
          ? "border-ink/20 bg-white text-ink"
          : "border-transparent text-ink/40 line-through hover:text-ink/60")
      }
    >
      {cor && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} />}
      {children}
    </button>
  );
}

export default function Rota() {
  const [hoje, setHoje] = useState<string | null>(null);
  const [mostrarProposta, setMostrarProposta] = useState(true);
  const [mostrarGenericos, setMostrarGenericos] = useState(false);
  const [ocultas, setOcultas] = useState<Set<Categoria>>(new Set());
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [simulados, setSimulados] = useState<SimuladoApi[]>([]);

  useEffect(() => setHoje(hojeIso()), []);

  useEffect(() => {
    fetch("/api/simulados")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setSimulados(d))
      .catch(() => {});
  }, []);

  const simuladosPorDia = useMemo(() => {
    const m = new Map<string, SimuladoApi[]>();
    for (const s of simulados) {
      const dia = s.data.slice(0, 10);
      m.set(dia, [...(m.get(dia) ?? []), s]);
    }
    return m;
  }, [simulados]);

  function alternar<T>(conj: Set<T>, valor: T, set: (s: Set<T>) => void) {
    const novo = new Set(conj);
    if (novo.has(valor)) novo.delete(valor);
    else novo.add(valor);
    set(novo);
  }

  const semanas = Array.from({ length: 7 }, (_, i) => somar("2026-09-28", i * 7));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Rota até o Enem</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/60">
          Calendário de 30/09 a 15/11 com as provas em destaque. Itens tracejados são a proposta e
          ainda não estão no Google Calendar. Simulados registrados no Tracker aparecem no dia em
          que foram feitos.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Contagem das provas">
        {MARCOS_PROVA.map((m) => {
          const dias = hoje ? Math.round((utc(m.d) - utc(hoje)) / 86400000) : null;
          return (
            <div
              key={m.d + m.detalhe}
              className={"rounded-lg border border-ink/10 bg-white p-3 " + (dias !== null && dias < 0 ? "opacity-50" : "")}
            >
              <div className="font-display text-3xl font-semibold leading-none">
                {dias === null ? " " : dias > 0 ? dias : dias === 0 ? "hoje" : "0"}
              </div>
              <div className="mt-1 text-xs text-ink/60">
                {dias === null ? "" : dias > 0 ? (dias === 1 ? "dia" : "dias") : dias < 0 ? "já passou" : ""}
              </div>
              <div className="mt-2 text-sm font-medium">
                {m.nome} {m.detalhe}
              </div>
              <div className="text-xs text-ink/60">
                {m.d.slice(8)}/{m.d.slice(5, 7)}
              </div>
            </div>
          );
        })}
      </section>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1">
          <Pilula ativo={mostrarProposta} onClick={() => setMostrarProposta(!mostrarProposta)}>
            Proposta
          </Pilula>
          <Pilula ativo={mostrarGenericos} onClick={() => setMostrarGenericos(!mostrarGenericos)}>
            Blocos genéricos
          </Pilula>
        </div>
        <div className="flex flex-wrap gap-1">
          {MATERIAS.map((m) => (
            <Pilula
              key={m.cat}
              ativo={!ocultas.has(m.cat)}
              cor={m.cor}
              onClick={() => alternar(ocultas, m.cat, setOcultas)}
            >
              {m.label}
            </Pilula>
          ))}
        </div>
      </div>

      {semanas.map((inicio) => (
        <section key={inicio} className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="font-display text-lg font-semibold">
              {Number(inicio.slice(8))} {MESES[Number(inicio.slice(5, 7)) - 1]} a{" "}
              {Number(somar(inicio, 6).slice(8))} {MESES[Number(somar(inicio, 6).slice(5, 7)) - 1]}
            </h2>
            <span className="text-sm text-ink/60">{SEMANAS[inicio]}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => somar(inicio, i)).map((dia) => {
              const itens = POR_DIA.get(dia) ?? [];
              const provas = itens.filter((e) => e.c === "prova");
              const marcos = itens.filter((e) => e.c === "marco");
              const blocos = itens.filter((e) => e.s && e.c !== "prova" && e.c !== "marco");
              const genericosOcultos = mostrarGenericos ? 0 : blocos.filter((e) => e.c === "generico").length;
              const visiveis = blocos.filter((e) =>
                e.c === "generico" ? mostrarGenericos : !ocultas.has(e.c)
              );
              const propostas = mostrarProposta ? PROPOSTA[dia] ?? [] : [];
              const reais = simuladosPorDia.get(dia) ?? [];
              const aberto = abertos.has(dia);
              const d = new Date(utc(dia));
              const fimDeSemana = d.getUTCDay() === 0 || d.getUTCDay() === 6;
              const vazio = !provas.length && !marcos.length && !visiveis.length && !propostas.length && !reais.length;

              return (
                <article
                  key={dia}
                  className={
                    "flex min-w-0 flex-col gap-1.5 rounded-lg border bg-white p-2 " +
                    (provas.length ? "border-ink " : "border-ink/10 ") +
                    (fimDeSemana ? "bg-ink/[0.03] " : "") +
                    (hoje && dia < hoje ? "opacity-50 " : "") +
                    (dia === hoje ? "ring-2 ring-accent" : "")
                  }
                >
                  <button
                    type="button"
                    aria-expanded={aberto}
                    title="Mostrar detalhes do dia"
                    onClick={() => alternar(abertos, dia, setAbertos)}
                    className="flex items-baseline gap-2 text-left text-xs text-ink/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <b className="font-display text-xl font-semibold text-ink">{Number(dia.slice(8))}</b>
                    <span>{DIAS[d.getUTCDay()]}</span>
                    <span className="uppercase tracking-wider">{MESES[Number(dia.slice(5, 7)) - 1]}</span>
                  </button>

                  {provas.map((e) => (
                    <div key={e.t} className="rounded bg-ink px-2 py-1 text-xs font-medium text-white">
                      {limpar(e.t)}
                    </div>
                  ))}
                  {marcos.map((e) => (
                    <div key={e.t} className="rounded border border-dashed border-ink/40 px-2 py-1 text-xs text-ink/60">
                      {limpar(e.t)}
                    </div>
                  ))}
                  {reais.map((s) => {
                    const acertos = s.resultados.reduce((a, r) => a + r.acertos, 0);
                    const total = s.resultados.reduce((a, r) => a + r.totalQuestoes, 0);
                    return (
                      <div key={s.id} className="rounded border border-good/40 bg-good/10 px-2 py-1 text-xs">
                        <span className="block text-[10px] uppercase tracking-wider text-good">Registrado</span>
                        {s.nome || s.prova.nome}, {acertos}/{total}
                      </div>
                    );
                  })}
                  {visiveis.map((e, i) => {
                    const cor = COR[e.c];
                    return (
                      <div
                        key={e.t + e.s + i}
                        className={"rounded px-2 py-1 text-xs leading-snug " + (cor ? "" : "border border-dotted border-ink/30 text-ink/60")}
                        style={cor ? { borderLeft: `3px solid ${cor}`, backgroundColor: `${cor}1F` } : undefined}
                      >
                        <span className="block font-mono text-[10.5px] text-ink/60">
                          {hm(e.s!)} a {hm(e.e!)}
                        </span>
                        {limpar(e.t)}
                        {aberto && e.x && <span className="mt-1 block text-[11.5px] text-ink/60">{e.x}</span>}
                      </div>
                    );
                  })}
                  {propostas.map((p) => (
                    <div key={p} className="rounded border border-dashed border-ink/40 px-2 py-1 text-xs">
                      <span className="block text-[10px] uppercase tracking-wider text-ink/60">Proposta</span>
                      {p}
                    </div>
                  ))}
                  {vazio && <div className="text-xs text-ink/50">Sem blocos marcados</div>}
                  {genericosOcultos > 0 && (
                    <div className="text-xs text-ink/50">
                      +{genericosOcultos} bloco{genericosOcultos > 1 ? "s" : ""} genérico
                      {genericosOcultos > 1 ? "s" : ""} oculto{genericosOcultos > 1 ? "s" : ""}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
