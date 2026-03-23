interface DataVintageProps {
  fuente: string;
  ultimoDato?: string;
  nota?: string;
  descontinuado?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

function getAgeColor(ultimoDato?: string, descontinuado?: boolean): string {
  if (descontinuado) return "text-danger";
  if (!ultimoDato) return "text-muted";
  const year = parseInt(ultimoDato.slice(0, 4), 10);
  if (isNaN(year)) return "text-muted";
  const age = CURRENT_YEAR - year;
  if (age > 5) return "text-danger";
  if (age > 2) return "text-warning";
  return "text-muted";
}

export function DataVintage({ fuente, ultimoDato, nota, descontinuado }: DataVintageProps) {
  const color = getAgeColor(ultimoDato, descontinuado);

  return (
    <span className={`text-[11px] leading-tight ${color} block mt-1 font-[var(--font-geist-mono)] tracking-tight`}>
      {fuente}
      {ultimoDato && ` · ${ultimoDato}`}
      {descontinuado && " · Descontinuado"}
      {nota && ` · ${nota}`}
    </span>
  );
}
