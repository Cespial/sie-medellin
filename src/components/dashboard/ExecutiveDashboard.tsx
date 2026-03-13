"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Award,
  Users,
  GraduationCap,
  ShieldAlert,
  Map,
  BarChart3,
  Heart,
  School,
  ArrowRight,
  ChevronRight,
  FlaskConical,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useFetchData } from "@/hooks/useFetchData";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";

/* ========== TYPES ========== */

interface KPIData {
  totalMatriculados: number;
  totalSedes: number;
  promedioSaber11: number;
  totalEvaluados: number;
  totalIEs: number;
  coberturaNeta: number | { valor: number } | null;
  coberturaBruta: number | null;
  tasaDesercion: number | null;
  tasaAprobacion: number | null;
  desercion?: { valor: number };
  aprobacion?: { valor: number };
}

interface ComunaData {
  comuna: string;
  tasa_desercion?: number;
  desertores?: number;
  matricula_total?: number;
  tasa_aprobacion?: number;
  oficial?: number;
  privado?: number;
  saber11_promedio?: number;
  saber11_evaluados?: number;
}

interface MapEnrichedData {
  comunas: Record<string, ComunaData>;
}

interface TrendData {
  anio: number;
  cobertura_neta?: number;
  desercion?: number;
  aprobacion?: number;
}

interface IEScore {
  codigoDane: string;
  nombre: string;
  naturaleza: string;
  promedioGlobal: number;
  numEvaluados: number;
}

/* ========== HELPERS ========== */

function extractValue(
  v: number | { valor: number } | null | undefined
): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && "valor" in v) return v.valor;
  return 0;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/* ========== COMPONENTS ========== */

