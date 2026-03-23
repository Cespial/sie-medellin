import { TrendChart } from "@/components/charts/TrendChart";
import { MedellinTrendChart } from "@/components/charts/MedellinTrendChart";
import { MatriculaChart } from "@/components/charts/MatriculaChart";
import { IndiceSIEChart } from "@/components/charts/IndiceSIEChart";

export const metadata = { title: "Cobertura — SIE Medellín" };

export default function CoberturaPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-accent" />
          <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-medium">
            Cobertura Educativa
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Cobertura
        </h1>
        <p className="text-[13px] text-muted mt-1 max-w-2xl tracking-tight">
          Tasas de cobertura bruta y neta para Medellin (2011-2024), matricula
          historica, e indice SIE compuesto por comuna.
        </p>
      </div>

      <IndiceSIEChart />
      <MatriculaChart />

      <h2 className="text-[11px] font-semibold text-foreground uppercase tracking-widest pt-2">
        Medellin — Cobertura Municipal
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MedellinTrendChart title="Cobertura Neta Total" dataKey="cobertura_neta" color="#007AFF" unit="%" />
        <MedellinTrendChart title="Cobertura Bruta Total" dataKey="cobertura_bruta" color="#5856D6" unit="%" />
        <MedellinTrendChart title="Cobertura Neta — Primaria" dataKey="cobertura_neta_primaria" color="#5AC8FA" unit="%" />
        <MedellinTrendChart title="Cobertura Neta — Secundaria" dataKey="cobertura_neta_secundaria" color="#FF9500" unit="%" />
        <MedellinTrendChart title="Cobertura Neta — Media" dataKey="cobertura_neta_media" color="#FF3B30" unit="%" />
        <MedellinTrendChart title="Cobertura Neta — Transicion" dataKey="cobertura_neta_transicion" color="#AF52DE" unit="%" />
      </div>

      <h2 className="text-[11px] font-semibold text-foreground uppercase tracking-widest pt-2">
        Antioquia — Serie Departamental
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart title="Cobertura Neta — Antioquia" dataKey="cobertura_neta" color="#007AFF" unit="%" />
        <TrendChart title="Cobertura Bruta — Antioquia" dataKey="cobertura_bruta" color="#5856D6" unit="%" />
      </div>
    </div>
  );
}
