// ============================================================
// Tipos del dominio educativo — SIE Medellín
// ============================================================

export interface InstitucionEducativa {
  id: number;
  codigoDaneIe: string;
  nombre: string;
  nombreSede?: string;
  esSedePrincipal: boolean;
  tipoIe: 'oficial' | 'privado' | 'concesion';
  sector: 'oficial' | 'no_oficial';
  zona: 'urbano' | 'rural';
  comunaCodigo: string;
  barrio: string;
  direccion: string;
  latitud: number;
  longitud: number;
  jornadas: string[];
  niveles: string[];
  estaActiva: boolean;
  rector?: string;
  telefono?: string;
  email?: string;
}

export interface Matricula {
  id: number;
  anio: number;
  codigoDaneIe: string;
  nivelEducativo: 'preescolar' | 'primaria' | 'secundaria' | 'media';
  grado: string;
  jornada: string;
  totalMatriculados: number;
  hombres: number;
  mujeres: number;
  urbano: number;
  rural: number;
  discapacidad: number;
  victimas: number;
  migrantes: number;
  indigenas: number;
  afro: number;
}

export interface CalidadEducativa {
  id: number;
  anio: number;
  codigoDaneIe: string;
  tipoEvaluacion: 'saber11' | 'saber359' | 'isce';
  puntajeGlobal: number;
  puntajeMatematicas?: number;
  puntajeLectura?: number;
  puntajeCiencias?: number;
  puntajeSociales?: number;
  puntajeIngles?: number;
  isceValor?: number;
  categoriaPlantel?: string;
  numEvaluados?: number;
  percentilCiudad?: number;
}

export interface Permanencia {
  id: number;
  anio: number;
  codigoDaneIe: string;
  nivelEducativo: string;
  grado: string;
  matriculaInicio: number;
  matriculaFin: number;
  desertores: number;
  tasaDesercion: number;
  tasaAprobacion: number;
  tasaReprobacion: number;
}

export interface IndicadorSocioeconomico {
  id: number;
  anio: number;
  comunaCodigo: string;
  ipm?: number;
  tasaDesempleo?: number;
  tasaHomicidios?: number;
  estratoModal?: number;
  coberturaInternet?: number;
  poblacionTotal?: number;
  poblacion6a16?: number;
}

export interface ResumenComuna {
  codigoDane: string;
  nombre: string;
  anio: number;
  totalMatriculados: number;
  promSaber11: number;
  promIsce: number;
  tasaDesercion: number;
  ipm: number;
  tasaHomicidios: number;
  poblacion: number;
}

export interface KPIData {
  label: string;
  value: number;
  previousValue?: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  trendIsGood?: boolean;
  icon?: string;
}

export type Dimension = 'cobertura' | 'calidad' | 'permanencia' | 'eficiencia' | 'equidad' | 'contexto';

export interface Indicador {
  codigo: string;
  nombre: string;
  descripcion: string;
  dimension: Dimension;
  unidad: string;
  fuente: string;
  esPorcentaje: boolean;
  mejorValor: 'mayor' | 'menor';
  colorScale: string[];
}
