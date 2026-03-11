// ============================================================
// Escalas de color para mapas — SIE Medellín
// ============================================================

export const THEME = {
  primary: '#0A2463',
  secondary: '#3E92CC',
  accent: '#00D4FF',
  success: '#06D6A0',
  warning: '#FFB703',
  danger: '#EF233C',
  background: '#020917',
  surface: '#0D1B2A',
  border: '#1A2D42',
  text: '#E8F4FD',
  muted: '#6B8CAE',
} as const;

export const GRADIENT = {
  hero: 'linear-gradient(135deg, #020917 0%, #0A2463 50%, #020917 100%)',
  card: 'linear-gradient(145deg, #0D1B2A, #1A2D42)',
  accent: 'linear-gradient(90deg, #00D4FF, #3E92CC)',
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
