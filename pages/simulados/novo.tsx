import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Area = { id: string; nome: string; totalQuestoes: number };
type Prova = { id: string; slug: string; nome: string; areas: Area[] };

type Competencia = { nome: string; nota: number; evidencia?: string; comentario: string };
type AvaliacaoIA = {
  notaEstimada: number;
  notaBruta?: number;
  travaAplicada?: string | null;
  competencias: Competencia[];
  sinaisSuperficialidade?: string[];
  diagnostico?: string;
  comoSubir?: string[];
  comentarioGeral: string;
};

type LinhaResultado = {
  areaId: string;
  acertos: string;
  totalQuestoes: string;
  conteudosErrados: string; // separados por vírgula
  textoRedacao: string;
  avaliacaoIA: AvaliacaoIA | null;
  avaliando: boolean;
  erroAvaliacao: string | null;
};

import { ehRedacao } from "@/lib/redacao";

export default function NovoSimulado() {
  const router = useRouter();
  const [provas, setProvas] = useState<Prova[] | null>(null);
  const [provaId, setProvaId] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [nome, setNome] = useState("");
  const [linhas, setLinhas] = useState<Record<string, LinhaResultado>>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/provas")
      .then((r) => r.json())
      .then((data: Prova[]) => {
        setProvas(data);
        if (data.length > 0) setProvaId(data[0].id);
      });
  }, []);

  const provaAtual = provas?.find((p) => p.id === provaId);

  useEffect(() => {
    if (!provaAtual) return;
    const iniciais: Record<string, LinhaResultado> = {};
    for (const area of provaAtual.areas) {
      iniciais[area.id] = {
        areaId: area.id,
        acertos: ehRedacao(area.nome) ? "1" : "",
        totalQuestoes: String(area.totalQuestoes),
        conteudosErrados: "",
        textoRedacao: "",
        avaliacaoIA: null,
        avaliando: false,
        erroAvaliacao: null,
      };
    }
    setLinhas(iniciais);
  }, [provaAtual?.id]);

  function atualizarLinha(areaId: string, campo: keyof LinhaResultado, valor: any) {
    setLinhas((prev) => ({ ...prev, [areaId]: { ...prev[areaId], [campo]: valor } }));
  }

  async function avaliarRedacaoComIA(areaId: string) {
    const linha = linhas[areaId];
    if (!linha?.textoRedacao || linha.textoRedacao.trim().length < 50) {
      atualizarLinha(areaId, "erroAvaliacao", "Cole o texto completo da redação (mínimo 50 caracteres).");
      return;
    }

    atualizarLinha(areaId, "avaliando", true);
    atualizarLinha(areaId, "erroAvaliacao", null);

    try {
      const res = await fetch("/api/redacao/avaliar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: linha.textoRedacao }),
      });
      const dados = await res.json();

      if (!res.ok) {
        atualizarLinha(areaId, "erroAvaliacao", dados.error || "Não foi possível avaliar.");
      } else {
        atualizarLinha(areaId, "avaliacaoIA", dados as AvaliacaoIA);
      }
    } catch {
      atualizarLinha(areaId, "erroAvaliacao", "Falha ao conectar com a IA. Tente novamente.");
    } finally {
      atualizarLinha(areaId, "avaliando", false);
    }
  }

  async function enviar() {
    setErro(null);
    const resultados = Object.values(linhas)
      .filter((l) => l.acertos !== "")
      .map((l) => ({
        areaId: l.areaId,
        acertos: Number(l.acertos),
        totalQuestoes: Number(l.totalQuestoes),
        notaEstimada: l.avaliacaoIA?.notaEstimada,
        textoRedacao: l.textoRedacao || undefined,
        avaliacaoIA: l.avaliacaoIA || undefined,
        conteudosErrados: l.conteudosErrados
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      }));

    if (resultados.length === 0) {
      setErro("Preencha ao menos uma área com o número de acertos.");
      return;
    }

    setEnviando(true);
    const res = await fetch("/api/simulados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provaId, data, nome, resultados }),
    });
    setEnviando(false);

    if (!res.ok) {
      setErro("Não foi possível salvar. Tente novamente.");
      return;
    }

    router.push(`/provas/${provaAtual?.slug}`);
  }

  if (!provas) return <p className="text-sm text-ink/60">Carregando...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Registrar simulado</h1>

      <div className="bg-white rounded-xl border border-ink/10 p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Prova
            <select
              className="mt-1 w-full border border-ink/20 rounded-md px-3 py-2"
              value={provaId}
              onChange={(e) => setProvaId(e.target.value)}
            >
              {provas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            {provaAtual?.slug === "enem" && (
              <span className="block text-xs text-accent mt-1">
                Esse resultado é copiado automaticamente para o ENEM-USP e o ENEM/SISU.
              </span>
            )}
          </label>
          <label className="text-sm">
            Data
            <input
              type="date"
              className="mt-1 w-full border border-ink/20 rounded-md px-3 py-2"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </label>
        </div>

        <label className="text-sm block">
          Nome do simulado (opcional)
          <input
            type="text"
            placeholder="ex: Simulado Poliedro #3"
            className="mt-1 w-full border border-ink/20 rounded-md px-3 py-2"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>

        <div className="space-y-3">
          {provaAtual?.areas.map((area) => {
            const linha = linhas[area.id];
            if (ehRedacao(area.nome)) {
              return (
                <div key={area.id} className="border border-ink/10 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{area.nome}</span>
                    <span className="text-xs text-ink/40">avaliação por IA (opcional)</span>
                  </div>
                  <textarea
                    placeholder="Cole aqui o texto completo da redação"
                    rows={6}
                    className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm"
                    value={linha?.textoRedacao ?? ""}
                    onChange={(e) => atualizarLinha(area.id, "textoRedacao", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => avaliarRedacaoComIA(area.id)}
                    disabled={linha?.avaliando}
                    className="text-sm border border-accent text-accent rounded-md px-3 py-1.5 hover:bg-accent/10 disabled:opacity-50"
                  >
                    {linha?.avaliando ? "Avaliando, isso pode levar até 1 min..." : "Avaliar com IA"}
                  </button>

                  {linha?.erroAvaliacao && (
                    <p className="text-sm text-warn">{linha.erroAvaliacao}</p>
                  )}

                  {linha?.avaliacaoIA && (
                    <div className="bg-accent/5 rounded-md p-3 space-y-3">
                      <p className="text-sm font-medium">
                        Nota estimada: {linha.avaliacaoIA.notaEstimada}/1000
                      </p>

                      {linha.avaliacaoIA.travaAplicada && (
                        <p className="text-xs text-warn">
                          Nota bruta pelas competências seria {linha.avaliacaoIA.notaBruta}, mas
                          foi limitada: {linha.avaliacaoIA.travaAplicada}.
                        </p>
                      )}

                      {linha.avaliacaoIA.diagnostico && (
                        <p className="text-xs text-ink/70">{linha.avaliacaoIA.diagnostico}</p>
                      )}

                      <ul className="space-y-2">
                        {linha.avaliacaoIA.competencias.map((c, i) => (
                          <li key={i} className="text-xs">
                            <span className="font-medium">
                              C{i + 1} ({c.nota}/200) {c.nome}
                            </span>
                            {c.evidencia && (
                              <span className="block text-ink/50 italic border-l-2 border-ink/15 pl-2 my-1">
                                {c.evidencia}
                              </span>
                            )}
                            <span className="block text-ink/70">{c.comentario}</span>
                          </li>
                        ))}
                      </ul>

                      {linha.avaliacaoIA.sinaisSuperficialidade &&
                        linha.avaliacaoIA.sinaisSuperficialidade.length > 0 && (
                          <div className="pt-2 border-t border-ink/10">
                            <p className="text-xs font-medium text-warn mb-1">
                              Sinais de superficialidade
                            </p>
                            <p className="text-xs text-ink/60">
                              {linha.avaliacaoIA.sinaisSuperficialidade.join(" · ")}
                            </p>
                          </div>
                        )}

                      {linha.avaliacaoIA.comoSubir && linha.avaliacaoIA.comoSubir.length > 0 && (
                        <div className="pt-2 border-t border-ink/10">
                          <p className="text-xs font-medium mb-1">Como subir de faixa</p>
                          <ol className="text-xs text-ink/70 list-decimal pl-4 space-y-0.5">
                            {linha.avaliacaoIA.comoSubir.map((acao, i) => (
                              <li key={i}>{acao}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <p className="text-xs text-ink/60 pt-2 border-t border-ink/10">
                        {linha.avaliacaoIA.comentarioGeral}
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={area.id} className="border border-ink/10 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{area.nome}</span>
                  <span className="text-xs text-ink/40">de {area.totalQuestoes} questões</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="acertos"
                    className="border border-ink/20 rounded-md px-3 py-2 text-sm"
                    value={linha?.acertos ?? ""}
                    onChange={(e) => atualizarLinha(area.id, "acertos", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="total de questões"
                    className="border border-ink/20 rounded-md px-3 py-2 text-sm"
                    value={linha?.totalQuestoes ?? ""}
                    onChange={(e) => atualizarLinha(area.id, "totalQuestoes", e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="conteúdos que errou, separados por vírgula (ex: frações, funções do 2º grau)"
                  className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm"
                  value={linha?.conteudosErrados ?? ""}
                  onChange={(e) => atualizarLinha(area.id, "conteudosErrados", e.target.value)}
                />
              </div>
            );
          })}
        </div>

        {erro && <p className="text-sm text-warn">{erro}</p>}

        <button
          onClick={enviar}
          disabled={enviando}
          className="bg-accent text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Salvar simulado"}
        </button>
      </div>
    </div>
  );
}
