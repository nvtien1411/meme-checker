"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Tag } from "@/components/ui";

type Severity = "critical" | "high" | "medium";
type Alert = { id: string; cat: string; sev: Severity; token: string; mint: string; chain: string; at: string; headline: string; detail: string; unread: boolean };

const SEVERITY: Record<Severity, { label: string; cls: string; dot: string }> = {
  critical: { label: "critical", cls: "text-bad", dot: "bg-bad" },
  high: { label: "high", cls: "text-hot", dot: "bg-hot" },
  medium: { label: "medium", cls: "text-warn", dot: "bg-warn" },
};

export function AlertsInbox({ alerts }: { alerts: Alert[] }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => alerts.filter((a) => filter === "all" || (filter === "unread" ? a.unread : a.sev === filter)), [alerts, filter]);
  return (
    <section className="panel panel-tight">
      <header className="panel-head"><div><h2 className="t-head">Alert examples</h2><p className="mt-1 t-xs text-fg4">Evidence first. Open a token for the full picture.</p></div><Tag tone="neutral">{filtered.length} shown</Tag></header>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-surf2/40 px-3 py-2" aria-label="Filter alerts">
        {[["all", "all"], ["critical", "critical"], ["high", "high"], ["medium", "medium"], ["unread", "new in demo"]].map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`min-h-9 border px-2.5 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid ${filter === key ? "border-acid/50 bg-acid/10 text-acid" : "border-line text-fg4 hover:border-line2 hover:text-fg2"}`}>{label}</button>)}
      </div>
      {filtered.length ? filtered.map((a) => {
        const sev = SEVERITY[a.sev];
        return <article key={a.id} className={`border-b border-line px-3 py-3 last:border-0 ${a.unread ? "bg-surf2/20" : ""}`}>
          <div className="flex items-start gap-2.5"><span aria-hidden className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${sev.dot}`} />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className={`font-mono text-[10px] uppercase tracking-[0.06em] ${sev.cls}`}>{sev.label}</span><span className="font-mono text-[10px] uppercase tracking-[0.06em] text-fg4">{a.cat}</span>{a.unread && <Tag tone="acid">new in demo</Tag>}<time className="ml-auto t-mono text-[10px] text-fg4">{a.at}</time></div>
              <h3 className="mt-1 t-strong text-fg">{a.headline}</h3><p className="mt-1 max-w-4xl t-sm leading-relaxed text-fg3">{a.detail}</p>
              <Link href={`/token/${a.chain}/${a.mint}`} className="mt-2 inline-flex min-h-10 items-center border border-line2 px-3 font-mono text-[10px] uppercase tracking-[0.05em] text-fg2 hover:border-acid/50 hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid">Open {a.token} →</Link>
            </div></div>
        </article>;
      }) : <p className="p-5 t-sm text-fg4">No alert examples in this view.</p>}
    </section>
  );
}
