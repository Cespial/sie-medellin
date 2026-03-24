"use client";

import dynamic from "next/dynamic";

const IEMapView = dynamic(
  () => import("@/components/map/IEMapView").then((mod) => mod.IEMapView),
  {
    ssr: false,
    loading: () => (
      <div className="apple-card flex items-center justify-center" style={{ height: "500px" }}>
        <p className="text-muted text-sm">Cargando mapa de instituciones...</p>
      </div>
    ),
  }
);

export function IEMapLoader({ highlightCode, height }: { highlightCode?: string; height?: string }) {
  return <IEMapView highlightCode={highlightCode} height={height} />;
}
