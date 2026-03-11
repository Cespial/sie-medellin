"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, School, Users, Calendar, Trophy, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

/* ---------- types ---------- */

interface Saber11IE {
  codigoDane: string;
  nombre: string;
  naturaleza: string;
  promedioGlobal: number;
  evaluados: number;
  periodos: number;
  matematicas: number;
  lecturaCritica: number;
  cienciasNaturales: number;
  socialesCiudadanas: number;
  ingles: number;
}

interface ISCEIE {
  codigoDane: string;
  nombre: string;
  comuna: string;
  sector: string;
  isce_2015?: number;
  isce_2016?: number;
  isce_2017?: number;
  isce_2018?: number;
}

interface ClasificacionIE {
  codigoDane: string;
  nombre: string;
  comuna: string;
  sector: string;
  clasificacion: string;
  evaluados: number;
  matriculados: number;
}

interface ClasificacionData {
  instituciones: ClasificacionIE[];
  [key: string]: unknown;
}

/* ---------- helpers ---------- */

const CLASIFICACION_COLORS: Record<string, string> = {
  "A+": "#06D6A0",
  A: "#00D4FF",
  B: "#FFB703",
  C: "#EF233C",
  D: "#6B8CAE",
};

const SUBJECT_LABELS: Record<string, string> = {
  matematicas: "Matemáticas",
  lecturaCritica: "Lectura Crítica",
  cienciasNaturales: "Ciencias Nat.",
  socialesCiudadanas: "Sociales y Ciud.",
  ingles: "Inglés",
};

const SUBJECT_COLORS: Record<string, string> = {
  matematicas: "#00D4FF",
  lecturaCritica: "#06D6A0",
  cienciasNaturales: "#FFB703",
  socialesCiudadanas: "#EF233C",
  ingles: "#3E92CC",
};

const tooltipStyle = {
  background: "#0D1B2A",
  border: "1px solid #1A2D42",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#E8F4FD",
};

/* ---------- page ---------- */

