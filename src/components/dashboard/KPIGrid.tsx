"use client";

import { KPICard } from "./KPICard";
import { useFetchData } from "@/hooks/useFetchData";
import { ErrorState } from "@/components/ui/ErrorState";

interface KPIData {
  totalMatriculados: number;
  totalSedes: number;
  promedioSaber11: number;
  totalEvaluados: number;
  totalIEs: number;
  coberturaNeta: number | { valor: number } | null;
  coberturaBruta: number | null;
  tasaDesercion: number | null;
  tasaAprobacion: number | null;
  desercion?: { valor: number };
  aprobacion?: { valor: number };
}

function extractValue(v: number | { valor: number } | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && "valor" in v) return v.valor;
  return 0;
}

export function KPIGrid() {
  const { data: kpis, loading, error, retry } = useFetchData<KPIData>("/data/kpis.json");

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-border bg-surface/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!kpis) return null;

  const cobNeta = extractValue(kpis.coberturaNeta);
  const desercion = kpis.desercion ? kpis.desercion.valor : (kpis.tasaDesercion ?? 0);
  const aprobacion = kpis.aprobacion ? kpis.aprobacion.valor : (kpis.tasaAprobacion ?? 0);

  const cards = [
    {
      label: "Total Matriculados",
      value: kpis.totalMatriculados,
      unit: "estudiantes",
      trend: "up" as const,
      trendIsGood: true,
    },
    {
      label: "Sedes Educativas",
      value: kpis.totalSedes,
      unit: "sedes",
      trend: "stable" as const,
      trendIsGood: true,
    },
    {
      label: "Puntaje Saber 11",
      value: kpis.promedioSaber11,
      unit: "promedio",
      decimals: 1,
      trend: "up" as const,
      trendIsGood: true,
    },
    {
      label: "Deserción",
      value: desercion,
      unit: "%",
      decimals: 2,
      trend: "down" as const,
      trendIsGood: true,
    },
    {
      label: "Cobertura Neta",
      value: cobNeta,
      unit: "%",
      decimals: 1,
      trend: "stable" as const,
      trendIsGood: true,
    },
    {
      label: "Aprobación",
      value: aprobacion,
      unit: "%",
      decimals: 1,
      trend: "up" as const,
      trendIsGood: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <KPICard
          key={card.label}
          label={card.label}
          value={card.value}
          unit={card.unit}
          trend={card.trend}
          trendIsGood={card.trendIsGood}
          decimals={card.decimals ?? 0}
          delay={i * 100}
        />
      ))}
    </div>
  );
}
