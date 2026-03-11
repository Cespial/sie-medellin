import { MatriculaChart } from "@/components/charts/MatriculaChart";
import { TrendChart } from "@/components/charts/TrendChart";

export const metadata = { title: "Matrícula — SIE Medellín" };

export default function MatriculaPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs mb-3">
          Matrícula Educativa
        </div>
        <h1 className="font-[var(--font-syne)] text-3xl font-bold text-foreground">
          Matrícula
        </h1>
        <p className="text-muted mt-2 max-w-2xl">
          Evolución de la matrícula educativa en Medellín por sector, nivel
          educativo y comuna. Datos MEData 2004-2023.
        </p>
      </div>

      <div className="mb-6">
        <MatriculaChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

      <MatriculaNivelSection />
    </div>
  );
}

function MatriculaNivelSection() {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6">
      <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-3">
        Fuentes de Datos de Matrícula
      </h3>
      <div className="space-y-3">
        {[
          {
            fuente: "MEData — Matrícula por IE",
            desc: "265.000+ registros por institución, grado y año (2004-2023)",
            status: "cargado",
          },
          {
            fuente: "datos.gov.co — Sedes Educativas",
            desc: "744 sedes con geolocalización, sector y zona",
            status: "cargado",
          },
          {
            fuente: "MEN — Estadísticas Sectoriales",
            desc: "Cobertura bruta y neta departamental por nivel",
            status: "cargado",
          },
          {
            fuente: "MEData — Matrícula Poblaciones Especiales",
            desc: "Extranjeros, etnias, víctimas, discapacidad",
            status: "pendiente",
          },
        ].map((s) => (
          <div
            key={s.fuente}
            className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
          >
            <span
              className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                s.status === "cargado" ? "bg-success" : "bg-muted"
              }`}
            />
            <div>
              <p className="text-xs font-medium text-foreground">{s.fuente}</p>
              <p className="text-[11px] text-muted">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
