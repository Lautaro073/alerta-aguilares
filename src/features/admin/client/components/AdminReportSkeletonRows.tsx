export function AdminReportSkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[92px] animate-pulse flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center"
          aria-hidden="true"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-md border border-slate-200 bg-slate-100" />
            <div className="flex flex-col min-w-0 flex-1 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-44 max-w-full rounded bg-slate-200" />
                <div className="h-4 w-14 rounded bg-slate-100" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-32 rounded bg-slate-100" />
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="h-3 w-20 rounded bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <div className="h-8 w-8 rounded-md bg-slate-100" />
            <div className="h-8 w-8 rounded-md bg-slate-100" />
            <div className="h-8 w-8 rounded-md bg-slate-100" />
          </div>
        </div>
      ))}
    </>
  );
}
