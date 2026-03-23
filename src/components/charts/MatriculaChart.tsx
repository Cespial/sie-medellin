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
  ReferenceLine,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { DataVintage } from "@/components/ui/DataVintage";

interface SerieTemporal {
  anio: string;
  total: number;
  oficial: number | null;
  privado: number | null;
  estimado?: boolean;
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
  const realData = chartData.filter((d) => !d.estimado);
  const estimatedData = chartData.filter((d) => d.estimado);
  const lastRealYear = realData.length ? realData[realData.length - 1].anio : "";
  const hasEstimated = estimatedData.length > 0;

  // For the chart: split into real total vs estimated total
  const enrichedData = chartData.map((d) => ({
    ...d,
    totalReal: d.estimado ? null : d.total,
    totalEstimado: d.estimado ? d.total : null,
    // Bridge point: last real year also goes in estimated series for continuity
    ...(d.anio === lastRealYear && hasEstimated ? { totalEstimado: d.total } : {}),
  }));

  return (
    <div className="apple-card p-6" role="img" aria-label="Gráfica de datos educativos">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[12px] font-semibold text-foreground">
            Matrícula Total — Medellín
          </h3>
          <DataVintage
            fuente="MEData CSV + sras-4t5p"
            ultimoDato={lastRealYear}
            nota={hasEstimated ? `Estimaciones ${estimatedData[0]?.anio}-${estimatedData[estimatedData.length - 1]?.anio}` : undefined}
          />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={enrichedData}>
          <defs>
            <linearGradient id="grad-oficial" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-privado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF9500" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF9500" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-estimado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#86868B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#86868B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
          <XAxis
            dataKey="anio"
            stroke="#86868B"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#86868B"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => formatNumber(v)}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => {
              if (value === null) return ["-", ""];
              const label =
                String(name) === "oficial" ? "Oficial" :
                String(name) === "privado" ? "Privado" :
                String(name) === "totalEstimado" ? "Total (estimado)" :
                "Total";
              return [formatNumber(Number(value)), label];
            }}
            labelFormatter={(label) => `Año ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) =>
              value === "oficial" ? "Oficial" :
              value === "privado" ? "Privado" :
              value === "totalEstimado" ? "Total (estimado*)" :
              value === "totalReal" ? "Total" : value
            }
          />
          {hasEstimated && (
            <ReferenceLine
              x={lastRealYear}
              stroke="#86868B"
              strokeDasharray="5 5"
              label={{ value: "Estimaciones →", position: "top", fill: "#86868B", fontSize: 9 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="oficial"
            stackId="matricula"
            stroke="#007AFF"
            strokeWidth={2}
            fill="url(#grad-oficial)"
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="privado"
            stackId="matricula"
            stroke="#FF9500"
            strokeWidth={2}
            fill="url(#grad-privado)"
            connectNulls={false}
          />
          {hasEstimated && (
            <Area
              type="monotone"
              dataKey="totalEstimado"
              stroke="#86868B"
              strokeWidth={2}
              strokeDasharray="8 4"
              fill="url(#grad-estimado)"
              connectNulls
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      {hasEstimated && (
        <p className="text-[10px] text-muted mt-2">
          * Estimado desde tasa de cobertura bruta × población 5-16 años (fuente: sras-4t5p). No desagregado oficial/privado.
        </p>
      )}
    </div>
  );
}
