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
}: KPICardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayValue(startValue + (value - startValue) * eased);
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
        ? "text-success"
        : "text-danger";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-5",
        "hover:border-accent/30 hover:glow-accent transition-all duration-300",
        className
      )}
    >
      {/* Accent line top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />

      <p className="text-xs text-muted uppercase tracking-wider mb-2">{label}</p>

      <div className="flex items-baseline gap-1.5">
        <span className="font-[var(--font-jetbrains)] text-3xl font-bold text-foreground tabular-nums">
          {prefix}
          {displayValue.toLocaleString("es-CO", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
        </span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>

      {(trend || changePercent !== null) && (
        <div className={cn("flex items-center gap-1 mt-2 text-xs", trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          {changePercent !== null && (
            <span>
              {changePercent > 0 ? "+" : ""}
              {changePercent.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
