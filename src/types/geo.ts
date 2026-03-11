// ============================================================
// Tipos geoespaciales — SIE Medellín
// ============================================================

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][] | number[];
  };
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface ComunaProperties {
  IDENTIFICACION?: string;
  NOMBRE?: string;
  codigo?: string;
  nombre?: string;
  comuna?: string;
  // Indicadores adjuntos
  totalMatriculados?: number;
  promSaber11?: number;
  tasaDesercion?: number;
  ipm?: number;
  poblacion?: number;
  [key: string]: unknown;
}

export interface IEPointProperties {
  codigoDane: string;
  nombre: string;
  comuna: string;
  barrio: string;
  sector: string;
  latitud: number;
  longitud: number;
  matricula?: number;
  puntajeSaber11?: number;
  isce?: number;
  categoria?: string;
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// Medellín center coordinates
export const MEDELLIN_CENTER: MapViewState = {
  longitude: -75.5636,
  latitude: 6.2476,
  zoom: 11.5,
  pitch: 45,
  bearing: -10,
};

export const MEDELLIN_BOUNDS: [[number, number], [number, number]] = [
  [-75.70, 6.15], // SW
  [-75.45, 6.38], // NE
];
