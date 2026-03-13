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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";
import { useFetchData } from "@/hooks/useFetchData";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-styles";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

/* ---------- types ---------- */

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

interface GeneroEstratoData {
  estrato: string;
  f: number;
  m: number;
  n_f: number;
  n_m: number;
}

interface SectorEstratoData {
  estrato: string;
  oficial: number;
  no_oficial: number;
  n_oficial: number;
  n_no_oficial: number;
}

interface MateriasData {
  [key: string]: string | number;
}

interface BinaryData {
  tiene: string;
  promedio: number;
  evaluados: number;
}

interface ComunaData {
  comuna: string;
  tasa_desercion?: number;
  tasa_aprobacion?: number;
  matricula_total?: number;
  evaluados_saber11?: number;
  oficial?: number;
  privado?: number;
  matricula_total_serie?: number;
  ies_con_saber11?: number;
}

interface CrucesData {
  saber11: {
    por_estrato: EstratoData[];
    por_internet: InternetData[];
    por_educacion_madre: MadreData[];
    por_educacion_padre: MadreData[];
    por_jornada: { jornada: string; promedio: number; evaluados: number }[];
    por_caracter: { tipo: string; promedio: number; evaluados: number }[];
    por_sector: { sector: string; promedio: number; evaluados: number }[];
    por_genero: { genero: string; promedio: number; evaluados: number }[];
    estrato_x_internet: CrossData[];
    genero_x_estrato: GeneroEstratoData[];
    sector_x_estrato: SectorEstratoData[];
    materias_x_estrato: MateriasData[];
    materias_x_genero: MateriasData[];
    por_bilingue: { tipo: string; promedio: number; evaluados: number }[];
    por_computador: BinaryData[];
    por_automovil: BinaryData[];
    por_lavadora: BinaryData[];
    por_personas_hogar: {
      personas: string;
      promedio: number;
      evaluados: number;
    }[];
    por_cuartos_hogar: {
      cuartos: string;
      promedio: number;
      evaluados: number;
    }[];
    total_evaluados: number;
  };
  comunas: ComunaData[];
}

type TabKey =
  | "estrato"
  | "digital"
  | "familia"
  | "genero"
  | "institucional"
  | "comunas";

const TABS: { key: TabKey; label: string }[] = [
  { key: "estrato", label: "Estrato" },
  { key: "digital", label: "Brecha Digital" },
  { key: "familia", label: "Familia" },
  { key: "genero", label: "Género" },
  { key: "institucional", label: "Institucional" },
  { key: "comunas", label: "Comunas" },
];

const ESTRATO_COLORS: Record<string, string> = {
  "1": "#EF233C",
  "2": "#FF6B6B",
  "3": "#FFB703",
  "4": "#06D6A0",
  "5": "#00D4FF",
  "6": "#3E92CC",
};

const SUBJECT_LABELS: Record<string, string> = {
  matematicas: "Matemáticas",
  lectura_critica: "Lectura Crítica",
  c_naturales: "C. Naturales",
  sociales_ciudadanas: "Sociales",
  ingles: "Inglés",
};

