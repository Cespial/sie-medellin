"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-12 md:py-16">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(62,146,204,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs mb-4"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Sistema de Inteligencia Educativa
        </motion.div>

        <h1 className="font-[var(--font-syne)] text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
          <span className="text-foreground">Educación en </span>
          <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
            Medellín
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted text-lg md:text-xl max-w-2xl leading-relaxed"
        >
          Dashboard ejecutivo con datos de cobertura, calidad, permanencia
          y contexto socioeconómico de{" "}
          <span className="text-foreground font-medium">806 establecimientos educativos</span>{" "}
          en 16 comunas y 5 corregimientos. 250K+ registros Saber 11,
          265K+ de matrícula, y 30+ datasets procesados.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-3 mt-8"
        >
          <Link
            href="/mapa"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-background font-semibold text-sm hover:bg-accent/90 transition-colors glow-accent-strong"
          >
            Explorar Mapa
          </Link>
          <Link
            href="/cobertura"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            Ver Indicadores
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats mini-bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border/50"
      >
        {[
          { label: "Comunas", value: "16" },
          { label: "Corregimientos", value: "5" },
          { label: "IEs Analizadas", value: "479" },
          { label: "Registros Saber 11", value: "250K+" },
          { label: "Datasets", value: "30+" },
          { label: "Años de datos", value: "14" },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="font-[var(--font-jetbrains)] text-2xl font-bold text-accent">
              {stat.value}
            </p>
            <p className="text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
