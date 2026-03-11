import { TrendChart } from "@/components/charts/TrendChart";

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
          Tasas de cobertura bruta y neta, matrícula por nivel educativo y series
          históricas del departamento de Antioquia.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          title="Cobertura Neta — Serie Histórica"
          dataKey="cobertura_neta"
          color="#00D4FF"
          unit="%"
        />
        <TrendChart
          title="Cobertura Bruta — Serie Histórica"
          dataKey="cobertura_bruta"
          color="#3E92CC"
          unit="%"
        />
        <TrendChart
          title="Tasa de Deserción"
          dataKey="desercion"
          color="#EF233C"
          unit="%"
        />
        <TrendChart
          title="Tasa de Aprobación"
          dataKey="aprobacion"
          color="#06D6A0"
          unit="%"
        />
        <TrendChart
          title="Deserción Primaria vs. Secundaria"
          dataKey="desercion_primaria"
          color="#FFB703"
          unit="%"
        />
        <TrendChart
          title="Repitencia"
          dataKey="repitencia"
          color="#FF6B6B"
          unit="%"
        />
      </div>
    </div>
  );
}