/* ---- Shared mini-components ---- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mt-8 mb-3 first:mt-0">
      {children}
    </h4>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-muted mt-1 mb-4 max-w-2xl leading-relaxed">
      {children}
    </p>
  );
}

function StatCard({
  label,
  value,
  color = "accent",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    accent: "bg-accent/10 border-accent/20 text-accent",
    danger: "bg-danger/10 border-danger/20 text-danger",
    success: "bg-[#06D6A0]/10 border-[#06D6A0]/20 text-[#06D6A0]",
    warning: "bg-[#FFB703]/10 border-[#FFB703]/20 text-[#FFB703]",
  };
  return (
    <div className={`px-3 py-2 rounded-lg border ${colorMap[color] || colorMap.accent}`}>
      <p className="text-[10px] text-muted">{label}</p>
      <p className="font-[var(--font-jetbrains)] text-lg font-bold">{value}</p>
    </div>
  );
}

/* ========== MAIN PANEL ========== */

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
            {"Análisis Multivariable — Saber 11 × Contexto Socioeconómico"}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {s.total_evaluados.toLocaleString("es-CO")} evaluados | 20
            dimensiones | Microdatos ICFES
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
      {tab === "estrato" && (
        <EstratoTab
          estrato={s.por_estrato}
          materias={s.materias_x_estrato}
          sectorXEstrato={s.sector_x_estrato}
        />
      )}
      {tab === "digital" && (
        <DigitalTab
          internet={s.por_internet}
          computador={s.por_computador}
          estratoXInternet={s.estrato_x_internet}
          personas={s.por_personas_hogar}
          cuartos={s.por_cuartos_hogar}
          automovil={s.por_automovil}
          lavadora={s.por_lavadora}
        />
      )}
      {tab === "familia" && (
        <FamiliaTab
          madre={s.por_educacion_madre}
          padre={s.por_educacion_padre}
        />
      )}
      {tab === "genero" && (
        <GeneroTab
          genero={s.por_genero}
          generoXEstrato={s.genero_x_estrato}
          materiasXGenero={s.materias_x_genero}
        />
      )}
      {tab === "institucional" && (
        <InstitucionalTab
          jornada={s.por_jornada}
          caracter={s.por_caracter}
          sector={s.por_sector}
          bilingue={s.por_bilingue}
        />
      )}
      {tab === "comunas" && <ComunasTab data={data.comunas} />}
    </div>
  );
}

/* ========== TAB 1: ESTRATO ========== */

