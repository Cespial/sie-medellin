"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  Legend,
  ReferenceLine,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

interface EstratoData {
  estrato: string;
  promedio: number;
  evaluados: number;
}

interface InternetData {
  internet: string;
  promedio: number;
  evaluados: number;
}

interface MadreData {
  nivel: string;
  promedio: number;
  evaluados: number;
}

interface CrossData {
  estrato: string;
  con_internet: number;
  sin_internet: number;
  n_con: number;
  n_sin: number;
}

interface ComunaData {
  comuna: string;
  tasa_desercion?: number;
  tasa_aprobacion?: number;
  matricula_total?: number;
  evaluados_saber11?: number;
  oficial?: number;
  privado?: number;
}

interface CrucesData {
  saber11: {
    por_estrato: EstratoData[];
    por_internet: InternetData[];
    por_educacion_madre: MadreData[];
    por_jornada: { jornada: string; promedio: number; evaluados: number }[];
    por_caracter: { tipo: string; promedio: number; evaluados: number }[];
    por_sector: { sector: string; promedio: number; evaluados: number }[];
    por_genero: { genero: string; promedio: number; evaluados: number }[];
    estrato_x_internet: CrossData[];
    por_bilingue: { tipo: string; promedio: number; evaluados: number }[];
    total_evaluados: number;
  };
  comunas: ComunaData[];
}

type TabKey = "estrato" | "internet" | "madre" | "comunas" | "cruces";

const TABS: { key: TabKey; label: string }[] = [
  { key: "estrato", label: "Estrato" },
  { key: "internet", label: "Brecha Digital" },
  { key: "madre", label: "Ed. Madre" },
  { key: "comunas", label: "Comunas" },
  { key: "cruces", label: "Estrato\u00d7Internet" },
];

const ESTRATO_COLORS: Record<string, string> = {
  "1": "#EF233C",
  "2": "#FF6B6B",
  "3": "#FFB703",
  "4": "#06D6A0",
  "5": "#00D4FF",
  "6": "#3E92CC",
};

export function CrucesPanel() {
  const [tab, setTab] = useState<TabKey>("estrato");
  const { data, loading, error, retry } =
    useFetchData<CrucesData>("/data/cruces_multivariable.json");

  if (loading) return <ChartSkeleton height={550} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const s = data.saber11;

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
            {
              "An\u00e1lisis Multivariable \u2014 Saber 11 \u00d7 Contexto Socioecon\u00f3mico"
            }
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {s.total_evaluados.toLocaleString("es-CO")} evaluados | Microdatos
            ICFES | datos.gov.co
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mt-4 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              tab === t.key
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted hover:text-foreground hover:bg-surface border border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "estrato" && <EstratoTab data={s.por_estrato} />}
      {tab === "internet" && (
        <InternetTab
          internet={s.por_internet}
          sector={s.por_sector}
          jornada={s.por_jornada}
          bilingue={s.por_bilingue}
        />
      )}
      {tab === "madre" && <MadreTab data={s.por_educacion_madre} />}
      {tab === "comunas" && <ComunasTab data={data.comunas} />}
      {tab === "cruces" && <CrucesTab data={s.estrato_x_internet} />}
    </div>
  );
}

function EstratoTab({ data }: { data: EstratoData[] }) {
  const brecha = data.length >= 2
    ? data[data.length - 1].promedio - data[0].promedio
    : 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
          <p className="text-[10px] text-muted">Brecha E1-E5</p>
          <p className="font-[var(--font-jetbrains)] text-lg font-bold text-danger">
            {brecha.toFixed(1)} pts
          </p>
        </div>
        <p className="text-xs text-muted max-w-md">
          Un estudiante de estrato 5 obtiene en promedio{" "}
          <span className="text-foreground font-medium">
            {brecha.toFixed(0)} puntos m&aacute;s
          </span>{" "}
          que uno de estrato 1 en el Saber 11.
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="estrato"
            stroke="#6B8CAE"
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) => `E${v}`}
          />
          <YAxis
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[200, 320]}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio Global",
            ]}
            labelFormatter={(l) => `Estrato ${l}`}
          />
          <Bar dataKey="promedio" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.estrato}
                fill={ESTRATO_COLORS[entry.estrato] || "#6B8CAE"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-3">
        {data.map((e) => (
          <span
            key={e.estrato}
            className="text-[10px] text-muted px-2 py-1 rounded bg-background/50"
          >
            E{e.estrato}: {e.evaluados.toLocaleString("es-CO")} eval.
          </span>
        ))}
      </div>
    </div>
  );
}

