export const metadata = { title: "Contexto — SIE Medellín" };

export default function ContextoPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-warning/20 bg-warning/5 text-warning text-xs mb-3">
          Contexto Socioeconómico
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Contexto
        </h1>
        <p className="text-muted mt-2">
          Correlaciones entre indicadores educativos e índices de pobreza,
          violencia, desempleo y conectividad por comunas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Scatter: Saber 11 vs. IPM por comunas
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Mapa bivariado: calidad × pobreza
          </p>
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Radar: perfil multidimensional por comunas
          </p>
        </div>
      </div>
    </div>
  );
}
