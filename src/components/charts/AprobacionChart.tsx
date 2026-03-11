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
  Legend,
} from "recharts";

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
  const [data, setData] = useState<AprobacionData | null>(null);
  const [tab, setTab] = useState<Tab>("comuna");

  useEffect(() => {
    fetch("/data/aprobacion_medellin.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <p className="text-muted text-sm">Cargando datos de aprobación...</p>
      </div>
    );
  }

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
              contentStyle={{
                background: "#0D1B2A",
                border: "1px solid #1A2D42",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#E8F4FD",
              }}
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
              contentStyle={{
                background: "#0D1B2A",
                border: "1px solid #1A2D42",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#E8F4FD",
              }}
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
