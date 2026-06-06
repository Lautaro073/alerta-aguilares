export function AdminReportSkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="min-h-[92px] border border-border/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-1/20 animate-pulse"
          aria-hidden="true"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg shrink-0 border border-border/40 bg-surface-2/60" />
            <div className="flex flex-col min-w-0 flex-1 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-44 max-w-full rounded bg-surface-2/70" />
                <div className="h-4 w-14 rounded-full bg-surface-2/60" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-3 w-24 rounded bg-surface-2/50" />
                <div className="h-3 w-32 rounded bg-surface-2/50" />
                <div className="h-3 w-16 rounded bg-surface-2/50" />
                <div className="h-3 w-20 rounded bg-surface-2/50" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <div className="w-8 h-8 rounded-lg bg-surface-2/60" />
            <div className="w-8 h-8 rounded-lg bg-surface-2/60" />
            <div className="w-8 h-8 rounded-lg bg-surface-2/60" />
          </div>
        </div>
      ))}
    </>
  );
}
