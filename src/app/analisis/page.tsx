import { CrucesPanel } from "@/components/charts/CrucesPanel";

export const metadata = { title: "Análisis — SIE Medellín" };

export default function AnalisisPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs mb-3">
          Análisis Multivariable
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Análisis
        </h1>
        <p className="text-muted mt-2 max-w-2xl">
          Cruces entre variables socioeconómicas y resultados educativos.
          275K+ microdatos Saber 11 cruzados con estrato, acceso a internet,
          educación de la madre, sector y tipo de colegio.
        </p>
      </div>

      <CrucesPanel />
    </div>
  );
}
