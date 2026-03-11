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

interface ISCEEntry {
  codigoDane: string;
  nombre: string;
  comuna: string;
  sector: string;
  isce_2015?: number;
  isce_2016?: number;
  isce_2017?: number;
  isce_2018?: number;
}

export function ISCEChart() {
  const [year, setYear] = useState<"2018" | "2017" | "2016" | "2015">("2018");
  const { data, loading, error, retry } = useFetchData<ISCEEntry[]>("/data/isce_por_ie.json");

  if (loading) return <ChartSkeleton height={500} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const key = `isce_${year}` as keyof ISCEEntry;
  const filtered = data
    .filter((d) => typeof d[key] === "number" && (d[key] as number) > 0)
    .sort((a, b) => ((b[key] as number) || 0) - ((a[key] as number) || 0));

  const top20 = filtered.slice(0, 20).map((d) => ({
    nombre: (d.nombre || "").substring(0, 25),
    nombreFull: d.nombre,
    valor: d[key] as number,
    sector: d.sector,
    comuna: d.comuna,
  }));

  const cityAvg =
    filtered.reduce((sum, d) => sum + ((d[key] as number) || 0), 0) /
    filtered.length;

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
            ISCE — Top 20 Instituciones ({year})
          </h3>
          <p className="text-xs text-muted mt-1">
            Promedio ciudad: {cityAvg.toFixed(2)} | {filtered.length} IEs con
            dato
          </p>
        </div>
        <div className="flex gap-1">
          {(["2018", "2017", "2016", "2015"] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-2 py-1 text-xs rounded ${
                year === y
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground bg-background/50"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={top20} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" horizontal={false} />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[0, 10]}
          />
          <YAxis
            dataKey="nombre"
            type="category"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
            width={160}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [Number(value).toFixed(2), `ISCE ${year}`]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
            {top20.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.sector === "privado"
                    ? "#FFB703"
                    : entry.valor >= 7
                      ? "#06D6A0"
                      : "#00D4FF"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#00D4FF]" /> Oficial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#FFB703]" /> Privado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#06D6A0]" /> Oficial
          (ISCE &ge; 7)
        </span>
      </div>
      <p className="text-[10px] text-muted mt-2">Nota: El MEN dejó de publicar el ISCE después de 2018.</p>
    </div>
  );
}
