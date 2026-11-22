export function ResultSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
      <div className="border border-ink-700 bg-ink-900">
        <div className="flex items-center gap-3 border-b border-ink-700 px-3.5 py-3">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="skeleton h-3.5 w-40 rounded-sm" />
            <div className="skeleton h-2.5 w-56 rounded-sm" />
          </div>
          <div className="skeleton h-11 w-24 rounded" />
        </div>
        <div className="grid grid-cols-2 divide-x divide-ink-700 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-3 py-2.5">
              <div className="skeleton h-2 w-16 rounded-sm" />
              <div className="skeleton mt-1.5 h-4 w-20 rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {[8, 6, 4].map((rows, i) => (
            <div key={i} className="border border-ink-700 bg-ink-900">
              <div className="border-b border-ink-700 px-3.5 py-2.5">
                <div className="skeleton h-2.5 w-24 rounded-sm" />
              </div>
              <div className="divide-y divide-ink-800">
                {Array.from({ length: rows }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2.5 px-3.5 py-2.5">
                    <div className="skeleton h-4 w-4 rounded-full" />
                    <div className="skeleton h-2.5 flex-1 rounded-sm" />
                    <div className="skeleton h-2.5 w-16 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((_, i) => (
            <div key={i} className="border border-ink-700 bg-ink-900 p-3.5">
              <div className="skeleton h-2.5 w-20 rounded-sm" />
              <div className="skeleton mt-2.5 h-16 w-full rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-mute-500">
        <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
        resolving chain · reading market, holders, contract, trades
      </p>
    </div>
  );
}
