"use client";

import { useEffect, useState } from "react";
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
  const [data, setData] = useState<ComunaData[]>([]);
  const [year, setYear] = useState<string>("");

  useEffect(() => {
    fetch("/data/desercion_medellin.json")
      .then((r) => r.json())
      .then((res: DesercionResponse) => {
        const sorted = [...res.porComuna].sort(
          (a, b) => a.tasaDesercion - b.tasaDesercion
        );
        setData(sorted);
        setYear(res.ultimoAnio);
      })
      .catch(() => {});
  }, []);

  if (!data.length) {
    return (
      <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
        <p className="text-muted text-sm">Cargando datos...</p>
      </div>
    );
  }

  const min = Math.min(...data.map((d) => d.tasaDesercion));
  const max = Math.max(...data.map((d) => d.tasaDesercion));
  const chartHeight = Math.max(400, data.length * 32);

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-4">
        Tasa de Desercion por Comuna ({year})
      </h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
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
            contentStyle={{
              background: "#0D1B2A",
              border: "1px solid #1A2D42",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#E8F4FD",
            }}
            formatter={(value) => [
              `${value}%`,
              "Tasa de Deserción",
            ]}
            cursor={{ fill: "rgba(0, 212, 255, 0.05)" }}
          />
          <Bar dataKey="tasaDesercion" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
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
