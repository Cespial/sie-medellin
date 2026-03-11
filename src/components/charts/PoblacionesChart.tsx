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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

interface PoblacionCategory {
  totalUltimoAnio: number;
  serieTemporal: { anio: string; total: number }[];
  porComuna: { comuna: string; total: number }[];
  [key: string]: unknown;
}

interface PoblacionesData {
  extranjeros: PoblacionCategory & {
    porPais: { pais: string; total: number }[];
  };
  etnias: PoblacionCategory & {
    porEtnia: { etnia: string; total: number }[];
  };
  victimas: PoblacionCategory & {
    porTipo: { tipo: string; total: number }[];
  };
  nee: PoblacionCategory & {
    porTipo: { tipo: string; total: number }[];
  };
}

type Tab = "extranjeros" | "etnias" | "victimas" | "nee";

const COLORS = ["#00D4FF", "#FFB703", "#EF233C", "#06D6A0", "#9B5DE5", "#FF6B6B", "#3E92CC", "#F8961E"];

const LABELS: Record<Tab, string> = {
  extranjeros: "Estudiantes Extranjeros",
  etnias: "Grupos Étnicos",
  victimas: "Víctimas de Violencia",
  nee: "Necesidades Educativas Especiales",
};

export function PoblacionesChart() {
  const [tab, setTab] = useState<Tab>("extranjeros");
  const { data, loading, error, retry } = useFetchData<PoblacionesData>("/data/poblaciones_especiales.json");

  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const current = data[tab];
  const categoryData =
    tab === "extranjeros"
      ? (data.extranjeros.porPais || []).slice(0, 8)
      : tab === "etnias"
        ? (data.etnias.porEtnia || []).slice(0, 8)
        : tab === "victimas"
          ? (data.victimas.porTipo || []).slice(0, 8)
          : (data.nee.porTipo || []).slice(0, 8);

  const categoryKey =
    tab === "extranjeros" ? "pais" : tab === "etnias" ? "etnia" : "tipo";

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
            Poblaciones Especiales en Educación Formal
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Total último año: {current.totalUltimoAnio?.toLocaleString() || 0}{" "}
            estudiantes
          </p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2 py-1 text-[11px] rounded ${
                tab === t
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground bg-background/50"
              }`}
            >
              {LABELS[t].split(" ").slice(-1)[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div>
          <p className="text-xs text-muted mb-2 font-medium">
            Distribución por{" "}
            {tab === "extranjeros"
              ? "país"
              : tab === "etnias"
                ? "etnia"
                : "tipo"}
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="total"
                nameKey={categoryKey}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {categoryData.map((_: unknown, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.map(
              (
                item: Record<string, unknown>,
                i: number
              ) => (
                <span
                  key={i}
                  className="flex items-center gap-1 text-[10px] text-muted"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  {String(item[categoryKey] || "").substring(0, 20)}
                </span>
              )
            )}
          </div>
        </div>

        {/* By comuna */}
        <div>
          <p className="text-xs text-muted mb-2 font-medium">
            Top comunas
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={(current.porComuna || []).slice(0, 10)}
              layout="vertical"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1A2D42"
                horizontal={false}
              />
              <XAxis type="number" stroke="#6B8CAE" fontSize={10} tickLine={false} />
              <YAxis
                dataKey="comuna"
                type="category"
                stroke="#6B8CAE"
                fontSize={10}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Estudiantes",
                ]}
              />
              <Bar dataKey="total" fill="#00D4FF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {(Object.keys(LABELS) as Tab[]).map((t, i) => (
          <div
            key={t}
            className={`rounded-lg border border-border p-3 ${
              tab === t ? "bg-accent/5 border-accent/30" : "bg-background/50"
            }`}
          >
            <p className="text-[10px] text-muted uppercase tracking-wide">
              {LABELS[t].split(" ").slice(-1)[0]}
            </p>
            <p
              className="text-lg font-bold mt-1"
              style={{ color: COLORS[i] }}
            >
              {(data[t].totalUltimoAnio || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
