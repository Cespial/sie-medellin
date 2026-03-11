import { PoblacionesChart } from "@/components/charts/PoblacionesChart";
import { GenderGapChart } from "@/components/charts/GenderGapChart";
import { MedellinTrendChart } from "@/components/charts/MedellinTrendChart";

export const metadata = { title: "Equidad — SIE Medellín" };

export default function EquidadPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-xs mb-3">
          Equidad Educativa
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Equidad
        </h1>
        <p className="text-muted mt-2 max-w-2xl">
          Análisis de brechas y poblaciones especiales en el sistema educativo
          de Medellín. Datos MEData: extranjeros, etnias, víctimas de
          violencia y necesidades educativas especiales.
        </p>
      </div>

      <div className="mb-6">
        <GenderGapChart />
      </div>

      <div className="mb-6">
        <PoblacionesChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MedellinTrendChart
          title="Deserción — Transición"
          dataKey="desercion_transicion"
          color="#FF6B6B"
          unit="%"
        />
        <MedellinTrendChart
          title="Deserción — Media"
          dataKey="desercion_media"
          color="#EF233C"
          unit="%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MedellinTrendChart
          title="Cobertura Bruta — Primaria"
          dataKey="cobertura_bruta_primaria"
          color="#00D4FF"
          unit="%"
        />
        <MedellinTrendChart
          title="Cobertura Bruta — Media"
          dataKey="cobertura_bruta_media"
          color="#3E92CC"
          unit="%"
        />
      </div>
    </div>
  );
}
