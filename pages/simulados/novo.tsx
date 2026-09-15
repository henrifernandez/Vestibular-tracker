import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Area = { id: string; nome: string; totalQuestoes: number };
type Prova = { id: string; slug: string; nome: string; areas: Area[] };

type LinhaResultado = {
  areaId: string;
  acertos: string;
  totalQuestoes: string;
  conteudosErrados: string; // separados por vírgula
};

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
        acertos: "",
        totalQuestoes: String(area.totalQuestoes),
        conteudosErrados: "",
      };
    }
    setLinhas(iniciais);
  }, [provaAtual?.id]);

  function atualizarLinha(areaId: string, campo: keyof LinhaResultado, valor: string) {
    setLinhas((prev) => ({ ...prev, [areaId]: { ...prev[areaId], [campo]: valor } }));
  }

  async function enviar() {
    setErro(null);
    const resultados = Object.values(linhas)
      .filter((l) => l.acertos !== "")
      .map((l) => ({
        areaId: l.areaId,
        acertos: Number(l.acertos),
        totalQuestoes: Number(l.totalQuestoes),
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
          {provaAtual?.areas.map((area) => (
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
                  value={linhas[area.id]?.acertos ?? ""}
                  onChange={(e) => atualizarLinha(area.id, "acertos", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="total de questões"
                  className="border border-ink/20 rounded-md px-3 py-2 text-sm"
                  value={linhas[area.id]?.totalQuestoes ?? ""}
                  onChange={(e) => atualizarLinha(area.id, "totalQuestoes", e.target.value)}
                />
              </div>
              <input
                type="text"
                placeholder="conteúdos que errou, separados por vírgula (ex: frações, funções do 2º grau)"
                className="w-full border border-ink/20 rounded-md px-3 py-2 text-sm"
                value={linhas[area.id]?.conteudosErrados ?? ""}
                onChange={(e) => atualizarLinha(area.id, "conteudosErrados", e.target.value)}
              />
            </div>
          ))}
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
