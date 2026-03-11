"use client";

import { useState } from "react";
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

interface AprobacionRecord {
  comuna?: string;
  genero?: string;
  nivel?: string;
  aprobados: number;
  total: number;
  tasaAprobacion: number;
}

interface AprobacionData {
  porComuna: AprobacionRecord[];
  porGenero: AprobacionRecord[];
  porNivel: AprobacionRecord[];
}

type Tab = "comuna" | "genero" | "nivel";

export function AprobacionChart() {
  const [tab, setTab] = useState<Tab>("comuna");
  const { data, loading, error, retry } = useFetchData<AprobacionData>("/data/aprobacion_medellin.json");

  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const chartData: AprobacionRecord[] =
    tab === "comuna"
      ? [...data.porComuna].sort((a, b) => a.tasaAprobacion - b.tasaAprobacion)
      : tab === "genero"
        ? data.porGenero
        : data.porNivel;

  const labelKey = tab === "comuna" ? "comuna" : tab === "genero" ? "genero" : "nivel";

  const isVertical = tab === "comuna";

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {(["comuna", "nivel", "genero"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs rounded capitalize ${
              tab === t
                ? "bg-accent/20 text-accent border border-accent/30"
                : "text-muted hover:text-foreground bg-background/50"
            }`}
          >
            Por {t}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={isVertical ? 500 : 250}>
        {isVertical ? (
          <BarChart data={chartData} layout="vertical" margin={{ left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" horizontal={false} />
            <XAxis
              type="number"
              stroke="#6B8CAE"
              fontSize={11}
              tickLine={false}
              domain={[80, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              dataKey={labelKey}
              type="category"
              stroke="#6B8CAE"
              fontSize={10}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Aprobación"]}
            />
            <Bar dataKey="tasaAprobacion" fill="#06D6A0" radius={[0, 4, 4, 0]} />
          </BarChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
            <XAxis
              dataKey={labelKey}
              stroke="#6B8CAE"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#6B8CAE"
              fontSize={11}
              tickLine={false}
              domain={[80, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Aprobación"]}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#6B8CAE" }} />
            <Bar dataKey="tasaAprobacion" fill="#06D6A0" radius={[4, 4, 0, 0]} name="Tasa de Aprobación" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
