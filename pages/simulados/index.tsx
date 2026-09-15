import { useEffect, useState } from "react";
import Link from "next/link";

type Simulado = {
  id: string;
  nome: string | null;
  data: string;
  prova: { nome: string; slug: string };
  resultados: { acertos: number; totalQuestoes: number }[];
};

export default function ListaSimulados() {
  const [simulados, setSimulados] = useState<Simulado[] | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/simulados")
      .then((r) => r.json())
      .then(setSimulados);
  }, []);

  async function excluir(id: string) {
    const confirmar = window.confirm(
      "Excluir este simulado? Os resultados e conteúdos errados registrados nele também serão apagados. Essa ação não pode ser desfeita."
    );
    if (!confirmar) return;

    setExcluindoId(id);
    const res = await fetch(`/api/simulados/${id}`, { method: "DELETE" });
    setExcluindoId(null);

    if (res.ok || res.status === 404) {
      setSimulados((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    } else {
      alert("Não foi possível excluir o simulado. Tente novamente.");
    }
  }

  if (!simulados) return <p className="text-sm text-ink/60">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Simulados registrados</h1>
        <Link href="/simulados/novo" className="text-sm text-accent hover:underline">
          + registrar novo
        </Link>
      </div>

      {simulados.length === 0 && (
        <p className="text-sm text-ink/50">Nenhum simulado registrado ainda.</p>
      )}

      <div className="space-y-2">
        {simulados.map((s) => {
          const totalAcertos = s.resultados.reduce((sum, r) => sum + r.acertos, 0);
          const totalQuestoes = s.resultados.reduce((sum, r) => sum + r.totalQuestoes, 0);
          return (
            <div
              key={s.id}
              className="bg-white border border-ink/10 rounded-lg p-4 flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/provas/${s.prova.slug}`}
                    className="font-medium text-sm hover:text-accent"
                  >
                    {s.prova.nome}
                  </Link>
                  {s.nome && <span className="text-xs text-ink/40">— {s.nome}</span>}
                </div>
                <p className="text-xs text-ink/50 mt-1">
                  {new Date(s.data).toLocaleDateString("pt-BR")} · {totalAcertos}/{totalQuestoes}{" "}
                  acertos no total
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/simulados/${s.id}/export`}
                  className="text-sm border border-ink/15 rounded-md px-3 py-1.5 hover:border-accent hover:text-accent"
                >
                  Exportar CSV
                </a>
                <button
                  onClick={() => excluir(s.id)}
                  disabled={excluindoId === s.id}
                  className="text-sm border border-warn/30 text-warn rounded-md px-3 py-1.5 hover:bg-warn/10 disabled:opacity-50"
                >
                  {excluindoId === s.id ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
