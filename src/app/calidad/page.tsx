import { RankingTable } from "@/components/dashboard/RankingTable";
import { ISCEChart } from "@/components/charts/ISCEChart";
import { Saber11HistoricoChart } from "@/components/charts/Saber11HistoricoChart";
import { BachilleresChart } from "@/components/charts/BachilleresChart";
import { OutliersChart } from "@/components/charts/OutliersChart";
import { Saber359Chart } from "@/components/charts/Saber359Chart";

export const metadata = { title: "Calidad — SIE Medellín" };

export default function CalidadPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-accent" />
          <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-medium">
            Calidad Educativa
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Calidad
        </h1>
        <p className="text-[13px] text-muted mt-1 max-w-2xl tracking-tight">
          Resultados Saber 11 por IE, ISCE, Saber 3/5/9, bachilleres graduados,
          e instituciones que sobre/sub-rinden vs. su contexto.
        </p>
      </div>

      <Saber11HistoricoChart />
      <Saber359Chart />
      <OutliersChart />
      <ISCEChart />
      <BachilleresChart />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RankingTable limit={20} showBottom={false} />
        <RankingTable limit={20} showBottom={true} />
      </div>
    </div>
  );
}
