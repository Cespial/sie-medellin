"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Search, ExternalLink } from "lucide-react";
import Link from "next/link";

interface IEData {
  codigoDane: string;
  nombre: string;
  naturaleza: string;
  area?: string;
  jornada?: string;
  numEvaluados?: number;
  evaluados?: number;
  periodos?: number;
  promedioGlobal: number;
  promedioMatematicas?: number;
  promedioLectura?: number;
  promedioCiencias?: number;
  promedioSociales?: number;
  promedioIngles?: number;
  matematicas?: number;
  lecturaCritica?: number;
  cienciasNaturales?: number;
  socialesCiudadanas?: number;
  ingles?: number;
}

export default function InstitucionesPage() {
  const [data, setData] = useState<IEData[]>([]);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [sortBy, setSortBy] = useState<"promedioGlobal" | "nombre" | "evaluados">("promedioGlobal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/saber11_por_ie.json")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getEval = (ie: IEData) => ie.evaluados ?? ie.numEvaluados ?? 0;
  const getMat = (ie: IEData) => ie.matematicas ?? ie.promedioMatematicas;
  const getLec = (ie: IEData) => ie.lecturaCritica ?? ie.promedioLectura;
  const getCin = (ie: IEData) => ie.cienciasNaturales ?? ie.promedioCiencias;
  const getSoc = (ie: IEData) => ie.socialesCiudadanas ?? ie.promedioSociales;
  const getIng = (ie: IEData) => ie.ingles ?? ie.promedioIngles;

  const filtered = data
    .filter((ie) => {
      const matchSearch =
        !search ||
        ie.nombre.toLowerCase().includes(search.toLowerCase()) ||
        ie.codigoDane.includes(search);
      const nat = (ie.naturaleza || "").toUpperCase();
      const matchSector =
        !sectorFilter || nat === sectorFilter || nat.includes(sectorFilter.toLowerCase());
      return matchSearch && matchSector;
    })
    .sort((a, b) => {
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "evaluados") return getEval(b) - getEval(a);
      return b.promedioGlobal - a.promedioGlobal;
    });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-xs mb-3">
          Directorio — {data.length} IEs con datos Saber 11
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Instituciones Educativas
        </h1>
        <p className="text-muted mt-2">
          Busca y compara instituciones por puntaje Saber 11, sector y zona.
          Haz clic en una institución para ver su ficha completa.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface/50 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre o código DANE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
            />
          </div>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/50"
          >
            <option value="">Todos los sectores</option>
            <option value="OFICIAL">Oficial</option>
            <option value="NO OFICIAL">No Oficial</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/50"
          >
            <option value="promedioGlobal">Ordenar: Puntaje Global</option>
            <option value="nombre">Ordenar: Nombre</option>
            <option value="evaluados">Ordenar: N. Evaluados</option>
          </select>
          <span className="text-xs text-muted">
            {filtered.length} resultados
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center text-muted text-sm">Cargando...</div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-border text-xs text-muted">
                  <th className="text-left px-4 py-2 w-8">#</th>
                  <th className="text-left px-4 py-2">Institución</th>
                  <th className="text-center px-3 py-2">Sector</th>
                  <th className="text-right px-3 py-2">Global</th>
                  <th className="text-right px-3 py-2">Mat</th>
                  <th className="text-right px-3 py-2">Lec</th>
                  <th className="text-right px-3 py-2">Cien</th>
                  <th className="text-right px-3 py-2">Soc</th>
                  <th className="text-right px-3 py-2">Ing</th>
                  <th className="text-right px-3 py-2">Eval.</th>
                  <th className="text-center px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ie, i) => {
                  const nat = (ie.naturaleza || "").toUpperCase();
                  return (
                    <tr
                      key={ie.codigoDane}
                      className="border-b border-border/30 hover:bg-accent/5 transition-colors group"
                    >
                      <td className="px-4 py-2 text-muted font-mono text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2 max-w-[300px]">
                        <Link
                          href={`/instituciones/${ie.codigoDane}`}
                          className="block hover:text-accent transition-colors"
                        >
                          <p className="text-foreground text-xs font-medium truncate group-hover:text-accent">
                            {ie.nombre}
                          </p>
                          <p className="text-[10px] text-muted font-mono">
                            {ie.codigoDane}
                          </p>
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            nat === "OFICIAL" || nat === "O"
                              ? "bg-accent/10 text-accent"
                              : "bg-warning/10 text-warning"
                          )}
                        >
                          {nat === "OFICIAL" || nat === "O" ? "OF" : "PR"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] font-bold text-foreground">
                        {ie.promedioGlobal}
                      </td>
                      <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                        {getMat(ie) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                        {getLec(ie) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                        {getCin(ie) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                        {getSoc(ie) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                        {getIng(ie) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-muted">
                        {getEval(ie).toLocaleString("es-CO")}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <Link
                          href={`/instituciones/${ie.codigoDane}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-accent"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