function EstratoTab({
  estrato,
  materias,
  sectorXEstrato,
}: {
  estrato: EstratoData[];
  materias: MateriasData[];
  sectorXEstrato: SectorEstratoData[];
}) {
  const brecha =
    estrato.length >= 2
      ? estrato[estrato.length - 1].promedio - estrato[0].promedio
      : 0;
  const totalEval = estrato.reduce((s, e) => s + e.evaluados, 0);

  // Radar data for subjects per estrato (E1 vs E5)
  const e1 = materias.find((m) => m.estrato === "1");
  const e5 = materias.find((m) => m.estrato === "5");
  const radarData = Object.keys(SUBJECT_LABELS).map((k) => ({
    subject: SUBJECT_LABELS[k],
    E1: Number(e1?.[k] || 0),
    E5: Number(e5?.[k] || 0),
  }));

  return (
    <div>
      {/* KPIs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <StatCard
          label="Brecha E1→E5"
          value={`${brecha.toFixed(1)} pts`}
          color="danger"
        />
        <StatCard
          label="Evaluados"
          value={totalEval.toLocaleString("es-CO")}
          color="accent"
        />
        <Insight>
          Un estudiante de estrato 5 obtiene en promedio{" "}
          <span className="text-foreground font-medium">
            {brecha.toFixed(0)} puntos más
          </span>{" "}
          que uno de estrato 1 en el Saber 11. La brecha es estructural y se
          reproduce en todas las materias.
        </Insight>
      </div>

      {/* Chart 1: Global score by estrato */}
      <SectionTitle>Puntaje global promedio por estrato</SectionTitle>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={estrato}>
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
            {estrato.map((entry) => (
              <Cell
                key={entry.estrato}
                fill={ESTRATO_COLORS[entry.estrato] || "#6B8CAE"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 2: Radar E1 vs E5 per subject */}
      <SectionTitle>Perfil por materia: Estrato 1 vs Estrato 5</SectionTitle>
      <Insight>
        La brecha es mayor en Inglés y Matemáticas, menor en Lectura Crítica.
      </Insight>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#1A2D42" />
          <PolarAngleAxis dataKey="subject" stroke="#6B8CAE" fontSize={10} />
          <PolarRadiusAxis
            stroke="#1A2D42"
            fontSize={9}
            domain={[30, 70]}
            tickCount={5}
          />
          <Radar
            name="Estrato 1"
            dataKey="E1"
            stroke="#EF233C"
            fill="#EF233C"
            fillOpacity={0.15}
          />
          <Radar
            name="Estrato 5"
            dataKey="E5"
            stroke="#00D4FF"
            fill="#00D4FF"
            fillOpacity={0.15}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value).toFixed(1)} pts`]}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Chart 3: Per-subject grouped bar by estrato */}
      <SectionTitle>Puntaje por materia y estrato</SectionTitle>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={materias} barGap={1} barSize={10}>
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
            domain={[30, 75]}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} pts`,
              SUBJECT_LABELS[String(name)] || String(name),
            ]}
            labelFormatter={(l) => `Estrato ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "10px" }}
            formatter={(v) => SUBJECT_LABELS[v] || v}
          />
          <Bar dataKey="matematicas" fill="#EF233C" radius={[3, 3, 0, 0]} />
          <Bar dataKey="lectura_critica" fill="#06D6A0" radius={[3, 3, 0, 0]} />
          <Bar dataKey="c_naturales" fill="#FFB703" radius={[3, 3, 0, 0]} />
          <Bar
            dataKey="sociales_ciudadanas"
            fill="#3E92CC"
            radius={[3, 3, 0, 0]}
          />
          <Bar dataKey="ingles" fill="#00D4FF" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 4: Oficial vs No Oficial by estrato */}
      <SectionTitle>Oficial vs No Oficial por estrato</SectionTitle>
      <Insight>
        En estratos bajos, los colegios oficiales superan a los no oficiales.
        La relación se invierte a partir de estrato 3.
      </Insight>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sectorXEstrato} barGap={4}>
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
            domain={[190, 320]}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} pts`,
              String(name) === "oficial" ? "Oficial" : "No Oficial",
            ]}
            labelFormatter={(l) => `Estrato ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(v) => (v === "oficial" ? "Oficial" : "No Oficial")}
          />
          <Bar dataKey="oficial" fill="#3E92CC" radius={[4, 4, 0, 0]} />
          <Bar dataKey="no_oficial" fill="#FFB703" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Distribution of evaluados */}
      <SectionTitle>Distribución de evaluados por estrato</SectionTitle>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={estrato.map((e) => ({
              name: `Estrato ${e.estrato}`,
              value: e.evaluados,
              fill: ESTRATO_COLORS[e.estrato],
            }))}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`
            }
          >
            {estrato.map((e) => (
              <Cell
                key={e.estrato}
                fill={ESTRATO_COLORS[e.estrato] || "#6B8CAE"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              Number(value).toLocaleString("es-CO"),
              "Evaluados",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ========== TAB 2: BRECHA DIGITAL ========== */

function DigitalTab({
  internet,
  computador,
  estratoXInternet,
  personas,
  cuartos,
  automovil,
  lavadora,
}: {
  internet: InternetData[];
  computador: BinaryData[];
  estratoXInternet: CrossData[];
  personas: { personas: string; promedio: number; evaluados: number }[];
  cuartos: { cuartos: string; promedio: number; evaluados: number }[];
  automovil: BinaryData[];
  lavadora: BinaryData[];
}) {
  const brechaNet =
    internet.length === 2
      ? Math.abs(internet[0].promedio - internet[1].promedio)
      : 0;
  const brechaPC =
    computador.length === 2
      ? Math.abs(computador[0].promedio - computador[1].promedio)
      : 0;

  // Combined asset comparison
  const assetData = [
    ...(internet.length === 2
      ? [
          {
            factor: "Internet — Sí",
            promedio: internet.find((i) => i.internet === "Si")?.promedio || 0,
            color: "#06D6A0",
          },
          {
            factor: "Internet — No",
            promedio: internet.find((i) => i.internet === "No")?.promedio || 0,
            color: "#EF233C",
          },
        ]
      : []),
    ...(computador.length === 2
      ? [
          {
            factor: "Computador — Sí",
            promedio:
              computador.find((c) => c.tiene === "Si")?.promedio || 0,
            color: "#06D6A0",
          },
          {
            factor: "Computador — No",
            promedio:
              computador.find((c) => c.tiene === "No")?.promedio || 0,
            color: "#EF233C",
          },
        ]
      : []),
    ...(automovil.length === 2
      ? [
          {
            factor: "Automóvil — Sí",
            promedio:
              automovil.find((a) => a.tiene === "Si")?.promedio || 0,
            color: "#00D4FF",
          },
          {
            factor: "Automóvil — No",
            promedio:
              automovil.find((a) => a.tiene === "No")?.promedio || 0,
            color: "#FF6B6B",
          },
        ]
      : []),
    ...(lavadora.length === 2
      ? [
          {
            factor: "Lavadora — Sí",
            promedio:
              lavadora.find((l) => l.tiene === "Si")?.promedio || 0,
            color: "#3E92CC",
          },
          {
            factor: "Lavadora — No",
            promedio:
              lavadora.find((l) => l.tiene === "No")?.promedio || 0,
            color: "#FFB703",
          },
        ]
      : []),
  ];

  return (
    <div>
      {/* KPIs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <StatCard
          label="Brecha Internet"
          value={`${brechaNet.toFixed(1)} pts`}
          color="danger"
        />
        <StatCard
          label="Brecha Computador"
          value={`${brechaPC.toFixed(1)} pts`}
          color="warning"
        />
        <Insight>
          La tenencia de bienes tecnológicos y del hogar se correlaciona con el
          puntaje Saber 11. Internet y computador son los factores más fuertes.
        </Insight>
      </div>

      {/* Chart 1: Asset comparison */}
      <SectionTitle>Impacto de bienes del hogar en puntaje</SectionTitle>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={assetData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[200, 280]}
          />
          <YAxis
            type="category"
            dataKey="factor"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]}>
            {assetData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 2: Estrato × Internet */}
      <SectionTitle>Cruce: Estrato × Acceso a Internet</SectionTitle>
      <Insight>
        La brecha digital amplifica la desigualdad socioeconómica. En todos los
        estratos, tener internet mejora el puntaje.
      </Insight>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={estratoXInternet} barGap={4}>
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
            domain={[190, 320]}
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
          <Bar dataKey="con_internet" fill="#06D6A0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="sin_internet" fill="#EF233C" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 3: Persons per household */}
      <SectionTitle>Puntaje según tamaño del hogar</SectionTitle>
      <Insight>
        Hogares más pequeños tienden a tener puntajes ligeramente superiores.
      </Insight>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={personas}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="personas"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[220, 270]}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" fill="#3E92CC" radius={[4, 4, 0, 0]}>
            {personas.map((_, i) => (
              <Cell
                key={i}
                fill={i < 2 ? "#06D6A0" : i < 4 ? "#FFB703" : "#EF233C"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 4: Rooms */}
      {cuartos.length > 0 && (
        <>
          <SectionTitle>Puntaje según habitaciones en el hogar</SectionTitle>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cuartos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
              <XAxis
                dataKey="cuartos"
                stroke="#6B8CAE"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#6B8CAE"
                fontSize={11}
                tickLine={false}
                domain={[220, 280]}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [
                  `${Number(value).toFixed(1)} pts`,
                  "Promedio",
                ]}
              />
              <Bar dataKey="promedio" fill="#00D4FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

/* ========== TAB 3: FAMILIA ========== */

function FamiliaTab({
  madre,
  padre,
}: {
  madre: MadreData[];
  padre: MadreData[];
}) {
  const truncLabel = (s: string) =>
    s.length > 30 ? s.slice(0, 28) + "..." : s;

  const madreChart = madre.slice(0, 10).map((d) => ({
    ...d,
    label: truncLabel(d.nivel),
  }));

  const padreChart = padre.slice(0, 10).map((d) => ({
    ...d,
    label: truncLabel(d.nivel),
  }));

  // Combined comparison: top 5 levels
  const topLevels = madre.slice(0, 6).map((m) => m.nivel);
  const combinedData = topLevels.map((nivel) => {
    const m = madre.find((x) => x.nivel === nivel);
    const p = padre.find((x) => x.nivel === nivel);
    return {
      nivel: truncLabel(nivel),
      madre: m?.promedio || 0,
      padre: p?.promedio || 0,
    };
  });

  const brechaMadre =
    madre.length >= 2
      ? madre[0].promedio - madre[madre.length - 1].promedio
      : 0;

  return (
    <div>
      {/* KPIs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <StatCard
          label="Brecha Ed. Madre"
          value={`${brechaMadre.toFixed(1)} pts`}
          color="danger"
        />
        <Insight>
          La educación de los padres es uno de los predictores más fuertes del
          rendimiento académico. Un hijo de madre con postgrado obtiene{" "}
          <span className="text-foreground font-medium">
            {brechaMadre.toFixed(0)} pts más
          </span>{" "}
          que uno de madre sin educación.
        </Insight>
      </div>

      {/* Chart 1: Madre */}
      <SectionTitle>Puntaje según educación de la madre</SectionTitle>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={madreChart} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[190, 320]}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#6B8CAE"
            fontSize={9}
            tickLine={false}
            width={150}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]}>
            {madreChart.map((entry, i) => (
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

      {/* Chart 2: Padre */}
      <SectionTitle>Puntaje según educación del padre</SectionTitle>
      <Insight>
        El patrón es similar al de la madre, pero con brechas ligeramente
        mayores. El padre con postgrado alcanza el mayor puntaje promedio.
      </Insight>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={padreChart} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[190, 320]}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#6B8CAE"
            fontSize={9}
            tickLine={false}
            width={150}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" fill="#3E92CC" radius={[0, 6, 6, 0]}>
            {padreChart.map((entry, i) => (
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

      {/* Chart 3: Madre vs Padre comparison */}
      <SectionTitle>Comparación: Madre vs Padre (mismos niveles)</SectionTitle>
      <Insight>
        El efecto del padre supera al de la madre en niveles altos de educación,
        posiblemente por correlación con ingreso familiar.
      </Insight>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={combinedData} layout="vertical" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[230, 320]}
          />
          <YAxis
            type="category"
            dataKey="nivel"
            stroke="#6B8CAE"
            fontSize={9}
            tickLine={false}
            width={150}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} pts`,
              String(name) === "madre" ? "Madre" : "Padre",
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(v) => (v === "madre" ? "Ed. Madre" : "Ed. Padre")}
          />
          <Bar dataKey="madre" fill="#FF6B6B" radius={[0, 4, 4, 0]} />
          <Bar dataKey="padre" fill="#3E92CC" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ========== TAB 4: GÉNERO ========== */

function GeneroTab({
  genero,
  generoXEstrato,
  materiasXGenero,
}: {
  genero: { genero: string; promedio: number; evaluados: number }[];
  generoXEstrato: GeneroEstratoData[];
  materiasXGenero: MateriasData[];
}) {
  const brechaGen =
    genero.length === 2
      ? Math.abs(genero[0].promedio - genero[1].promedio)
      : 0;

  // Per-subject radar by gender
  const gF = materiasXGenero.find((m) => m.genero === "F");
  const gM = materiasXGenero.find((m) => m.genero === "M");
  const radarData = Object.keys(SUBJECT_LABELS).map((k) => ({
    subject: SUBJECT_LABELS[k],
    Femenino: Number(gF?.[k] || 0),
    Masculino: Number(gM?.[k] || 0),
  }));

  // Gender gap by estrato (M - F)
  const gapByEstrato = generoXEstrato.map((e) => ({
    estrato: `E${e.estrato}`,
    brecha: Number((e.m - e.f).toFixed(1)),
    f: e.f,
    m: e.m,
  }));

  return (
    <div>
      {/* KPIs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <StatCard
          label="Brecha de Género"
          value={`${brechaGen.toFixed(1)} pts`}
          color="warning"
        />
        {genero.map((g) => (
          <StatCard
            key={g.genero}
            label={g.genero === "F" ? "Femenino" : "Masculino"}
            value={`${g.promedio.toFixed(1)} pts`}
            color={g.genero === "F" ? "danger" : "accent"}
          />
        ))}
      </div>

      {/* Chart 1: Gender comparison bar */}
      <SectionTitle>Puntaje global por género</SectionTitle>
      <Insight>
        Los hombres obtienen en promedio {brechaGen.toFixed(1)} puntos más que
        las mujeres, pero la brecha varía por materia y estrato.
      </Insight>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={genero.map((g) => ({
            genero: g.genero === "F" ? "Femenino" : "Masculino",
            promedio: g.promedio,
            evaluados: g.evaluados,
          }))}
          layout="vertical"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[240, 265]}
          />
          <YAxis
            type="category"
            dataKey="genero"
            stroke="#6B8CAE"
            fontSize={12}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]}>
            <Cell fill="#FF6B6B" />
            <Cell fill="#3E92CC" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 2: Radar per subject */}
      <SectionTitle>Perfil por materia: Femenino vs Masculino</SectionTitle>
      <Insight>
        Las mujeres superan a los hombres en Lectura Crítica. Los hombres
        lideran en Matemáticas e Inglés.
      </Insight>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#1A2D42" />
          <PolarAngleAxis dataKey="subject" stroke="#6B8CAE" fontSize={10} />
          <PolarRadiusAxis
            stroke="#1A2D42"
            fontSize={9}
            domain={[40, 60]}
            tickCount={5}
          />
          <Radar
            name="Femenino"
            dataKey="Femenino"
            stroke="#FF6B6B"
            fill="#FF6B6B"
            fillOpacity={0.15}
          />
          <Radar
            name="Masculino"
            dataKey="Masculino"
            stroke="#3E92CC"
            fill="#3E92CC"
            fillOpacity={0.15}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value).toFixed(1)} pts`]}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Chart 3: Gender gap by estrato */}
      <SectionTitle>Brecha de género por estrato (M − F)</SectionTitle>
      <Insight>
        La brecha de género se mantiene relativamente constante entre estratos,
        sugiriendo que es un fenómeno transversal.
      </Insight>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={gapByEstrato}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="estrato"
            stroke="#6B8CAE"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[0, 20]}
            label={{
              value: "Δ puntos (M−F)",
              angle: -90,
              position: "insideLeft",
              fill: "#6B8CAE",
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `+${Number(value).toFixed(1)} pts (M sobre F)`,
              "Brecha",
            ]}
          />
          <Bar dataKey="brecha" fill="#FFB703" radius={[4, 4, 0, 0]}>
            {gapByEstrato.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  ESTRATO_COLORS[(i + 1).toString()] || "#FFB703"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 4: F vs M per estrato */}
      <SectionTitle>Femenino vs Masculino por estrato</SectionTitle>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={generoXEstrato.map((e) => ({
            estrato: `E${e.estrato}`,
            Femenino: e.f,
            Masculino: e.m,
          }))}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="estrato"
            stroke="#6B8CAE"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[210, 310]}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value).toFixed(1)} pts`]}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Line
            type="monotone"
            dataKey="Femenino"
            stroke="#FF6B6B"
            strokeWidth={2}
            dot={{ r: 4, fill: "#FF6B6B" }}
          />
          <Line
            type="monotone"
            dataKey="Masculino"
            stroke="#3E92CC"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3E92CC" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ========== TAB 5: INSTITUCIONAL ========== */

function InstitucionalTab({
  jornada,
  caracter,
  sector,
  bilingue,
}: {
  jornada: { jornada: string; promedio: number; evaluados: number }[];
  caracter: { tipo: string; promedio: number; evaluados: number }[];
  sector: { sector: string; promedio: number; evaluados: number }[];
  bilingue: { tipo: string; promedio: number; evaluados: number }[];
}) {
  const brechaJornada =
    jornada.length >= 2
      ? jornada[0].promedio - jornada[jornada.length - 1].promedio
      : 0;

  // Combined factors for overview
  const allFactors = [
    ...jornada.map((j) => ({
      factor: j.jornada.charAt(0) + j.jornada.slice(1).toLowerCase(),
      promedio: j.promedio,
      evaluados: j.evaluados,
      grupo: "Jornada",
    })),
  ];

  const sectorData = sector.map((s) => ({
    factor: s.sector === "OFICIAL" ? "Oficial" : "No Oficial",
    promedio: s.promedio,
    evaluados: s.evaluados,
  }));

  const caracterData = caracter.map((c) => ({
    factor:
      c.tipo.charAt(0) + c.tipo.slice(1).toLowerCase().replace(/\//g, " / "),
    promedio: c.promedio,
    evaluados: c.evaluados,
  }));

  return (
    <div>
      {/* KPIs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <StatCard
          label="Brecha por Jornada"
          value={`${brechaJornada.toFixed(1)} pts`}
          color="danger"
        />
        <Insight>
          La jornada completa supera ampliamente a la sabatina y nocturna. Las
          variables institucionales tienen un impacto medible pero menor que las
          socioeconómicas.
        </Insight>
      </div>

      {/* Chart 1: Jornada */}
      <SectionTitle>Puntaje por jornada escolar</SectionTitle>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={allFactors} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[190, 310]}
          />
          <YAxis
            type="category"
            dataKey="factor"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
            width={80}
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
              <Cell
                key={i}
                fill={
                  entry.promedio >= 280
                    ? "#06D6A0"
                    : entry.promedio >= 250
                      ? "#00D4FF"
                      : entry.promedio >= 220
                        ? "#FFB703"
                        : "#EF233C"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Jornada evaluados distribution */}
      <SectionTitle>Distribución de evaluados por jornada</SectionTitle>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={jornada.map((j, i) => ({
              name:
                j.jornada.charAt(0) + j.jornada.slice(1).toLowerCase(),
              value: j.evaluados,
            }))}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {jornada.map((_, i) => (
              <Cell
                key={i}
                fill={
                  ["#06D6A0", "#00D4FF", "#3E92CC", "#FFB703", "#FF6B6B", "#EF233C"][i]
                }
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              Number(value).toLocaleString("es-CO"),
              "Evaluados",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Chart 2: Sector */}
      <SectionTitle>Oficial vs No Oficial</SectionTitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={sectorData} layout="vertical" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[240, 265]}
          />
          <YAxis
            type="category"
            dataKey="factor"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]}>
            <Cell fill="#3E92CC" />
            <Cell fill="#FFB703" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 3: Carácter */}
      <SectionTitle>Tipo de colegio (carácter)</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={caracterData} layout="vertical" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[230, 290]}
          />
          <YAxis
            type="category"
            dataKey="factor"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(1)} pts`,
              "Promedio",
            ]}
          />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]}>
            {caracterData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.promedio >= 270
                    ? "#06D6A0"
                    : entry.promedio >= 250
                      ? "#00D4FF"
                      : "#FFB703"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 4: Bilingüe */}
      <SectionTitle>Colegios bilingües vs no bilingües</SectionTitle>
      <Insight>
        Sorprendentemente, los colegios bilingües no muestran ventaja en puntaje
        global. La muestra bilingüe es muy pequeña (179 evaluados).
      </Insight>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={bilingue.map((b) => ({
          tipo: b.tipo,
          promedio: b.promedio,
          evaluados: b.evaluados,
        }))} layout="vertical" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[240, 260]}
          />
          <YAxis
            type="category"
            dataKey="tipo"
            stroke="#6B8CAE"
            fontSize={11}
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
            <Cell fill="#3E92CC" />
            <Cell fill="#6B8CAE" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ========== TAB 6: COMUNAS ========== */

