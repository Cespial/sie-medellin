"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MEDELLIN_CENTER } from "@/types/geo";

export function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({ comunas: 0, ies: 0 });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: "SIE Dark",
        sources: {
          "carto-dark": {
            type: "raster",
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
            type: "raster",
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

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setLoaded(true);
      const m = map.current!;

      // Load comunas layer
      fetch("/geojson/comunas_medellin.geojson")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setStats((s) => ({ ...s, comunas: data.features?.length || 0 }));

          m.addSource("comunas", { type: "geojson", data });

          m.addLayer({
            id: "comunas-fill",
            type: "fill",
            source: "comunas",
            paint: {
              "fill-color": "#00D4FF",
              "fill-opacity": 0.08,
            },
          });

          m.addLayer({
            id: "comunas-line",
            type: "line",
            source: "comunas",
            paint: {
              "line-color": "#00D4FF",
              "line-width": 1.5,
              "line-opacity": 0.5,
            },
          });

          m.addLayer({
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

          // Highlight on hover
          m.on("mousemove", "comunas-fill", () => {
            m.getCanvas().style.cursor = "pointer";
          });
          m.on("mouseleave", "comunas-fill", () => {
            m.getCanvas().style.cursor = "";
          });
        })
        .catch(() => {});

      // Load institutions layer
      fetch("/geojson/instituciones_educativas.geojson")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setStats((s) => ({ ...s, ies: data.features?.length || 0 }));

          m.addSource("instituciones", { type: "geojson", data });

          // Circles sized by enrollment
          m.addLayer({
            id: "ie-circles",
            type: "circle",
            source: "instituciones",
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["to-number", ["get", "total_matricula"], 100],
                0, 3,
                500, 6,
                2000, 12,
                5000, 18,
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

          // Glow effect
          m.addLayer(
            {
              id: "ie-circles-glow",
              type: "circle",
              source: "instituciones",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["to-number", ["get", "total_matricula"], 100],
                  0, 8,
                  500, 14,
                  2000, 22,
                  5000, 30,
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

          // Popup on click
          m.on("click", "ie-circles", (e) => {
            const props = e.features?.[0]?.properties;
            if (!props) return;

            const coord = e.lngLat;
            new maplibregl.Popup({
              closeButton: true,
              maxWidth: "320px",
            })
              .setLngLat(coord)
              .setHTML(
                `<div style="padding:12px;font-family:Inter,sans-serif;">
                  <h3 style="font-weight:700;font-size:13px;color:#E8F4FD;margin:0 0 8px 0;">
                    ${props.nombre_establecimiento || props.nombre_sede || "IE"}
                  </h3>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
                    <div><span style="color:#6B8CAE;">Matrícula</span><br/>
                      <span style="font-weight:600;color:#00D4FF;font-size:14px;">${Number(props.total_matricula || 0).toLocaleString("es-CO")}</span>
                    </div>
                    <div><span style="color:#6B8CAE;">Sector</span><br/>
                      <span style="font-weight:600;color:${props.cte_id_sector === "OFICIAL" ? "#00D4FF" : "#FFB703"};">${props.cte_id_sector || ""}</span>
                    </div>
                    <div><span style="color:#6B8CAE;">Zona</span><br/>
                      <span style="color:#E8F4FD;">${props.zona || ""}</span>
                    </div>
                    <div><span style="color:#6B8CAE;">Código DANE</span><br/>
                      <span style="color:#E8F4FD;font-family:monospace;font-size:10px;">${props.codigo_dane_sede || ""}</span>
                    </div>
                  </div>
                  <div style="margin-top:8px;font-size:10px;color:#6B8CAE;">
                    ${props.direccion || ""}
                  </div>
                </div>`
              )
              .addTo(m);
          });

          m.on("mousemove", "ie-circles", () => {
            m.getCanvas().style.cursor = "pointer";
          });
          m.on("mouseleave", "ie-circles", () => {
            m.getCanvas().style.cursor = "";
          });
        })
        .catch(() => {});
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

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
            : "Cargando mapa..."}
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
    </div>
  );
}
