"use client";

import {
  LineChart,
  Line,
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
  const { data, loading, error, retry } = useFetchData<Saber11Periodo[]>("/data/saber11_historico_medellin.json");

  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const latestPeriod = data[data.length - 1];

  const formatPeriodo = (p: string) => {
    const year = p.slice(0, 4);
    const sem = p.slice(4);
    return `${year}-S${sem}`;
  };

  return (
    <div className="apple-card p-6" role="img" aria-label="Gráfica de datos educativos">
      <h3 className="text-[12px] font-semibold text-foreground mb-1">
        {"Saber 11 \u2014 Promedio Hist\u00f3rico Medell\u00edn"}
      </h3>
      <DataVintage
        fuente={`MEData CSV + microdatos · ${data.length} períodos · ${data[0]?.periodo}–${data[data.length - 1]?.periodo}`}
        ultimoDato={data[data.length - 1]?.periodo?.slice(0, 4)}
      />

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
          <XAxis
            dataKey="periodo"
            stroke="#6E6E73"
            fontSize={11}
            tickLine={false}
            tickFormatter={formatPeriodo}
          />
          <YAxis
            stroke="#6E6E73"
            fontSize={11}
            tickLine={false}
            domain={["dataMin - 10", "dataMax + 10"]}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
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
            stroke="#FF9500"
            strokeWidth={2}
            dot={{ r: 4, fill: "#FF9500", stroke: "#FFFFFF", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#FF9500" }}
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
                        ? "text-[#FF9500] font-semibold"
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
                        ? "text-[#FF9500] font-semibold"
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
