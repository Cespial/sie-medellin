"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, School, Users, Calendar, Trophy, TrendingUp, MapPin,
  Phone, Mail, Award, Target, ChevronRight, BarChart3, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";

/* ---------- types ---------- */

interface Materia {
  puntaje: number;
  ciudad: number;
  sector: number;
  fortaleza?: boolean;
  debilidad?: boolean;
}

interface Profile {
  codigoDane: string;
  nombre: string;
  naturaleza: string;
  jornada: string;
  comuna: string;
  comunaNombre: string;
  clasificacion: string;
  outlier: { tipo: string; diferencia: number } | null;
  direccion: string;
  barrio: string;
  telefono: string;
  email: string;
  zona: string;
  coordenadas: [number, number] | null;
  promedioGlobal: number;
  percentil: number;
  rankComuna: number | null;
  totalIEsComuna: number;
  evaluados: number;
  periodos: number;
  materias: Record<string, Materia>;
  socioeconomico: {
    estratos: Record<string, number>;
    estratoPromedio: number;
    pctInternet: number | null;
    pctComputador: number | null;
    educacionMadre: Record<string, number>;
    ratioGenero: { F: number; M: number };
  };
  historico: { periodo: string; promedio: number; evaluados: number }[];
  isce: Record<string, number>;
  sedes: { nombre: string; direccion: string; barrio: string; zona: string; matricula: number; principal: boolean }[];
  contextoComuna: {
    nombre: string;
    tasaDesercion: number | null;
    tasaAprobacion: number | null;
    saber11Promedio: number | null;
    indiceSIE: number;
    totalIEs: number;
  };
  similares: { codigoDane: string; nombre: string; promedioGlobal: number; clasificacion: string }[];
  scoreEsperado: number | null;
  valorAgregado: number | null;
}

/* ---------- constants ---------- */

const CLASIF_COLORS: Record<string, string> = {
  "A+": "#34C759", A: "#007AFF", B: "#FF9500", C: "#FF3B30", D: "#6E6E73",
};

const SUBJ_LABELS: Record<string, string> = {
  matematicas: "Matemáticas",
  lectura_critica: "L. Crítica",
  c_naturales: "C. Naturales",
  sociales_ciudadanas: "Sociales",
  ingles: "Inglés",
};

