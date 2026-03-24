"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import {
  Layers,
  Eye,
  EyeOff,
  MapPin,
  Building2,
  X,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";

/* ========== TYPES ========== */

interface MapEnrichedData {
  comunas: Record<string, ComunaMetrics>;
  instituciones: Record<string, IEMetrics>;
}

interface ComunaMetrics {
  tasa_desercion?: number;
  desertores?: number;
  matricula_desercion?: number;
  tasa_aprobacion?: number;
  aprobados?: number;
  matricula?: number;
  oficial?: number;
  privado?: number;
  pct_oficial?: number;
  saber11_promedio?: number;
  saber11_evaluados?: number;
  saber11_ies?: number;
  saber11_clasif?: Record<string, number>;
  isce_promedio?: number;
  isce_ies?: number;
}

interface IEMetrics {
  promedioGlobal?: number;
  evaluados?: number;
  matematicas?: number;
  lecturaCritica?: number;
  cienciasNaturales?: number;
  socialesCiudadanas?: number;
  ingles?: number;
  clasificacion?: string;
  isce?: number;
}

/* ========== VARIABLE CONFIG ========== */

interface VarConfig {
  key: string;
  label: string;
  unit: string;
  desc: string;
  gradient: string;
  min: string;
  max: string;
  legendLabels: [string, string, string];
  getColor: (v: number) => string;
  format: (v: number) => string;
}

const MAP_VARIABLES: VarConfig[] = [
  {
    key: "tasa_desercion",
    label: "Deserción",
    unit: "%",
    desc: "Tasa de deserción escolar por comuna",
    gradient: "linear-gradient(to right, #34C759, #FF9500, #FF3B30)",
    min: "0%",
    max: "6%+",
    legendLabels: ["Baja", "Media", "Alta"],
    getColor: (v) => {
      if (v >= 5) return "#FF3B30";
      if (v >= 3.5) return "#FF453A";
      if (v >= 2) return "#FF9500";
      return "#34C759";
    },
    format: (v) => `${v.toFixed(2)}%`,
  },
  {
    key: "tasa_aprobacion",
    label: "Aprobación",
    unit: "%",
    desc: "Tasa de aprobación escolar por comuna",
    gradient: "linear-gradient(to right, #FF3B30, #FF9500, #34C759)",
    min: "84%",
    max: "96%",
    legendLabels: ["Baja", "Media", "Alta"],
    getColor: (v) => {
      if (v >= 93) return "#34C759";
      if (v >= 90) return "#007AFF";
      if (v >= 87) return "#FF9500";
      return "#FF3B30";
    },
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: "matricula",
    label: "Matrícula",
    unit: "",
    desc: "Total de estudiantes matriculados",
    gradient: "linear-gradient(to right, #E5E5EA, #5856D6, #007AFF)",
    min: "0",
    max: "40K+",
    legendLabels: ["Baja", "Media", "Alta"],
    getColor: (v) => {
      if (v >= 30000) return "#007AFF";
      if (v >= 20000) return "#5856D6";
      if (v >= 10000) return "#1D1D1F";
      return "#D2D2D7";
    },
    format: (v) => v.toLocaleString("es-CO"),
  },
  {
    key: "pct_oficial",
    label: "% Oficial",
    unit: "%",
    desc: "Proporción de matrícula en sector oficial",
    gradient: "linear-gradient(to right, #FF9500, #007AFF, #5856D6)",
    min: "0%",
    max: "100%",
    legendLabels: ["Privado", "Mixto", "Oficial"],
    getColor: (v) => {
      if (v >= 85) return "#5856D6";
      if (v >= 60) return "#007AFF";
      if (v >= 40) return "#FF9500";
      return "#FF3B30";
    },
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: "saber11_promedio",
    label: "Saber 11",
    unit: "pts",
    desc: "Puntaje global promedio Saber 11",
    gradient: "linear-gradient(to right, #FF3B30, #FF9500, #34C759)",
    min: "220",
    max: "270+",
    legendLabels: ["Bajo", "Medio", "Alto"],
    getColor: (v) => {
      if (v >= 260) return "#34C759";
      if (v >= 250) return "#007AFF";
      if (v >= 240) return "#FF9500";
      return "#FF3B30";
    },
    format: (v) => `${v.toFixed(1)} pts`,
  },
  {
    key: "isce_promedio",
    label: "ISCE",
    unit: "",
    desc: "Índice Sintético de Calidad Educativa",
    gradient: "linear-gradient(to right, #FF3B30, #FF9500, #34C759)",
    min: "3",
    max: "7+",
    legendLabels: ["Bajo", "Medio", "Alto"],
    getColor: (v) => {
      if (v >= 6) return "#34C759";
      if (v >= 5) return "#007AFF";
      if (v >= 4) return "#FF9500";
      return "#FF3B30";
    },
    format: (v) => v.toFixed(2),
  },
];

