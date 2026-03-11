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
  const [data, setData] = useState<SerieTemporal[]>([]);

  useEffect(() => {
    fetch("/data/matricula_medellin.json")
      .then((r) => r.json())
      .then((res: MatriculaResponse) => {
        setData(res.serieTemporal);
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

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-4">
        Matrícula Total — Medellín
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
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
            contentStyle={{
              background: "#0D1B2A",
              border: "1px solid #1A2D42",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#E8F4FD",
            }}
            formatter={(value, name) => [
              formatNumber(Number(value)),
              String(name) === "oficial" ? "Oficial" : "Privado",
            ]}
            labelFormatter={(label) => `Año ${label}`}
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
