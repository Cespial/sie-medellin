import type { Indicador } from '@/types/education';

export const INDICATORS: Record<string, Indicador> = {
  // COBERTURA
  tcb: {
    codigo: 'tcb',
    nombre: 'Tasa de Cobertura Bruta',
    descripcion: 'Matrícula total / Población en edad escolar × 100',
    dimension: 'cobertura',
    unidad: '%',
    fuente: 'SIMAT / DANE',
    esPorcentaje: true,
    mejorValor: 'mayor',
    colorScale: ['#1a1a2e', '#16213e', '#0f3460', '#3E92CC', '#00D4FF'],
  },
  matricula_total: {
    codigo: 'matricula_total',
    nombre: 'Total Matriculados',
    descripcion: 'Suma de estudiantes activos en el sistema',
    dimension: 'cobertura',
    unidad: 'estudiantes',
    fuente: 'SIMAT',
    esPorcentaje: false,
    mejorValor: 'mayor',
    colorScale: ['#0D1B2A', '#1B2838', '#2A3F55', '#3E92CC', '#00D4FF'],
  },

  // CALIDAD
  saber11_global: {
    codigo: 'saber11_global',
    nombre: 'Puntaje Saber 11 (Global)',
    descripcion: 'Promedio puntaje global Saber 11 por institución',
    dimension: 'calidad',
    unidad: 'puntos',
    fuente: 'ICFES',
    esPorcentaje: false,
    mejorValor: 'mayor',
    colorScale: ['#EF233C', '#FFB703', '#F4D35E', '#06D6A0', '#00D4FF'],
  },
  isce: {
    codigo: 'isce',
    nombre: 'ISCE',
    descripcion: 'Índice Sintético de Calidad Educativa (1-10)',
    dimension: 'calidad',
    unidad: 'índice',
    fuente: 'MEN/ICFES',
    esPorcentaje: false,
    mejorValor: 'mayor',
    colorScale: ['#EF233C', '#FFB703', '#06D6A0', '#00D4FF', '#3E92CC'],
  },

  // PERMANENCIA
  tasa_desercion: {
    codigo: 'tasa_desercion',
    nombre: 'Tasa de Deserción',
    descripcion: '(Matrícula inicial - final) / Matrícula inicial × 100',
    dimension: 'permanencia',
    unidad: '%',
    fuente: 'C600 / SEM',
    esPorcentaje: true,
    mejorValor: 'menor',
    colorScale: ['#00D4FF', '#06D6A0', '#F4D35E', '#FFB703', '#EF233C'],
  },

  // EFICIENCIA
  ratio_alumno_docente: {
    codigo: 'ratio_alumno_docente',
    nombre: 'Relación Alumno/Docente',
    descripcion: 'Número de estudiantes por cada docente',
    dimension: 'eficiencia',
    unidad: 'ratio',
    fuente: 'C600',
    esPorcentaje: false,
    mejorValor: 'menor',
    colorScale: ['#00D4FF', '#06D6A0', '#FFB703', '#EF233C', '#8B0000'],
  },

  // CONTEXTO
  ipm: {
    codigo: 'ipm',
    nombre: 'Índice de Pobreza Multidimensional',
    descripcion: 'IPM por comunas de Medellín',
    dimension: 'contexto',
    unidad: '%',
    fuente: 'DANE / ECV',
    esPorcentaje: true,
    mejorValor: 'menor',
    colorScale: ['#00D4FF', '#06D6A0', '#FFB703', '#EF233C', '#8B0000'],
  },
  tasa_homicidios: {
    codigo: 'tasa_homicidios',
    nombre: 'Tasa de Homicidios',
    descripcion: 'Homicidios por 100.000 habitantes por comuna',
    dimension: 'contexto',
    unidad: 'por 100k',
    fuente: 'Obs. Seguridad',
    esPorcentaje: false,
    mejorValor: 'menor',
    colorScale: ['#00D4FF', '#06D6A0', '#FFB703', '#EF233C', '#8B0000'],
  },
};

export const DIMENSIONS = [
  { key: 'cobertura', label: 'Cobertura', icon: 'Users' },
  { key: 'calidad', label: 'Calidad', icon: 'Award' },
  { key: 'permanencia', label: 'Permanencia', icon: 'TrendingUp' },
  { key: 'eficiencia', label: 'Eficiencia', icon: 'Settings' },
  { key: 'equidad', label: 'Equidad', icon: 'Scale' },
  { key: 'contexto', label: 'Contexto', icon: 'MapPin' },
] as const;