/* ========== POPUP BUILDERS ========== */

function buildComunaPopup(
  nombre: string,
  codigo: string,
  data: ComunaMetrics
): string {
  const fmt = (v: number | undefined, decimals = 1) =>
    v != null ? v.toFixed(decimals) : "N/D";
  const fmtInt = (v: number | undefined) =>
    v != null ? v.toLocaleString("es-CO") : "N/D";

  const clasifBadges = data.saber11_clasif
    ? Object.entries(data.saber11_clasif)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([cl, n]) =>
            `<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600;background:${cl === "A+" || cl === "A" ? "rgba(52,199,89,0.12)" : cl === "B" ? "rgba(255,149,0,0.12)" : "rgba(255,59,48,0.12)"};color:${cl === "A+" || cl === "A" ? "#34C759" : cl === "B" ? "#FF9500" : "#FF3B30"};">${cl}: ${n}</span>`
        )
        .join(" ")
    : "";

  return `<div style="padding:16px;font-family:system-ui,-apple-system,sans-serif;background:#FFFFFF;color:#1D1D1F;border-radius:16px;min-width:260px;max-width:320px;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <h3 style="font-weight:700;font-size:15px;margin:0;letter-spacing:-0.01em;">${nombre}</h3>
      <span style="font-size:10px;color:#6E6E73;background:#F5F5F7;padding:2px 8px;border-radius:8px;">C${codigo}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11px;">
      <div>
        <span style="color:#6E6E73;font-size:10px;">Deserción</span><br/>
        <span style="font-weight:700;color:${(data.tasa_desercion ?? 0) > 3.5 ? "#FF3B30" : "#34C759"};font-size:17px;">${fmt(data.tasa_desercion, 2)}%</span>
      </div>
      <div>
        <span style="color:#6E6E73;font-size:10px;">Aprobación</span><br/>
        <span style="font-weight:700;color:${(data.tasa_aprobacion ?? 0) >= 90 ? "#34C759" : "#FF9500"};font-size:17px;">${fmt(data.tasa_aprobacion, 1)}%</span>
      </div>
      <div>
        <span style="color:#6E6E73;font-size:10px;">Matrícula</span><br/>
        <span style="font-weight:600;color:#007AFF;font-size:15px;">${fmtInt(data.matricula)}</span>
      </div>
      <div>
        <span style="color:#6E6E73;font-size:10px;">% Oficial</span><br/>
        <span style="font-weight:600;color:#5856D6;font-size:15px;">${fmt(data.pct_oficial, 1)}%</span>
      </div>
      <div>
        <span style="color:#6E6E73;font-size:10px;">Saber 11</span><br/>
        <span style="font-weight:700;color:#1D1D1F;font-size:15px;">${data.saber11_promedio != null ? data.saber11_promedio.toFixed(1) + " pts" : "N/D"}</span>
      </div>
      <div>
        <span style="color:#6E6E73;font-size:10px;">ISCE</span><br/>
        <span style="font-weight:600;color:#1D1D1F;font-size:15px;">${data.isce_promedio != null ? data.isce_promedio.toFixed(2) : "N/D"}</span>
      </div>
    </div>
    ${clasifBadges ? `<div style="margin-top:10px;display:flex;gap:4px;flex-wrap:wrap;">${clasifBadges}</div>` : ""}
    ${data.saber11_ies ? `<div style="margin-top:8px;font-size:10px;color:#6E6E73;">${data.saber11_ies} IEs con Saber 11 · ${fmtInt(data.saber11_evaluados)} evaluados</div>` : ""}
  </div>`;
}

