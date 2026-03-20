"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: number;
  previousValue?: number;
  unit?: string;
  prefix?: string;
  decimals?: number;
  trend?: "up" | "down" | "stable";
  trendIsGood?: boolean;
  delay?: number;
  className?: string;
  dataYear?: string;
}

export function KPICard({
  label,
  value,
  previousValue,
  unit = "",
  prefix = "",
  decimals = 0,
  trend,
  trendIsGood = true,
  delay = 0,
  className,
  dataYear,
}: KPICardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    const timeout = setTimeout(() => requestAnimationFrame(animate), delay);
    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  const changePercent =
    previousValue && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null;

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "stable"
      ? "text-muted"
      : (trend === "up") === trendIsGood
        ? "text-accent"
        : "text-danger";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: delay / 1000 }}
      className={cn(
        "relative border border-border bg-surface p-4 hover:border-accent/20 transition-colors duration-200",
        className
      )}
    >
      {/* Sharp accent line — top left */}
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-accent/40" />

      <p className="text-[11px] text-muted uppercase tracking-widest mb-3 font-medium">
        {label}
        {dataYear && (
          <span className="normal-case tracking-normal text-muted/50 ml-1.5">
            {dataYear}
          </span>
        )}
      </p>

      <div className="flex items-baseline gap-1">
        <span className="font-[var(--font-geist-mono)] text-2xl font-semibold text-foreground tabular-nums tracking-tight">
          {prefix}
          {displayValue.toLocaleString("es-CO", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
        </span>
        {unit && <span className="text-[11px] text-muted">{unit}</span>}
      </div>

      {(trend || changePercent !== null) && (
        <div className={cn("flex items-center gap-1 mt-2 text-[11px]", trendColor)}>
          <TrendIcon className="w-3 h-3" />
          {changePercent !== null && (
            <span className="font-[var(--font-geist-mono)]">
              {changePercent > 0 ? "+" : ""}
              {changePercent.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
