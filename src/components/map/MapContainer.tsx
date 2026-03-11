"use client";

import { useEffect, useRef, useState } from "react";
import { MEDELLIN_CENTER } from "@/types/geo";

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

export function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ comunas: 0, ies: 0 });

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const mlModule = await import("maplibre-gl");
        const maplibregl = mlModule.default;

        // Use pre-built CSP worker to avoid webpack worker bundling failures
        if (mlModule.setWorkerUrl) {
          mlModule.setWorkerUrl("/maplibre-gl-csp-worker.js");
        }

        if (cancelled || !mapContainer.current) return;

        const map = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8 as const,
            name: "SIE Dark",
            sources: {
              "carto-dark": {
                type: "raster" as const,
                tiles: [
                  "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                  "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                ],
                tileSize: 256,
                attribution: "&copy; OSM &copy; CARTO",
              },
            },
            layers: [
              {
                id: "carto-dark-layer",
                type: "raster" as const,
                source: "carto-dark",
              },
            ],
          },
          center: [MEDELLIN_CENTER.longitude, MEDELLIN_CENTER.latitude],
          zoom: MEDELLIN_CENTER.zoom,
          pitch: MEDELLIN_CENTER.pitch,
          bearing: MEDELLIN_CENTER.bearing,
          maxBounds: [
            [-75.75, 6.1],
            [-75.4, 6.45],
          ],
        });

        mapRef.current = map;

        map.addControl(new maplibregl.NavigationControl(), "top-right");

        map.on("load", () => {
          if (cancelled) return;
          setLoaded(true);

          // Load comunas + deserción
          Promise.all([
            fetch("/geojson/comunas_medellin.geojson").then((r) =>
              r.ok ? r.json() : null
            ),
            fetch("/data/desercion_medellin.json").then((r) =>
              r.ok ? (r.json() as Promise<DesercionData>) : null
            ),
          ])
            .then(([comunasData, desercionData]) => {
              if (!comunasData || cancelled) return;
              setStats((s) => ({
                ...s,
                comunas: comunasData.features?.length || 0,
              }));

              if (desercionData?.porComuna) {
                const desercionMap = new Map<string, DesercionComuna>();
                for (const d of desercionData.porComuna) {
                  desercionMap.set(d.comuna, d);
                  desercionMap.set(d.comuna.padStart(2, "0"), d);
                }
                for (const feature of comunasData.features) {
                  const comunaCode = feature.properties?.COMUNA;
                  if (!comunaCode) continue;
                  const match =
                    desercionMap.get(comunaCode) ||
                    desercionMap.get(String(parseInt(comunaCode, 10)));
                  if (match) {
                    feature.properties.tasaDesercion = match.tasaDesercion;
                    feature.properties.desertores = match.desertores;
                    feature.properties.matriculaTotal = match.matricula;
                  }
                }
              }

              map.addSource("comunas", { type: "geojson", data: comunasData });

              map.addLayer({
                id: "comunas-fill",
                type: "fill",
                source: "comunas",
                paint: {
                  "fill-color": [
                    "interpolate",
                    ["linear"],
                    ["get", "tasaDesercion"],
                    0,
                    "#06D6A0",
                    3,
                    "#FFB703",
                    6,
                    "#EF233C",
                  ],
                  "fill-opacity": 0.55,
                },
              });

              map.addLayer({
                id: "comunas-line",
                type: "line",
                source: "comunas",
                paint: {
                  "line-color": "#00D4FF",
                  "line-width": 1.5,
                  "line-opacity": 0.5,
                },
              });

              map.addLayer({
                id: "comunas-line-glow",
                type: "line",
                source: "comunas",
                paint: {
                  "line-color": "#00D4FF",
                  "line-width": 4,
                  "line-opacity": 0.1,
                  "line-blur": 3,
                },
              });

              map.on("click", "comunas-fill", (e) => {
                const props = e.features?.[0]?.properties;
                if (!props) return;
                const nombre = props.NOMBRE || "Comuna";
                const tasa =
                  props.tasaDesercion != null
                    ? Number(props.tasaDesercion).toFixed(2)
                    : "N/D";
                const desertores =
                  props.desertores != null
                    ? Number(props.desertores).toLocaleString("es-CO")
                    : "N/D";
                const matricula =
                  props.matriculaTotal != null
                    ? Number(props.matriculaTotal).toLocaleString("es-CO")
                    : "N/D";

                new maplibregl.Popup({ closeButton: true, maxWidth: "300px" })
                  .setLngLat(e.lngLat)
                  .setHTML(
                    `<div style="padding:12px;font-family:Inter,sans-serif;">
                      <h3 style="font-weight:700;font-size:13px;color:#E8F4FD;margin:0 0 8px 0;">${nombre}</h3>
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
                        <div><span style="color:#6B8CAE;">Tasa Deserción</span><br/>
                          <span style="font-weight:700;color:#EF233C;font-size:16px;">${tasa}%</span></div>
                        <div><span style="color:#6B8CAE;">Desertores</span><br/>
                          <span style="font-weight:600;color:#FFB703;font-size:14px;">${desertores}</span></div>
                        <div style="grid-column:span 2;"><span style="color:#6B8CAE;">Matrícula Total</span><br/>
                          <span style="font-weight:600;color:#00D4FF;font-size:14px;">${matricula}</span></div>
                      </div>
                    </div>`
                  )
                  .addTo(map);
              });

              map.on("mousemove", "comunas-fill", () => {
                map.getCanvas().style.cursor = "pointer";
              });
              map.on("mouseleave", "comunas-fill", () => {
                map.getCanvas().style.cursor = "";
              });
            })
            .catch(() => {});

          // Load institutions
          fetch("/geojson/instituciones_educativas.geojson")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (!data || cancelled) return;
              setStats((s) => ({ ...s, ies: data.features?.length || 0 }));

              map.addSource("instituciones", { type: "geojson", data });

              map.addLayer({
                id: "ie-circles",
                type: "circle",
                source: "instituciones",
                paint: {
                  "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["to-number", ["get", "total_matricula"], 100],
                    0, 3, 500, 6, 2000, 12, 5000, 18,
                  ],
                  "circle-color": [
                    "case",
                    ["==", ["get", "cte_id_sector"], "OFICIAL"],
                    "#00D4FF",
                    "#FFB703",
                  ],
                  "circle-opacity": 0.7,
                  "circle-stroke-color": "#ffffff",
                  "circle-stroke-width": 0.5,
                  "circle-stroke-opacity": 0.3,
                },
              });

              map.addLayer(
                {
                  id: "ie-circles-glow",
                  type: "circle",
                  source: "instituciones",
                  paint: {
                    "circle-radius": [
                      "interpolate",
                      ["linear"],
                      ["to-number", ["get", "total_matricula"], 100],
                      0, 8, 500, 14, 2000, 22, 5000, 30,
                    ],
                    "circle-color": [
                      "case",
                      ["==", ["get", "cte_id_sector"], "OFICIAL"],
                      "#00D4FF",
                      "#FFB703",
                    ],
                    "circle-opacity": 0.1,
                    "circle-blur": 1,
                  },
                },
                "ie-circles"
              );

              map.on("click", "ie-circles", (e) => {
                const props = e.features?.[0]?.properties;
                if (!props) return;
                new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
                  .setLngLat(e.lngLat)
                  .setHTML(
                    `<div style="padding:12px;font-family:Inter,sans-serif;">
                      <h3 style="font-weight:700;font-size:13px;color:#E8F4FD;margin:0 0 8px 0;">
                        ${props.nombre_establecimiento || props.nombre_sede || "IE"}
                      </h3>
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
                        <div><span style="color:#6B8CAE;">Matrícula</span><br/>
                          <span style="font-weight:600;color:#00D4FF;font-size:14px;">${Number(props.total_matricula || 0).toLocaleString("es-CO")}</span></div>
                        <div><span style="color:#6B8CAE;">Sector</span><br/>
                          <span style="font-weight:600;color:${props.cte_id_sector === "OFICIAL" ? "#00D4FF" : "#FFB703"};">${props.cte_id_sector || ""}</span></div>
                        <div><span style="color:#6B8CAE;">Zona</span><br/>
                          <span style="color:#E8F4FD;">${props.zona || ""}</span></div>
                        <div><span style="color:#6B8CAE;">Código DANE</span><br/>
                          <span style="color:#E8F4FD;font-family:monospace;font-size:10px;">${props.codigo_dane_sede || ""}</span></div>
                      </div>
                      <div style="margin-top:8px;font-size:10px;color:#6B8CAE;">${props.direccion || ""}</div>
                    </div>`
                  )
                  .addTo(map);
              });

              map.on("mousemove", "ie-circles", () => {
                map.getCanvas().style.cursor = "pointer";
              });
              map.on("mouseleave", "ie-circles", () => {
                map.getCanvas().style.cursor = "";
              });
            })
            .catch(() => {});
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current && typeof (mapRef.current as { remove: () => void }).remove === "function") {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <p className="text-danger font-semibold mb-2">Error cargando el mapa</p>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Control panel */}
      <div className="absolute top-4 left-4 z-10 bg-surface/90 backdrop-blur-md border border-border rounded-xl p-4 max-w-xs">
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
        <div className="absolute bottom-6 right-6 z-10 bg-surface/90 backdrop-blur-md border border-border rounded-xl p-3">
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
