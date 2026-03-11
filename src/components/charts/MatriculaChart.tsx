"use client";

import {
  AreaChart,
  Area,
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

interface SerieTemporal {
  anio: string;
  total: number;
  oficial: number;
  privado: number;
}

interface MatriculaResponse {
  serieTemporal: SerieTemporal[];
  porNivel: { nivel: string; total: number }[];
  ultimoAnio: string;
}

function formatNumber(value: number): string {
  return value.toLocaleString("es-CO");
}

export function MatriculaChart() {
  const { data, loading, error, retry } = useFetchData<MatriculaResponse>("/data/matricula_medellin.json");

  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const chartData = data.serieTemporal;

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-4">
        Matrícula Total — Medellín
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="grad-oficial" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-privado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB703" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FFB703" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v) => formatNumber(v)}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [
              formatNumber(Number(value)),
              String(name) === "oficial" ? "Oficial" : "Privado",
            ]}
            labelFormatter={(label) => `Año ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) => String(value) === "oficial" ? "Oficial" : "Privado"}
          />
          <Area
            type="monotone"
            dataKey="oficial"
            stackId="matricula"
            stroke="#00D4FF"
            strokeWidth={2}
            fill="url(#grad-oficial)"
          />
          <Area
            type="monotone"
            dataKey="privado"
            stackId="matricula"
            stroke="#FFB703"
            strokeWidth={2}
            fill="url(#grad-privado)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
