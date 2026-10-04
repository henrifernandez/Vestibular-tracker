import { useCallback, useEffect, useState } from "react";

type Conteudo = {
  id: string;
  assunto: string;
  disciplina: string;
  prioridade: "ALTA" | "MEDIA" | "BAIXA";
  status: "PENDENTE" | "REVISADO";
  vezesErrado: number;
  origem: "MANUAL" | "SIMULADO";
  observacao: string | null;
  revisadoEm: string | null;
  ultimaRevisao: string | null;
  ultimaConfianca: number | null;
  totalRevisoes: number;
};

type Resumo = {
  pendentes: number;
  revisados: number;
  total: number;
  pctRevisado: number | null;
  revisadosUltimos7Dias: number;
  disciplinas: string[];
};

type ResultadoSync = { criados: number; atualizados: number; reabertos: number; removidos: number };

const PRIORIDADE_LABEL = { ALTA: "Alta", MEDIA: "Média", BAIXA: "Baixa" } as const;
const PRIORIDADE_COR = {
  ALTA: "text-risco border-risco/30",
  MEDIA: "text-atencao border-atencao/30",
  BAIXA: "text-ink/50 border-ink/15",
} as const;
const CONFIANCA_LABEL = ["", "ainda confuso", "razoável", "dominado"];

const campo =
  "bg-paper border border-ink/15 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent";

const STATUS_OPCOES = [
  { valor: "", rotulo: "Todos" },
  { valor: "PENDENTE", rotulo: "Pendentes" },
  { valor: "REVISADO", rotulo: "Revisados" },
] as const;

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Select com seta própria. `forma="pilula"` para filtros, `forma="campo"` para formulários.
function SelectBox({
  value,
  onChange,
  children,
  ativo = false,
  forma = "campo",
  rotulo,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  ativo?: boolean;
  forma?: "pilula" | "campo";
  rotulo: string;
}) {
  const base =
    forma === "pilula"
      ? "rounded-full pl-3.5 pr-9 py-1.5 text-sm border transition cursor-pointer " +
        (ativo
          ? "border-brand/50 bg-accent/15 text-brand"
          : "border-ink/10 bg-surface text-ink/70 hover:border-ink/25")
      : campo + " pr-8 w-full cursor-pointer";
  return (
    <div className={"relative " + (forma === "campo" ? "w-full" : "")}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={rotulo}
        className={"appearance-none focus:outline-none focus:border-accent " + base}
      >
        {children}
      </select>
      <Chevron />
    </div>
  );
}

function Numero({ n, singular, plural, cor }: { n: number; singular: string; plural: string; cor: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-full border border-ink/10 bg-paper/60 px-3 py-1 text-xs">
      <span className={"font-mono text-sm font-medium " + (n > 0 ? cor : "text-ink/35")}>{n}</span>
      <span className="text-ink/55">{n === 1 ? singular : plural}</span>
    </span>
  );
}

