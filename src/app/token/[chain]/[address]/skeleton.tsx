/* Layout-matched to the real report: same masthead height, same two-column
   rhythm, same number of rule-separated sections. A skeleton that does not
   match the final shape causes a visible jump when data lands. */

export function ReportSkeleton() {
  return (
    <div className="animate-none">
      {/* identity strip */}
      <div className="border-b border-ink-800">
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-3 w-40" />
          <div className="ml-auto skeleton h-2.5 w-32" />
        </div>

        {/* verdict block */}
        <div className="grid grid-cols-1 items-center gap-6 border-t border-ink-800 px-4 py-7 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:py-9">
          <div className="flex items-center gap-6">
            <div className="skeleton h-[188px] w-[188px] rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-2 w-16" />
              <div className="skeleton h-6 w-28" />
              <div className="skeleton h-2.5 w-36" />
            </div>
          </div>
          <div className="space-y-2.5 lg:border-l lg:border-ink-800 lg:pl-10">
            <div className="skeleton h-3 w-full max-w-[420px]" />
            <div className="skeleton h-3 w-full max-w-[340px]" />
            <div className="mt-4 flex gap-[3px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-[6px] flex-1" />
              ))}
            </div>
          </div>
        </div>

        {/* market strip */}
        <div className="grid grid-cols-2 divide-x divide-ink-800 border-t border-ink-800 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2 px-4 py-3">
              <div className="skeleton h-2 w-14" />
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-2 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="grid grid-cols-1 gap-x-10 px-4 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="pb-14">
          <div className="pb-4 pt-5">
            <div className="skeleton h-5 w-32" />
          </div>
          <div className="border-t border-ink-800">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 border-b border-ink-850 py-3">
                <div className="skeleton h-[18px] w-[18px]" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-2/5" />
                  <div className="skeleton h-2 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pb-14">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="slab p-4">
              <div className="skeleton mb-3 h-2 w-20" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
