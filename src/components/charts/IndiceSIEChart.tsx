"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

interface ComunaIndex {
  comuna: string;
  nombre: string;
  indice_sie: number;
  calidad_score: number;
  permanencia_score: number;
  aprobacion_score: number;
  saber11_promedio: number | null;
  tasa_desercion: number | null;
  tasa_aprobacion: number | null;
  matricula: number;
}

function getBarColor(score: number): string {
  if (score >= 75) return "#10B981";
  if (score >= 65) return "#22D3EE";
  if (score >= 55) return "#F59E0B";
  return "#EF4444";
}

export function IndiceSIEChart() {
  const { data, loading, error, retry } = useFetchData<ComunaIndex[]>("/data/indice_sie_comunas.json");

  if (loading) return <ChartSkeleton height={600} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data || data.length === 0) return null;

  // Filter to only numbered comunas (exclude corregimientos for cleaner viz)
  const comunas = data.filter(d => d.comuna.length <= 2);
  const avg = Math.round(comunas.reduce((s, d) => s + d.indice_sie, 0) / comunas.length * 10) / 10;

  return (
    <div className="border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-[12px] font-semibold text-foreground">
            Indice SIE Compuesto por Comuna
          </h3>
          <span className="text-[10px] font-[var(--font-geist-mono)] text-muted block mt-1">
            Ponderacion: Calidad 40% + Permanencia 35% + Aprobacion 25% · Promedio: {avg}
          </span>
        </div>
        <div className="flex gap-3 text-[9px] text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#10B981]" /> &ge;75</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#22D3EE]" /> 65-74</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#F59E0B]" /> 55-64</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#EF4444]" /> &lt;55</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={comunas} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F1F23" horizontal={false} />
          <XAxis
            type="number"
            stroke="#63636E"
            fontSize={11}
            tickLine={false}
            domain={[40, 90]}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            stroke="#63636E"
            fontSize={10}
            tickLine={false}
            width={130}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                indice_sie: "Indice SIE",
              };
              return [`${Number(value).toFixed(1)}`, labels[String(name)] || String(name)];
            }}
            labelFormatter={(label) => String(label)}
          />
          <ReferenceLine
            x={avg}
            stroke="#63636E"
            strokeDasharray="5 5"
            label={{ value: `Promedio ${avg}`, position: "top", fill: "#63636E", fontSize: 9 }}
          />
          <Bar dataKey="indice_sie" radius={[0, 4, 4, 0]}>
            {comunas.map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry.indice_sie)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Score breakdown for top 3 and bottom 3 */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <h4 className="text-[10px] text-muted uppercase tracking-widest mb-2">Top 3</h4>
          {comunas.slice(0, 3).map((c) => (
            <div key={c.comuna} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <span className="text-[11px] text-foreground">{c.nombre}</span>
              <div className="flex gap-3 text-[10px] font-[var(--font-geist-mono)]">
                <span className="text-accent">{c.indice_sie}</span>
                <span className="text-muted" title="Calidad">C:{c.calidad_score}</span>
                <span className="text-muted" title="Permanencia">P:{c.permanencia_score}</span>
                <span className="text-muted" title="Aprobacion">A:{c.aprobacion_score}</span>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-[10px] text-muted uppercase tracking-widest mb-2">Bottom 3</h4>
          {comunas.slice(-3).map((c) => (
            <div key={c.comuna} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <span className="text-[11px] text-foreground">{c.nombre}</span>
              <div className="flex gap-3 text-[10px] font-[var(--font-geist-mono)]">
                <span className="text-danger">{c.indice_sie}</span>
                <span className="text-muted" title="Calidad">C:{c.calidad_score}</span>
                <span className="text-muted" title="Permanencia">P:{c.permanencia_score}</span>
                <span className="text-muted" title="Aprobacion">A:{c.aprobacion_score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
