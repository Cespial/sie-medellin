"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MedellinTrendChartProps {
  title: string;
  dataKey: string;
  color?: string;
  unit?: string;
}

interface StatRecord {
  anio: string;
  [key: string]: string | number | null;
}

export function MedellinTrendChart({
  title,
  dataKey,
  color = "#00D4FF",
  unit = "%",
}: MedellinTrendChartProps) {
  const [data, setData] = useState<StatRecord[]>([]);

  useEffect(() => {
    fetch("/data/estadisticas_medellin.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data.length) {
    return (
      <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
        <p className="text-muted text-sm">Cargando datos...</p>
      </div>
    );
  }

  const latestVal = data[data.length - 1]?.[dataKey];
  const prevVal = data[data.length - 2]?.[dataKey];
  const change =
    typeof latestVal === "number" && typeof prevVal === "number"
      ? latestVal - prevVal
      : null;

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Medellín ETC | {data[0]?.anio}–{data[data.length - 1]?.anio}
          </p>
        </div>
        {change !== null && (
          <div
            className={`text-xs font-mono px-2 py-1 rounded ${
              change > 0
                ? dataKey.includes("desercion") || dataKey.includes("reprobacion") || dataKey.includes("repitencia")
                  ? "text-danger bg-danger/10"
                  : "text-success bg-success/10"
                : dataKey.includes("desercion") || dataKey.includes("reprobacion") || dataKey.includes("repitencia")
                  ? "text-success bg-success/10"
                  : "text-danger bg-danger/10"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change.toFixed(2)}
            {unit}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient
              id={`grad-mde-${dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
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
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Tooltip
            contentStyle={{
              background: "#0D1B2A",
              border: "1px solid #1A2D42",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#E8F4FD",
            }}
            formatter={(value) => [`${value}${unit}`, title]}
            labelFormatter={(label) => `${label}`}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-mde-${dataKey})`}
            dot={{ r: 3, fill: color, stroke: "#0D1B2A", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