const TOOLTIP = {
  background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: "12px",
  fontSize: "12px", color: "#1D1D1F", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const ESTRATO_COLORS = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#5856D6"];

/* ---------- page ---------- */

export default function InstitucionDetallePage() {
  const params = useParams();
  const codigo = params.codigo as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!codigo) return;
    fetch("/data/perfiles_ie.json")
      .then(r => r.json())
      .then((data: Profile[]) => {
        const match = data.find(p => p.codigoDane === codigo);
        setProfile(match ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [codigo]);

  if (loading) {
    return (
      <div className="p-6">
        <BackLink />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <BackLink />
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div>
            <School className="w-12 h-12 text-muted/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Institución no encontrada</h2>
            <p className="text-muted text-sm">Código DANE <span className="font-[var(--font-geist-mono)] text-accent">{codigo}</span></p>
          </div>
        </div>
      </div>
    );
  }

  const p = profile;

  // Radar data
  const radarData = Object.entries(SUBJ_LABELS).map(([key, label]) => ({
    subject: label,
    ie: p.materias[key]?.puntaje || 0,
    ciudad: p.materias[key]?.ciudad || 0,
  }));

  // Estrato pie
  const estratoData = Object.entries(p.socioeconomico.estratos)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: `E${k}`, value: v, fill: ESTRATO_COLORS[parseInt(k) - 1] || "#6E6E73" }));

  // Madre edu (top 5)
  const madreData = Object.entries(p.socioeconomico.educacionMadre)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k, v]) => ({ nivel: k.length > 25 ? k.slice(0, 23) + "..." : k, total: v }));

  // ISCE timeline
  const isceData = Object.entries(p.isce)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ anio: k, isce: v }))
    .sort((a, b) => a.anio.localeCompare(b.anio));

  return (
    <div className="p-6 max-w-[1200px] space-y-6">
      <BackLink />

      {/* ==================== HERO ==================== */}
      <div className="apple-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {p.naturaleza && (
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  p.naturaleza === "OFICIAL" ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
                }`}>
                  {p.naturaleza === "OFICIAL" ? "Oficial" : "No Oficial"}
                </span>
              )}
              {p.clasificacion && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{
                  color: CLASIF_COLORS[p.clasificacion] || "#6E6E73",
                  backgroundColor: (CLASIF_COLORS[p.clasificacion] || "#6E6E73") + "15",
                }}>
                  Clasificación {p.clasificacion}
                </span>
              )}
              {p.outlier && (
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  p.outlier.tipo === "sobre_rinde" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}>
                  <Zap className="w-3 h-3 inline mr-0.5" />
                  {p.outlier.tipo === "sobre_rinde" ? `+${p.outlier.diferencia} pts sobre esperado` : `${p.outlier.diferencia} pts bajo esperado`}
                </span>
              )}
              {p.zona && (
                <span className="px-2.5 py-1 rounded-full text-[11px] text-muted bg-surface">{p.zona}</span>
              )}
            </div>

            <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1 capitalize">
              {p.nombre.toLowerCase()}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
              <span className="font-[var(--font-geist-mono)]">{p.codigoDane}</span>
              {p.comunaNombre && <span>Comuna {p.comuna} — {p.comunaNombre}</span>}
              {p.jornada && <span className="capitalize">{p.jornada.toLowerCase()}</span>}
            </div>

            {/* Contact */}
            {(p.direccion || p.telefono || p.email) && (
              <div className="flex flex-wrap gap-4 mt-3 text-[12px] text-muted">
                {p.direccion && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.direccion}{p.barrio && `, ${p.barrio}`}</span>}
                {p.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.telefono}</span>}
                {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 lg:w-72 shrink-0">
            <MiniStat label="Promedio Global" value={p.promedioGlobal.toFixed(1)} accent />
            <MiniStat label="Percentil" value={`${p.percentil}%`} />
            <MiniStat label="Evaluados" value={p.evaluados.toLocaleString("es-CO")} />
            <MiniStat label={`Rank Comuna ${p.comuna}`} value={p.rankComuna ? `${p.rankComuna}/${p.totalIEsComuna}` : "—"} />
          </div>
        </div>
      </div>

      {/* ==================== RENDIMIENTO ==================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Radar: IE vs Ciudad */}
        <div className="apple-card p-6" role="img" aria-label="Radar de materias">
          <h3 className="text-[13px] font-semibold text-foreground mb-1">Perfil Académico</h3>
          <p className="text-[11px] text-muted mb-4">Puntaje por materia vs. promedio ciudad</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E5EA" />
              <PolarAngleAxis dataKey="subject" stroke="#6E6E73" fontSize={10} />
              <PolarRadiusAxis stroke="#E5E5EA" fontSize={9} domain={[0, 100]} tickCount={5} />
              <Radar name="Esta IE" dataKey="ie" stroke="#007AFF" fill="#007AFF" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Ciudad" dataKey="ciudad" stroke="#D2D2D7" fill="#D2D2D7" fillOpacity={0.05} strokeWidth={1} strokeDasharray="4 4" />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${Number(v).toFixed(1)} pts`]} />
            </RadarChart>
          </ResponsiveContainer>
          {/* Strengths/weaknesses */}
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(p.materias).map(([key, m]) => (
              m.fortaleza ? (
                <span key={key} className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                  Fortaleza: {SUBJ_LABELS[key]}
                </span>
              ) : m.debilidad ? (
                <span key={key} className="text-[10px] px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                  A mejorar: {SUBJ_LABELS[key]}
                </span>
              ) : null
            ))}
          </div>
        </div>

        {/* Histórico */}
        {p.historico.length > 1 && (
          <div className="apple-card p-6" role="img" aria-label="Tendencia histórica">
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Tendencia Histórica</h3>
            <p className="text-[11px] text-muted mb-4">{p.historico.length} períodos · Saber 11</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={p.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                <XAxis dataKey="periodo" stroke="#6E6E73" fontSize={10} tickLine={false}
                  tickFormatter={(v) => `${v.slice(0,4)}`} />
                <YAxis stroke="#6E6E73" fontSize={11} tickLine={false} domain={["dataMin - 15", "dataMax + 15"]} />
                <Tooltip contentStyle={TOOLTIP}
                  formatter={(v) => [`${Number(v).toFixed(1)} pts`, "Promedio"]}
                  labelFormatter={(l) => `Período ${l}`} />
                <Line type="monotone" dataKey="promedio" stroke="#007AFF" strokeWidth={2}
                  dot={{ r: 4, fill: "#007AFF", stroke: "#FFFFFF", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ==================== SOCIOECONOMICO ==================== */}
      {p.socioeconomico.estratoPromedio > 0 && (
        <div className="apple-card p-6">
          <h3 className="text-[13px] font-semibold text-foreground mb-1">Perfil Socioeconómico</h3>
          <p className="text-[11px] text-muted mb-4">Datos de {p.evaluados} estudiantes evaluados en Saber 11</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Estrato */}
            <div>
              <h4 className="text-[10px] text-muted uppercase tracking-widest mb-2">Distribución Estrato</h4>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={estratoData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                    stroke="#FFFFFF" strokeWidth={2} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {estratoData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${Number(v).toFixed(1)}%`, "Estudiantes"]} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-[11px] text-muted mt-1">
                Estrato promedio: <span className="font-[var(--font-geist-mono)] text-foreground font-semibold">{p.socioeconomico.estratoPromedio}</span>
              </p>
            </div>

            {/* Internet + Computador + Género */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-muted uppercase tracking-widest">Recursos Digitales</h4>
              <GaugeBar label="Internet en casa" value={p.socioeconomico.pctInternet} />
              <GaugeBar label="Computador en casa" value={p.socioeconomico.pctComputador} />
              <div className="mt-4">
                <h4 className="text-[10px] text-muted uppercase tracking-widest mb-2">Género</h4>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-[#FF2D55]" style={{ width: `${p.socioeconomico.ratioGenero.F}%` }} />
                  <div className="bg-[#007AFF]" style={{ width: `${p.socioeconomico.ratioGenero.M}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>F: {p.socioeconomico.ratioGenero.F}%</span>
                  <span>M: {p.socioeconomico.ratioGenero.M}%</span>
                </div>
              </div>
            </div>

            {/* Educación madre */}
            <div className="col-span-2">
              <h4 className="text-[10px] text-muted uppercase tracking-widest mb-2">Educación de la Madre</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={madreData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" horizontal={false} />
                  <XAxis type="number" stroke="#6E6E73" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="nivel" stroke="#6E6E73" fontSize={9} tickLine={false} width={130} />
                  <Tooltip contentStyle={TOOLTIP} formatter={(v) => [v, "Estudiantes"]} />
                  <Bar dataKey="total" fill="#5856D6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VALOR AGREGADO ==================== */}
      {p.scoreEsperado && p.valorAgregado !== null && (
        <div className={`apple-card p-5 border-l-4 ${p.valorAgregado > 0 ? "border-l-success" : "border-l-danger"}`}>
          <div className="flex items-center gap-4">
            <Target className={`w-8 h-8 ${p.valorAgregado > 0 ? "text-success" : "text-danger"}`} />
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Valor Agregado</h3>
              <p className="text-[12px] text-muted">
                Score esperado para estrato promedio {p.socioeconomico.estratoPromedio}: <span className="font-[var(--font-geist-mono)] text-foreground">{p.scoreEsperado}</span> pts.
                Real: <span className="font-[var(--font-geist-mono)] text-foreground">{p.promedioGlobal}</span> pts.
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className={`font-[var(--font-geist-mono)] text-2xl font-semibold ${p.valorAgregado > 0 ? "text-success" : "text-danger"}`}>
                {p.valorAgregado > 0 ? "+" : ""}{p.valorAgregado}
              </p>
              <p className="text-[10px] text-muted">pts {p.valorAgregado > 0 ? "sobre" : "bajo"} esperado</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONTEXTO COMUNA + ISCE ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comuna */}
        <div className="apple-card p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">
            Contexto: {p.contextoComuna.nombre || `Comuna ${p.comuna}`}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <ContextStat label="Índice SIE" value={p.contextoComuna.indiceSIE ? `${p.contextoComuna.indiceSIE}` : "—"} />
            <ContextStat label="Saber 11 Promedio" value={p.contextoComuna.saber11Promedio ? `${p.contextoComuna.saber11Promedio}` : "—"} />
            <ContextStat label="Deserción" value={p.contextoComuna.tasaDesercion ? `${p.contextoComuna.tasaDesercion}%` : "—"} />
            <ContextStat label="Aprobación" value={p.contextoComuna.tasaAprobacion ? `${p.contextoComuna.tasaAprobacion}%` : "—"} />
          </div>
          <p className="text-[11px] text-muted mt-3">
            Esta IE ocupa el puesto <span className="font-semibold text-foreground">{p.rankComuna || "?"}</span> de {p.totalIEsComuna} en su comuna.
          </p>
        </div>

        {/* ISCE */}
        {isceData.length > 0 && (
          <div className="apple-card p-5" role="img" aria-label="ISCE histórico">
            <h3 className="text-[13px] font-semibold text-foreground mb-1">ISCE Histórico</h3>
            <p className="text-[11px] text-muted mb-3">Escala 1-10 · Descontinuado 2018</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={isceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                <XAxis dataKey="anio" stroke="#6E6E73" fontSize={11} tickLine={false} />
                <YAxis stroke="#6E6E73" fontSize={11} tickLine={false} domain={[0, 10]} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v) => [Number(v).toFixed(2), "ISCE"]} />
                <Line type="monotone" dataKey="isce" stroke="#34C759" strokeWidth={2}
                  dot={{ r: 4, fill: "#34C759", stroke: "#FFFFFF", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ==================== SEDES ==================== */}
      {p.sedes.length > 0 && (
        <div className="apple-card p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">
            Sedes ({p.sedes.length})
          </h3>
          <div className="space-y-2">
            {p.sedes.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface text-[12px]">
                <School className={`w-4 h-4 shrink-0 ${s.principal ? "text-accent" : "text-muted"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium capitalize">{s.nombre.toLowerCase()}</p>
                  <p className="text-muted text-[11px]">{s.direccion}{s.barrio && ` · ${s.barrio}`} · {s.zona}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-[var(--font-geist-mono)] font-semibold text-foreground">{s.matricula.toLocaleString("es-CO")}</p>
                  <p className="text-[10px] text-muted">matriculados</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SIMILARES ==================== */}
      {p.similares.length > 0 && (
        <div className="apple-card p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">
            Colegios Similares
            <span className="text-[11px] text-muted font-normal ml-2">
              Mismo sector + comuna
            </span>
          </h3>
          <div className="space-y-2">
            {p.similares.map((s) => (
              <Link key={s.codigoDane} href={`/instituciones/${s.codigoDane}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-accent/5 transition-colors text-[12px] group">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium capitalize group-hover:text-accent transition-colors">
                    {s.nombre.toLowerCase()}
                  </p>
                  <p className="text-muted text-[11px]">Clasificación {s.clasificacion || "—"}</p>
                </div>
                <span className="font-[var(--font-geist-mono)] font-semibold text-foreground">{s.promedioGlobal.toFixed(1)}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- subcomponents ---------- */

function BackLink() {
  return (
    <Link href="/instituciones" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-accent transition-colors mb-6">
      <ArrowLeft className="w-4 h-4" />
      Instituciones
    </Link>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface rounded-xl p-3">
      <p className="text-[10px] text-muted mb-1">{label}</p>
      <p className={`font-[var(--font-geist-mono)] text-lg font-semibold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function ContextStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-surface">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="font-[var(--font-geist-mono)] text-[14px] font-semibold text-foreground">{value}</p>
    </div>
  );
}

function GaugeBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted mb-1">
        <span>{label}</span>
        <span className="font-[var(--font-geist-mono)]">{value}%</span>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
