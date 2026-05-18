export function CardSkeleton({ h = "h-32" }: { h?: string }) {
  return <div className={`card ${h} animate-pulse bg-line/40`} />;
}

export function ChartSkeleton() {
  return (
    <section className="space-y-2">
      <div className="h-3 w-32 animate-pulse rounded-full bg-line/40" />
      <div className="card h-32 animate-pulse" />
    </section>
  );
}

export function GridSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <section className="space-y-2">
      <div className="h-3 w-28 animate-pulse rounded-full bg-line/40" />
      <div className={`card p-4`}>
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-${cols}`}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-line/30" />
          ))}
        </div>
      </div>
    </section>
  );
}
