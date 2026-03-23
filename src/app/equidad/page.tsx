import { PoblacionesChart } from "@/components/charts/PoblacionesChart";
import { GenderGapChart } from "@/components/charts/GenderGapChart";
import { ParidadGeneroChart } from "@/components/charts/ParidadGeneroChart";
import { MedellinTrendChart } from "@/components/charts/MedellinTrendChart";

export const metadata = { title: "Equidad — SIE Medellín" };

export default function EquidadPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-accent" />
          <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-medium">
            Equidad Educativa
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Equidad
        </h1>
        <p className="text-[13px] text-muted mt-1 max-w-2xl tracking-tight">
          Brechas de genero en Saber 11, indice de paridad, y poblaciones
          especiales (extranjeros, etnias, victimas, NEE) en el sistema educativo.
        </p>
      </div>

      <GenderGapChart />
      <ParidadGeneroChart />
      <PoblacionesChart />

      <h2 className="text-[11px] font-semibold text-foreground uppercase tracking-widest pt-2">
        Desercion por Nivel Educativo
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MedellinTrendChart title="Desercion — Transicion" dataKey="desercion_transicion" color="#FF3B30" unit="%" />
        <MedellinTrendChart title="Desercion — Media" dataKey="desercion_media" color="#FF9500" unit="%" />
      </div>

      <h2 className="text-[11px] font-semibold text-foreground uppercase tracking-widest pt-2">
        Cobertura por Nivel
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MedellinTrendChart title="Cobertura Bruta — Primaria" dataKey="cobertura_bruta_primaria" color="#007AFF" unit="%" />
        <MedellinTrendChart title="Cobertura Bruta — Media" dataKey="cobertura_bruta_media" color="#5856D6" unit="%" />
      </div>
    </div>
  );
}
