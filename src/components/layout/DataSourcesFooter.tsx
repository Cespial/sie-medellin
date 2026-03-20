"use client";

import { useDataManifest } from "@/hooks/useDataManifest";

export function DataSourcesFooter() {
  const { manifest } = useDataManifest();

  const totalArchivos = manifest?.total_archivos ?? 19;
  const generado = manifest?.generado
    ? new Date(manifest.generado).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  return (
    <footer className="px-6 py-6 border-t border-border/50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[11px] text-muted text-center leading-relaxed">
          Fuentes: MEData (Alcaldía de Medellín, 30+ datasets) |
          datos.gov.co (Saber 11, sedes, estadísticas ETC) |
          MEN (Estadísticas Sectoriales) | ArcGIS FeatureServer (GeoJSON
          oficial) | OpenStreetMap contributors
        </p>
        <p className="text-[10px] text-muted/60 text-center mt-1">
          Sistema de Inteligencia Educativa — Secretaría de Educación de
          Medellín | {totalArchivos} datasets procesados | Última generación: {generado}
        </p>
      </div>
    </footer>
  );
}
