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
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { DataVintage } from "@/components/ui/DataVintage";

interface GradoArea {
  grado: string;
  area: string;
  promedioCiudad: number;
  nivelAvanzado: number;
  nivelSatisfactorio: number;
  nivelMinimo: number;
  nivelSuperior?: number;
  registros: number;
}

interface Saber359Data {
  porGradoArea: GradoArea[];
  porComuna: { comuna: string; promedio: number; count: number }[];
  ultimoAnio: string;
}

const GRADE_LABELS: Record<string, string> = {
  "3": "Grado 3",
  "5": "Grado 5",
  "9": "Grado 9",
};

const AREA_COLORS: Record<string, string> = {
  lenguaje: "#007AFF",
  matematicas: "#5856D6",
};

export function Saber359Chart() {
  const { data, loading, error, retry } = useFetchData<Saber359Data>("/data/saber_3_5_9.json");

  if (loading) return <ChartSkeleton height={400} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const chartData = data.porGradoArea.map(d => ({
    label: `${GRADE_LABELS[d.grado] || `G${d.grado}`} — ${d.area === "lenguaje" ? "Lenguaje" : "Matematicas"}`,
    promedio: d.promedioCiudad,
    avanzado: d.nivelAvanzado,
    satisfactorio: d.nivelSatisfactorio,
    minimo: d.nivelMinimo,
    registros: d.registros,
    area: d.area,
  }));

  // Top 5 comunas
  const topComunas = [...data.porComuna].sort((a, b) => b.promedio - a.promedio).slice(0, 8);

  const COMUNA_NAMES: Record<string, string> = {
    "1": "Popular", "2": "Santa Cruz", "3": "Manrique", "4": "Aranjuez",
    "5": "Castilla", "6": "Doce de Octubre", "7": "Robledo",
    "8": "Villa Hermosa", "9": "Buenos Aires", "10": "La Candelaria",
    "11": "Laureles", "12": "La America", "13": "San Javier",
    "14": "El Poblado", "15": "Guayabal", "16": "Belen",
    "50": "Palmitas", "60": "San Cristobal", "70": "Altavista",
    "80": "San Antonio", "90": "Santa Elena",
  };

  return (
    <div className="apple-card p-6">
      <div className="mb-4">
        <h3 className="text-[12px] font-semibold text-foreground">
          Pruebas Saber 3, 5 y 9
        </h3>
        <DataVintage fuente="MEData CSV" ultimoDato={data.ultimoAnio} nota="Lenguaje y Matematicas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promedio por grado-area */}
        <div>
          <h4 className="text-[10px] text-muted uppercase tracking-widest mb-3">Promedio ciudad por grado y area</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" horizontal={false} />
              <XAxis type="number" stroke="#86868B" fontSize={11} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                stroke="#86868B"
                fontSize={9}
                tickLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [`${Number(value).toFixed(1)}`, "Promedio"]}
              />
              <Bar dataKey="promedio" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={AREA_COLORS[entry.area] || "#86868B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top comunas */}
        <div>
          <h4 className="text-[10px] text-muted uppercase tracking-widest mb-3">Promedio por comuna (todos los grados)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topComunas} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" horizontal={false} />
              <XAxis type="number" stroke="#86868B" fontSize={11} tickLine={false} domain={[250, "dataMax + 10"]} />
              <YAxis
                type="category"
                dataKey="comuna"
                stroke="#86868B"
                fontSize={10}
                tickLine={false}
                width={40}
                tickFormatter={(v) => COMUNA_NAMES[v] || v}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [`${Number(value).toFixed(1)}`, "Promedio"]}
                labelFormatter={(v) => COMUNA_NAMES[String(v)] || String(v)}
              />
              <Bar dataKey="promedio" fill="#007AFF" radius={[0, 4, 4, 0]}>
                {topComunas.map((_, i) => (
                  <Cell key={i} fill={i < 3 ? "#007AFF" : "#86868B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Niveles de desempeno */}
      <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
        {data.porGradoArea.map((d, i) => (
          <div key={i} className="border border-border/50 p-2">
            <p className="text-[9px] text-muted uppercase tracking-wider">
              G{d.grado} {d.area === "lenguaje" ? "Leng" : "Mat"}
            </p>
            <p className="font-[var(--font-geist-mono)] text-sm font-semibold text-foreground mt-1">
              {d.promedioCiudad}
            </p>
            <div className="flex gap-1 mt-1">
              <div className="h-1 bg-accent" style={{ width: `${d.nivelAvanzado}%` }} title={`Avanzado: ${d.nivelAvanzado}%`} />
              <div className="h-1 bg-[#5AC8FA]" style={{ width: `${d.nivelSatisfactorio}%` }} title={`Satisfactorio: ${d.nivelSatisfactorio}%`} />
              <div className="h-1 bg-warning" style={{ width: `${d.nivelMinimo}%` }} title={`Minimo: ${d.nivelMinimo}%`} />
            </div>
            <p className="text-[8px] text-muted mt-0.5">{d.registros} eval</p>
          </div>
        ))}
      </div>
    </div>
  );
}
