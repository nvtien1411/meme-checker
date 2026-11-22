export function ReportSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6">
      {/* verdict skeleton */}
      <div className="panel overflow-hidden">
        <div className="flex items-center gap-3 border-b border-ink-750 px-4 py-3">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-4 w-44" />
            <div className="skeleton h-2.5 w-64" />
          </div>
          <div className="skeleton h-8 w-24" />
        </div>
        <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center">
          <div className="skeleton h-[132px] w-[132px] shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="skeleton h-3 w-full max-w-lg" />
            <div className="skeleton h-3 w-3/4 max-w-md" />
            <div className="skeleton mt-2 h-2.5 w-full" />
            <div className="skeleton h-2 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-ink-800 border-t border-ink-750 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="skeleton h-2 w-14" />
              <div className="skeleton mt-2 h-4 w-20" />
              <div className="skeleton mt-1.5 h-2 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_358px]">
        <div className="min-w-0 space-y-4">
          {(
            [
              [8, "rows"],
              [6, "rows"],
              [3, "card"],
            ] as const
          ).map(([n, kind], i) => (
            <div key={i} className="panel">
              <div className="border-b border-ink-750 px-4 py-2.5">
                <div className="skeleton h-2.5 w-24" />
              </div>
              {kind === "rows" ? (
                <div className="divide-y divide-ink-800">
                  {Array.from({ length: n }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3 px-4 py-3">
                      <div className="skeleton h-[18px] w-[18px] rounded-full" />
                      <div className="skeleton h-2.5 flex-1" />
                      <div className="skeleton h-2.5 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  <div className="skeleton h-2 w-full" />
                  <div className="skeleton h-2 w-5/6" />
                  <div className="skeleton h-2 w-2/3" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((_, i) => (
            <div key={i} className="panel p-4">
              <div className="skeleton h-2.5 w-20" />
              <div className="skeleton mt-3 h-20 w-full" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 t-meta text-mute-500">
        <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
        resolving chain · reading market, holders, contract and trades
      </p>
    </div>
  );
}
