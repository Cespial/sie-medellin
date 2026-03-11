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
        <p className="text-muted mt-2">
          Matrícula, tasas de cobertura bruta y neta por nivel educativo, género
          y zona geográfica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Mapa coroplético de cobertura por comunas — datos pendientes del lago
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Serie temporal: matrícula total 2010-2024
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Breakdown por nivel educativo
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Top/bottom comunas por cobertura
          </p>
        </div>
      </div>
    </div>
  );
}
