"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useFetchData } from "@/hooks/useFetchData";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { AlertTriangle, ChevronRight, Search } from "lucide-react";

interface RiskIE {
  codigoDane: string;
  nombre: string;
  naturaleza: string;
  comuna: string;
  comunaNombre: string;
  scoreRiesgo: number;
  nivel: string;
  promedioGlobal: number;
  percentil: number;
  estratoPromedio: number;
  pctInternet: number | null;
  evaluados: number;
  clasificacion: string;
  factores: string[];
}

const NIVEL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critico: { bg: "bg-danger/10", text: "text-danger", label: "Crítico" },
  alto: { bg: "bg-warning/10", text: "text-warning", label: "Alto" },
  medio: { bg: "bg-accent/10", text: "text-accent", label: "Medio" },
  bajo: { bg: "bg-success/10", text: "text-success", label: "Bajo" },
};

export default function RiesgoPage() {
  const { data, loading, error, retry } = useFetchData<RiskIE[]>("/data/escuelas_riesgo.json");
  const [search, setSearch] = useState("");
  const [nivelFilter, setNivelFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((ie) => {
      if (nivelFilter !== "all" && ie.nivel !== nivelFilter) return false;
      if (sectorFilter === "OFICIAL" && ie.naturaleza !== "OFICIAL") return false;
      if (sectorFilter === "NO OFICIAL" && ie.naturaleza !== "NO OFICIAL") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!ie.nombre.toLowerCase().includes(q) && !ie.codigoDane.includes(q) && !ie.comunaNombre.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, search, nivelFilter, sectorFilter]);

  const counts = useMemo(() => {
    if (!data) return { critico: 0, alto: 0, medio: 0, bajo: 0 };
    return {
      critico: data.filter(d => d.nivel === "critico").length,
      alto: data.filter(d => d.nivel === "alto").length,
      medio: data.filter(d => d.nivel === "medio").length,
      bajo: data.filter(d => d.nivel === "bajo").length,
    };
  }, [data]);

  if (loading) return <div className="p-6"><ChartSkeleton height={400} /></div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={retry} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-danger" />
          <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-medium">
            Priorización de Intervenciones
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Escuelas en Riesgo
        </h1>
        <p className="text-[13px] text-muted mt-1 max-w-2xl">
          Ranking de {data?.length || 0} instituciones por score de riesgo compuesto.
          Factores: puntaje Saber 11, estrato, acceso a internet, desempeño vs contexto.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["critico", "alto", "medio", "bajo"] as const).map((nivel) => {
          const s = NIVEL_STYLES[nivel];
          return (
            <button
              key={nivel}
              onClick={() => setNivelFilter(nivelFilter === nivel ? "all" : nivel)}
              className={`apple-card p-4 text-left transition-all ${nivelFilter === nivel ? "ring-2 ring-accent" : ""}`}
            >
              <p className="text-[11px] text-muted mb-1">{s.label}</p>
              <p className={`font-[var(--font-geist-mono)] text-2xl font-semibold ${s.text}`}>
                {counts[nivel]}
              </p>
              <p className="text-[10px] text-muted">instituciones</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o comuna..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-border text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/30"
            aria-label="Buscar institución"
          />
        </div>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-[13px] text-foreground"
          aria-label="Filtrar por sector"
        >
          <option value="all">Todos</option>
          <option value="OFICIAL">Oficial</option>
          <option value="NO OFICIAL">Privado</option>
        </select>
        <span className="text-[12px] text-muted">{filtered.length} resultados</span>
      </div>

      {/* Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted">
                <th className="text-left px-4 py-3 w-10">#</th>
                <th className="text-left px-4 py-3">Institución</th>
                <th className="text-center px-3 py-3">Riesgo</th>
                <th className="text-right px-3 py-3">Score</th>
                <th className="text-right px-3 py-3">Saber 11</th>
                <th className="text-right px-3 py-3">Estrato</th>
                <th className="text-right px-3 py-3">Internet</th>
                <th className="text-left px-3 py-3">Factores</th>
                <th className="text-center px-2 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((ie, i) => {
                const s = NIVEL_STYLES[ie.nivel] || NIVEL_STYLES.medio;
                return (
                  <tr key={ie.codigoDane} className="border-b border-border/30 hover:bg-accent/[0.03] transition-colors group">
                    <td className="px-4 py-3 text-muted font-[var(--font-geist-mono)] text-[11px]">{i + 1}</td>
                    <td className="px-4 py-3 max-w-[250px]">
                      <Link href={`/instituciones/${ie.codigoDane}`} className="block group-hover:text-accent transition-colors">
                        <p className="text-foreground font-medium truncate capitalize text-[12px]">{ie.nombre.toLowerCase()}</p>
                        <p className="text-[10px] text-muted">{ie.comunaNombre} · {ie.naturaleza === "OFICIAL" ? "Oficial" : "Privado"}</p>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-[var(--font-geist-mono)] font-semibold text-foreground">
                      {ie.scoreRiesgo}
                    </td>
                    <td className="px-3 py-3 text-right font-[var(--font-geist-mono)] text-muted">
                      {ie.promedioGlobal.toFixed(0)}
                    </td>
                    <td className="px-3 py-3 text-right font-[var(--font-geist-mono)] text-muted">
                      {ie.estratoPromedio.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-[var(--font-geist-mono)] text-muted">
                      {ie.pctInternet != null ? `${ie.pctInternet.toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {ie.factores.slice(0, 2).map((f, j) => (
                          <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-surface text-muted">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <Link href={`/instituciones/${ie.codigoDane}`} className="opacity-0 group-hover:opacity-100 text-accent transition-opacity">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div className="px-4 py-3 border-t border-border text-[12px] text-muted text-center">
            Mostrando 50 de {filtered.length} resultados. Use los filtros para refinar.
          </div>
        )}
      </div>
    </div>
  );
}
