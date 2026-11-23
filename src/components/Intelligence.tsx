"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel, Tag } from "./ui";
import { shortAddr } from "@/lib/demo";
import {
  classifyWallet,
  groupBehaviour,
  walletNetwork,
  type ExitOrderRow,
  type NetworkNode,
} from "@/lib/intel";

/* ==================================================================== *
 * INTELLIGENCE VIEWS
 *
 * Three surfaces that only exist because there is launch history behind them.
 * Each one answers a question the free tier cannot, and each answer is computed
 * from DEMO_LAUNCHES rather than written into the component.
 *
 * The visual rules are the same as everywhere else in this product: a number
 * carries its label and its denominator, a claim carries its evidence, and a
 * metric with no rows says so instead of rendering a zero.
 * ==================================================================== */

/* ------------------------------------------------------------------ *
 * Network — who keeps showing up with whom
 *
 * A radial layout on a deterministic ring, edges weighted by how many launches
 * two addresses share. No force simulation: a graph that settles differently on
 * every render is a graph nobody can compare against the last time they looked.
 * ------------------------------------------------------------------ */

export function WalletNetworkView({ limit = 12 }: { limit?: number }) {
  const [picked, setPicked] = useState<string | null>(null);
  const net = useMemo(() => walletNetwork(), []);

  const nodes = useMemo(
    () =>
      [...net.nodes]
        .sort((a, b) => b.degree - a.degree || b.profile.launchCount - a.profile.launchCount)
        .slice(0, limit),
    [net, limit],
  );
  const nodeIds = new Set(nodes.map((n) => n.addr));
  const edges = net.edges.filter((e) => e.together >= 2 && nodeIds.has(e.a) && nodeIds.has(e.b));

  const R = 118;
  const C = 150;
  const pos = new Map(
    nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      return [n.addr, { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle) }];
    }),
  );

  const sel = picked ? net.nodes.find((n) => n.addr === picked) : null;
  const selEdges = picked ? edges.filter((e) => e.a === picked || e.b === picked) : [];

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="panel overflow-hidden">
        <div className="border-b border-line px-2.5 py-1.5">
          <span className="t-eyebrow">wallet network</span>
        </div>
        <svg viewBox="0 0 300 300" className="block h-auto w-full" role="img" aria-label="Wallets that repeatedly appear on the same launches">
          {edges.map((e) => {
            const a = pos.get(e.a);
            const b = pos.get(e.b);
            if (!a || !b) return null;
            const active = picked === e.a || picked === e.b;
            const dim = picked !== null && !active;
            return (
              <line
                key={e.a + e.b}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={active ? "var(--color-acid)" : "currentColor"}
                className={active ? "" : "text-fg4"}
                strokeWidth={Math.min(2.4, 0.5 + e.together * 0.4)}
                strokeOpacity={dim ? 0.08 : active ? 0.7 : 0.22}
              />
            );
          })}
          {nodes.map((n) => {
            const p = pos.get(n.addr);
            if (!p) return null;
            const isSel = picked === n.addr;
            const role = ROLE_TONE[n.behaviour.label];
            return (
              <g key={n.addr} onClick={() => setPicked(isSel ? null : n.addr)} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={n.degree >= 8 ? 8 : n.degree >= 5 ? 6.5 : 5}
                  fill={isSel ? "var(--color-acid)" : role}
                  fillOpacity={isSel ? 1 : picked ? 0.35 : 0.85}
                />
                <circle cx={p.x} cy={p.y} r={13} fill="transparent" />
                <title>{`${shortAddr(n.addr, 6, 4)} — ${n.behaviour.label}, ${n.profile.launchCount} launches, ${n.degree} repeat partners`}</title>
              </g>
            );
          })}
        </svg>
        <div className="border-t border-line px-2.5 py-1.5">
          <p className="t-xs leading-relaxed text-fg4">
            An edge means two addresses appeared on the same launch. It is not proof of common
            ownership — it is a reason to look. Line weight is the number of launches shared
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {sel ? (
          <NetworkNodeDetail node={sel} edges={selEdges} onClose={() => setPicked(null)} />
        ) : (
          <Panel title="Repeat participants" note="ranked by how many other addresses they keep appearing with" flush>
            <div>
              {nodes.slice(0, 7).map((n) => (
                <button
                  key={n.addr}
                  type="button"
                  onClick={() => setPicked(n.addr)}
                  className="drow flex w-full items-baseline gap-2 border-b border-line px-3 py-1.5 text-left last:border-b-0"
                >
                  <span aria-hidden className="mt-[4px] h-[5px] w-[5px] shrink-0" style={{ background: ROLE_TONE[n.behaviour.label] }} />
                  <Link href={`/wallets/${n.addr}`} className="font-mono text-[10.5px] text-fg2 hover:text-acid" onClick={(e) => e.stopPropagation()}>
                    {shortAddr(n.addr, 6, 4)}
                  </Link>
                  <span className="t-xs text-fg4">{n.behaviour.label}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-fg4">
                    {n.degree} partners
                  </span>
                  <span className="w-14 shrink-0 text-right font-mono text-[10px] tabular-nums text-fg3">
                    {n.profile.launchCount}L
                  </span>
                </button>
              ))}
            </div>
            <div className="border-t border-line px-3 py-1.5">
              <p className="t-xs leading-relaxed text-fg4">
                {net.core.length} addresses appear with at least three others more than once. The full
                graph holds {net.nodes.length} nodes and {net.edges.filter((e) => e.together >= 2).length} repeat pairs
              </p>
            </div>
          </Panel>
        )}

        <GroupRead />
      </div>
    </div>
  );
}

