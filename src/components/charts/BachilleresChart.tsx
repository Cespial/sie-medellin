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

interface BachillerData {
  anio: string;
  graduados_11: number;
  graduados_26: number;
  matricula_11: number;
  matricula_26: number;
  tasa_graduacion_11: number;
  tasa_graduacion_26: number;
  oficial_11: number;
  no_oficial_11: number;
}

export function BachilleresChart() {
  const { data, loading, error, retry } =
    useFetchData<BachillerData[]>("/data/bachilleres_medellin.json");

  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data || data.length === 0) return null;

  const latest = data[data.length - 1];

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
            {"Bachilleres Graduados \u2014 Medell\u00edn"}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Grados 11 y 26 (adultos) | 2019-2024 | datos.gov.co
          </p>
        </div>
        <div className="text-right">
          <p className="font-[var(--font-jetbrains)] text-xl font-bold text-accent">
            {latest.graduados_11.toLocaleString("es-CO")}
          </p>
          <p className="text-[10px] text-muted">
            graduados grado 11 ({latest.anio})
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="anio"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
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
              const label =
                String(name) === "graduados_11"
                  ? "Grado 11"
                  : "Grado 26 (Adultos)";
              return [Number(value).toLocaleString("es-CO"), label];
            }}
            labelFormatter={(label) => `Año ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) =>
              value === "graduados_11"
                ? "Grado 11"
                : "Grado 26 (Adultos)"
            }
          />
          <Bar
            dataKey="graduados_11"
            fill="#00D4FF"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="graduados_26"
            fill="#3E92CC"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