export default function Revisao() {
  const [itens, setItens] = useState<Conteudo[] | null>(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [novo, setNovo] = useState({ assunto: "", disciplina: "", prioridade: "MEDIA", observacao: "" });
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [avisoNovo, setAvisoNovo] = useState<string | null>(null);

  const [importando, setImportando] = useState(false);
  const [resultadoSync, setResultadoSync] = useState<ResultadoSync | null>(null);

  const [confiancaAbertaId, setConfiancaAbertaId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState({ assunto: "", disciplina: "", prioridade: "MEDIA", observacao: "" });
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const params = new URLSearchParams();
    if (filtroStatus) params.set("status", filtroStatus);
    if (filtroDisciplina) params.set("disciplina", filtroDisciplina);
    if (filtroPrioridade) params.set("prioridade", filtroPrioridade);
    try {
      const [lista, res] = await Promise.all([
        fetch(`/api/revisao?${params}`).then((r) => r.json()),
        fetch("/api/revisao/resumo").then((r) => r.json()),
      ]);
      setItens(lista);
      setResumo(res);
      setErro(null);
    } catch {
      setErro("Não foi possível carregar os conteúdos.");
    }
  }, [filtroStatus, filtroDisciplina, filtroPrioridade]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.assunto.trim()) return;
    setSalvandoNovo(true);
    setAvisoNovo(null);
    try {
      const res = await fetch("/api/revisao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo),
      });
      const d = await res.json();
      if (!res.ok) {
        setAvisoNovo(d.error || "Não foi possível adicionar.");
      } else if (d.aviso) {
        setAvisoNovo(d.aviso);
      } else {
        setNovo({ assunto: "", disciplina: "", prioridade: "MEDIA", observacao: "" });
        setMostrarForm(false);
        carregar();
      }
    } catch {
      setAvisoNovo("Erro de rede ao chamar o servidor.");
    } finally {
      setSalvandoNovo(false);
    }
  }

  async function importar() {
    setImportando(true);
    setResultadoSync(null);
    setErro(null);
    try {
      const res = await fetch("/api/revisao/importar-simulados", { method: "POST" });
      const d = await res.json();
      if (!res.ok) setErro(d.error || "Não foi possível importar dos simulados.");
      else {
        setResultadoSync(d);
        carregar();
      }
    } catch {
      setErro("Erro de rede ao chamar o servidor.");
    } finally {
      setImportando(false);
    }
  }

  async function atualizar(id: string, corpo: Record<string, unknown>): Promise<boolean> {
    setOcupadoId(id);
    try {
      const res = await fetch(`/api/revisao/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Não foi possível salvar. Tente novamente.");
        return false;
      }
      await carregar();
      return true;
    } finally {
      setOcupadoId(null);
    }
  }

  async function marcarRevisado(id: string, confianca?: number) {
    setConfiancaAbertaId(null);
    await atualizar(id, { status: "REVISADO", ...(confianca ? { confianca } : {}) });
  }

  async function excluir(c: Conteudo) {
    if (!window.confirm(`Excluir "${c.assunto}"? O histórico de revisões dele também será apagado.`)) return;
    setOcupadoId(c.id);
    const res = await fetch(`/api/revisao/${c.id}`, { method: "DELETE" });
    setOcupadoId(null);
    if (res.ok || res.status === 404) carregar();
    else alert("Não foi possível excluir. Tente novamente.");
  }

  function abrirEdicao(c: Conteudo) {
    setEditandoId(c.id);
    setEdicao({ assunto: c.assunto, disciplina: c.disciplina, prioridade: c.prioridade, observacao: c.observacao ?? "" });
  }

  async function salvarEdicao(id: string) {
    if (await atualizar(id, edicao)) setEditandoId(null);
  }

  const temFiltro = !!(filtroStatus || filtroDisciplina || filtroPrioridade);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Revisão</h1>
          <p className="text-xs text-ink/50 mt-1">
            Entram os assuntos que você errou em 2 ou mais simulados, mais os que adicionar à mão.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={importar}
            disabled={importando}
            className="text-sm text-brand hover:underline disabled:opacity-50"
          >
            {importando ? "importando..." : "importar dos simulados"}
          </button>
          <button onClick={() => setMostrarForm((v) => !v)} className="text-sm text-brand hover:underline">
            {mostrarForm ? "cancelar" : "+ adicionar conteúdo"}
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-surface rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Pendentes</div>
          <div className="font-display text-2xl font-semibold mt-1">{resumo ? resumo.pendentes : "—"}</div>
          <div className="text-xs text-ink/50 mt-1">a revisar</div>
        </div>
        <div className="bg-surface rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Revisados</div>
          <div className="font-display text-2xl font-semibold mt-1">{resumo ? resumo.revisados : "—"}</div>
          <div className="text-xs text-ink/50 mt-1">no total</div>
        </div>
        <div className="bg-surface rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">% revisado</div>
          <div className="font-display text-2xl font-semibold mt-1">
            {resumo?.pctRevisado != null ? `${resumo.pctRevisado}%` : "—"}
          </div>
          <div className="text-xs text-ink/50 mt-1">
            {resumo && resumo.total > 0 ? `${resumo.revisados} de ${resumo.total}` : "sem conteúdos ainda"}
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-ink/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Revisados (7d)</div>
          <div className="font-display text-2xl font-semibold mt-1">
            {resumo ? resumo.revisadosUltimos7Dias : "—"}
          </div>
          <div className="text-xs text-ink/50 mt-1">últimos 7 dias</div>
        </div>
      </div>

      {mostrarForm && (
        <form onSubmit={adicionar} className="bg-surface border border-ink/10 rounded-xl p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
            <label className="text-xs text-ink/60 space-y-1">
              <span>Assunto</span>
              <input
                value={novo.assunto}
                onChange={(e) => setNovo({ ...novo, assunto: e.target.value })}
                placeholder="ex: Princípio de Pascal"
                className={campo + " w-full"}
                autoFocus
              />
            </label>
            <label className="text-xs text-ink/60 space-y-1">
              <span>Disciplina</span>
              <input
                list="disciplinas-revisao"
                value={novo.disciplina}
                onChange={(e) => setNovo({ ...novo, disciplina: e.target.value })}
                placeholder="automática"
                className={campo + " w-full"}
              />
            </label>
            <label className="text-xs text-ink/60 space-y-1">
              <span>Prioridade</span>
              <SelectBox rotulo="Prioridade" value={novo.prioridade} onChange={(v) => setNovo({ ...novo, prioridade: v })}>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Baixa</option>
              </SelectBox>
            </label>
          </div>
          <label className="text-xs text-ink/60 space-y-1 block">
            <span>Observação (opcional)</span>
            <textarea
              value={novo.observacao}
              onChange={(e) => setNovo({ ...novo, observacao: e.target.value })}
              rows={2}
              className={campo + " w-full"}
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={salvandoNovo || !novo.assunto.trim()}
              className="text-sm bg-accent text-white rounded-md px-3 py-1.5 disabled:opacity-50"
            >
              {salvandoNovo ? "Salvando..." : "Adicionar"}
            </button>
            {avisoNovo && <span className="text-sm text-warn">{avisoNovo}</span>}
          </div>
        </form>
      )}

      <datalist id="disciplinas-revisao">
        {(resumo?.disciplinas ?? []).map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      {erro && <p className="text-sm text-warn">{erro}</p>}

      {resultadoSync && (
        <div className="rounded-xl border border-good/25 bg-good/[0.06] p-4 flex items-start gap-3.5">
          <span className="h-9 w-9 rounded-full bg-good/15 text-good flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[17px] font-semibold leading-tight">Importação concluída</p>
            <p className="text-xs text-ink/55 mt-1">
              {resultadoSync.criados + resultadoSync.atualizados + resultadoSync.reabertos + resultadoSync.removidos === 0
                ? "Tudo já estava sincronizado com os seus simulados."
                : "Os conteúdos errados dos simulados foram sincronizados."}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Numero n={resultadoSync.criados} singular="criado" plural="criados" cor="text-good" />
              <Numero n={resultadoSync.atualizados} singular="atualizado" plural="atualizados" cor="text-brand" />
              <Numero n={resultadoSync.reabertos} singular="reaberto" plural="reabertos" cor="text-atencao" />
              <Numero n={resultadoSync.removidos ?? 0} singular="removido" plural="removidos" cor="text-ink/70" />
            </div>
          </div>
          <button
            onClick={() => setResultadoSync(null)}
            aria-label="Fechar aviso"
            className="rounded-md p-1 text-ink/35 hover:text-ink hover:bg-ink/5 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Filtrar por status" className="inline-flex rounded-full border border-ink/10 bg-surface p-0.5">
            {STATUS_OPCOES.map((op) => {
              const ativo = filtroStatus === op.valor;
              const contagem =
                resumo == null ? null : op.valor === "PENDENTE" ? resumo.pendentes : op.valor === "REVISADO" ? resumo.revisados : resumo.total;
              return (
                <button
                  key={op.valor}
                  onClick={() => setFiltroStatus(op.valor)}
                  aria-pressed={ativo}
                  className={
                    "rounded-full px-3.5 py-1 text-sm transition flex items-center gap-1.5 " +
                    (ativo ? "bg-accent text-white" : "text-ink/60 hover:text-ink")
                  }
                >
                  {op.rotulo}
                  {contagem != null && (
                    <span className={"font-mono text-[11px] " + (ativo ? "text-white/75" : "text-ink/35")}>{contagem}</span>
                  )}
                </button>
              );
            })}
          </div>

          <SelectBox
            forma="pilula"
            rotulo="Filtrar por disciplina"
            value={filtroDisciplina}
            onChange={setFiltroDisciplina}
            ativo={!!filtroDisciplina}
          >
            <option value="">Todas as disciplinas</option>
            {(resumo?.disciplinas ?? []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectBox>

          <SelectBox
            forma="pilula"
            rotulo="Filtrar por prioridade"
            value={filtroPrioridade}
            onChange={setFiltroPrioridade}
            ativo={!!filtroPrioridade}
          >
            <option value="">Todas as prioridades</option>
            <option value="ALTA">Prioridade alta</option>
            <option value="MEDIA">Prioridade média</option>
            <option value="BAIXA">Prioridade baixa</option>
          </SelectBox>

          {temFiltro && (
            <button
              onClick={() => {
                setFiltroStatus("");
                setFiltroDisciplina("");
                setFiltroPrioridade("");
              }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-ink/50 hover:text-ink hover:bg-ink/5 transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              limpar filtros
            </button>
          )}
        </div>

        {itens && (
          <span className="font-mono text-xs text-ink/40">
            {itens.length} {itens.length === 1 ? "conteúdo" : "conteúdos"}
          </span>
        )}
      </div>

      {/* Lista */}
      {!itens && !erro && <p className="text-sm text-ink/60">Carregando...</p>}

      {itens && itens.length === 0 && (
        <p className="text-sm text-ink/50">
          {temFiltro
            ? "Nenhum conteúdo com esses filtros."
            : "Nenhum conteúdo para revisar ainda. A importação só traz assuntos que apareceram em 2 ou mais simulados; você também pode usar “+ adicionar conteúdo”."}
        </p>
      )}

      <div className="space-y-2">
        {itens?.map((c) => {
          const revisado = c.status === "REVISADO";
          const ocupado = ocupadoId === c.id;

          if (editandoId === c.id) {
            return (
              <div key={c.id} className="bg-surface border border-accent/40 rounded-lg p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <input
                    value={edicao.assunto}
                    onChange={(e) => setEdicao({ ...edicao, assunto: e.target.value })}
                    className={campo}
                    aria-label="Assunto"
                  />
                  <input
                    list="disciplinas-revisao"
                    value={edicao.disciplina}
                    onChange={(e) => setEdicao({ ...edicao, disciplina: e.target.value })}
                    className={campo}
                    aria-label="Disciplina"
                  />
                  <SelectBox rotulo="Prioridade" value={edicao.prioridade} onChange={(v) => setEdicao({ ...edicao, prioridade: v })}>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Média</option>
                    <option value="BAIXA">Baixa</option>
                  </SelectBox>
                </div>
                <textarea
                  value={edicao.observacao}
                  onChange={(e) => setEdicao({ ...edicao, observacao: e.target.value })}
                  rows={2}
                  placeholder="Observação"
                  className={campo + " w-full"}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => salvarEdicao(c.id)}
                    disabled={ocupado}
                    className="text-sm bg-accent text-white rounded-md px-3 py-1.5 disabled:opacity-50"
                  >
                    {ocupado ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="text-sm border border-ink/15 rounded-md px-3 py-1.5 hover:border-accent"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={c.id}
              className={
                "bg-surface border border-ink/10 rounded-lg p-4 flex items-start justify-between gap-3 flex-wrap " +
                (revisado ? "opacity-70" : "")
              }
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={"h-1.5 w-1.5 rounded-full " + (revisado ? "bg-good" : "bg-atencao")} />
                  <span className={"font-medium text-sm " + (revisado ? "line-through decoration-ink/30" : "")}>
                    {c.assunto}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wide bg-accent/10 text-brand rounded-full px-2 py-0.5">
                    {c.disciplina}
                  </span>
                  <span
                    className={
                      "font-mono text-[10px] uppercase tracking-wide border rounded-full px-2 py-0.5 " +
                      PRIORIDADE_COR[c.prioridade]
                    }
                  >
                    {PRIORIDADE_LABEL[c.prioridade]}
                  </span>
                </div>
                <p className="text-xs text-ink/50 mt-1.5">
                  {c.vezesErrado > 0
                    ? `errou ${c.vezesErrado} ${c.vezesErrado === 1 ? "vez" : "vezes"}`
                    : "sem erros registrados"}{" "}
                  · {c.origem === "SIMULADO" ? "veio dos simulados" : "cadastro manual"}
                  {c.ultimaRevisao && (
                    <>
                      {" "}
                      · última revisão {formatarData(c.ultimaRevisao)}
                      {c.ultimaConfianca ? ` (${CONFIANCA_LABEL[c.ultimaConfianca]})` : ""}
                      {c.totalRevisoes > 1 ? ` · ${c.totalRevisoes} revisões` : ""}
                    </>
                  )}
                </p>
                {c.observacao && <p className="text-xs text-ink/60 mt-1">{c.observacao}</p>}

                {confiancaAbertaId === c.id && (
                  <div className="flex items-center gap-2 flex-wrap mt-3 text-xs">
                    <span className="text-ink/50">Quão seguro ficou?</span>
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => marcarRevisado(c.id, n)}
                        className="border border-ink/15 rounded-md px-2.5 py-1 hover:border-accent hover:text-brand"
                      >
                        {n} · {CONFIANCA_LABEL[n]}
                      </button>
                    ))}
                    <button onClick={() => marcarRevisado(c.id)} className="text-ink/50 hover:underline">
                      pular
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {revisado ? (
                  <button
                    onClick={() => atualizar(c.id, { status: "PENDENTE" })}
                    disabled={ocupado}
                    className="text-sm border border-ink/15 rounded-md px-3 py-1.5 hover:border-accent hover:text-brand disabled:opacity-50"
                  >
                    Reabrir
                  </button>
                ) : (
                  <button
                    onClick={() => setConfiancaAbertaId(confiancaAbertaId === c.id ? null : c.id)}
                    disabled={ocupado}
                    className="text-sm bg-accent text-white rounded-md px-3 py-1.5 disabled:opacity-50"
                  >
                    Marcar revisado
                  </button>
                )}
                <button
                  onClick={() => abrirEdicao(c)}
                  className="text-sm border border-ink/15 rounded-md px-3 py-1.5 hover:border-accent hover:text-brand"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluir(c)}
                  disabled={ocupado}
                  className="text-sm border border-warn/30 text-warn rounded-md px-3 py-1.5 hover:bg-warn/10 disabled:opacity-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
