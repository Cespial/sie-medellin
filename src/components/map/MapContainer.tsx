"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

interface DesercionComuna {
  comuna: string;
  desertores: number;
  matricula: number;
  tasaDesercion: number;
}

interface DesercionData {
  porComuna: DesercionComuna[];
  ultimoAnio: string;
}

function getColor(tasa: number): string {
  if (tasa >= 6) return "#EF233C";
  if (tasa >= 4.5) return "#FF6B6B";
  if (tasa >= 3) return "#FFB703";
  if (tasa >= 1.5) return "#06D6A0";
  return "#06D6A0";
}

export function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ comunas: 0, ies: 0 });

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      const map = L.map(mapContainer.current, {
        center: [6.2476, -75.5636],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      mapRef.current = map;

      // Dark basemap
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Zoom control top-right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Attribution bottom-left
      L.control
        .attribution({ position: "bottomleft" })
        .addAttribution("&copy; OSM &copy; CARTO")
        .addTo(map);

      // Load data
      Promise.all([
        fetch("/geojson/comunas_medellin.geojson").then((r) =>
          r.ok ? r.json() : null
        ),
        fetch("/data/desercion_medellin.json").then((r) =>
          r.ok ? (r.json() as Promise<DesercionData>) : null
        ),
      ])
        .then(([comunasData, desercionData]) => {
          if (!comunasData) return;

          setStats((s) => ({
            ...s,
            comunas: comunasData.features?.length || 0,
          }));

          // Merge deserción
          const desercionMap = new Map<string, DesercionComuna>();
          if (desercionData?.porComuna) {
            for (const d of desercionData.porComuna) {
              desercionMap.set(d.comuna, d);
              desercionMap.set(d.comuna.padStart(2, "0"), d);
            }
            for (const feature of comunasData.features) {
              const code = feature.properties?.COMUNA;
              if (!code) continue;
              const match =
                desercionMap.get(code) ||
                desercionMap.get(String(parseInt(code, 10)));
              if (match) {
                feature.properties.tasaDesercion = match.tasaDesercion;
                feature.properties.desertores = match.desertores;
                feature.properties.matriculaTotal = match.matricula;
              }
            }
          }

          // Choropleth layer
          L.geoJSON(comunasData, {
            style: (feature) => {
              const tasa = feature?.properties?.tasaDesercion ?? 0;
              return {
                fillColor: getColor(tasa),
                fillOpacity: 0.5,
                color: "#00D4FF",
                weight: 1.5,
                opacity: 0.5,
              };
            },
            onEachFeature: (feature, layer) => {
              const p = feature.properties || {};
              const nombre = p.NOMBRE || "Comuna";
              const tasa =
                p.tasaDesercion != null
                  ? Number(p.tasaDesercion).toFixed(2)
                  : "N/D";
              const desertores =
                p.desertores != null
                  ? Number(p.desertores).toLocaleString("es-CO")
                  : "N/D";
              const matricula =
                p.matriculaTotal != null
                  ? Number(p.matriculaTotal).toLocaleString("es-CO")
                  : "N/D";

              layer.bindPopup(
                `<div style="padding:12px;font-family:Inter,sans-serif;background:#0D1B2A;color:#E8F4FD;border-radius:12px;min-width:200px;">
                  <h3 style="font-weight:700;font-size:13px;margin:0 0 8px 0;">${nombre}</h3>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
                    <div><span style="color:#6B8CAE;">Tasa Deserción</span><br/>
                      <span style="font-weight:700;color:#EF233C;font-size:16px;">${tasa}%</span></div>
                    <div><span style="color:#6B8CAE;">Desertores</span><br/>
                      <span style="font-weight:600;color:#FFB703;font-size:14px;">${desertores}</span></div>
                    <div style="grid-column:span 2;"><span style="color:#6B8CAE;">Matrícula Total</span><br/>
                      <span style="font-weight:600;color:#00D4FF;font-size:14px;">${matricula}</span></div>
                  </div>
                </div>`,
                {
                  className: "sie-popup",
                  closeButton: true,
                  maxWidth: 300,
                }
              );

              layer.on("mouseover", function () {
                (layer as L.Path).setStyle({
                  fillOpacity: 0.75,
                  weight: 2.5,
                  opacity: 0.9,
                });
              });
              layer.on("mouseout", function () {
                (layer as L.Path).setStyle({
                  fillOpacity: 0.5,
                  weight: 1.5,
                  opacity: 0.5,
                });
              });
            },
          }).addTo(map);

          setLoaded(true);
        })
        .catch((err) => {
          console.error("Error loading comunas:", err);
        });

      // Load institutions
      fetch("/geojson/instituciones_educativas.geojson")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setStats((s) => ({ ...s, ies: data.features?.length || 0 }));

          L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
              const p = feature.properties || {};
              const mat = Number(p.total_matricula || 100);
              const isOficial = p.cte_id_sector === "OFICIAL";
              const radius = Math.max(3, Math.min(14, Math.sqrt(mat) * 0.3));

              return L.circleMarker(latlng, {
                radius,
                fillColor: isOficial ? "#00D4FF" : "#FFB703",
                fillOpacity: 0.7,
                color: "#ffffff",
                weight: 0.5,
                opacity: 0.3,
              });
            },
            onEachFeature: (feature, layer) => {
              const p = feature.properties || {};
              const isOficial = p.cte_id_sector === "OFICIAL";

              layer.bindPopup(
                `<div style="padding:12px;font-family:Inter,sans-serif;background:#0D1B2A;color:#E8F4FD;border-radius:12px;min-width:220px;">
                  <h3 style="font-weight:700;font-size:13px;margin:0 0 8px 0;">
                    ${p.nombre_establecimiento || p.nombre_sede || "IE"}
                  </h3>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
                    <div><span style="color:#6B8CAE;">Matrícula</span><br/>
                      <span style="font-weight:600;color:#00D4FF;font-size:14px;">${Number(p.total_matricula || 0).toLocaleString("es-CO")}</span></div>
                    <div><span style="color:#6B8CAE;">Sector</span><br/>
                      <span style="font-weight:600;color:${isOficial ? "#00D4FF" : "#FFB703"};">${p.cte_id_sector || ""}</span></div>
                    <div><span style="color:#6B8CAE;">Zona</span><br/>
                      <span style="color:#E8F4FD;">${p.zona || ""}</span></div>
                    <div><span style="color:#6B8CAE;">DANE</span><br/>
                      <span style="color:#E8F4FD;font-family:monospace;font-size:10px;">${p.codigo_dane_sede || ""}</span></div>
                  </div>
                  ${p.direccion ? `<div style="margin-top:8px;font-size:10px;color:#6B8CAE;">${p.direccion}</div>` : ""}
                </div>`,
                {
                  className: "sie-popup",
                  closeButton: true,
                  maxWidth: 320,
                }
              );
            },
          }).addTo(map);
        })
        .catch((err) => {
          console.error("Error loading instituciones:", err);
        });

      // Force resize after mount
      setTimeout(() => map.invalidateSize(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <p className="text-danger font-semibold mb-2">
            Error cargando el mapa
          </p>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Control panel */}
      <div className="absolute top-4 left-4 z-[1000] bg-surface/90 backdrop-blur-md border border-border rounded-xl p-4 max-w-xs">
        <h2 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-1">
          Mapa Educativo
        </h2>
        <p className="text-xs text-muted mb-3">
          {loaded
            ? `${stats.ies} instituciones en ${stats.comunas} comunas`
            : "Inicializando mapa..."}
        </p>

        {loaded && (
          <div className="flex gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-muted">Oficial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warning" />
              <span className="text-muted">No Oficial</span>
            </div>
          </div>
        )}
      </div>

      {/* Choropleth legend */}
      {loaded && (
        <div className="absolute bottom-6 right-6 z-[1000] bg-surface/90 backdrop-blur-md border border-border rounded-xl p-3">
          <p className="text-[10px] font-semibold text-foreground mb-2">
            Tasa de Deserción (%)
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted">0</span>
            <div
              className="h-2.5 rounded-sm flex-1"
              style={{
                width: 120,
                background:
                  "linear-gradient(to right, #06D6A0, #FFB703, #EF233C)",
              }}
            />
            <span className="text-[9px] text-muted">6+</span>
          </div>
          <div
            className="flex justify-between mt-1 text-[8px] text-muted"
            style={{ paddingLeft: 12, paddingRight: 8 }}
          >
            <span>Baja</span>
            <span>Media</span>
            <span>Alta</span>
          </div>
        </div>
      )}
    </div>
  );
}
