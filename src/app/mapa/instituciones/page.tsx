import { IEMapLoader } from "@/components/map/IEMapLoader";

export const metadata = { title: "Mapa de Instituciones — SIE Medellín" };

export default function MapaInstitucionesPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 pb-0">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          Mapa de Instituciones Educativas
        </h1>
        <p className="text-[12px] text-muted mt-0.5">
          452 instituciones por clasificación ICFES. Click en un punto para ver detalles.
        </p>
      </div>
      <div className="flex-1 p-4">
        <IEMapLoader height="calc(100vh - 140px)" />
      </div>
    </div>
  );
}
