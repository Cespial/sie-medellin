"use client";

import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () =>
    import("@/components/map/MapContainer").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted text-sm">Cargando mapa...</p>
      </div>
    ),
  }
);

export function MapLoader() {
  return <MapContainer />;
}
