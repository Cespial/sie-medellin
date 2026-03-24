"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { useFetchData } from "@/hooks/useFetchData";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";

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
  coordenadas: [number, number] | null;
  zona: string;
  outlier: { tipo: string; diferencia: number } | null;
  socioeconomico: { estratoPromedio: number };
}

interface IEMapViewProps {
  highlightCode?: string;
  height?: string;
}

const CLASIF_COLORS: Record<string, string> = {
  "A+": "#34C759", A: "#007AFF", B: "#FF9500", C: "#FF3B30", D: "#6E6E73",
};

const CENTER: [number, number] = [6.2476, -75.5636];

export function IEMapView({ highlightCode, height = "500px" }: IEMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>("all");
  const { data: profiles, loading } = useFetchData<IEProfile[]>("/data/perfiles_ie.json");

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CENTER,
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false })
      .addAttribution('&copy; <a href="https://carto.com">CARTO</a>')
      .addTo(map);

    mapRef.current = map;
  }, []);

  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initMap]);

  // Render markers when data loads
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !profiles) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    const filtered = filter === "all"
      ? profiles
      : filter === "oficial"
        ? profiles.filter(p => p.naturaleza === "OFICIAL")
        : filter === "privado"
          ? profiles.filter(p => p.naturaleza === "NO OFICIAL")
          : profiles.filter(p => p.clasificacion === filter);

    for (const p of filtered) {
      if (!p.coordenadas) continue;
      const [lon, lat] = p.coordenadas;
      if (!lat || !lon) continue;

      const isHighlighted = p.codigoDane === highlightCode;
      const color = CLASIF_COLORS[p.clasificacion] || "#6E6E73";
      const radius = isHighlighted ? 10 : (p.evaluados > 200 ? 6 : p.evaluados > 50 ? 5 : 4);

      const marker = L.circleMarker([lat, lon], {
        radius,
        fillColor: color,
        color: isHighlighted ? "#1D1D1F" : "#FFFFFF",
        weight: isHighlighted ? 3 : 1,
        opacity: 1,
        fillOpacity: isHighlighted ? 1 : 0.8,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: var(--font-geist-sans, system-ui); min-width: 220px; padding: 4px 0;">
          <div style="font-weight: 600; font-size: 13px; color: #1D1D1F; margin-bottom: 4px; text-transform: capitalize;">
            ${p.nombre.toLowerCase()}
          </div>
          <div style="display: flex; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 10px; background: ${color}20; color: ${color}; font-weight: 600;">
              ${p.clasificacion || "—"}
            </span>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 10px; background: #F5F5F7; color: #6E6E73;">
              ${p.naturaleza === "OFICIAL" ? "Oficial" : "Privado"}
            </span>
          </div>
          <div style="font-size: 11px; color: #6E6E73; line-height: 1.6;">
            <div>Puntaje: <strong style="color: #1D1D1F; font-family: var(--font-geist-mono, monospace);">${p.promedioGlobal}</strong> (P${p.percentil})</div>
            <div>Evaluados: ${p.evaluados} · ${p.comunaNombre || "C" + p.comuna}</div>
            ${p.outlier ? `<div style="color: ${p.outlier.tipo === "sobre_rinde" ? "#34C759" : "#FF3B30"}; font-weight: 500;">
              ${p.outlier.tipo === "sobre_rinde" ? "+" : ""}${p.outlier.diferencia} pts vs esperado
            </div>` : ""}
          </div>
          <a href="/instituciones/${p.codigoDane}" style="display: inline-block; margin-top: 8px; font-size: 11px; color: #007AFF; text-decoration: none;">
            Ver perfil completo →
          </a>
        </div>
      `, { className: "sie-popup", maxWidth: 280 });

      if (isHighlighted) {
        marker.openPopup();
        map.setView([lat, lon], 15);
      }
    }
  }, [profiles, filter, highlightCode]);

  if (loading) return <ChartSkeleton height={parseInt(height)} />;

  const counts = profiles ? {
    total: profiles.filter(p => p.coordenadas).length,
    "A+": profiles.filter(p => p.clasificacion === "A+").length,
    A: profiles.filter(p => p.clasificacion === "A").length,
    B: profiles.filter(p => p.clasificacion === "B").length,
    C: profiles.filter(p => p.clasificacion === "C").length,
    D: profiles.filter(p => p.clasificacion === "D").length,
  } : null;

  return (
    <div className="apple-card overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50 overflow-x-auto">
        <span className="text-[11px] text-muted shrink-0">Filtrar:</span>
        {[
          { key: "all", label: `Todos (${counts?.total || 0})` },
          { key: "A+", label: `A+ (${counts?.["A+"] || 0})`, color: "#34C759" },
          { key: "A", label: `A (${counts?.A || 0})`, color: "#007AFF" },
          { key: "B", label: `B (${counts?.B || 0})`, color: "#FF9500" },
          { key: "C", label: `C (${counts?.C || 0})`, color: "#FF3B30" },
          { key: "oficial", label: "Oficial" },
          { key: "privado", label: "Privado" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2.5 py-1 text-[11px] rounded-full transition-colors shrink-0 ${
              filter === f.key
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {"color" in f && f.color && (
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: f.color }} />
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
