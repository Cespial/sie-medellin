import { TrendChart } from "@/components/charts/TrendChart";
import { MedellinTrendChart } from "@/components/charts/MedellinTrendChart";

export const metadata = { title: "Cobertura — SIE Medellín" };

export default function CoberturaPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs mb-3">
          Cobertura Educativa
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Cobertura
        </h1>
        <p className="text-muted mt-2 max-w-2xl">
          Tasas de cobertura bruta y neta para Medellín (2011-2024) y series
          históricas departamentales de Antioquia.
        </p>
      </div>

      <h2 className="font-[var(--font-syne)] text-base font-bold text-foreground mb-3">
        Medellín — Cobertura Municipal
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MedellinTrendChart
          title="Cobertura Neta Total"
          dataKey="cobertura_neta"
          color="#00D4FF"
          unit="%"
        />
        <MedellinTrendChart
          title="Cobertura Bruta Total"
          dataKey="cobertura_bruta"
          color="#3E92CC"
          unit="%"
        />
        <MedellinTrendChart
          title="Cobertura Neta — Primaria"
          dataKey="cobertura_neta_primaria"
          color="#06D6A0"
          unit="%"
        />
        <MedellinTrendChart
          title="Cobertura Neta — Secundaria"
          dataKey="cobertura_neta_secundaria"
          color="#FFB703"
          unit="%"
        />
        <MedellinTrendChart
          title="Cobertura Neta — Media"
          dataKey="cobertura_neta_media"
          color="#EF233C"
          unit="%"
        />
        <MedellinTrendChart
          title="Cobertura Neta — Transición"
          dataKey="cobertura_neta_transicion"
          color="#9B5DE5"
          unit="%"
        />
      </div>

      <h2 className="font-[var(--font-syne)] text-base font-bold text-foreground mb-3">
        Antioquia — Serie Departamental
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          title="Cobertura Neta — Antioquia"
          dataKey="cobertura_neta"
          color="#00D4FF"
          unit="%"
        />
        <TrendChart
          title="Cobertura Bruta — Antioquia"
          dataKey="cobertura_bruta"
          color="#3E92CC"
          unit="%"
        />
      </div>
    </div>
  );
}
