"use client";

import React from "react";
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
  ArrowRight,
  ChevronRight,
  FlaskConical,
  Target,
  CheckCircle2,
  XCircle,
  School,
} from "lucide-react";
import { useFetchData } from "@/hooks/useFetchData";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { Minus } from "lucide-react";

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
  fuentes?: Record<string, string>;
  ultimaActualizacion?: string;
  frescura?: {
    estadisticas_etc?: { ultimo_anio?: string };
    saber11?: { ultimo_periodo?: string; ultimo_anio?: string };
    sedes?: { ultimo_anio?: string };
    matricula_medata?: { ultimo_anio?: string };
  };
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
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

/* ========== COMPONENTS ========== */

function MetricCard({
  label,
  value,
  unit,
  year,
  icon: Icon,
  accent = false,
  delay = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  year?: string;
  icon: React.ElementType;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ delay: delay * 0.06, duration: 0.35 }}
      className="relative border border-border bg-surface p-4 hover:border-accent/20 transition-colors"
    >
      {accent && <div className="absolute top-0 left-0 w-6 h-[2px] bg-accent" />}
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted" />
        <span className="text-[10px] text-muted uppercase tracking-widest font-medium">
          {label}
        </span>
        {year && (
          <span className="text-[9px] font-[var(--font-geist-mono)] text-muted/50 ml-auto">
            {year}
          </span>
        )}
      </div>
      <p className="font-[var(--font-geist-mono)] text-xl font-semibold text-foreground tracking-tight">
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
      border: "border-danger/20",
      icon: <XCircle className="w-3.5 h-3.5 text-danger" />,
      valueColor: "text-danger",
    },
    warning: {
      border: "border-warning/20",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-warning" />,
      valueColor: "text-warning",
    },
    positive: {
      border: "border-accent/20",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-accent" />,
      valueColor: "text-accent",
    },
  };

  const s = styles[type];

  return (
    <motion.div
      {...fadeUp}
      transition={{ delay: delay * 0.05, duration: 0.35 }}
      className={`border bg-surface p-3 ${s.border}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{s.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-foreground">{title}</p>
          <p className={`font-[var(--font-geist-mono)] text-lg font-semibold ${s.valueColor}`}>
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
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="font-[var(--font-geist-mono)] text-[10px] text-muted w-4 tabular-nums">
        {rank}
      </span>
      <span className="text-[12px] text-foreground flex-1 tracking-tight">{name}</span>
      <div className="text-right">
        <span className={`font-[var(--font-geist-mono)] text-[13px] font-semibold ${color}`}>
          {value}
        </span>
        <span className="text-[9px] text-muted ml-1">{label}</span>
      </div>
    </div>
  );
}

/* ========== TENDENCIAS YoY ========== */

interface TendenciaEntry {
  anio: string;
  desercion_delta?: number;
  cobertura_neta_delta?: number;
  aprobacion_delta?: number;
  reprobacion_delta?: number;
}

function TendenciasCard() {
  const { data } = useFetchData<TendenciaEntry[]>("/data/tendencias_yoy.json");
  if (!data || data.length === 0) return null;

  const latest = data[data.length - 1]; // 2024 vs 2023

  const items = [
    { label: "Deserción", delta: latest.desercion_delta, inverse: true },
    { label: "Cobertura", delta: latest.cobertura_neta_delta, inverse: false },
    { label: "Aprobación", delta: latest.aprobacion_delta, inverse: false },
  ];

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.08, duration: 0.4 }}>
      <div className="apple-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-foreground">
              {latest.anio} vs {Number(latest.anio) - 1}
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            {items.map((item) => {
              if (item.delta === undefined) return null;
              const isGood = item.inverse ? item.delta < 0 : item.delta > 0;
              const color = Math.abs(item.delta) < 0.1 ? "text-muted" : isGood ? "text-success" : "text-danger";
              const Icon = Math.abs(item.delta) < 0.1 ? Minus : isGood ? TrendingDown : TrendingUp;
              const displayIcon = item.inverse
                ? (item.delta < 0 ? TrendingDown : TrendingUp)
                : (item.delta > 0 ? TrendingUp : TrendingDown);
              return (
                <div key={item.label} className="flex items-center gap-1.5">
                  {React.createElement(displayIcon, { className: `w-3.5 h-3.5 ${color}` })}
                  <span className={`font-[var(--font-geist-mono)] text-[13px] font-semibold ${color}`}>
                    {item.delta > 0 ? "+" : ""}{item.delta.toFixed(2)}pp
                  </span>
                  <span className="text-[11px] text-muted">{item.label}</span>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-muted sm:ml-auto">
            {items.filter(i => i.delta !== undefined && (i.inverse ? i.delta < 0 : i.delta > 0)).length >= 2
              ? "Sistema mejorando"
              : "Atención requerida"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ========== INDICE SIE MINI ========== */

interface SIEIndex {
  comuna: string;
  nombre: string;
  indice_sie: number;
}

function IndiceSIEMini() {
  const { data } = useFetchData<SIEIndex[]>("/data/indice_sie_comunas.json");
  if (!data || data.length === 0) return null;

  const comunas = data.filter(d => d.comuna.length <= 2);
  const top5 = comunas.slice(0, 5);
  const bottom5 = comunas.slice(-5).reverse();

  function scoreColor(score: number): string {
    if (score >= 75) return "text-accent";
    if (score >= 65) return "text-foreground";
    if (score >= 55) return "text-warning";
    return "text-danger";
  }

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.52, duration: 0.4 }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="apple-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-semibold text-foreground">
              Indice SIE — Mejores Comunas
            </h3>
            <Link href="/cobertura" className="text-[10px] text-accent hover:text-accent/80 flex items-center gap-0.5">
              Ver ranking <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {top5.map((c, i) => (
            <div key={c.comuna} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className="font-[var(--font-geist-mono)] text-[10px] text-muted w-4 tabular-nums">{i + 1}</span>
              <span className="text-[12px] text-foreground flex-1">{c.nombre}</span>
              <span className={`font-[var(--font-geist-mono)] text-[13px] font-semibold tabular-nums ${scoreColor(c.indice_sie)}`}>
                {c.indice_sie}
              </span>
            </div>
          ))}
        </div>
        <div className="apple-card p-5">
          <h3 className="text-[12px] font-semibold text-foreground mb-3">
            Indice SIE — Comunas Prioritarias
          </h3>
          {bottom5.map((c, i) => (
            <div key={c.comuna} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className="font-[var(--font-geist-mono)] text-[10px] text-muted w-4 tabular-nums">{comunas.length - 4 + i}</span>
              <span className="text-[12px] text-foreground flex-1">{c.nombre}</span>
              <span className={`font-[var(--font-geist-mono)] text-[13px] font-semibold tabular-nums ${scoreColor(c.indice_sie)}`}>
                {c.indice_sie}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
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
        <ChartSkeleton height={80} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface animate-pulse" />
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

  const comunas = mapData
    ? Object.entries(mapData.comunas)
        .map(([code, data]) => ({ code, ...data }))
        .filter((c) => c.code.length <= 2)
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

  const criticalDesercion = comunas
    .filter((c) => (c.tasa_desercion ?? 0) > 3.5)
    .sort((a, b) => (b.tasa_desercion ?? 0) - (a.tasa_desercion ?? 0));

  const lowApproval = comunas
    .filter((c) => (c.tasa_aprobacion ?? 0) < 88)
    .sort((a, b) => (a.tasa_aprobacion ?? 0) - (b.tasa_aprobacion ?? 0));

  const bestComunas = comunas
    .filter((c) => (c.tasa_desercion ?? 99) < 2)
    .sort((a, b) => (a.tasa_desercion ?? 0) - (b.tasa_desercion ?? 0));

  const filteredIEs = ranking
    ? ranking.filter((ie) => ie.numEvaluados >= 10)
    : [];
  const topIEs = filteredIEs.slice(0, 5);
  const bottomIEs = filteredIEs.slice(-5).reverse();

  const latestTrend = trends?.length ? trends[trends.length - 1] : null;
  const prevTrend =
    trends?.length && trends.length >= 2 ? trends[trends.length - 2] : null;

  const desercionDelta =
    latestTrend && prevTrend
      ? (latestTrend.desercion ?? 0) - (prevTrend.desercion ?? 0)
      : 0;
  const aprobacionDelta =
    latestTrend && prevTrend
      ? (latestTrend.aprobacion ?? 0) - (prevTrend.aprobacion ?? 0)
      : 0;

  const f = kpis.frescura;
  const etcYear = f?.estadisticas_etc?.ultimo_anio;
  const saberYear = f?.saber11?.ultimo_anio || f?.saber11?.ultimo_periodo?.slice(0, 4);
  const sedesYear = f?.sedes?.ultimo_anio;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* ---- Header ---- */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-accent animate-pulse" />
              <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-medium">
                Sistema de Inteligencia Educativa
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Dashboard Ejecutivo
            </h1>
            <p className="text-[13px] text-muted mt-1 tracking-tight">
              Medellín — {kpis.totalIEs ?? "—"} IEs · 16 comunas · 5 corregimientos ·{" "}
              {kpis.totalMatriculados.toLocaleString("es-CO")} matriculados
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/riesgo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-[12px] font-medium tracking-tight hover:bg-foreground/90 transition-colors"
            >
              <ShieldAlert className="w-3 h-3" />
              Escuelas en Riesgo
            </Link>
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-foreground text-[12px] tracking-tight hover:border-foreground/30 transition-colors"
            >
              <Map className="w-3 h-3" />
              Mapa
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ---- Tendencias YoY ---- */}
      <TendenciasCard />

      {/* ---- KPI Strip ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Matriculados"
          value={kpis.totalMatriculados.toLocaleString("es-CO")}
          unit="estudiantes activos"
          year={sedesYear}
          icon={Users}
          accent
          delay={0}
        />
        <MetricCard
          label="Cobertura Neta"
          value={`${cobNeta.toFixed(1)}%`}
          unit={`${desercionDelta !== 0 ? "tasa neta" : "tasa neta"}`}
          year={etcYear}
          icon={Target}
          accent
          delay={1}
        />
        <MetricCard
          label="Deserción"
          value={`${desercion.toFixed(2)}%`}
          unit={
            desercionDelta !== 0
              ? `${desercionDelta > 0 ? "+" : ""}${desercionDelta.toFixed(2)} pp vs. anterior`
              : "tasa global"
          }
          year={etcYear}
          icon={desercionDelta <= 0 ? TrendingDown : TrendingUp}
          accent
          delay={2}
        />
        <MetricCard
          label="Aprobación"
          value={`${aprobacion.toFixed(1)}%`}
          unit={
            aprobacionDelta !== 0
              ? `${aprobacionDelta > 0 ? "+" : ""}${aprobacionDelta.toFixed(1)} pp vs. anterior`
              : "tasa global"
          }
          year={etcYear}
          icon={Award}
          accent
          delay={3}
        />
        <MetricCard
          label="Saber 11"
          value={kpis.promedioSaber11.toFixed(1)}
          unit="puntaje promedio global"
          year={saberYear}
          icon={GraduationCap}
          delay={4}
        />
        <MetricCard
          label="Sedes"
          value={kpis.totalSedes.toLocaleString("es-CO")}
          unit="sedes educativas"
          year={sedesYear}
          icon={School}
          delay={5}
        />
        <MetricCard
          label="IEs Analizadas"
          value={kpis.totalIEs?.toString() || "\u2014"}
          unit="instituciones educativas"
          icon={BarChart3}
          delay={6}
        />
        <MetricCard
          label="Datasets"
          value={`${Object.keys(kpis.fuentes || {}).length}+`}
          unit="fuentes integradas"
          icon={FlaskConical}
          delay={7}
        />
      </div>

      {/* ---- Diagnostic Alerts ---- */}
      <motion.div {...fadeUp} transition={{ delay: 0.2, duration: 0.4 }}>
        <div className="apple-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-3.5 h-3.5 text-muted" />
            <h2 className="text-[12px] font-semibold text-foreground uppercase tracking-widest">
              Diagnóstico Territorial
            </h2>
            <span className="text-[9px] font-[var(--font-geist-mono)] text-muted ml-auto">
              Umbrales predefinidos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

      {/* ---- Rankings ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="apple-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-widest">
              Mayor Deserción
            </h3>
            <Link
              href="/permanencia"
              className="text-[10px] text-muted hover:text-foreground flex items-center gap-0.5 transition-colors"
            >
              Ver más <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {comunas
            .sort((a, b) => (b.tasa_desercion ?? 0) - (a.tasa_desercion ?? 0))
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
                      ? "text-warning"
                      : "text-accent"
                }
              />
            ))}
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="apple-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-widest">
              Mayor Aprobación
            </h3>
            <Link
              href="/permanencia"
              className="text-[10px] text-muted hover:text-foreground flex items-center gap-0.5 transition-colors"
            >
              Ver más <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {comunas
            .sort((a, b) => (b.tasa_aprobacion ?? 0) - (a.tasa_aprobacion ?? 0))
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
                    ? "text-accent"
                    : (c.tasa_aprobacion ?? 0) >= 90
                      ? "text-foreground"
                      : "text-warning"
                }
              />
            ))}
        </motion.div>
      </div>

      {/* ---- IE Rankings ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="apple-card overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-widest">
              Top 5 IEs — Saber 11
            </h3>
            <span className="text-[9px] font-[var(--font-geist-mono)] text-muted">
              Min. 10 evaluados · Todos los períodos
            </span>
          </div>
          <div className="p-4">
            {topIEs.map((ie, i) => (
              <div
                key={ie.codigoDane}
                className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <span className="font-[var(--font-geist-mono)] text-[10px] text-muted w-4 tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground font-medium truncate tracking-tight">
                    {ie.nombre}
                  </p>
                  <span className="text-[9px] text-muted">
                    {ie.naturaleza === "OFICIAL" ? "Oficial" : "Privado"}
                  </span>
                </div>
                <span className="font-[var(--font-geist-mono)] text-[13px] font-semibold text-accent tabular-nums">
                  {ie.promedioGlobal}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="apple-card overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-widest">
              Bottom 5 IEs — Saber 11
            </h3>
            <span className="text-[9px] font-[var(--font-geist-mono)] text-muted">
              Min. 10 evaluados
            </span>
          </div>
          <div className="p-4">
            {bottomIEs.map((ie, i) => (
              <div
                key={ie.codigoDane}
                className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <span className="font-[var(--font-geist-mono)] text-[10px] text-muted w-4 tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground font-medium truncate tracking-tight">
                    {ie.nombre}
                  </p>
                  <span className="text-[9px] text-muted">
                    {ie.naturaleza === "OFICIAL" ? "Oficial" : "Privado"}
                  </span>
                </div>
                <span className="font-[var(--font-geist-mono)] text-[13px] font-semibold text-danger tabular-nums">
                  {ie.promedioGlobal}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ---- Hallazgos ---- */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="apple-card border-accent/20 p-5"
      >
        <h2 className="text-[11px] font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-widest">
          <FlaskConical className="w-3.5 h-3.5 text-accent" />
          Hallazgos Clave
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-[12px] text-muted leading-relaxed">
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0 font-[var(--font-geist-mono)] text-[10px]">01</span>
            <p>
              La brecha socioeconómica en Saber 11 es de{" "}
              <span className="text-foreground font-medium">59.6 puntos</span>{" "}
              entre estrato 1 y 5. Internet explica 31.9 pts adicionales.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0 font-[var(--font-geist-mono)] text-[10px]">02</span>
            <p>
              Las comunas periféricas (Popular, Santa Cruz, Villa Hermosa)
              concentran la{" "}
              <span className="text-foreground font-medium">mayor deserción</span>{" "}
              y menor aprobación simultáneamente.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0 font-[var(--font-geist-mono)] text-[10px]">03</span>
            <p>
              La educación de la madre predice hasta{" "}
              <span className="text-foreground font-medium">101.8 pts de diferencia</span>{" "}
              en Saber 11 (postgrado vs. ninguna).
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0 font-[var(--font-geist-mono)] text-[10px]">04</span>
            <p>
              Jornada completa supera a sabatina en{" "}
              <span className="text-foreground font-medium">87.8 pts</span>. La
              jornada es el factor institucional más determinante.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0 font-[var(--font-geist-mono)] text-[10px]">05</span>
            <p>
              Colegios oficiales de estrato 1 superan a los no oficiales del
              mismo estrato en{" "}
              <span className="text-foreground font-medium">19 pts</span>. La
              relación se invierte desde estrato 3.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent mt-0.5 shrink-0 font-[var(--font-geist-mono)] text-[10px]">06</span>
            <p>
              La brecha de género es transversal:{" "}
              <span className="text-foreground font-medium">10.5 pts a favor de hombres</span>.
              La diferencia es mayor en Matemáticas que en otras áreas.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-accent/10">
          <Link
            href="/analisis"
            className="text-[11px] text-accent hover:text-accent/80 inline-flex items-center gap-1 transition-colors"
          >
            Explorar análisis completo
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>

      {/* ---- Índice SIE Mini ---- */}
      <IndiceSIEMini />

      {/* ---- Dimensions ---- */}
      <motion.div {...fadeUp} transition={{ delay: 0.55, duration: 0.4 }}>
        <h2 className="text-[11px] font-semibold text-foreground mb-3 uppercase tracking-widest">
          Dimensiones del Sistema
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: "Cobertura", icon: Users, href: "/cobertura" },
            { name: "Calidad", icon: Award, href: "/calidad" },
            { name: "Permanencia", icon: ShieldAlert, href: "/permanencia" },
            { name: "Matrícula", icon: GraduationCap, href: "/matricula" },
            { name: "Equidad", icon: Heart, href: "/equidad" },
            { name: "Contexto", icon: BarChart3, href: "/contexto" },
          ].map((dim) => (
            <Link
              key={dim.name}
              href={dim.href}
              className="group apple-card p-3 hover:shadow-md transition-colors"
            >
              <div className="w-4 h-[2px] bg-accent/30 mb-2 group-hover:w-8 group-hover:bg-accent transition-all duration-300" />
              <div className="flex items-center gap-1.5">
                <dim.icon className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
                <span className="text-[12px] font-medium text-foreground tracking-tight">
                  {dim.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ---- Footer ---- */}
      <div className="text-center pt-4 pb-8">
        <p className="text-[10px] font-[var(--font-geist-mono)] text-muted tracking-tight">
          datos.gov.co · MEData · ICFES · MEN · Secretaría de Educación de Medellín
          {kpis.ultimaActualizacion && ` · ${kpis.ultimaActualizacion}`}
        </p>
      </div>
    </div>
  );
}
