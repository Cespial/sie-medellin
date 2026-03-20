"use client";

import { useFetchData } from "./useFetchData";

interface ManifestEntry {
  fuente: string;
  descripcion: string;
  rango?: string;
  ultimo_dato?: string;
  ultimo_periodo?: string;
  rango_periodos?: string;
  obsoleto?: boolean;
  descontinuado?: boolean;
  antiguedad_anios?: number | null;
  nota?: string;
  ultimo_dato_ciudad?: string;
  ultimo_dato_comunas?: string;
  ultimo_dato_real?: string;
  ultimo_dato_estimado?: string;
  tamano_kb?: number;
}

interface DataManifest {
  generado: string;
  total_archivos: number;
  archivos: Record<string, ManifestEntry>;
}

export function useDataManifest() {
  const { data, loading, error } = useFetchData<DataManifest>("/data/data_manifest.json");

  function getInfo(filename: string): ManifestEntry | null {
    if (!data) return null;
    return data.archivos[filename] ?? null;
  }

  return { manifest: data, loading, error, getInfo };
}
