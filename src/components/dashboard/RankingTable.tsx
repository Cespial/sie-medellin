"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface IEScore {
  codigoDane: string;
  nombre: string;
  naturaleza: string;
  promedioGlobal: number;
  promedioMatematicas?: number;
  promedioLectura?: number;
  numEvaluados: number;
}

interface RankingTableProps {
  limit?: number;
  showBottom?: boolean;
}

export function RankingTable({ limit = 20, showBottom = false }: RankingTableProps) {
  const [data, setData] = useState<IEScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/saber11_por_ie.json")
      .then((r) => r.json())
      .then((all: IEScore[]) => {
        // Filter IEs with at least 10 evaluated students
        const filtered = all.filter((ie) => ie.numEvaluados >= 10);
        if (showBottom) {
          setData(filtered.slice(-limit).reverse());
        } else {
          setData(filtered.slice(0, limit));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [limit, showBottom]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-muted text-sm">Cargando ranking...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface/50 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground">
          {showBottom ? "Bottom" : "Top"} {limit} IEs — Puntaje Saber 11
        </h3>
        <p className="text-xs text-muted mt-1">
          Promedio global por institución (min. 10 evaluados)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="text-left px-4 py-2 w-10">#</th>
              <th className="text-left px-4 py-2">Institución</th>
              <th className="text-center px-4 py-2">Sector</th>
              <th className="text-right px-4 py-2">Global</th>
              <th className="text-right px-4 py-2">Mat.</th>
              <th className="text-right px-4 py-2">Lec.</th>
              <th className="text-right px-4 py-2">Eval.</th>
            </tr>
          </thead>
          <tbody>
            {data.map((ie, i) => (
              <motion.tr
                key={ie.codigoDane}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-accent/5 transition-colors"
              >
                <td className="px-4 py-2.5 text-muted font-mono text-xs">
                  {showBottom ? data.length - i : i + 1}
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-foreground text-xs font-medium line-clamp-1">
                    {ie.nombre}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span
                    className={cn(
                      "inline-block px-1.5 py-0.5 rounded text-[10px] font-medium",
                      ie.naturaleza === "OFICIAL"
                        ? "bg-accent/10 text-accent"
                        : "bg-warning/10 text-warning"
                    )}
                  >
                    {ie.naturaleza === "OFICIAL" ? "OF" : "PR"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-[var(--font-jetbrains)] font-bold text-foreground">
                  {ie.promedioGlobal}
                </td>
                <td className="px-4 py-2.5 text-right font-[var(--font-jetbrains)] text-muted text-xs">
                  {ie.promedioMatematicas ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-[var(--font-jetbrains)] text-muted text-xs">
                  {ie.promedioLectura ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-muted text-xs">
                  {ie.numEvaluados}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
