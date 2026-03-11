"use client";

import { useEffect, useState } from "react";
import { KPICard } from "./KPICard";

interface KPIData {
  totalMatriculados: number;
  totalSedes: number;
  promedioSaber11: number;
  totalEvaluados: number;
  totalIEs: number;
  coberturaNeta: number | null;
  coberturaBruta: number | null;
  tasaDesercion: number | null;
  tasaAprobacion: number | null;
}

export function KPIGrid() {
  const [kpis, setKpis] = useState<KPIData | null>(null);

  useEffect(() => {
    fetch("/data/kpis.json")
      .then((r) => r.json())
      .then(setKpis)
      .catch(() => {});
  }, []);

  if (!kpis) {
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
      label: "Tasa de Deserción",
      value: kpis.tasaDesercion ?? 0,
      unit: "%",
      decimals: 1,
      trend: "down" as const,
      trendIsGood: true,
    },
    {
      label: "Cobertura Neta",
      value: kpis.coberturaNeta ?? 0,
      unit: "%",
      decimals: 1,
      trend: "up" as const,
      trendIsGood: true,
    },
    {
      label: "Tasa de Aprobación",
      value: kpis.tasaAprobacion ?? 0,
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
