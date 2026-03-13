import { MapLoader } from "@/components/map/MapLoader";

export const metadata = {
  title: "Mapa — SIE Medellín",
};

export default function MapaPage() {
  return (
    <div className="h-full relative">
      <MapLoader />
    </div>
  );
}
