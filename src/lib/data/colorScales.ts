// Apple-style color system for SIE Medellín

export const THEME = {
  primary: '#1D1D1F',
  secondary: '#6E6E73',
  accent: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F5F5F7',
  border: '#D2D2D7',
  text: '#1D1D1F',
  muted: '#86868B',
} as const;

export const GRADIENT = {
  hero: 'linear-gradient(135deg, #F5F5F7 0%, #FFFFFF 50%, #F5F5F7 100%)',
  card: 'linear-gradient(145deg, #FFFFFF, #F5F5F7)',
  accent: 'linear-gradient(90deg, #007AFF, #5856D6)',
} as const;

/**
 * Interpola un color en una escala dados un valor normalizado [0, 1]
 */
export function interpolateColor(colors: string[], t: number): [number, number, number, number] {
  const n = colors.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = t * n - i;

  const c1 = hexToRgb(colors[i]);
  const c2 = hexToRgb(colors[i + 1]);

  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * f),
    Math.round(c1[1] + (c2[1] - c1[1]) * f),
    Math.round(c1[2] + (c2[2] - c1[2]) * f),
    200,
  ];
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function getColorForValue(
  value: number,
  min: number,
  max: number,
  colors: string[]
): [number, number, number, number] {
  if (max === min) return interpolateColor(colors, 0.5);
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return interpolateColor(colors, t);
}
