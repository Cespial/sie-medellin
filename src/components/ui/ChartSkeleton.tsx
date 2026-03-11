export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="bg-surface border border-border rounded-xl p-6 animate-pulse"
      style={{ minHeight: height }}
    >
      <div className="h-4 w-1/3 bg-border rounded mb-3" />
      <div className="h-3 w-1/2 bg-border/50 rounded mb-8" />
      <div className="flex items-end gap-2" style={{ height: height * 0.55 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-border/30 rounded-t"
            style={{ height: `${25 + ((i * 37) % 60)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