function KPICard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  const colorMap: Record<string, string> = {
    accent: "border-accent/20 text-accent",
    danger: "border-danger/20 text-danger",
    success: "border-[#06D6A0]/20 text-[#06D6A0]",
    warning: "border-[#FFB703]/20 text-[#FFB703]",
    secondary: "border-secondary/20 text-secondary",
  };

  return (
    <motion.div
      {...fadeUp}
      transition={{ delay: delay * 0.08, duration: 0.4 }}
      className={`rounded-xl border bg-surface/50 p-4 ${colorMap[color] || colorMap.accent}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-60" />
        <span className="text-[10px] text-muted uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className="font-[var(--font-jetbrains)] text-2xl font-bold">
        {value}
      </p>
      {unit && <p className="text-[10px] text-muted mt-0.5">{unit}</p>}
    </motion.div>
  );
}

function AlertCard({
  type,
  title,
  value,
  detail,
  delay = 0,
}: {
  type: "critical" | "warning" | "positive";
  title: string;
  value: string;
  detail: string;
  delay?: number;
}) {
  const styles = {
    critical: {
      bg: "bg-danger/5 border-danger/20",
      icon: <XCircle className="w-4 h-4 text-danger" />,
      valueColor: "text-danger",
    },
    warning: {
      bg: "bg-[#FFB703]/5 border-[#FFB703]/20",
      icon: <AlertTriangle className="w-4 h-4 text-[#FFB703]" />,
      valueColor: "text-[#FFB703]",
    },
    positive: {
      bg: "bg-[#06D6A0]/5 border-[#06D6A0]/20",
      icon: <CheckCircle2 className="w-4 h-4 text-[#06D6A0]" />,
      valueColor: "text-[#06D6A0]",
    },
  };

  const s = styles[type];

  return (
    <motion.div
      {...fadeUp}
      transition={{ delay: delay * 0.06, duration: 0.4 }}
      className={`rounded-lg border p-3 ${s.bg}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{s.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">{title}</p>
          <p
            className={`font-[var(--font-jetbrains)] text-lg font-bold ${s.valueColor}`}
          >
            {value}
          </p>
          <p className="text-[10px] text-muted leading-relaxed">{detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ComunaRow({
  rank,
  name,
  value,
  label,
  color,
}: {
  rank: number;
  name: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
      <span className="font-[var(--font-jetbrains)] text-xs text-muted w-5">
        {rank}
      </span>
      <span className="text-xs text-foreground flex-1">{name}</span>
      <div className="text-right">
        <span
          className={`font-[var(--font-jetbrains)] text-sm font-bold ${color}`}
        >
          {value}
        </span>
        <span className="text-[9px] text-muted ml-1">{label}</span>
      </div>
    </div>
  );
}

/* ========== MAIN DASHBOARD ========== */

export function ExecutiveDashboard() {
  const { data: kpis, loading: kpiLoading } =
    useFetchData<KPIData>("/data/kpis.json");
  const { data: mapData, loading: mapLoading } =
    useFetchData<MapEnrichedData>("/data/mapa_enriquecido.json");
  const { data: trends, loading: trendLoading } =
    useFetchData<TrendData[]>("/data/estadisticas_medellin.json");
  const { data: ranking, loading: rankLoading } =
    useFetchData<IEScore[]>("/data/saber11_por_ie.json");

  const loading = kpiLoading || mapLoading || trendLoading || rankLoading;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <ChartSkeleton height={100} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-border bg-surface/50 animate-pulse"
            />
          ))}
        </div>
        <ChartSkeleton height={300} />
      </div>
    );
  }

  if (!kpis) return null;

  const cobNeta = extractValue(kpis.coberturaNeta);
  const desercion = kpis.desercion
    ? kpis.desercion.valor
    : (kpis.tasaDesercion ?? 0);
  const aprobacion = kpis.aprobacion
    ? kpis.aprobacion.valor
    : (kpis.tasaAprobacion ?? 0);

  // Compute comuna alerts from enriched data
  const comunas = mapData
    ? Object.entries(mapData.comunas)
        .map(([code, data]) => ({ code, ...data }))
        .filter((c) => c.code.length <= 2) // only numbered comunas, not corregimientos
    : [];

  const COMUNA_NAMES: Record<string, string> = {
    "1": "Popular",
    "2": "Santa Cruz",
    "3": "Manrique",
    "4": "Aranjuez",
    "5": "Castilla",
    "6": "Doce de Octubre",
    "7": "Robledo",
    "8": "Villa Hermosa",
    "9": "Buenos Aires",
    "10": "La Candelaria",
    "11": "Laureles-Estadio",
    "12": "La América",
    "13": "San Javier",
    "14": "El Poblado",
    "15": "Guayabal",
    "16": "Belén",
  };

  // Critical: comunas with desercion > 3.5%
  const criticalDesercion = comunas
    .filter((c) => (c.tasa_desercion ?? 0) > 3.5)
    .sort((a, b) => (b.tasa_desercion ?? 0) - (a.tasa_desercion ?? 0));

  // Warning: comunas with aprobacion < 88%
  const lowApproval = comunas
    .filter((c) => (c.tasa_aprobacion ?? 0) < 88)
    .sort((a, b) => (a.tasa_aprobacion ?? 0) - (b.tasa_aprobacion ?? 0));

  // Positive: comunas with best ISCE or lowest desercion
  const bestComunas = comunas
    .filter((c) => (c.tasa_desercion ?? 99) < 2)
    .sort((a, b) => (a.tasa_desercion ?? 0) - (b.tasa_desercion ?? 0));

  // Top/bottom IEs
  const filteredIEs = ranking
    ? ranking.filter((ie) => ie.numEvaluados >= 10)
    : [];
  const topIEs = filteredIEs.slice(0, 5);
  const bottomIEs = filteredIEs.slice(-5).reverse();

  // Trend data
  const latestTrend = trends?.length
    ? trends[trends.length - 1]
    : null;
  const prevTrend = trends?.length && trends.length >= 2
    ? trends[trends.length - 2]
    : null;

  const desercionDelta =
    latestTrend && prevTrend
      ? (latestTrend.desercion ?? 0) - (prevTrend.desercion ?? 0)
      : 0;
  const aprobacionDelta =
    latestTrend && prevTrend
      ? (latestTrend.aprobacion ?? 0) - (prevTrend.aprobacion ?? 0)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* ---- Header ---- */}
      <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Sistema de Inteligencia Educativa
            </div>
            <h1 className="font-[var(--font-syne)] text-2xl md:text-3xl font-extrabold text-foreground">
              Dashboard Ejecutivo
            </h1>
            <p className="text-sm text-muted mt-1">
              Medellín — 342 IEs · 16 comunas · 5 corregimientos ·{" "}
              {kpis.totalMatriculados.toLocaleString("es-CO")} matriculados
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-semibold text-xs hover:bg-accent/90 transition-colors"
            >
              <Map className="w-3.5 h-3.5" />
              Mapa
            </Link>
            <Link
              href="/analisis"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-xs hover:border-accent/40 hover:bg-accent/5 transition-all"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Análisis
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ---- KPI Strip ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Matriculados"
          value={kpis.totalMatriculados.toLocaleString("es-CO")}
          unit="estudiantes activos"
          icon={Users}
          color="accent"
          delay={0}
        />
        <KPICard
          label="Cobertura Neta"
          value={`${cobNeta.toFixed(1)}%`}
          unit="tasa neta"
          icon={Target}
          color="success"
          delay={1}
        />
        <KPICard
          label="Deserción"
          value={`${desercion.toFixed(2)}%`}
          unit={
            desercionDelta !== 0
              ? `${desercionDelta > 0 ? "+" : ""}${desercionDelta.toFixed(2)} pp vs. anterior`
              : "tasa global"
          }
          icon={desercionDelta <= 0 ? TrendingDown : TrendingUp}
          color={desercion > 3.5 ? "danger" : "warning"}
          delay={2}
        />
        <KPICard
          label="Aprobación"
          value={`${aprobacion.toFixed(1)}%`}
          unit={
            aprobacionDelta !== 0
              ? `${aprobacionDelta > 0 ? "+" : ""}${aprobacionDelta.toFixed(1)} pp vs. anterior`
              : "tasa global"
          }
          icon={Award}
          color="success"
          delay={3}
        />
        <KPICard
          label="Saber 11"
          value={kpis.promedioSaber11.toFixed(1)}
          unit="puntaje promedio global"
          icon={GraduationCap}
          color="warning"
          delay={4}
        />
        <KPICard
          label="Sedes"
          value={kpis.totalSedes.toLocaleString("es-CO")}
          unit="sedes educativas"
          icon={School}
          color="secondary"
          delay={5}
        />
        <KPICard
          label="IEs Analizadas"
          value={kpis.totalIEs?.toString() || "342"}
          unit="instituciones educativas"
          icon={BarChart3}
          color="accent"
          delay={6}
        />
        <KPICard
          label="Datasets"
          value="34+"
          unit="fuentes de datos integradas"
          icon={FlaskConical}
          color="secondary"
          delay={7}
        />
      </div>

      {/* ---- Diagnostic Alerts ---- */}
      <motion.div {...fadeUp} transition={{ delay: 0.3, duration: 0.5 }}>
        <div className="rounded-xl border border-border bg-surface/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-accent" />
            <h2 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
              Diagnóstico Territorial
            </h2>
            <span className="text-[10px] text-muted ml-auto">
              Alertas basadas en umbrales predefinidos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Critical alerts */}
            {criticalDesercion.length > 0 && (
              <AlertCard
                type="critical"
                title={`${criticalDesercion.length} comunas con alta deserción`}
                value={`>${criticalDesercion[0].tasa_desercion?.toFixed(1)}%`}
                detail={criticalDesercion
                  .slice(0, 3)
                  .map(
                    (c) =>
                      `${COMUNA_NAMES[c.code] || `C${c.code}`}: ${c.tasa_desercion?.toFixed(2)}%`
                  )
                  .join(" · ")}
                delay={0}
              />
            )}

            {/* Warning alerts */}
            {lowApproval.length > 0 && (
              <AlertCard
                type="warning"
                title={`${lowApproval.length} comunas con baja aprobación`}
                value={`<88%`}
                detail={lowApproval
                  .slice(0, 3)
                  .map(
                    (c) =>
                      `${COMUNA_NAMES[c.code] || `C${c.code}`}: ${c.tasa_aprobacion?.toFixed(1)}%`
                  )
                  .join(" · ")}
                delay={1}
              />
            )}

            {/* Positive */}
            {bestComunas.length > 0 && (
              <AlertCard
                type="positive"
                title={`${bestComunas.length} comunas con deserción <2%`}
                value={`<2%`}
                detail={bestComunas
                  .slice(0, 3)
                  .map(
                    (c) =>
                      `${COMUNA_NAMES[c.code] || `C${c.code}`}: ${c.tasa_desercion?.toFixed(2)}%`
                  )
                  .join(" · ")}
                delay={2}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* ---- Two-column: Rankings ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top comunas deserción */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-xl border border-border bg-surface/50 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-[var(--font-syne)] text-xs font-bold text-foreground uppercase tracking-wider">
              Comunas — Mayor Deserción
            </h3>
            <Link
              href="/permanencia"
              className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
            >
              Ver más <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {comunas
            .sort(
              (a, b) => (b.tasa_desercion ?? 0) - (a.tasa_desercion ?? 0)
            )
            .slice(0, 6)
            .map((c, i) => (
              <ComunaRow
                key={c.code}
                rank={i + 1}
                name={COMUNA_NAMES[c.code] || `Comuna ${c.code}`}
                value={`${c.tasa_desercion?.toFixed(2)}%`}
                label="deserción"
                color={
                  (c.tasa_desercion ?? 0) > 3.5
                    ? "text-danger"
                    : (c.tasa_desercion ?? 0) > 2
                      ? "text-[#FFB703]"
                      : "text-[#06D6A0]"
                }
              />
            ))}
        </motion.div>

        {/* Top comunas aprobación */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="rounded-xl border border-border bg-surface/50 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-[var(--font-syne)] text-xs font-bold text-foreground uppercase tracking-wider">
              Comunas — Mayor Aprobación
            </h3>
            <Link
              href="/permanencia"
              className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
            >
              Ver más <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {comunas
            .sort(
              (a, b) =>
                (b.tasa_aprobacion ?? 0) - (a.tasa_aprobacion ?? 0)
            )
            .slice(0, 6)
            .map((c, i) => (
              <ComunaRow
                key={c.code}
                rank={i + 1}
                name={COMUNA_NAMES[c.code] || `Comuna ${c.code}`}
                value={`${c.tasa_aprobacion?.toFixed(1)}%`}
                label="aprobación"
                color={
                  (c.tasa_aprobacion ?? 0) >= 93
                    ? "text-[#06D6A0]"
                    : (c.tasa_aprobacion ?? 0) >= 90
                      ? "text-accent"
                      : "text-[#FFB703]"
                }
              />
            ))}
        </motion.div>
      </div>

      {/* ---- IE Rankings ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-xl border border-border bg-surface/50 overflow-hidden"
        >
          <div className="p-4 border-b border-border/50">
            <h3 className="font-[var(--font-syne)] text-xs font-bold text-foreground uppercase tracking-wider">
              Top 5 IEs — Saber 11
            </h3>
          </div>
          <div className="p-4">
            {topIEs.map((ie, i) => (
              <div
                key={ie.codigoDane}
                className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
              >
                <span className="font-[var(--font-jetbrains)] text-xs text-muted w-5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium truncate">
                    {ie.nombre}
                  </p>
                  <span
                    className={`text-[9px] ${ie.naturaleza === "OFICIAL" ? "text-accent" : "text-[#FFB703]"}`}
                  >
                    {ie.naturaleza === "OFICIAL" ? "Oficial" : "Privado"}
                  </span>
                </div>
                <span className="font-[var(--font-jetbrains)] text-sm font-bold text-[#06D6A0]">
                  {ie.promedioGlobal}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="rounded-xl border border-border bg-surface/50 overflow-hidden"
        >
          <div className="p-4 border-b border-border/50">
            <h3 className="font-[var(--font-syne)] text-xs font-bold text-foreground uppercase tracking-wider">
              Bottom 5 IEs — Saber 11
            </h3>
            <p className="text-[10px] text-muted mt-0.5">
              Min. 10 evaluados
            </p>
          </div>
          <div className="p-4">
            {bottomIEs.map((ie, i) => (
              <div
                key={ie.codigoDane}
                className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
              >
                <span className="font-[var(--font-jetbrains)] text-xs text-muted w-5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium truncate">
                    {ie.nombre}
                  </p>
                  <span
                    className={`text-[9px] ${ie.naturaleza === "OFICIAL" ? "text-accent" : "text-[#FFB703]"}`}
                  >
                    {ie.naturaleza === "OFICIAL" ? "Oficial" : "Privado"}
                  </span>
                </div>
                <span className="font-[var(--font-jetbrains)] text-sm font-bold text-danger">
                  {ie.promedioGlobal}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ---- Key Insights ---- */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="rounded-xl border border-accent/20 bg-accent/5 p-5"
      >
        <h2 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-accent" />
          Hallazgos Clave
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-muted leading-relaxed">
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0">1.</span>
            <p>
              La brecha socioeconómica en Saber 11 es de{" "}
              <span className="text-foreground font-medium">59.6 puntos</span>{" "}
              entre estrato 1 y 5. Internet explica 31.9 pts adicionales.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0">2.</span>
            <p>
              Las comunas periféricas (Popular, Santa Cruz, Villa Hermosa)
              concentran la{" "}
              <span className="text-foreground font-medium">
                mayor deserción
              </span>{" "}
              y menor aprobación simultáneamente.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0">3.</span>
            <p>
              La educación de la madre predice hasta{" "}
              <span className="text-foreground font-medium">
                101.8 pts de diferencia
              </span>{" "}
              en Saber 11 (postgrado vs. ninguna).
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0">4.</span>
            <p>
              Jornada completa supera a sabatina en{" "}
              <span className="text-foreground font-medium">87.8 pts</span>. La
              jornada es el factor institucional más determinante.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0">5.</span>
            <p>
              Colegios oficiales de estrato 1 superan a los no oficiales del
              mismo estrato en{" "}
              <span className="text-foreground font-medium">19 pts</span>. La
              relación se invierte desde estrato 3.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0">6.</span>
            <p>
              La brecha de género es transversal:{" "}
              <span className="text-foreground font-medium">
                10.5 pts a favor de hombres
              </span>
              . Mujeres lideran en Lectura Crítica.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-accent/10">
          <Link
            href="/analisis"
            className="text-xs text-accent hover:underline inline-flex items-center gap-1"
          >
            Explorar análisis completo
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>

      {/* ---- Dimension Quick Links ---- */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.65, duration: 0.5 }}
      >
        <h2 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
          Dimensiones del Sistema
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              name: "Cobertura",
              icon: Users,
              color: "from-accent to-secondary",
              href: "/cobertura",
            },
            {
              name: "Calidad",
              icon: Award,
              color: "from-[#06D6A0] to-accent",
              href: "/calidad",
            },
            {
              name: "Permanencia",
              icon: ShieldAlert,
              color: "from-[#FFB703] to-danger",
              href: "/permanencia",
            },
            {
              name: "Matrícula",
              icon: GraduationCap,
              color: "from-secondary to-primary",
              href: "/matricula",
            },
            {
              name: "Equidad",
              icon: Heart,
              color: "from-accent to-[#06D6A0]",
              href: "/equidad",
            },
            {
              name: "Contexto",
              icon: BarChart3,
              color: "from-danger to-[#FFB703]",
              href: "/contexto",
            },
          ].map((dim) => (
            <Link
              key={dim.name}
              href={dim.href}
              className="group rounded-lg border border-border bg-background/50 p-3 hover:border-accent/30 hover:bg-accent/5 transition-all"
            >
              <div
                className={`w-6 h-1 rounded-full bg-gradient-to-r ${dim.color} mb-2 group-hover:w-10 transition-all`}
              />
              <div className="flex items-center gap-1.5">
                <dim.icon className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
                <span className="text-xs font-semibold text-foreground">
                  {dim.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ---- Footer ---- */}
      <div className="text-center pt-4 pb-8">
        <p className="text-[10px] text-muted">
          Datos: datos.gov.co · MEData · ICFES · MEN ·
          Secretaría de Educación de Medellín | Actualizado 2024
        </p>
      </div>
    </div>
  );
}