const ROLE_TONE: Record<string, string> = {
  "block-0 bundler": "#ff2d55",
  "launch sniper": "#ffb020",
  "insider supply": "#a855f7",
  "fast flipper": "#38bdf8",
  "mid-curve seller": "#94a3b8",
  "patient holder": "#4ade80",
  "insufficient history": "#52525f",
};

function NetworkNodeDetail({
  node,
  edges,
  onClose,
}: {
  node: NetworkNode;
  edges: { a: string; b: string; together: number; symbols: string[]; alwaysAtLaunch: boolean }[];
  onClose: () => void;
}) {
  const p = node.profile;
  const b = classifyWallet(p);
  return (
    <Panel
      title={shortAddr(node.addr, 8, 6)}
      note={`${p.launchCount} launches on record`}
      right={
        <button type="button" onClick={onClose} className="font-mono text-[9px] uppercase tracking-[0.06em] text-fg4 hover:text-fg2">
          close
        </button>
      }
      flush
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-1.5">
        <Tag tone="bad">{b.label}</Tag>
        <span className="font-mono text-[9.5px] tabular-nums text-fg4">
          confidence {(b.confidence * 100).toFixed(0)}%
        </span>
        <Link href={`/wallets/${node.addr}`} className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-acid hover:underline">
          full profile
        </Link>
      </div>
      <ul className="space-y-1 px-3 py-2">
        {b.evidence.map((e) => (
          <li key={e} className="flex items-start gap-1.5">
            <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
            <span className="t-xs leading-snug text-fg3">{e}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-3 py-1.5">
        <div className="t-eyebrow">appears with</div>
        <div className="mt-1 space-y-0.5">
          {edges
            .sort((x, y) => y.together - x.together)
            .slice(0, 4)
            .map((e) => {
              const other = e.a === node.addr ? e.b : e.a;
              return (
                <div key={other} className="flex items-baseline gap-2">
                  <Link href={`/wallets/${other}`} className="font-mono text-[10px] text-fg3 hover:text-acid">
                    {shortAddr(other, 6, 4)}
                  </Link>
                  <span className="t-xs text-fg4">{e.symbols.join(" · ")}</span>
                  <span className="ml-auto font-mono text-[9.5px] tabular-nums text-fg4">
                    {e.together}×
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * The group read — what the cluster does collectively, which is the part
 * that predicts the exit rather than describing a wallet.
 * ------------------------------------------------------------------ */

function GroupRead() {
  const g = useMemo(() => groupBehaviour(CORE_BUNDLE), []);
  const fmtH = (m: number | null) =>
    m === null ? "not measured" : m < 90 ? `${Math.round(m)} min` : `${(m / 60).toFixed(1)} h`;

  return (
    <Panel title="What this group does" note="computed across every launch they share" flush>
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:grid-cols-4">
        {[
          { k: "shared launches", v: String(g.coLaunches.length), s: g.coLaunches.map((l) => l.symbol).join(" · ") },
          { k: "median hold", v: fmtH(g.medianHoldMin), s: "before first sell" },
          { k: "exit point", v: g.medianExitAtPeak === null ? "—" : `${(g.medianExitAtPeak * 100).toFixed(0)}%`, s: "of the peak, median" },
          { k: "exit spread", v: g.medianExitSpreadMin === null ? "—" : `${Math.round(g.medianExitSpreadMin)} min`, s: g.style },
        ].map((c) => (
          <div key={c.k} className="p-2.5">
            <div className="t-eyebrow">{c.k}</div>
            <div className="mt-0.5 font-mono text-[15px] leading-none tabular-nums text-fg">{c.v}</div>
            <div className="mt-1 t-xs leading-snug text-fg4">{c.s}</div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2">
        <p className="t-body leading-relaxed text-fg2">
          These {g.wallets.length} addresses held {g.peakGroupPct.toFixed(1)}% of supply at their largest.
          Across {g.coLaunches.length} shared launches they began selling at a median{" "}
          <span className="text-fg">{g.medianExitAtPeak === null ? "unmeasured" : `${(g.medianExitAtPeak * 100).toFixed(0)}% of the peak`}</span>
          {g.medianExitSpreadMin !== null && (
            <>
              , spread over {Math.round(g.medianExitSpreadMin)} minutes —{" "}
              {g.style === "simultaneous"
                ? "one event, not a sequence"
                : g.style === "staggered"
                  ? "a staggered exit, which is what an organised group looks like"
                  : "no consistent ordering"}
            </>
          )}
          . {g.collapsesAfterExit} of those {g.coLaunches.length} launches collapsed after they left.
        </p>
        <p className="mt-1.5 t-xs leading-relaxed text-fg4">
          This is a description of what happened, not a forecast. It is the only measured evidence
          available about what this group does next
        </p>
      </div>
    </Panel>
  );
}

/** The wallets that appear together most often across the recorded launches. */
export const CORE_BUNDLE = [
  "BBPzEyKTdRm3wXqNa4vJhSc8LkPyU2gFtZoQx6RRbMNk",
  "7gi5osq2KxPa9VuLd3nRtYbXm8QcWj4HsSpEz1K96us9",
  "D32Zb9mZQvNk8RtXyLp5HcJfW2sGdA7UeMi6YqXBeA6h",
  "2Zk8QpLmN4vRtXbYc5HjDfW7sGaE9UeMi3YqXdA6hBnP",
  "Qv7LmNpK4xRtYb2WcHf5JdG8sEaZ9UiM3YqXe6AhBd1S",
];

/* ------------------------------------------------------------------ *
 * Exit order — who leaves first
 * ------------------------------------------------------------------ */

export function ExitOrderTable({ rows }: { rows: ExitOrderRow[] }) {
  const firsts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) if (r.position === 1) m.set(r.addr, (m.get(r.addr) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_240px]">
      <Panel className="mc-rows" title="Each exit, ordered" note="every exit, ordered within its own launch" flush>
        <div className="grid grid-cols-[minmax(0,1fr)_40px_44px_46px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1">
          <span className="t-eyebrow">wallet · launch</span>
          <span className="t-eyebrow text-right">order</span>
          <span className="t-eyebrow text-right">held</span>
          <span className="t-eyebrow text-right">at peak</span>
        </div>
        {rows.slice(0, 12).map((r, i) => (
          <div
            key={`${r.addr}-${r.symbol}-${i}`}
            className="grid grid-cols-[minmax(0,1fr)_40px_44px_46px] items-baseline gap-x-2 border-b border-line px-3 py-[5px] last:border-b-0"
          >
            <span className="flex min-w-0 items-baseline gap-1.5">
              <Link href={`/wallets/${r.addr}`} className="font-mono text-[10px] text-fg2 hover:text-acid">
                {shortAddr(r.addr, 5, 3)}
              </Link>
              <span className="truncate t-xs text-fg4">{r.symbol}</span>
            </span>
            <span className={`text-right font-mono text-[10px] tabular-nums ${r.position === 1 ? "text-bad" : "text-fg3"}`}>
              #{r.position}
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-fg4">
              {r.holdMin < 60 ? `${Math.round(r.holdMin)}m` : `${(r.holdMin / 60).toFixed(1)}h`}
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
              {r.exitAtPeakFrac === null ? "—" : `${(r.exitAtPeakFrac * 100).toFixed(0)}%`}
            </span>
          </div>
        ))}
      </Panel>

      <Panel title="First out" note="how often each wallet led the exit" flush>
        <div className="px-3 py-2">
          {firsts.map(([addr, n]) => (
            <div key={addr} className="flex items-baseline gap-2 border-b border-line py-1 last:border-b-0">
              <Link href={`/wallets/${addr}`} className="font-mono text-[10px] text-fg2 hover:text-acid">
                {shortAddr(addr, 5, 3)}
              </Link>
              <span className="ml-auto font-mono text-[10px] tabular-nums text-bad">{n}×</span>
            </div>
          ))}
        </div>
        <div className="border-t border-line px-3 py-1.5">
          <p className="t-xs leading-relaxed text-fg4">
            The wallet that leaves first sets the price everyone else exits into. It is the address worth
            watching, not the largest holder
          </p>
        </div>
      </Panel>
    </div>
  );
}
