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
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

interface ComunaData {
  comuna: string;
  desertores: number;
  matricula: number;
  tasaDesercion: number;
}

interface DesercionResponse {
  porComuna: ComunaData[];
  ultimoAnio: string;
}

function getBarColor(rate: number, min: number, max: number): string {
  const t = max === min ? 0 : (rate - min) / (max - min);

  // Interpolate from cyan (#00D4FF) to red (#EF233C)
  const r = Math.round(0x00 + t * (0xef - 0x00));
  const g = Math.round(0xd4 + t * (0x23 - 0xd4));
  const b = Math.round(0xff + t * (0x3c - 0xff));

  return `rgb(${r}, ${g}, ${b})`;
}

export function DesercionComunaChart() {
  const { data, loading, error, retry } = useFetchData<DesercionResponse>("/data/desercion_medellin.json");

  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const sorted = [...data.porComuna].sort(
    (a, b) => a.tasaDesercion - b.tasaDesercion
  );

  const min = Math.min(...sorted.map((d) => d.tasaDesercion));
  const max = Math.max(...sorted.map((d) => d.tasaDesercion));
  const chartHeight = Math.max(400, sorted.length * 32);

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-4">
        Tasa de Deserción por Comuna ({data.ultimoAnio})
      </h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1A2D42"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="comuna"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${value}%`,
              "Tasa de Deserción",
            ]}
            cursor={{ fill: "rgba(0, 212, 255, 0.05)" }}
          />
          <Bar dataKey="tasaDesercion" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.tasaDesercion, min, max)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
