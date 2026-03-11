import { RankingTable } from "@/components/dashboard/RankingTable";
import { TrendChart } from "@/components/charts/TrendChart";

export const metadata = { title: "Calidad — SIE Medellín" };

export default function CalidadPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-success/20 bg-success/5 text-success text-xs mb-3">
          Calidad Educativa
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Calidad
        </h1>
        <p className="text-muted mt-2 max-w-2xl">
          Resultados Saber 11 por institución educativa, rankings y evolución
          histórica de indicadores de calidad.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <TrendChart
          title="Cobertura Neta por Nivel — Primaria"
          dataKey="cobertura_neta_primaria"
          color="#00D4FF"
          unit="%"
        />
        <TrendChart
          title="Cobertura Neta — Media"
          dataKey="cobertura_neta_media"
          color="#06D6A0"
          unit="%"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RankingTable limit={20} showBottom={false} />
        <RankingTable limit={20} showBottom={true} />
      </div>
    </div>
  );
}