function ComunasTab({ data }: { data: ComunaData[] }) {
  const valid = data.filter(
    (c) =>
      c.tasa_desercion != null &&
      c.tasa_aprobacion != null &&
      c.matricula_total != null
  );

  // Top/bottom deserción
  const sortedDesercion = [...valid]
    .sort((a, b) => (b.tasa_desercion ?? 0) - (a.tasa_desercion ?? 0))
    .slice(0, 10)
    .map((c) => ({
      comuna: `C${c.comuna}`,
      tasa: c.tasa_desercion ?? 0,
      desertores: (c as { desertores?: number }).desertores ?? 0,
    }));

  // Top oficialidad ratio
  const oficialidadData = valid
    .filter((c) => c.oficial != null && c.privado != null)
    .map((c) => ({
      comuna: `C${c.comuna}`,
      oficial: c.oficial ?? 0,
      privado: c.privado ?? 0,
      pct_oficial: Math.round(
        ((c.oficial ?? 0) /
          ((c.oficial ?? 0) + (c.privado ?? 0))) *
          100
      ),
    }))
    .sort((a, b) => b.pct_oficial - a.pct_oficial);

  // Aprobación ranking
  const sortedAprobacion = [...valid]
    .sort((a, b) => (b.tasa_aprobacion ?? 0) - (a.tasa_aprobacion ?? 0))
    .slice(0, 10)
    .map((c) => ({
      comuna: `C${c.comuna}`,
      tasa: c.tasa_aprobacion ?? 0,
    }));

  return (
    <div>
      {/* Chart 1: Scatter */}
      <SectionTitle>Deserción × Aprobación por comuna</SectionTitle>
      <Insight>
        Cada punto es una comuna. Eje X = deserción, Eje Y = aprobación.
        Tamaño = matrícula. Las comunas en rojo tienen deserción alta.
      </Insight>
      <ResponsiveContainer width="100%" height={320}>
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
              const suffix = label === "Matrícula" ? "" : "%";
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
          2.5–4%
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#EF233C]" />
          {"> 4%"}
        </div>
      </div>

      {/* Chart 2: Top deserción */}
      <SectionTitle>Ranking: mayor deserción</SectionTitle>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedDesercion} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[0, 7]}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="comuna"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value).toFixed(2)}%`, "Deserción"]}
          />
          <Bar dataKey="tasa" radius={[0, 6, 6, 0]}>
            {sortedDesercion.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.tasa > 4
                    ? "#EF233C"
                    : entry.tasa > 2.5
                      ? "#FFB703"
                      : "#06D6A0"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 3: Top aprobación */}
      <SectionTitle>Ranking: mayor aprobación</SectionTitle>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedAprobacion} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            domain={[84, 96]}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="comuna"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${Number(value).toFixed(2)}%`,
              "Aprobación",
            ]}
          />
          <Bar dataKey="tasa" fill="#06D6A0" radius={[0, 6, 6, 0]}>
            {sortedAprobacion.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.tasa >= 92 ? "#06D6A0" : entry.tasa >= 88 ? "#00D4FF" : "#FFB703"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Chart 4: Oficialidad ratio */}
      <SectionTitle>Proporción oficial vs privada por comuna</SectionTitle>
      <Insight>
        Las comunas periféricas tienen casi 100% matrícula oficial.
        Las comunas centrales tienen mayor participación privada.
      </Insight>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={oficialidadData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            type="number"
            stroke="#6B8CAE"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="comuna"
            stroke="#6B8CAE"
            fontSize={10}
            tickLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [
              Number(value).toLocaleString("es-CO"),
              String(name) === "oficial" ? "Oficial" : "Privado",
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(v) => (v === "oficial" ? "Oficial" : "Privado")}
          />
          <Bar
            dataKey="oficial"
            stackId="a"
            fill="#3E92CC"
          />
          <Bar
            dataKey="privado"
            stackId="a"
            fill="#FFB703"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
