import { TrendChart } from "@/components/charts/TrendChart";

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
        <p className="text-muted mt-2 max-w-2xl">
          Indicadores de eficiencia del sistema educativo y su relación con el
          contexto socioeconómico de Antioquia. Datos del Ministerio de
          Educación Nacional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TrendChart
          title="Tamaño Promedio de Grupo"
          dataKey="tamano_promedio_grupo"
          color="#3E92CC"
          unit=" est."
        />
        <TrendChart
          title="Reprobación por Nivel — Primaria"
          dataKey="reprobacion_primaria"
          color="#FFB703"
          unit="%"
        />
        <TrendChart
          title="Reprobación — Secundaria"
          dataKey="reprobacion_secundaria"
          color="#EF233C"
          unit="%"
        />
        <TrendChart
          title="Repitencia — Media"
          dataKey="repitencia_media"
          color="#FF6B6B"
          unit="%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface/50 p-6">
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-3">
            Fuentes de Datos de Contexto
          </h3>
          <div className="space-y-3">
            {[
              {
                fuente: "DANE — Censo 2018",
                desc: "Población por edad, vivienda, servicios, educación alcanzada",
                status: "pendiente",
              },
              {
                fuente: "ECV Medellín",
                desc: "Encuesta de Calidad de Vida — asistencia escolar, gasto educativo",
                status: "pendiente",
              },
              {
                fuente: "Obs. Seguridad",
                desc: "Tasas de homicidio por comunas — correlación con deserción",
                status: "pendiente",
              },
              {
                fuente: "SISBEN",
                desc: "Puntaje SISBEN por barrio — focalización beneficiarios",
                status: "pendiente",
              },
              {
                fuente: "MEN — Estadísticas",
                desc: "Cobertura, deserción, aprobación departamental",
                status: "cargado",
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
                  <p className="text-xs font-medium text-foreground">
                    {s.fuente}
                  </p>
                  <p className="text-[11px] text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface/50 p-6">
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-3">
            Cruces Potenciales
          </h3>
          <p className="text-xs text-muted mb-4">
            Correlaciones entre indicadores educativos y socioeconómicos por
            comunas — requiere datos georeferenciados a nivel de comuna.
          </p>
          <div className="space-y-2">
            {[
              "IPM vs. Puntaje Saber 11",
              "Tasa de Homicidios vs. Deserción",
              "Estrato vs. Categoría del Plantel",
              "Acceso a Internet vs. Rendimiento Post-pandemia",
              "Desempleo vs. Cobertura Secundaria",
              "Hacinamiento vs. Deserción",
            ].map((cruce) => (
              <div
                key={cruce}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 text-xs text-muted"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                {cruce}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
