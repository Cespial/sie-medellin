export const metadata = { title: "Instituciones — SIE Medellín" };

export default function InstitucionesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-xs mb-3">
          Directorio
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Instituciones Educativas
        </h1>
        <p className="text-muted mt-2">
          Directorio completo de 432+ IEs oficiales de Medellín con indicadores
          por institución.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface/50 p-6">
        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar institución por nombre o código DANE..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
          <select className="px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/50">
            <option value="">Todas las comunas</option>
          </select>
        </div>
        <div className="min-h-[400px] flex items-center justify-center">
          <p className="text-muted text-sm">
            Tabla de instituciones educativas — datos pendientes del lago
          </p>
        </div>
      </div>
    </div>
  );
}
