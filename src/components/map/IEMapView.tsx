"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { useFetchData } from "@/hooks/useFetchData";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { Search } from "lucide-react";

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
  socioeconomico: { estratoPromedio: number; pctInternet: number | null };
  valorAgregado: number | null;
}

interface IEMapViewProps {
  highlightCode?: string;
  height?: string;
}

const CLASIF_COLORS: Record<string, string> = {
  "A+": "#34C759", A: "#007AFF", B: "#FF9500", C: "#FF3B30", D: "#6E6E73",
};

const CENTER: [number, number] = [6.2476, -75.5636];

function buildIEPopup(p: IEProfile): string {
  const color = CLASIF_COLORS[p.clasificacion] || "#6E6E73";
  const va = p.valorAgregado;
  const vaHtml = va !== null && va !== undefined
    ? `<div style="margin-top:6px;padding:4px 8px;border-radius:8px;background:${va > 0 ? "rgba(52,199,89,0.08)" : "rgba(255,59,48,0.08)"};font-size:11px;">
        <span style="color:${va > 0 ? "#34C759" : "#FF3B30"};font-weight:600;">${va > 0 ? "+" : ""}${va} pts</span>
        <span style="color:#6E6E73;"> valor agregado</span>
      </div>`
    : "";

  return `<div style="padding:16px;font-family:system-ui,-apple-system,sans-serif;background:#FFFFFF;color:#1D1D1F;border-radius:16px;min-width:240px;max-width:300px;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
    <div style="font-weight:700;font-size:14px;margin-bottom:6px;line-height:1.3;text-transform:capitalize;">
      ${p.nombre.toLowerCase()}
    </div>
    <div style="display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap;">
      <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:${color}15;color:${color};font-weight:600;">${p.clasificacion || "—"}</span>
      <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:#F5F5F7;color:#6E6E73;">${p.naturaleza === "OFICIAL" ? "Oficial" : "Privado"}</span>
      ${p.outlier ? `<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:${p.outlier.tipo === "sobre_rinde" ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)"};color:${p.outlier.tipo === "sobre_rinde" ? "#34C759" : "#FF3B30"};font-weight:500;">⚡ ${p.outlier.tipo === "sobre_rinde" ? "Sobre-rinde" : "Sub-rinde"}</span>` : ""}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
      <div><span style="color:#6E6E73;font-size:10px;">Puntaje</span><br/><strong style="font-size:16px;">${p.promedioGlobal}</strong> <span style="color:#6E6E73;font-size:10px;">P${p.percentil}</span></div>
      <div><span style="color:#6E6E73;font-size:10px;">Evaluados</span><br/><strong>${p.evaluados}</strong></div>
      <div><span style="color:#6E6E73;font-size:10px;">Estrato prom.</span><br/><strong>${p.socioeconomico.estratoPromedio || "—"}</strong></div>
      <div><span style="color:#6E6E73;font-size:10px;">Internet</span><br/><strong>${p.socioeconomico.pctInternet != null ? p.socioeconomico.pctInternet + "%" : "—"}</strong></div>
    </div>
    ${vaHtml}
    <div style="margin-top:6px;font-size:10px;color:#6E6E73;">${p.comunaNombre || "C" + p.comuna}${p.zona ? " · " + p.zona : ""}</div>
    <a href="/instituciones/${p.codigoDane}" style="display:inline-block;margin-top:8px;font-size:11px;color:#007AFF;text-decoration:none;font-weight:500;">Ver perfil completo →</a>
  </div>`;
}

export function IEMapView({ highlightCode, height = "500px" }: IEMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { data: profiles, loading } = useFetchData<IEProfile[]>("/data/perfiles_ie.json");

  // Memoize counts to avoid recalculating on every render
  const counts = useMemo(() => {
    if (!profiles) return null;
    return {
      total: profiles.filter(p => p.coordenadas).length,
      "A+": profiles.filter(p => p.clasificacion === "A+").length,
      A: profiles.filter(p => p.clasificacion === "A").length,
      B: profiles.filter(p => p.clasificacion === "B").length,
      C: profiles.filter(p => p.clasificacion === "C").length,
      D: profiles.filter(p => p.clasificacion === "D").length,
    };
  }, [profiles]);

  // Memoize filtered profiles
  const filtered = useMemo(() => {
    if (!profiles) return [];
    let result = filter === "all"
      ? profiles
      : filter === "oficial"
        ? profiles.filter(p => p.naturaleza === "OFICIAL")
        : filter === "privado"
          ? profiles.filter(p => p.naturaleza === "NO OFICIAL")
          : profiles.filter(p => p.clasificacion === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(q) || p.codigoDane.includes(q)
      );
    }
    return result;
  }, [profiles, filter, search]);

  // Initialize map only after container is mounted and has dimensions
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Ensure container has height before initializing
    const container = containerRef.current;
    if (container.clientHeight === 0) {
      // Wait for layout to complete
      const raf = requestAnimationFrame(() => {
        if (container.clientHeight > 0 && !mapRef.current) {
          initMapInstance(container);
        }
      });
      return () => cancelAnimationFrame(raf);
    }

    initMapInstance(container);

    return () => {
      resizeObs.current?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const resizeObs = useRef<ResizeObserver | null>(null);

  function initMapInstance(container: HTMLDivElement) {
    const map = L.map(container, {
      center: CENTER,
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false })
      .addAttribution('&copy; CARTO')
      .addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // ResizeObserver to handle layout shifts
    resizeObs.current = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObs.current.observe(container);
  }

  // Render markers when filtered data changes
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

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
      });

      marker.bindPopup(buildIEPopup(p), { className: "sie-popup", maxWidth: 300 });
      markers.addLayer(marker);

      if (isHighlighted) {
        marker.openPopup();
        map.setView([lat, lon], 15);
      }
    }
  }, [filtered, highlightCode]);

  if (loading) return <ChartSkeleton height={parseInt(height)} />;

  return (
    <div className="apple-card overflow-hidden">
      {/* Filter + Search bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border-b border-border/30">
        {/* Search */}
        <div className="relative w-full sm:w-48 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar IE..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-surface rounded-lg text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent/30"
            aria-label="Buscar institución en el mapa"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {[
            { key: "all", label: `Todos (${counts?.total || 0})` },
            { key: "A+", label: `A+`, color: "#34C759" },
            { key: "A", label: `A`, color: "#007AFF" },
            { key: "B", label: `B`, color: "#FF9500" },
            { key: "C", label: `C`, color: "#FF3B30" },
            { key: "oficial", label: "Oficial" },
            { key: "privado", label: "Privado" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-label={`Filtrar por ${f.label}`}
              className={`px-2.5 py-1 text-[11px] rounded-full transition-colors shrink-0 ${
                filter === f.key
                  ? "bg-accent text-white font-medium"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {"color" in f && f.color && (
                <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: f.color }} />
              )}
              {f.label}
            </button>
          ))}
          <span className="text-[10px] text-muted shrink-0 ml-1">
            {filtered.filter(p => p.coordenadas).length} en mapa
          </span>
        </div>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ height, minHeight: "300px" }} />
    </div>
  );
}
