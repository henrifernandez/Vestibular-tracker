import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function Dashboard() {
  const [provas, setProvas] = useState<ProvaDash[] | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setProvas);
  }, []);

  if (!provas) return <p className="text-sm text-ink/60">Carregando...</p>;

  const provaAtiva = provas.find((p) => p.id === abaAtiva) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Painel de evolução</h1>
        <p className="text-sm text-ink/60 mt-1">
          Escolha uma prova para ver o progresso por área, comparado com as metas da reta final.
        </p>
      </div>

      {/* abas */}
      <div className="flex flex-wrap gap-2 border-b border-ink/10 pb-3">
        {provas.map((prova) => {
          const ativa = prova.id === abaAtiva;
          return (
            <button
              key={prova.id}
              onClick={() => setAbaAtiva(ativa ? null : prova.id)}
              className={
                "text-sm px-4 py-2 rounded-full border transition " +
                (ativa
                  ? "bg-accent text-white border-accent"
                  : "border-ink/15 text-ink/70 hover:border-accent/50 hover:text-accent")
              }
            >
              {prova.nome}
            </button>
          );
        })}
      </div>

      {!provaAtiva && (
        <p className="text-sm text-ink/50">
          Clique em uma prova acima para ver o progresso por área.
        </p>
      )}

      {provaAtiva && (
        <section className="bg-white rounded-xl border border-ink/10 p-5">
          <div className="flex items-baseline justify-between mb-1">
            <Link
              href={`/provas/${provaAtiva.slug}`}
              className="text-lg font-medium hover:text-accent"
            >
              {provaAtiva.nome}
            </Link>
          </div>
          {provaAtiva.descricao && (
            <p className="text-xs text-ink/50 mb-4">{provaAtiva.descricao}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {provaAtiva.areas.map((area) => (
              <div key={area.id} className="border border-ink/10 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{area.nome}</span>
                  <span className="text-xs text-ink/50">
                    {area.ultimoAcertos != null
                      ? `${area.ultimoAcertos}/${area.ultimoTotal}`
                      : "sem dados"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${area.progresso ?? 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[11px] text-ink/40">
                    {area.qtdSimulados} simulado(s) registrado(s)
                  </span>
                  {area.progresso != null && (
                    <span className="text-[11px] text-ink/40">{area.progresso}% da meta</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
