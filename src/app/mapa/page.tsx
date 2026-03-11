import { MapContainer } from "@/components/map/MapContainer";

export const metadata = {
  title: "Mapa — SIE Medellín",
};

export default function MapaPage() {
  return (
    <div className="h-screen relative">
      <MapContainer />
    </div>
  );
}