function buildIEPopup(
  props: Record<string, string | number>,
  ieData: IEMetrics | undefined
): string {
  const nombre = props.nombre_establecimiento || props.nombre_sede || "IE";
  const isOficial = props.cte_id_sector === "OFICIAL";
  const mat = Number(props.total_matricula || 0);
  const dane = String(props.codigo_dane || "");

  const sectorBadge = `<span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;background:${isOficial ? "rgba(0,122,255,0.1)" : "rgba(255,149,0,0.1)"};color:${isOficial ? "#007AFF" : "#FF9500"};">${isOficial ? "Oficial" : "No Oficial"}</span>`;
  const clasifBadge = ieData?.clasificacion
    ? `<span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;margin-left:4px;background:${ieData.clasificacion === "A+" || ieData.clasificacion === "A" ? "rgba(52,199,89,0.12)" : ieData.clasificacion === "B" ? "rgba(255,149,0,0.12)" : "rgba(255,59,48,0.12)"};color:${ieData.clasificacion === "A+" || ieData.clasificacion === "A" ? "#34C759" : ieData.clasificacion === "B" ? "#FF9500" : "#FF3B30"};">${ieData.clasificacion}</span>`
    : "";

  let subjectsHtml = "";
  if (ieData?.matematicas) {
    subjectsHtml = `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #E5E5EA;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:10px;">
      <div><span style="color:#6E6E73;">Mat</span> <strong style="color:#1D1D1F;">${ieData.matematicas?.toFixed(1)}</strong></div>
      <div><span style="color:#6E6E73;">Lec</span> <strong style="color:#1D1D1F;">${ieData.lecturaCritica?.toFixed(1)}</strong></div>
      <div><span style="color:#6E6E73;">Nat</span> <strong style="color:#1D1D1F;">${ieData.cienciasNaturales?.toFixed(1)}</strong></div>
      <div><span style="color:#6E6E73;">Soc</span> <strong style="color:#1D1D1F;">${ieData.socialesCiudadanas?.toFixed(1)}</strong></div>
      <div><span style="color:#6E6E73;">Ing</span> <strong style="color:#1D1D1F;">${ieData.ingles?.toFixed(1)}</strong></div>
    </div>`;
  }

  return `<div style="padding:16px;font-family:system-ui,-apple-system,sans-serif;background:#FFFFFF;color:#1D1D1F;border-radius:16px;min-width:240px;max-width:320px;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
    <h3 style="font-weight:700;font-size:13px;margin:0 0 8px 0;line-height:1.3;">${nombre}</h3>
    <div style="margin-bottom:10px;">${sectorBadge}${clasifBadge}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
      <div>
        <span style="color:#6E6E73;font-size:10px;">Matrícula</span><br/>
        <span style="font-weight:600;color:#007AFF;font-size:15px;">${mat.toLocaleString("es-CO")}</span>
      </div>
      ${ieData?.promedioGlobal ? `<div>
        <span style="color:#6E6E73;font-size:10px;">Saber 11</span><br/>
        <span style="font-weight:700;color:#1D1D1F;font-size:15px;">${ieData.promedioGlobal.toFixed(1)}</span>
      </div>` : ""}
      ${ieData?.isce ? `<div>
        <span style="color:#6E6E73;font-size:10px;">ISCE</span><br/>
        <span style="font-weight:600;color:#1D1D1F;font-size:15px;">${ieData.isce.toFixed(2)}</span>
      </div>` : ""}
      ${ieData?.evaluados ? `<div>
        <span style="color:#6E6E73;font-size:10px;">Evaluados</span><br/>
        <span style="color:#1D1D1F;">${ieData.evaluados.toLocaleString("es-CO")}</span>
      </div>` : ""}
    </div>
    ${subjectsHtml}
    ${props.zona ? `<div style="margin-top:8px;font-size:10px;color:#6E6E73;">${props.zona}${props.barrio_vereda ? ` · ${props.barrio_vereda}` : ""}</div>` : ""}
    <a href="/instituciones/${dane}" style="display:inline-block;margin-top:10px;font-size:11px;color:#007AFF;text-decoration:none;font-weight:500;">Ver perfil completo →</a>
  </div>`;
}

