"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Top5IE {
  nombre: string;
  comuna: string;
  puntaje: number;
}

interface Saber11Periodo {
  periodo: string;
  promedioCiudad: number;
  totalIEs: number;
  top5: Top5IE[];
}

export function Saber11HistoricoChart() {
  const [data, setData] = useState<Saber11Periodo[]>([]);

  useEffect(() => {
    fetch("/data/saber11_historico_medellin.json")
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

  const latestPeriod = data[data.length - 1];

  const formatPeriodo = (p: string) => {
    const year = p.slice(0, 4);
    const sem = p.slice(4);
    return `${year}-S${sem}`;
  };

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-4">
        {"Saber 11 \u2014 Promedio Hist\u00f3rico Medell\u00edn"}
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="periodo"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            tickFormatter={formatPeriodo}
          />
          <YAxis
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={["dataMin - 10", "dataMax + 10"]}
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
              `${Number(value).toFixed(1)} pts`,
              "Promedio Ciudad",
            ]}
            labelFormatter={(label) =>
              `Periodo ${formatPeriodo(String(label))}`
            }
          />
          <Line
            type="monotone"
            dataKey="promedioCiudad"
            stroke="#FFB703"
            strokeWidth={2}
            dot={{ r: 4, fill: "#FFB703", stroke: "#0D1B2A", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#FFB703" }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Top 5 IEs del ultimo periodo */}
      <div className="mt-6">
        <h4 className="text-xs font-semibold text-muted mb-2">
          Top 5 IEs — {formatPeriodo(latestPeriod.periodo)} ({latestPeriod.totalIEs} instituciones)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Nombre</th>
                <th className="py-2 pr-3 font-medium">Comuna</th>
                <th className="py-2 text-right font-medium">Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {latestPeriod.top5.map((ie, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2 pr-3 text-muted">{idx + 1}</td>
                  <td
                    className={`py-2 pr-3 capitalize ${
                      idx === 0
                        ? "text-[#FFB703] font-semibold"
                        : "text-foreground"
                    }`}
                  >
                    {ie.nombre}
                  </td>
                  <td className="py-2 pr-3 capitalize text-muted">
                    {ie.comuna.trim()}
                  </td>
                  <td
                    className={`py-2 text-right tabular-nums ${
                      idx === 0
                        ? "text-[#FFB703] font-semibold"
                        : "text-foreground"
                    }`}
                  >
                    {ie.puntaje.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
