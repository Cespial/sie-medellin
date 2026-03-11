"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Search } from "lucide-react";

interface IEData {
  codigoDane: string;
  nombre: string;
  naturaleza: string;
  area: string;
  jornada: string;
  numEvaluados: number;
  promedioGlobal: number;
  promedioMatematicas?: number;
  promedioLectura?: number;
  promedioCiencias?: number;
  promedioSociales?: number;
  promedioIngles?: number;
}

export default function InstitucionesPage() {
  const [data, setData] = useState<IEData[]>([]);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [sortBy, setSortBy] = useState<"promedioGlobal" | "nombre" | "numEvaluados">("promedioGlobal");
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

  const filtered = data
    .filter((ie) => {
      const matchSearch =
        !search ||
        ie.nombre.toLowerCase().includes(search.toLowerCase()) ||
        ie.codigoDane.includes(search);
      const matchSector =
        !sectorFilter || ie.naturaleza === sectorFilter;
      return matchSearch && matchSector;
    })
    .sort((a, b) => {
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "numEvaluados") return b.numEvaluados - a.numEvaluados;
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
            <option value="numEvaluados">Ordenar: N. Evaluados</option>
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
                  <th className="text-center px-3 py-2">Zona</th>
                  <th className="text-right px-3 py-2">Global</th>
                  <th className="text-right px-3 py-2">Mat</th>
                  <th className="text-right px-3 py-2">Lec</th>
                  <th className="text-right px-3 py-2">Cien</th>
                  <th className="text-right px-3 py-2">Soc</th>
                  <th className="text-right px-3 py-2">Ing</th>
                  <th className="text-right px-3 py-2">Eval.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ie, i) => (
                  <tr
                    key={ie.codigoDane}
                    className="border-b border-border/30 hover:bg-accent/5 transition-colors"
                  >
                    <td className="px-4 py-2 text-muted font-mono text-xs">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2 max-w-[300px]">
                      <p className="text-foreground text-xs font-medium truncate">
                        {ie.nombre}
                      </p>
                      <p className="text-[10px] text-muted font-mono">
                        {ie.codigoDane}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          ie.naturaleza === "OFICIAL"
                            ? "bg-accent/10 text-accent"
                            : "bg-warning/10 text-warning"
                        )}
                      >
                        {ie.naturaleza === "OFICIAL" ? "OF" : "PR"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-muted">
                      {ie.area === "URBANO" ? "U" : "R"}
                    </td>
                    <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] font-bold text-foreground">
                      {ie.promedioGlobal}
                    </td>
                    <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                      {ie.promedioMatematicas ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                      {ie.promedioLectura ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                      {ie.promedioCiencias ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                      {ie.promedioSociales ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-[var(--font-jetbrains)] text-xs text-muted">
                      {ie.promedioIngles ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted">
                      {ie.numEvaluados.toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
