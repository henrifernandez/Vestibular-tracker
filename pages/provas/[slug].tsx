import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { ehRedacao } from "@/lib/redacao";
import { corSensor, margemParaNota, MARGEM_ACERTOS, SENSOR_DOT } from "@/lib/tri";

type Meta = {
  id: string;
  label: string;
  acertosAlvo: number | null;
  notaAlvo: number | null;
  observacao: string | null;
};

type Resultado = {
  id: string;
  acertos: number;
  totalQuestoes: number;
  notaEstimada: number | null;
  createdAt: string;
  simulado: { data: string; nome: string | null };
  conteudosErrados: { conteudo: string }[];
};

type AreaDetail = {
  id: string;
  nome: string;
  totalQuestoes: number;
  ehRedacao?: boolean;
  metas: Meta[];
  resultados: Resultado[];
  conteudosMaisErrados: { conteudo: string; vezes: number }[];
  percentualMedio: number | null;
};

type ProvaDetail = {
  id: string;
  nome: string;
  descricao: string | null;
  areas: AreaDetail[];
};

export default function ProvaPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [prova, setProva] = useState<ProvaDetail | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);

  useEffect(() => {
    if (typeof slug !== "string") return;
    fetch(`/api/provas/${slug}`)
      .then((r) => r.json())
      .then(setProva);
  }, [slug]);

  if (!prova) return <p className="text-sm text-ink/60">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{prova.nome}</h1>
        {prova.descricao && <p className="text-sm text-ink/60 mt-1">{prova.descricao}</p>}
      </div>

      {prova.areas.map((area) => {
        const redacao = area.ehRedacao ?? ehRedacao(area.nome);

        // Para Redação, o gráfico acompanha a nota estimada (0-1000) em vez de acertos,
        // já que "acertos" pra Redação sempre vale 1/1 e não representa nada.
        const chartData = area.resultados
          .filter((r) => !redacao || r.notaEstimada != null)
          .map((r) => ({
            data: new Date(r.simulado.data).toLocaleDateString("pt-BR"),
            valor: redacao ? r.notaEstimada! : r.acertos,
          }));

        const metaLinha = redacao
          ? area.metas.find((m) => m.notaAlvo != null)?.notaAlvo
          : area.metas.find((m) => m.acertosAlvo != null)?.acertosAlvo;

        const domainMax = redacao ? 1000 : area.totalQuestoes;
        const estaAberta = aberta === area.id;

        const rotuloResumo = area.percentualMedio == null
          ? "sem simulados registrados ainda"
          : redacao
            ? `nota média ${Math.round((area.percentualMedio / 100) * 1000)}/1000`
            : `média de ${area.percentualMedio.toFixed(0)}% de acertos`;

        return (
          <section key={area.id} className="bg-surface rounded-xl border border-ink/10 p-5">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setAberta(estaAberta ? null : area.id)}
            >
              <div>
                <span className="font-medium">{area.nome}</span>
                <span className="text-xs text-ink/50 ml-2">{rotuloResumo}</span>
              </div>
              <span className="text-ink/40 text-sm">{estaAberta ? "fechar ▲" : "ver detalhes ▼"}</span>
            </button>

            {/* metas de referência */}
            <div className="flex flex-wrap gap-2 mt-3">
              {area.metas.map((m) => {
                const ultimo = area.resultados[area.resultados.length - 1];
                const valor = redacao ? ultimo?.notaEstimada ?? null : ultimo?.acertos ?? null;
                const meta = redacao ? m.notaAlvo : m.acertosAlvo;
                const margem = redacao && meta != null ? margemParaNota(meta) : MARGEM_ACERTOS;
                const sensor = valor != null && meta != null ? corSensor(valor, meta, margem) : null;
                return (
                  <span
                    key={m.id}
                    title={m.observacao || ""}
                    className="text-xs bg-accent/10 text-brand rounded-full px-3 py-1 inline-flex items-center gap-1.5"
                  >
                    {sensor && <span className={"h-1.5 w-1.5 rounded-full " + SENSOR_DOT[sensor]} />}
                    {m.label}
                    {!redacao && m.acertosAlvo != null
                      ? ` · ${m.acertosAlvo}/${area.totalQuestoes} acertos`
                      : ""}
                    {m.notaAlvo != null ? ` · nota ${m.notaAlvo}` : ""}
                  </span>
                );
              })}
            </div>

            {estaAberta && (
              <div className="mt-4 space-y-5">
                {chartData.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEB1F" />
                        <XAxis dataKey="data" tick={{ fontSize: 11, fill: "#9AA7A2" }} stroke="#E8EEEB33" />
                        <YAxis tick={{ fontSize: 11, fill: "#9AA7A2" }} stroke="#E8EEEB33" domain={[0, domainMax]} width={30} />
                        <Tooltip contentStyle={{ background: "#151C1A", border: "1px solid #E8EEEB26", borderRadius: 8, color: "#E8EEEB" }} labelStyle={{ color: "#E8EEEB" }} itemStyle={{ color: "#E8EEEB" }} />
                        {metaLinha != null && (
                          <ReferenceLine
                            y={metaLinha}
                            stroke="#E0714A"
                            strokeDasharray="4 4"
                            label={{ value: "meta", fontSize: 10, fill: "#E0714A" }}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="valor"
                          stroke="#4CC084"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-ink/50">
                    Nenhum simulado registrado para esta área ainda.
                  </p>
                )}

                <div>
                  <h3 className="text-sm font-medium mb-2">Conteúdos que mais errou</h3>
                  {area.conteudosMaisErrados.length > 0 ? (
                    <ul className="space-y-1">
                      {area.conteudosMaisErrados.map((c) => (
                        <li
                          key={c.conteudo}
                          className="flex justify-between text-sm border-b border-ink/5 py-1"
                        >
                          <span>{c.conteudo}</span>
                          <span className="text-ink/40">{c.vezes}x</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink/50">
                      Nenhum conteúdo específico registrado ainda para esta área.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
