"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { DataVintage } from "@/components/ui/DataVintage";

interface TrendChartProps {
  title: string;
  dataKey: string;
  color?: string;
  unit?: string;
}

interface StatRecord {
  anio: string;
  [key: string]: string | number | null;
}

export function TrendChart({
  title,
  dataKey,
  color = "#007AFF",
  unit = "%",
}: TrendChartProps) {
  const { data, loading, error, retry } = useFetchData<StatRecord[]>("/data/estadisticas_historicas.json");

  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  return (
    <div className="apple-card p-6" role="img" aria-label="Gráfica de datos educativos">
      <h3 className="text-[12px] font-semibold text-foreground mb-1">
        {title}
      </h3>
      <DataVintage
        fuente="Antioquia · ji8i-4anb"
        ultimoDato={data[data.length - 1]?.anio as string | undefined}
      />
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
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
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${value}${unit}`, title]}
            labelFormatter={(label) => `Año ${label}`}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            dot={{ r: 3, fill: color, stroke: "#FFFFFF", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
