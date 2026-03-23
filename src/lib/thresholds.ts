/**
 * Umbrales de indicadores educativos — SIE Medellín
 * Centralized thresholds for alerts, color-coding, and diagnostics.
 */

export const THRESHOLDS = {
  desercion: {
    critical: 3.5,  // % — alerta roja
    warning: 2.5,   // % — alerta amber
    good: 2.0,      // % — buen desempeño
  },
  aprobacion: {
    low: 88,         // % — baja aprobación
    medium: 92,      // % — normal
    high: 95,        // % — excelente
  },
  saber11: {
    low: 240,        // pts — bajo
    medium: 260,     // pts — promedio
    high: 280,       // pts — superior
  },
  indiceSIE: {
    excellent: 75,
    good: 65,
    fair: 55,
  },
  evaluadosMinimo: 10,   // Min students for ranking inclusion
  muestraMenor: 100,     // Flag for small samples in time series
} as const;
