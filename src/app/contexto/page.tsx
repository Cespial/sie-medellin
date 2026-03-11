import { MedellinTrendChart } from "@/components/charts/MedellinTrendChart";
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
          contexto socioeconómico. Datos de Medellín ETC (2011-2024) y
          Antioquia.
        </p>
      </div>

      <h2 className="font-[var(--font-syne)] text-base font-bold text-foreground mb-3">
        Medellín — Eficiencia y Reprobación
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MedellinTrendChart
          title="Tasa de Reprobación"
          dataKey="reprobacion"
          color="#EF233C"
          unit="%"
        />
        <MedellinTrendChart
          title="Reprobación Secundaria"
          dataKey="reprobacion_secundaria"
          color="#FF6B6B"
          unit="%"
        />
        <MedellinTrendChart
          title="Repitencia"
          dataKey="repitencia"
          color="#FFB703"
          unit="%"
        />
        <MedellinTrendChart
          title="Aprobación"
          dataKey="aprobacion"
          color="#06D6A0"
          unit="%"
        />
      </div>

      <h2 className="font-[var(--font-syne)] text-base font-bold text-foreground mb-3">
        Antioquia — Serie Departamental
      </h2>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface/50 p-6">
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-3">
            Fuentes de Datos de Contexto
          </h3>
          <div className="space-y-3">
            {[
              {
                fuente: "datos.gov.co — Estadísticas Municipales",
                desc: "14 años de indicadores para Medellín ETC (2011-2024)",
                status: "cargado",
              },
              {
                fuente: "MEN — Estadísticas Sectoriales",
                desc: "Cobertura, deserción, aprobación departamental Antioquia",
                status: "cargado",
              },
              {
                fuente: "MEData — Deserción por Comuna",
                desc: "Tasa de deserción por 21 comunas de Medellín",
                status: "cargado",
              },
              {
                fuente: "MEData — ISCE",
                desc: "Índice Sintético de Calidad por IE (2015-2018)",
                status: "cargado",
              },
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
          <h3 className="font-[var(--font-syne)] text-sm font-bold text-foreground mb-3 flex items-center">
            Cruces Potenciales
            <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-warning/10 text-warning border border-warning/20">En desarrollo</span>
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