function InternetTab({
  internet,
  sector,
  jornada,
  bilingue,
}: {
  internet: InternetData[];
  sector: { sector: string; promedio: number; evaluados: number }[];
  jornada: { jornada: string; promedio: number; evaluados: number }[];
  bilingue: { tipo: string; promedio: number; evaluados: number }[];
}) {
  const brechaNet =
    internet.length === 2
      ? Math.abs(internet[0].promedio - internet[1].promedio)
      : 0;

  const allFactors = [
    ...internet.map((i) => ({
      factor: i.internet === "Si" ? "Con Internet" : "Sin Internet",
      promedio: i.promedio,
      evaluados: i.evaluados,
      color: i.internet === "Si" ? "#06D6A0" : "#EF233C",
    })),
    ...sector.map((s) => ({
      factor: s.sector === "OFICIAL" ? "Oficial" : "No Oficial",
      promedio: s.promedio,
      evaluados: s.evaluados,
      color: s.sector === "OFICIAL" ? "#00D4FF" : "#FFB703",
    })),
    ...bilingue.map((b) => ({
      factor: b.tipo,
      promedio: b.promedio,
      evaluados: b.evaluados,
      color: b.tipo === "Bilingüe" ? "#3E92CC" : "#6B8CAE",
    })),
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
          <p className="text-[10px] text-muted">Brecha Digital</p>
          <p className="font-[var(--font-jetbrains)] text-lg font-bold text-danger">
            {brechaNet.toFixed(1)} pts
          </p>
        </div>
        <p className="text-xs text-muted max-w-md">
          Estudiantes{" "}
          <span className="text-foreground font-medium">sin internet</span>{" "}
          obtienen {brechaNet.toFixed(0)} puntos menos. Factores comparados:
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={allFactors} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[180, 320]}
          />
          <YAxis
            type="category"
            dataKey="factor"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]}>
            {allFactors.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MadreTab({ data }: { data: MadreData[] }) {
  // Truncate labels
  const chartData = data.slice(0, 8).map((d) => ({
    ...d,
    label:
      d.nivel.length > 35
        ? d.nivel.slice(0, 33) + "..."
        : d.nivel,
  }));

  return (
    <div>
      <p className="text-xs text-muted mb-4">
        {
          "La educaci\u00f3n de la madre es uno de los predictores m\u00e1s fuertes del rendimiento acad\u00e9mico."
        }
      </p>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[200, 300]}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#6B8CAE"
            fontSize={9}
            tickLine={false}
            width={160}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" fill="#3E92CC" radius={[0, 6, 6, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.promedio >= 270
                    ? "#06D6A0"
                    : entry.promedio >= 250
                      ? "#FFB703"
                      : "#EF233C"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComunasTab({ data }: { data: ComunaData[] }) {
  const valid = data.filter(
    (c) =>
      c.tasa_desercion != null &&
      c.tasa_aprobacion != null &&
      c.matricula_total != null
  );

  return (
    <div>
      <p className="text-xs text-muted mb-4">
        {
          "Cada punto es una comuna. Eje X = deserci\u00f3n, Eje Y = aprobaci\u00f3n. Tama\u00f1o = matr\u00edcula."
        }
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            dataKey="tasa_desercion"
            name="Deserción"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            label={{
              value: "Tasa Deserción (%)",
              position: "insideBottom",
              offset: -5,
              fill: "#6B8CAE",
              fontSize: 10,
            }}
          />
          <YAxis
            type="number"
            dataKey="tasa_aprobacion"
            name="Aprobación"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[84, 96]}
            label={{
              value: "Aprobación (%)",
              angle: -90,
              position: "insideLeft",
              fill: "#6B8CAE",
              fontSize: 10,
            }}
          />
          <ZAxis
            type="number"
            dataKey="matricula_total"
            range={[60, 400]}
            name="Matrícula"
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => {
              const label =
                String(name) === "Deserción"
                  ? "Deserción"
                  : String(name) === "Aprobación"
                    ? "Aprobación"
                    : "Matrícula";
              const suffix =
                label === "Matrícula"
                  ? ""
                  : "%";
              return [
                `${label === "Matrícula" ? Number(value).toLocaleString("es-CO") : Number(value).toFixed(2)}${suffix}`,
                label,
              ];
            }}
            labelFormatter={() => ""}
          />
          <Scatter data={valid} fill="#00D4FF" fillOpacity={0.7}>
            {valid.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  (entry.tasa_desercion ?? 0) > 4
                    ? "#EF233C"
                    : (entry.tasa_desercion ?? 0) > 2.5
                      ? "#FFB703"
                      : "#06D6A0"
                }
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-[10px] text-muted justify-center">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#06D6A0]" />
          {"Deserción < 2.5%"}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#FFB703]" />
          2.5-4%
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#EF233C]" />
          {"> 4%"}
        </div>
      </div>
    </div>
  );
}

function CrucesTab({ data }: { data: CrossData[] }) {
  return (
    <div>
      <p className="text-xs text-muted mb-4">
        {
          "Cruce de dos variables: estrato socioecon\u00f3mico \u00d7 acceso a internet. La brecha digital amplifica la desigualdad."
        }
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="estrato"
            stroke="#6B8CAE"
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) => `E${v}`}
          />
          <YAxis
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[180, 320]}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} pts`,
              String(name) === "con_internet"
                ? "Con Internet"
                : "Sin Internet",
            ]}
            labelFormatter={(l) => `Estrato ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(v) =>
              v === "con_internet" ? "Con Internet" : "Sin Internet"
            }
          />
          <Bar
            dataKey="con_internet"
            fill="#06D6A0"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="sin_internet"
            fill="#EF233C"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted text-center mt-2">
        En todos los estratos, tener internet mejora el puntaje. La brecha es
        mayor en estratos altos (hasta 84 pts en E6).
      </p>
    </div>
  );
}
