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
  Cell,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

interface OutlierIE {
  nombre: string;
  naturaleza: string;
  puntaje: number;
  diferencia: number;
  evaluados: number;
}

interface OutliersData {
  sobre_rinden: OutlierIE[];
  sub_rinden: OutlierIE[];
}

type View = "sobre" | "sub";

export function OutliersChart() {
  const [view, setView] = useState<View>("sobre");
  const { data, loading, error, retry } = useFetchData<OutliersData>("/data/outliers_ie.json");

  if (loading) return <ChartSkeleton height={400} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const items = view === "sobre" ? data.sobre_rinden.slice(0, 15) : data.sub_rinden.slice(0, 15);
  const chartData = items.map(d => ({
    nombre: d.nombre.length > 30 ? d.nombre.slice(0, 28) + "..." : d.nombre,
    nombreFull: d.nombre,
    diferencia: d.diferencia,
    puntaje: d.puntaje,
    evaluados: d.evaluados,
    naturaleza: d.naturaleza,
  }));

  return (
    <div className="apple-card p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-[12px] font-semibold text-foreground">
            IEs que {view === "sobre" ? "Sobre-rinden" : "Sub-rinden"} vs. Baseline
          </h3>
          <span className="text-[10px] font-[var(--font-geist-mono)] text-muted block mt-1">
            Baseline: Oficial 245 pts, No Oficial 260 pts · Min 20 evaluados ·{" "}
            {data.sobre_rinden.length} sobre-rinden, {data.sub_rinden.length} sub-rinden
          </span>
        </div>
        <div className="flex gap-1">
          {(["sobre", "sub"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2 py-1 text-[11px] transition-colors ${
                view === v
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {v === "sobre" ? `Sobre (${data.sobre_rinden.length})` : `Sub (${data.sub_rinden.length})`}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" horizontal={false} />
          <XAxis
            type="number"
            stroke="#86868B"
            fontSize={11}
            tickLine={false}
            domain={view === "sobre" ? [0, "dataMax + 10"] : ["dataMin - 10", 0]}
            tickFormatter={v => `${v > 0 ? "+" : ""}${v}`}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            stroke="#86868B"
            fontSize={9}
            tickLine={false}
            width={160}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => {
              if (String(name) === "diferencia") {
                const v = Number(value);
                return [`${v > 0 ? "+" : ""}${v.toFixed(1)} pts`, "Diferencia vs baseline"];
              }
              return [value, name];
            }}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey="diferencia" radius={view === "sobre" ? [0, 4, 4, 0] : [4, 0, 0, 4]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={view === "sobre"
                  ? (entry.diferencia > 80 ? "#007AFF" : entry.diferencia > 50 ? "#5AC8FA" : "#5856D6")
                  : (entry.diferencia < -50 ? "#FF3B30" : "#FF9500")
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
