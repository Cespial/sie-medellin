"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

interface NivelMatricula {
  nivel: string;
  femenino: number;
  masculino: number;
}

interface NivelIPG {
  nivel: string;
  ipg: number;
}

interface ParidadData {
  anio: string;
  matricula_por_nivel: NivelMatricula[];
  ipg_cobertura_bruta: NivelIPG[];
  poblacion_por_edad: { rango: string; hombres: number; mujeres: number }[];
}

function getIPGColor(ipg: number): string {
  if (ipg < 0.95) return "#FF3B30";
  if (ipg > 1.05) return "#34C759";
  return "#FF9500";
}

export function ParidadGeneroChart() {
  const { data, loading, error, retry } =
    useFetchData<ParidadData>("/data/paridad_genero_medellin.json");

  if (loading) return <ChartSkeleton height={500} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  return (
    <div className="apple-card p-6" role="img" aria-label="Gráfica de datos educativos">
      <h3 className="text-[12px] font-semibold text-foreground mb-1">
        {"\u00cdndice de Paridad de G\u00e9nero \u2014 " + data.anio}
      </h3>
      <span className={`text-[10px] block mb-6 ${Number(data.anio) < new Date().getFullYear() - 2 ? "text-[#FF9500]" : "text-muted"}`}>
        datos.gov.co/MEN · Último dato: {data.anio} · 1 registro snapshot
      </span>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matrícula por género y nivel */}
        <div>
          <h4 className="text-xs font-semibold text-muted mb-3">
            Matrícula por Género
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.matricula_por_nivel}
              layout="vertical"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
              <XAxis
                type="number"
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
              />
              <YAxis
                type="category"
                dataKey="nivel"
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                width={75}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value, name) => [
                  Number(value).toLocaleString("es-CO"),
                  String(name) === "femenino" ? "Femenino" : "Masculino",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                formatter={(v) =>
                  v === "femenino" ? "Femenino" : "Masculino"
                }
              />
              <Bar dataKey="femenino" fill="#FF2D55" radius={[0, 4, 4, 0]} />
              <Bar dataKey="masculino" fill="#007AFF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* IPG por nivel */}
        <div>
          <h4 className="text-xs font-semibold text-muted mb-3">
            IPG Cobertura Bruta (1.0 = paridad)
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.ipg_cobertura_bruta}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
              <XAxis
                dataKey="nivel"
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#6E6E73"
                fontSize={11}
                tickLine={false}
                domain={[0.8, 1.3]}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [
                  Number(value).toFixed(2),
                  "IPG",
                ]}
              />
              <ReferenceLine
                y={1}
                stroke="#6E6E73"
                strokeDasharray="5 5"
                label={{
                  value: "Paridad",
                  position: "right",
                  fill: "#6E6E73",
                  fontSize: 10,
                }}
              />
              <Bar dataKey="ipg" radius={[4, 4, 0, 0]}>
                {data.ipg_cobertura_bruta.map((entry, index) => (
                  <Cell key={index} fill={getIPGColor(entry.ipg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px] text-muted justify-center">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
              {"< 0.95 (brecha M)"}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
              Paridad
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#34C759]" />
              {"> 1.05 (brecha F)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