export default function InstitucionDetallePage() {
  const params = useParams();
  const codigo = params.codigo as string;

  const [saber, setSaber] = useState<Saber11IE | null>(null);
  const [isce, setIsce] = useState<ISCEIE | null>(null);
  const [clasif, setClasif] = useState<ClasificacionIE | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!codigo) return;

    Promise.all([
      fetch("/data/saber11_por_ie.json").then((r) => r.json()),
      fetch("/data/isce_por_ie.json").then((r) => r.json()),
      fetch("/data/clasificacion_saber11.json").then((r) => r.json()),
    ])
      .then(([saberData, isceData, clasifData]: [Saber11IE[], ISCEIE[], ClasificacionData]) => {
        const saberMatch = saberData.find((ie) => ie.codigoDane === codigo) ?? null;
        const isceMatch = isceData.find((ie) => ie.codigoDane === codigo) ?? null;
        const clasifMatch =
          clasifData.instituciones?.find((ie) => ie.codigoDane === codigo) ?? null;

        setSaber(saberMatch);
        setIsce(isceMatch);
        setClasif(clasifMatch);

        if (!saberMatch && !isceMatch && !clasifMatch) {
          setNotFound(true);
        }

        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [codigo]);

  /* ---- loading / not-found states ---- */

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/instituciones"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Instituciones
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted text-sm">Cargando datos de la institución...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/instituciones"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Instituciones
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <School className="w-12 h-12 text-muted/40 mx-auto mb-4" />
            <h2 className="font-[var(--font-syne)] text-xl font-bold text-foreground mb-2">
              Institución no encontrada
            </h2>
            <p className="text-muted text-sm">
              No se encontraron datos para el código DANE <span className="font-mono text-accent">{codigo}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---- derive display data ---- */

  const nombre = saber?.nombre ?? isce?.nombre ?? clasif?.nombre ?? "Institución";
  const naturaleza = saber?.naturaleza ?? clasif?.sector?.toUpperCase() ?? null;
  const comuna = isce?.comuna ?? clasif?.comuna ?? null;

  /* Subject scores for bar chart */
  const subjectData = saber
    ? Object.entries(SUBJECT_LABELS).map(([key, label]) => ({
        name: label,
        value: saber[key as keyof Saber11IE] as number,
        fill: SUBJECT_COLORS[key],
      }))
    : [];

  /* ISCE timeline for line chart */
  const isceTimeline = isce
    ? (
        [
          { anio: "2015", isce: isce.isce_2015 },
          { anio: "2016", isce: isce.isce_2016 },
          { anio: "2017", isce: isce.isce_2017 },
          { anio: "2018", isce: isce.isce_2018 },
        ] as { anio: string; isce: number | undefined }[]
      ).filter((d) => d.isce != null && d.isce > 0)
    : [];

  /* ---- render ---- */

  return (
    <div className="p-6">
      {/* Back link */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/instituciones"
          className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Instituciones
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-border bg-surface/50 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {naturaleza && (
                <span
                  className={
                    "px-2 py-0.5 rounded-full text-[11px] font-semibold " +
                    (naturaleza === "OFICIAL" || naturaleza === "O"
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-warning/10 text-warning border border-warning/20")
                  }
                >
                  {naturaleza === "OFICIAL" ? "Oficial" : naturaleza === "NO OFICIAL" ? "No Oficial" : naturaleza}
                </span>
              )}
              {clasif && (
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                  style={{
                    color: CLASIFICACION_COLORS[clasif.clasificacion] ?? "#6B8CAE",
                    borderColor: (CLASIFICACION_COLORS[clasif.clasificacion] ?? "#6B8CAE") + "33",
                    backgroundColor: (CLASIFICACION_COLORS[clasif.clasificacion] ?? "#6B8CAE") + "15",
                  }}
                >
                  Clasificación {clasif.clasificacion}
                </span>
              )}
            </div>
            <h1 className="font-[var(--font-syne)] text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-1">
              {nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="font-mono">{codigo}</span>
              {comuna && <span>Comuna {comuna}</span>}
              {isce?.sector && <span className="capitalize">{isce.sector}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {saber && (
          <>
            <StatCard
              icon={<Trophy className="w-4 h-4 text-accent" />}
              label="Promedio Global"
              value={saber.promedioGlobal.toFixed(1)}
              accent
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-success" />}
              label="Evaluados"
              value={saber.evaluados.toLocaleString("es-CO")}
            />
            <StatCard
              icon={<Calendar className="w-4 h-4 text-warning" />}
              label="Periodos"
              value={String(saber.periodos)}
            />
          </>
        )}
        {clasif && (
          <StatCard
            icon={<School className="w-4 h-4 text-secondary" />}
            label="Matriculados"
            value={clasif.matriculados.toLocaleString("es-CO")}
          />
        )}
        {isceTimeline.length > 0 && (
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-accent" />}
            label={`ISCE ${isceTimeline[isceTimeline.length - 1].anio}`}
            value={(isceTimeline[isceTimeline.length - 1].isce as number).toFixed(2)}
            accent
          />
        )}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Saber 11 Subject Scores */}
        {saber && subjectData.length > 0 && (
          <div className="rounded-xl border border-border bg-surface/50 p-6">
            <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-1">
              Puntajes Saber 11 por Competencia
            </h3>
            <p className="text-xs text-muted mb-4">
              Promedio histórico de {saber.periodos} periodo{saber.periodos !== 1 ? "s" : ""}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#6B8CAE"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6B8CAE"
                  fontSize={10}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [Number(value).toFixed(1), "Puntaje"]}
                  cursor={{ fill: "rgba(0,212,255,0.05)" }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {subjectData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {subjectData.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5 text-[10px] text-muted">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.fill }} />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ISCE Timeline */}
        {isceTimeline.length > 0 && (
          <div className="rounded-xl border border-border bg-surface/50 p-6">
            <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-1">
              ISCE Histórico
            </h3>
            <p className="text-xs text-muted mb-4">
              Índice Sintético de Calidad Educativa (escala 1-10)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={isceTimeline} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="isceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
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
                  domain={[0, 10]}
                  tickFormatter={(v) => Number(v).toFixed(1)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [Number(value).toFixed(2), "ISCE"]}
                  labelFormatter={(label) => `Año ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="isce"
                  stroke="#06D6A0"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#06D6A0", stroke: "#0D1B2A", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#06D6A0" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Classification detail */}
      {clasif && (
        <div className="mt-6 rounded-xl border border-border bg-surface/50 p-6">
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-4">
            Clasificación Saber 11
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted mb-1">Clasificación</p>
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold"
                style={{
                  color: CLASIFICACION_COLORS[clasif.clasificacion] ?? "#6B8CAE",
                  backgroundColor: (CLASIFICACION_COLORS[clasif.clasificacion] ?? "#6B8CAE") + "18",
                  border: `1px solid ${(CLASIFICACION_COLORS[clasif.clasificacion] ?? "#6B8CAE")}30`,
                }}
              >
                {clasif.clasificacion}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Sector</p>
              <p className="text-sm text-foreground capitalize">{clasif.sector}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Evaluados</p>
              <p className="text-sm font-[var(--font-jetbrains)] text-foreground">
                {clasif.evaluados.toLocaleString("es-CO")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Matriculados</p>
              <p className="text-sm font-[var(--font-jetbrains)] text-foreground">
                {clasif.matriculados.toLocaleString("es-CO")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- stat card component ---------- */

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[11px] text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p
        className={
          "font-[var(--font-jetbrains)] text-2xl font-bold tabular-nums " +
          (accent ? "text-accent" : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  );
}
