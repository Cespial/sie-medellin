"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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

interface DocentesData {
  anio: string;
  total_docentes: number;
  por_genero: { genero: string; total: number }[];
  por_nivel_educativo: { nivel: string; total: number }[];
  por_nivel_ensenanza: { nivel: string; total: number }[];
  por_estatuto: { estatuto: string; total: number }[];
  por_tipo_vinculacion: { tipo: string; total: number }[];
  por_zona: { zona: string; total: number }[];
}

const GENDER_COLORS: Record<string, string> = {
  F: "#FF6B9D",
  M: "#00D4FF",
};

export function DocentesChart() {
  const { data, loading, error, retry } =
    useFetchData<DocentesData>("/data/docentes_perfil_medellin.json");

  if (loading) return <ChartSkeleton height={400} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const genderData = data.por_genero.map((g) => ({
    name: g.genero === "F" ? "Femenino" : "Masculino",
    value: g.total,
    color: GENDER_COLORS[g.genero] || "#6B8CAE",
  }));

  // Truncate long level names for the bar chart
  const nivelData = data.por_nivel_educativo.slice(0, 6).map((n) => ({
    nivel: n.nivel.length > 30 ? n.nivel.slice(0, 28) + "..." : n.nivel,
    total: n.total,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
            {"Perfil Docente Oficial \u2014 " + data.anio}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {data.total_docentes.toLocaleString("es-CO")} docentes |
            datos.gov.co/MEN
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Género */}
        <div>
          <h4 className="text-xs font-semibold text-muted mb-3">
            Distribución por Género
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="#0D1B2A"
                strokeWidth={2}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {genderData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [
                  Number(value).toLocaleString("es-CO"),
                  "Docentes",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Quick stats below pie */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.por_estatuto.map((e) => (
              <div
                key={e.estatuto}
                className="text-center p-2 rounded-lg bg-background/50"
              >
                <p className="font-[var(--font-jetbrains)] text-sm font-bold text-foreground">
                  {e.total.toLocaleString("es-CO")}
                </p>
                <p className="text-[10px] text-muted">
                  Estatuto {e.estatuto}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Nivel educativo del docente */}
        <div>
          <h4 className="text-xs font-semibold text-muted mb-3">
            Formación del Docente
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nivelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
              <XAxis
                type="number"
                stroke="#6B8CAE"
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)
                }
              />
              <YAxis
                type="category"
                dataKey="nivel"
                stroke="#6B8CAE"
                fontSize={9}
                tickLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [
                  Number(value).toLocaleString("es-CO"),
                  "Docentes",
                ]}
              />
              <Bar dataKey="total" fill="#3E92CC" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
