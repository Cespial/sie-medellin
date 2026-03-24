"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, MapPin, Users, Award, ShieldAlert, Target, School } from "lucide-react";
import { useFetchData } from "@/hooks/useFetchData";

interface IEProfile {
  codigoDane: string;
  nombre: string;
  naturaleza: string;
  comuna: string;
  comunaNombre: string;
  clasificacion: string;
  promedioGlobal: number;
  percentil: number;
  evaluados: number;
  socioeconomico: { estratoPromedio: number; pctInternet: number | null };
  valorAgregado: number | null;
  scoreEsperado: number | null;
}

interface ComunaIndex {
  comuna: string;
  nombre: string;
  indice_sie: number;
  calidad_score: number;
  permanencia_score: number;
  aprobacion_score: number;
  saber11_promedio: number | null;
  tasa_desercion: number | null;
  tasa_aprobacion: number | null;
  matricula: number;
}

const COMUNA_NAMES: Record<string, string> = {
  "1": "Popular", "2": "Santa Cruz", "3": "Manrique", "4": "Aranjuez",
  "5": "Castilla", "6": "Doce de Octubre", "7": "Robledo",
  "8": "Villa Hermosa", "9": "Buenos Aires", "10": "La Candelaria",
  "11": "Laureles-Estadio", "12": "La América", "13": "San Javier",
  "14": "El Poblado", "15": "Guayabal", "16": "Belén",
  "50": "Palmitas", "60": "San Cristóbal", "70": "Altavista",
  "80": "San Antonio de Prado", "90": "Santa Elena",
};

export default function ComunaPage() {
  const params = useParams();
  const codigo = params.codigo as string;
  const nombre = COMUNA_NAMES[codigo] || `Comuna ${codigo}`;

  const { data: profiles } = useFetchData<IEProfile[]>("/data/perfiles_ie.json");
  const { data: indices } = useFetchData<ComunaIndex[]>("/data/indice_sie_comunas.json");

  const comunaIEs = useMemo(() => {
    if (!profiles) return [];
    return profiles
      .filter(p => p.comuna === codigo)
      .sort((a, b) => b.promedioGlobal - a.promedioGlobal);
  }, [profiles, codigo]);

  const comunaIndex = useMemo(() => {
    if (!indices) return null;
    return indices.find(c => c.comuna === codigo) || null;
  }, [indices, codigo]);

  const allIndices = useMemo(() => {
    if (!indices) return [];
    return indices.filter(c => c.comuna.length <= 2).sort((a, b) => b.indice_sie - a.indice_sie);
  }, [indices]);

  const rank = allIndices.findIndex(c => c.comuna === codigo) + 1;

  useEffect(() => {
    document.title = `${nombre} — SIE Medellín`;
  }, [nombre]);

  if (!profiles || !indices) {
    return (
      <div className="p-6">
        <Link href="/" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-accent transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] space-y-6">
      <Link href="/" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-accent transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      {/* Hero */}
      <div className="apple-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-[10px] text-muted uppercase tracking-[0.2em]">Comuna {codigo}</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{nombre}</h1>
            <p className="text-[13px] text-muted mt-1">
              {comunaIEs.length} instituciones educativas analizadas
            </p>
          </div>
          {comunaIndex && (
            <div className="flex gap-3">
              <div className="text-center p-3 bg-surface rounded-xl">
                <p className="font-[var(--font-geist-mono)] text-2xl font-semibold text-accent">{comunaIndex.indice_sie}</p>
                <p className="text-[10px] text-muted">Índice SIE</p>
              </div>
              <div className="text-center p-3 bg-surface rounded-xl">
                <p className="font-[var(--font-geist-mono)] text-2xl font-semibold text-foreground">{rank}/{allIndices.length}</p>
                <p className="text-[10px] text-muted">Rank</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      {comunaIndex && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Target} label="Saber 11" value={comunaIndex.saber11_promedio?.toFixed(1) || "—"} unit="pts" />
          <StatCard icon={ShieldAlert} label="Deserción" value={comunaIndex.tasa_desercion?.toFixed(2) || "—"} unit="%" alert={comunaIndex.tasa_desercion != null && comunaIndex.tasa_desercion > 3.5} />
          <StatCard icon={Award} label="Aprobación" value={comunaIndex.tasa_aprobacion?.toFixed(1) || "—"} unit="%" />
          <StatCard icon={Users} label="Matrícula" value={comunaIndex.matricula?.toLocaleString("es-CO") || "—"} />
        </div>
      )}

      {/* Score breakdown */}
      {comunaIndex && (
        <div className="apple-card p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">Desglose Índice SIE</h3>
          <div className="space-y-3">
            {[
              { label: "Calidad (40%)", score: comunaIndex.calidad_score, max: 100 },
              { label: "Permanencia (35%)", score: comunaIndex.permanencia_score, max: 100 },
              { label: "Aprobación (25%)", score: comunaIndex.aprobacion_score, max: 100 },
            ].map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-muted">{d.label}</span>
                  <span className="font-[var(--font-geist-mono)] text-foreground font-medium">{d.score.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${d.score >= 70 ? "bg-success" : d.score >= 50 ? "bg-accent" : "bg-danger"}`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IE list */}
      <div className="apple-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <h3 className="text-[13px] font-semibold text-foreground">
            Instituciones en {nombre}
          </h3>
          <p className="text-[11px] text-muted mt-0.5">
            {comunaIEs.length} IEs ordenadas por puntaje Saber 11
          </p>
        </div>
        <div className="divide-y divide-border/30">
          {comunaIEs.map((ie, i) => (
            <Link
              key={ie.codigoDane}
              href={`/instituciones/${ie.codigoDane}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-accent/[0.03] transition-colors group"
            >
              <span className="font-[var(--font-geist-mono)] text-[11px] text-muted w-5 shrink-0 tabular-nums">{i + 1}</span>
              <School className={`w-4 h-4 shrink-0 ${ie.naturaleza === "OFICIAL" ? "text-accent" : "text-warning"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground font-medium truncate capitalize group-hover:text-accent transition-colors">
                  {ie.nombre.toLowerCase()}
                </p>
                <div className="flex gap-2 text-[10px] text-muted">
                  <span>{ie.naturaleza === "OFICIAL" ? "Oficial" : "Privado"}</span>
                  {ie.clasificacion && <span>· {ie.clasificacion}</span>}
                  <span>· E{ie.socioeconomico.estratoPromedio.toFixed(1)}</span>
                  {ie.valorAgregado !== null && (
                    <span className={ie.valorAgregado > 0 ? "text-success" : "text-danger"}>
                      · {ie.valorAgregado > 0 ? "+" : ""}{ie.valorAgregado}va
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-[var(--font-geist-mono)] text-[14px] font-semibold text-foreground">{ie.promedioGlobal.toFixed(1)}</p>
                <p className="text-[9px] text-muted">P{ie.percentil}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, alert }: {
  icon: React.ElementType; label: string; value: string; unit?: string; alert?: boolean;
}) {
  return (
    <div className="apple-card p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-3.5 h-3.5 ${alert ? "text-danger" : "text-muted"}`} />
        <span className="text-[11px] text-muted">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-[var(--font-geist-mono)] text-xl font-semibold ${alert ? "text-danger" : "text-foreground"}`}>{value}</span>
        {unit && <span className="text-[11px] text-muted">{unit}</span>}
      </div>
    </div>
  );
}