/* ========== MAIN COMPONENT ========== */

export function MapContainer() {
  const [selectedVariable, setSelectedVariable] = useState("tasa_desercion");
  const [showInstitutions, setShowInstitutions] = useState(true);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ comunas: 0, ies: 0, iesVisible: 0 });

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const choroplethRef = useRef<L.GeoJSON | null>(null);
  const institutionRef = useRef<L.GeoJSON | null>(null);
  const enrichedRef = useRef<MapEnrichedData | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  const currentVarConfig =
    MAP_VARIABLES.find((v) => v.key === selectedVariable) || MAP_VARIABLES[0];

  /* ---- Update choropleth colors ---- */
  const updateChoropleth = useCallback(
    (varKey: string) => {
      if (!choroplethRef.current || !enrichedRef.current) return;
      const config =
        MAP_VARIABLES.find((v) => v.key === varKey) || MAP_VARIABLES[0];

      choroplethRef.current.eachLayer((layer: L.Layer) => {
        const geoLayer = layer as L.Path & { feature?: GeoJSON.Feature };
        const comunaCode = geoLayer.feature?.properties?.COMUNA;
        if (!comunaCode) return;

        const data =
          enrichedRef.current?.comunas[comunaCode] ||
          enrichedRef.current?.comunas[String(parseInt(comunaCode, 10))];
        const value =
          (data?.[varKey as keyof ComunaMetrics] as number) ?? 0;

        geoLayer.setStyle({ fillColor: config.getColor(value) });
      });
    },
    []
  );

  /* ---- Update institution filter ---- */
  const updateInstitutions = useCallback(
    (show: boolean, sector: string) => {
      if (!institutionRef.current || !mapRef.current) return;

      if (!show) {
        if (mapRef.current.hasLayer(institutionRef.current)) {
          institutionRef.current.remove();
        }
        setStats((s) => ({ ...s, iesVisible: 0 }));
        return;
      }

      if (!mapRef.current.hasLayer(institutionRef.current)) {
        institutionRef.current.addTo(mapRef.current);
      }

      let visible = 0;
      institutionRef.current.eachLayer((layer: L.Layer) => {
        const marker = layer as L.CircleMarker & { feature?: GeoJSON.Feature };
        const props = marker.feature?.properties;
        if (!props) return;

        const sectorMatch = sector === "all" || props.cte_id_sector === sector;

        if (sectorMatch) {
          const mat = Number(props.total_matricula || 100);
          const radius = Math.max(3, Math.min(14, Math.sqrt(mat) * 0.3));
          marker.setStyle({ radius, fillOpacity: 0.75, opacity: 0.4 });
          marker.setRadius(radius);
          visible++;
        } else {
          marker.setStyle({ fillOpacity: 0, opacity: 0 });
          marker.setRadius(0);
        }
      });

      setStats((s) => ({ ...s, iesVisible: visible }));
    },
    []
  );

  /* ---- Search for IE ---- */
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !institutionRef.current || !mapRef.current) return;
    const q = searchQuery.toLowerCase();

    let found = false;
    institutionRef.current.eachLayer((layer: L.Layer) => {
      if (found) return;
      const marker = layer as L.CircleMarker & { feature?: GeoJSON.Feature };
      const props = marker.feature?.properties;
      if (!props) return;

      const name = String(props.nombre_establecimiento || "").toLowerCase();
      const dane = String(props.codigo_dane || "");
      if (name.includes(q) || dane.includes(q)) {
        const latlng = marker.getLatLng();
        mapRef.current!.setView(latlng, 16, { animate: true });
        marker.openPopup();
        found = true;
      }
    });
  }, [searchQuery]);

  /* ---- Initialize map ---- */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [6.2476, -75.5636],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;

    // Light basemap (Apple-compatible)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control
      .attribution({ position: "bottomleft" })
      .addAttribution("&copy; OSM &copy; CARTO")
      .addTo(map);

    // Close panel on map click (mobile)
    map.on("click", () => {
      if (window.innerWidth < 1024) setPanelOpen(false);
    });

    // Load all data in parallel
    Promise.all([
      fetch("/geojson/comunas_medellin.geojson").then((r) =>
        r.ok ? r.json() : Promise.reject("Error cargando comunas")
      ),
      fetch("/geojson/instituciones_educativas.geojson").then((r) =>
        r.ok ? r.json() : Promise.reject("Error cargando instituciones")
      ),
      fetch("/data/mapa_enriquecido.json").then((r) =>
        r.ok ? (r.json() as Promise<MapEnrichedData>) : Promise.reject("Error cargando datos")
      ),
    ])
      .then(([comunasGeo, iesGeo, enriched]) => {
        enrichedRef.current = enriched;

        const iesCount = iesGeo?.features?.length || 0;
        setStats({
          comunas: comunasGeo.features?.length || 0,
          ies: iesCount,
          iesVisible: iesCount,
        });

        // --- Choropleth layer ---
        const choropleth = L.geoJSON(comunasGeo, {
          style: (feature) => {
            const code = feature?.properties?.COMUNA;
            const data =
              enriched.comunas[code] ||
              enriched.comunas[String(parseInt(code, 10))];
            const value = (data?.tasa_desercion as number) ?? 0;

            return {
              fillColor: MAP_VARIABLES[0].getColor(value),
              fillOpacity: 0.45,
              color: "#007AFF",
              weight: 1,
              opacity: 0.3,
            };
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties || {};
            const code = p.COMUNA || "";
            const nombre = p.NOMBRE || "Comuna";
            const data =
              enriched.comunas[code] ||
              enriched.comunas[String(parseInt(code, 10))] ||
              {};

            layer.bindPopup(buildComunaPopup(nombre, code, data), {
              className: "sie-popup",
              closeButton: true,
              maxWidth: 340,
            });

            layer.on("mouseover", function () {
              (layer as L.Path).setStyle({
                fillOpacity: 0.7,
                weight: 2,
                opacity: 0.8,
              });
            });
            layer.on("mouseout", function () {
              (layer as L.Path).setStyle({
                fillOpacity: 0.45,
                weight: 1,
                opacity: 0.3,
              });
            });
          },
        }).addTo(map);

        choroplethRef.current = choropleth;

        // fitBounds to choropleth extent
        map.fitBounds(choropleth.getBounds(), { padding: [20, 20] });

        // --- Institution layer ---
        if (iesGeo) {
          const instLayer = L.geoJSON(iesGeo, {
            pointToLayer: (feature, latlng) => {
              const p = feature.properties || {};
              const mat = Number(p.total_matricula || 100);
              const isOficial = p.cte_id_sector === "OFICIAL";
              const radius = Math.max(3, Math.min(14, Math.sqrt(mat) * 0.3));

              return L.circleMarker(latlng, {
                radius,
                fillColor: isOficial ? "#007AFF" : "#FF9500",
                fillOpacity: 0.75,
                color: "#ffffff",
                weight: 0.5,
                opacity: 0.4,
              });
            },
            onEachFeature: (feature, layer) => {
              const p = feature.properties || {};
              const dane = p.codigo_dane || "";
              const ieData = enriched.instituciones[dane];

              layer.bindPopup(buildIEPopup(p, ieData), {
                className: "sie-popup",
                closeButton: true,
                maxWidth: 340,
              });
            },
          }).addTo(map);

          institutionRef.current = instLayer;
        }

        setLoaded(true);
      })
      .catch((err) => {
        console.error("Error loading map data:", err);
        setError(String(err));
      });

    // ResizeObserver instead of setTimeout
    if (mapContainer.current) {
      resizeObserver.current = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.current.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.current?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /* ---- React to variable change ---- */
  useEffect(() => {
    updateChoropleth(selectedVariable);
  }, [selectedVariable, updateChoropleth]);

  /* ---- React to institution filter change ---- */
  useEffect(() => {
    updateInstitutions(showInstitutions, sectorFilter);
  }, [showInstitutions, sectorFilter, updateInstitutions]);

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface">
        <div className="text-center apple-card p-8 max-w-sm">
          <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-foreground mb-2">Error cargando el mapa</h3>
          <p className="text-[13px] text-muted mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[13px] font-medium hover:bg-accent/90 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* ---- Mobile toggle ---- */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute top-3 left-3 z-[1001] flex items-center justify-center w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md shadow-sm border border-border/50 text-muted hover:text-foreground transition-colors lg:hidden"
        aria-label={panelOpen ? "Cerrar panel" : "Abrir panel"}
      >
        {panelOpen ? <X className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
      </button>

      {/* ---- Control Panel ---- */}
      <div
        className={`absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xl shadow-lg border border-border/30 rounded-2xl w-[280px] transition-all duration-300 overflow-hidden ${
          panelOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-full pointer-events-none lg:opacity-100 lg:translate-x-0 lg:pointer-events-auto"
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <h2 className="text-[14px] font-semibold text-foreground tracking-tight">
              Mapa Inteligente
            </h2>
          </div>
          <p className="text-[11px] text-muted mt-1">
            {loaded
              ? `${stats.ies} sedes · ${stats.comunas} comunas`
              : "Cargando..."}
          </p>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-border/30">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar IE por nombre..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-surface rounded-lg text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent/30"
              aria-label="Buscar institución en el mapa"
            />
          </div>
        </div>

        {/* Variable selector */}
        <div className="px-4 py-3 border-b border-border/30">
          <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2">
            Variable
          </p>
          <div className="grid grid-cols-2 gap-1">
            {MAP_VARIABLES.map((v) => (
              <button
                key={v.key}
                onClick={() => setSelectedVariable(v.key)}
                aria-label={`Mostrar ${v.label}`}
                aria-current={selectedVariable === v.key ? "true" : undefined}
                className={`px-2 py-1.5 text-[11px] rounded-lg transition-colors text-left ${
                  selectedVariable === v.key
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted/70 mt-2 leading-relaxed">
            {currentVarConfig.desc}
          </p>
        </div>

        {/* Institution controls */}
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-muted" />
              <p className="text-[10px] font-medium text-muted uppercase tracking-wider">
                Instituciones
              </p>
            </div>
            <button
              onClick={() => setShowInstitutions(!showInstitutions)}
              className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
              aria-label={showInstitutions ? "Ocultar instituciones" : "Mostrar instituciones"}
            >
              {showInstitutions ? (
                <><Eye className="w-3 h-3" /><span>Visible</span></>
              ) : (
                <><EyeOff className="w-3 h-3" /><span>Oculto</span></>
              )}
            </button>
          </div>

          {showInstitutions && (
            <>
              <div className="flex gap-1">
                {[
                  { value: "all", label: "Todos" },
                  { value: "OFICIAL", label: "Oficial" },
                  { value: "NO OFICIAL", label: "Privado" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSectorFilter(opt.value)}
                    aria-label={`Filtrar por ${opt.label}`}
                    className={`flex-1 px-2 py-1.5 text-[10px] rounded-lg transition-colors ${
                      sectorFilter === opt.value
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-muted hover:text-foreground hover:bg-surface"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {sectorFilter !== "all" && (
                <p className="text-[10px] text-accent mt-1.5">
                  {stats.iesVisible.toLocaleString("es-CO")} sedes visibles
                </p>
              )}
            </>
          )}
        </div>

        {/* Point legend */}
        {showInstitutions && (
          <div className="px-4 py-2.5">
            <div className="flex gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span className="text-muted">Oficial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                <span className="text-muted">No Oficial</span>
              </div>
              <div className="flex items-center gap-1 text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="w-3 h-3 rounded-full bg-current opacity-30" />
                <span className="text-[9px]">= matrícula</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- Dynamic Legend ---- */}
      {loaded && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-xl shadow-lg border border-border/30 rounded-2xl p-3">
          <p className="text-[11px] font-semibold text-foreground mb-2">
            {currentVarConfig.label}{" "}
            {currentVarConfig.unit && `(${currentVarConfig.unit})`}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted">{currentVarConfig.min}</span>
            <div
              className="h-2.5 rounded-full flex-1"
              style={{ width: 120, background: currentVarConfig.gradient }}
            />
            <span className="text-[9px] text-muted">{currentVarConfig.max}</span>
          </div>
          <div className="flex justify-between mt-1 text-[8px] text-muted" style={{ paddingLeft: 12, paddingRight: 8 }}>
            {currentVarConfig.legendLabels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
