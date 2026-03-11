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
        <p className="text-muted mt-2">
          Resultados Saber 11, ISCE, clasificación de planteles y evolución
          histórica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Mapa: burbujas de puntaje Saber 11 por IE
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Distribución de puntajes — histograma
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Ranking: Top/Bottom 20 IEs por puntaje
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Evolución: serie temporal ISCE promedio
          </p>
        </div>
      </div>
    </div>
  );
}
