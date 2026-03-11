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
  color = "#00D4FF",
  unit = "%",
}: TrendChartProps) {
  const [data, setData] = useState<StatRecord[]>([]);

  useEffect(() => {
    fetch("/data/estadisticas_historicas.json")
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

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
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
            labelFormatter={(label) => `Año ${label}`}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            dot={{ r: 3, fill: color, stroke: "#0D1B2A", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
