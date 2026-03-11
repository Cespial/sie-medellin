"use client";

import {
  LineChart,
  Line,
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

interface PeriodData {
  periodo: string;
  promedio: number;
  evaluados: number;
  promedio_f?: number;
  promedio_m?: number;
  [key: string]: string | number | undefined;
}

export function GenderGapChart() {
  const { data, loading, error, retry } = useFetchData<PeriodData[]>("/data/saber11_serie_temporal.json");

  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  // Format period labels
  const chartData = data.map((d) => {
    const p = d.periodo;
    const label = p.length >= 5 ? `${p.slice(0, 4)}-S${p.slice(4)}` : p;
    return {
      ...d,
      label,
      brecha: d.promedio_f && d.promedio_m
        ? Math.round((d.promedio_f - d.promedio_m) * 10) / 10
        : null,
    };
  });

  const latestWithGender = chartData.filter(d => d.promedio_f && d.promedio_m);
  const latest = latestWithGender[latestWithGender.length - 1];

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
            Saber 11 — Brecha de Género
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Promedio global por género | 250K+ evaluados | datos.gov.co
          </p>
        </div>
        {latest && (
          <div className="flex gap-3 text-xs">
            <span className="text-[#FF6B9D]">
              F: {latest.promedio_f}
            </span>
            <span className="text-[#00D4FF]">
              M: {latest.promedio_m}
            </span>
            <span className={latest.brecha && latest.brecha > 0 ? "text-success" : "text-warning"}>
              {latest.brecha && latest.brecha > 0 ? "+" : ""}{latest.brecha}
            </span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="label"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => {
              const label = String(name) === "promedio_f" ? "Mujeres"
                : String(name) === "promedio_m" ? "Hombres"
                : "Promedio";
              return [value, label];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) => value === "promedio_f" ? "Mujeres" : value === "promedio_m" ? "Hombres" : "Ciudad"}
          />
          <Line
            type="monotone"
            dataKey="promedio"
            stroke="#6B8CAE"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="promedio_f"
            stroke="#FF6B9D"
            strokeWidth={2}
            dot={{ r: 3, fill: "#FF6B9D", stroke: "#0D1B2A", strokeWidth: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="promedio_m"
            stroke="#00D4FF"
            strokeWidth={2}
            dot={{ r: 3, fill: "#00D4FF", stroke: "#0D1B2A", strokeWidth: 2 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
