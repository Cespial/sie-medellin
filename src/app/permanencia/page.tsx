import { TrendChart } from "@/components/charts/TrendChart";

export const metadata = { title: "Permanencia — SIE Medellín" };

export default function PermanenciaPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-danger/20 bg-danger/5 text-danger text-xs mb-3">
          Permanencia Escolar
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Permanencia
        </h1>
        <p className="text-muted mt-2 max-w-2xl">
          Indicadores de deserción, reprobación y retención escolar. Datos de
          MEData (Medellín) y Ministerio de Educación Nacional (Antioquia).
        </p>
      </div>

      {/* Deserción por comuna (client component loaded separately) */}
      <div className="mb-6">
        <DesercionSection />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TrendChart
          title="Tasa de Deserción — Antioquia"
          dataKey="desercion"
          color="#EF233C"
          unit="%"
        />
        <TrendChart
          title="Deserción Primaria — Antioquia"
          dataKey="desercion_primaria"
          color="#FF6B6B"
          unit="%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TrendChart
          title="Reprobación Secundaria"
          dataKey="reprobacion_secundaria"
          color="#FFB703"
          unit="%"
        />
        <TrendChart
          title="Repitencia Media"
          dataKey="repitencia_media"
          color="#FF6B6B"
          unit="%"
        />
      </div>

      {/* Aprobación section */}
      <AprobacionSection />
    </div>
  );
}

// Client component wrappers
import { DesercionComunaChart } from "@/components/charts/DesercionComunaChart";
import { AprobacionChart } from "@/components/charts/AprobacionChart";

function DesercionSection() {
  return <DesercionComunaChart />;
}

function AprobacionSection() {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-1">
        Aprobación Escolar
      </h3>
      <p className="text-xs text-muted mb-4">
        Tasas de aprobación por comuna y género — datos MEData 2017
      </p>
      <AprobacionChart />
    </div>
  );
}
