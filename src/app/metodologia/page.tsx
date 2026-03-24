"use client";

import { useFetchData } from "@/hooks/useFetchData";
import { BookOpen } from "lucide-react";

interface ManifestEntry {
  fuente: string;
  descripcion: string;
  rango?: string;
  ultimo_dato?: string;
  obsoleto?: boolean;
  descontinuado?: boolean;
  antiguedad_anios?: number | null;
  nota?: string;
  tamano_kb?: number;
}

interface Manifest {
  generado: string;
  total_archivos: number;
  archivos: Record<string, ManifestEntry>;
}

export default function MetodologiaPage() {
  const { data: manifest } = useFetchData<Manifest>("/data/data_manifest.json");

  return (
    <div className="p-6 max-w-[900px] space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-accent" />
          <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-medium">
            Transparencia
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Metodología y Fuentes
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Documentación completa de cada fuente de datos, fechas de actualización,
          limitaciones conocidas y metodología de cálculo.
        </p>
      </div>

      {/* Limitaciones */}
      <div className="apple-card p-5 border-l-4 border-l-warning">
        <h2 className="text-[14px] font-semibold text-foreground mb-2">Limitaciones Importantes</h2>
        <ul className="space-y-2 text-[13px] text-muted">
          <li className="flex gap-2">
            <span className="text-warning shrink-0">1.</span>
            <span>Los datos de <strong className="text-foreground">deserción por comuna son de 2017</strong> (MEData CSV). La tasa ciudad 2024 (3.18%) proviene de sras-4t5p pero no se desagrega por comuna.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-warning shrink-0">2.</span>
            <span>Los puntajes <strong className="text-foreground">Saber 11 son de 2022</strong> (período ICFES 20224). El código "20224" significa año 2022, aplicación 4 — no año 2024.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-warning shrink-0">3.</span>
            <span>La matrícula por comuna <strong className="text-foreground">real llega hasta 2019</strong>. Los años 2020-2024 son estimaciones calculadas como cobertura_bruta × población_5_16.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-warning shrink-0">4.</span>
            <span>El <strong className="text-foreground">ISCE fue descontinuado</strong> por el MEN después de 2018. Los datos mostrados son históricos.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-warning shrink-0">5.</span>
            <span>El <strong className="text-foreground">score de riesgo</strong> es un indicador compuesto calculado por SIE Medellín, no un indicador oficial del MEN.</span>
          </li>
        </ul>
      </div>

      {/* Indicadores */}
      <div>
        <h2 className="text-[14px] font-semibold text-foreground mb-3">Indicadores Calculados</h2>
        <div className="space-y-3">
          {[
            { nombre: "Índice SIE", formula: "Calidad(40%) + Permanencia(35%) + Aprobación(25%)", desc: "Calidad = Saber 11 normalizado 0-100. Permanencia = (10 - deserción) × 10. Aprobación = tasa directa." },
            { nombre: "Score de Riesgo", formula: "Puntaje(30%) + Estrato(25%) + Internet(20%) + Outlier(15%) + Percentil(10%)", desc: "0-100 donde mayor = más riesgo. Niveles: >50 Crítico, >35 Alto, >20 Medio, <20 Bajo." },
            { nombre: "Valor Agregado", formula: "Puntaje_real − (219.3 + estrato_promedio × 14.9)", desc: "Score esperado derivado de regresión lineal estrato→puntaje. Positivo = IE aporta más de lo esperado." },
            { nombre: "Percentil", formula: "Rank / Total_IEs × 100", desc: "Posición relativa entre las 452 IEs con ≥10 evaluados." },
          ].map((ind) => (
            <div key={ind.nombre} className="apple-card p-4">
              <h3 className="text-[13px] font-semibold text-foreground">{ind.nombre}</h3>
              <p className="font-[var(--font-geist-mono)] text-[11px] text-accent mt-1">{ind.formula}</p>
              <p className="text-[12px] text-muted mt-1">{ind.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fuentes */}
      <div>
        <h2 className="text-[14px] font-semibold text-foreground mb-3">
          Fuentes de Datos ({manifest?.total_archivos || "—"} datasets)
        </h2>
        {manifest && (
          <div className="apple-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted">
                  <th className="text-left px-4 py-2.5">Archivo</th>
                  <th className="text-left px-3 py-2.5">Fuente</th>
                  <th className="text-center px-3 py-2.5">Último dato</th>
                  <th className="text-center px-3 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(manifest.archivos)
                  .sort(([, a], [, b]) => (a.ultimo_dato || "").localeCompare(b.ultimo_dato || ""))
                  .map(([name, entry]) => (
                    <tr key={name} className="border-b border-border/30">
                      <td className="px-4 py-2 font-[var(--font-geist-mono)] text-foreground">{name}</td>
                      <td className="px-3 py-2 text-muted">{entry.fuente}</td>
                      <td className="px-3 py-2 text-center font-[var(--font-geist-mono)]">
                        {entry.ultimo_dato || "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {entry.descontinuado ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/10 text-danger">Descontinuado</span>
                        ) : entry.obsoleto ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">Obsoleto</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">Vigente</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generación */}
      <div className="text-[11px] text-muted text-center pb-8">
        Pipeline generado: {manifest?.generado ? new Date(manifest.generado).toLocaleString("es-CO") : "—"}
        {" · "}SIE Medellín v1.0 · Tensor
      </div>
    </div>
  );
}
