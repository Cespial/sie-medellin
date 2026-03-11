import Link from "next/link";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { MedellinTrendChart } from "@/components/charts/MedellinTrendChart";
import { DataSourcesFooter } from "@/components/layout/DataSourcesFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />

      <section className="px-6 pb-8">
        <h2 className="font-[var(--font-syne)] text-lg font-bold text-foreground mb-4">
          Indicadores Clave
        </h2>
        <KPIGrid />
      </section>

      <section className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MedellinTrendChart
            title="Cobertura Neta — Medellín"
            dataKey="cobertura_neta"
            color="#00D4FF"
            unit="%"
          />
          <MedellinTrendChart
            title="Tasa de Deserción — Medellín"
            dataKey="desercion"
            color="#EF233C"
            unit="%"
          />
        </div>
      </section>

      <section className="px-6 pb-8">
        <RankingTable limit={10} />
      </section>

      <section className="px-6 pb-8">
        <div className="rounded-xl border border-border bg-surface/50 p-6">
          <h2 className="font-[var(--font-syne)] text-lg font-bold text-foreground mb-2">
            Dimensiones del Sistema
          </h2>
          <p className="text-sm text-muted mb-6">
            El SIE cruza datos educativos con indicadores socioeconómicos para
            generar inteligencia accionable.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                name: "Cobertura",
                desc: "Matrícula, tasas de cobertura bruta y neta por nivel",
                color: "from-accent to-secondary",
                href: "/cobertura",
              },
              {
                name: "Calidad",
                desc: "Saber 11, ISCE, clasificación de planteles",
                color: "from-success to-accent",
                href: "/calidad",
              },
              {
                name: "Permanencia",
                desc: "Deserción por comuna, reprobación, aprobación escolar",
                color: "from-warning to-danger",
                href: "/permanencia",
              },
              {
                name: "Matrícula",
                desc: "265K+ registros, matrícula por sector, nivel y comuna",
                color: "from-secondary to-primary",
                href: "/matricula",
              },
              {
                name: "Equidad",
                desc: "Poblaciones: extranjeros, etnias, víctimas, NEE",
                color: "from-accent to-success",
                href: "/equidad",
              },
              {
                name: "Contexto",
                desc: "IPM, violencia, desempleo, hacinamiento por comunas",
                color: "from-danger to-warning",
                href: "/contexto",
              },
            ].map((dim) => (
              <Link
                key={dim.name}
                href={dim.href}
                className="group rounded-lg border border-border bg-background/50 p-4 hover:border-accent/30 hover:bg-accent/5 transition-all"
              >
                <div
                  className={`w-8 h-1 rounded-full bg-gradient-to-r ${dim.color} mb-3 group-hover:w-12 transition-all`}
                />
                <h3 className="font-semibold text-sm text-foreground mb-1">
                  {dim.name}
                </h3>
                <p className="text-xs text-muted leading-relaxed">{dim.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <DataSourcesFooter />
    </div>
  );
}
