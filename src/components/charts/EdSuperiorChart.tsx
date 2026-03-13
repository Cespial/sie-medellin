"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

interface EdSupData {
  anio: string;
  tecnica: number;
  tecnologica: number;
  universitaria: number;
  especializacion: number;
  maestria: number;
  doctorado: number;
  total: number;
  ies_con_oferta: number;
}

export function EdSuperiorChart() {
  const { data, loading, error, retry } =
    useFetchData<EdSupData[]>("/data/educacion_superior_medellin.json");

  if (loading) return <ChartSkeleton height={400} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data || data.length === 0) return null;

  const latest = data[data.length - 1];

  // Combine posgrado levels for stacking
  const chartData = data.map((d) => ({
    anio: d.anio,
    tecnica: d.tecnica,
    tecnologica: d.tecnologica,
    universitaria: d.universitaria,
    posgrado: d.especializacion + d.maestria + d.doctorado,
    total: d.total,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
            {"Matr\u00edcula Educaci\u00f3n Superior \u2014 Medell\u00edn"}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Por nivel de formación | 2005-2020 | datos.gov.co/MEN
          </p>
        </div>
        <div className="text-right">
          <p className="font-[var(--font-jetbrains)] text-xl font-bold text-accent">
            {latest.total.toLocaleString("es-CO")}
          </p>
          <p className="text-[10px] text-muted">
            matriculados ({latest.anio}) en {latest.ies_con_oferta} IES
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="anio"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
            interval={2}
          />
          <YAxis
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
            }
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                tecnica: "Técnica Profesional",
                tecnologica: "Tecnológica",
                universitaria: "Universitaria",
                posgrado: "Posgrado (Esp+Mtría+Doc)",
              };
              return [Number(value).toLocaleString("es-CO"), labels[String(name)] || String(name)];
            }}
            labelFormatter={(label) => `Año ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                tecnica: "Técnica",
                tecnologica: "Tecnológica",
                universitaria: "Universitaria",
                posgrado: "Posgrado",
              };
              return labels[value] || value;
            }}
          />
          <Bar dataKey="tecnica" stackId="a" fill="#6B8CAE" />
          <Bar dataKey="tecnologica" stackId="a" fill="#3E92CC" />
          <Bar dataKey="universitaria" stackId="a" fill="#00D4FF" />
          <Bar
            dataKey="posgrado"
            stackId="a"
            fill="#06D6A0"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
