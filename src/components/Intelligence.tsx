"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "./ui";
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
 *
 * The flow animation reports co-appearance, not transfers. Nothing here is a
 * transaction: two addresses sharing a launch is a weaker claim than one paying
 * the other, and the caption says so. If these were funding paths the particles
 * would be earning their meaning; here they are only showing which pairs are
 * connected, and the direction is nominal.
 * ------------------------------------------------------------------ */

const ROLE_TONE: Record<string, string> = {
  "block-0 bundler": "#ff2d55",
  "launch sniper": "#ffb020",
  "insider supply": "#a855f7",
  "fast flipper": "#38bdf8",
  "mid-curve seller": "#94a3b8",
  "patient holder": "#4ade80",
  "insufficient history": "#52525f",
};

interface Pt {
  x: number;
  y: number;
}

interface EdgeGeom {
  key: string;
  a: string;
  b: string;
  path: string;
  together: number;
}

/** Quadratic curve bowed perpendicular to its chord. The bow is what makes a
 *  shared chord readable: two edges between the same pair, or many edges
 *  radiating from the same hub, would otherwise overlap exactly. */
function curve(a: Pt, b: Pt, bowFrac: number, sign: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const nlen = Math.hypot(-dy, dx) || 1;
  const bow = Math.hypot(dx, dy) * bowFrac * sign;
  const cx = mx + (-dy / nlen) * bow;
  const cy = my + (dx / nlen) * bow;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function WalletNetworkView({ limit = 12 }: { limit?: number }) {
  // ONE state for the whole view. The graph, the detail panel and the Repeat
  // participants table all read this, and clicking either the graph or a row
  // calls the same setter with the same address string. There is no second
  // source of truth to fall out of sync, and no hover state at all — hover is
  // pure CSS below, so moving the cursor cannot re-render this component.
  const [selected, setSelected] = useState<string | null>(null);

  const net = useMemo(() => walletNetwork(), []);

  const nodes = useMemo(
    () =>
      [...net.nodes]
        .sort((a, b) => b.degree - a.degree || b.profile.launchCount - a.profile.launchCount)
        .slice(0, limit),
    [net, limit],
  );
  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.addr)), [nodes]);
  const edges = useMemo(
    () => net.edges.filter((e) => e.together >= 2 && nodeIds.has(e.a) && nodeIds.has(e.b)),
    [net, nodeIds],
  );

  const R = 118;
  const C = 150;
  // Positions depend only on the node list, which depends only on `net`. A
  // selection change cannot move a node, which is why nothing here is keyed on
  // `selected`.
  const pos = useMemo(() => {
    const m = new Map<string, Pt>();
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      m.set(n.addr, { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle) });
    });
    return m;
  }, [nodes]);

  // Geometry is computed once per layout: paths are strings, and the browser
  // measures them. Recomputing per frame would be the whole cost of this view.
  const geometry = useMemo<EdgeGeom[]>(() => {
    const out: EdgeGeom[] = [];
    for (const e of edges) {
      const a = pos.get(e.a);
      const b = pos.get(e.b);
      if (!a || !b) continue;
      const seed = [...(e.a + e.b)].reduce((n, c) => n + c.charCodeAt(0), 0);
      const sign = seed % 2 === 0 ? 1 : -1;
      out.push({
        key: e.a + e.b,
        a: e.a,
        b: e.b,
        path: curve(a, b, 0.22, sign),
        together: e.together,
      });
    }
    return out;
  }, [edges, pos]);

  const svgRef = useRef<SVGSVGElement>(null);

  const relatedEdges = useMemo(
    () =>
      selected
        ? new Set(geometry.filter((g) => g.a === selected || g.b === selected).map((g) => g.key))
        : null,
    [selected, geometry],
  );

  // The selected wallet plus every wallet it actually shares a launch with.
  // Derived from the same geometry the edges come from, so a wallet can never
  // be lit as connected without a line being drawn to it.
  const relatedNodes = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    for (const g of geometry) {
      if (g.a === selected) set.add(g.b);
      if (g.b === selected) set.add(g.a);
    }
    return set;
  }, [selected, geometry]);

  // Both directions go through here, so the graph and the table cannot disagree
  // about what is selected. Matching is by address — never by position or index.
  const selectWallet = useCallback((addr: string) => {
    setSelected((cur) => (cur === addr ? null : addr));
  }, []);

  // A row click can happen while the graph is scrolled out of view. `nearest`
  // scrolls only if it has to, and never changes the layout or the coordinates.
  const selectFromTable = useCallback((addr: string) => {
    setSelected((cur) => (cur === addr ? null : addr));
    svgRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="panel overflow-hidden">
        <div className="border-b border-line px-2.5 py-1.5">
          <span className="t-eyebrow">wallet network</span>
        </div>
        <svg
          ref={svgRef}
          viewBox="0 0 300 300"
          className="mc-net block h-auto w-full"
          role="img"
          aria-label="Wallets that repeatedly appear on the same launches"
          data-selected={selected ?? ""}
          data-related={relatedNodes ? relatedNodes.size - 1 : 0}
        >
          {/* edges first, so nodes sit on top of their own lines.
              Every Flow stays mounted for the life of the graph. Unmounting the
              muted ones on selection was restarting their particles from their
              starting offset when the selection cleared — which reads as the
              whole graph rebuilding itself. */}
          {geometry.map((g) => {
            const related = relatedEdges?.has(g.key) ?? false;
            const muted = relatedEdges !== null && !related;
            return (
              <g key={g.key}>
                <path
                  d={g.path}
                  fill="none"
                  stroke={related ? "var(--color-acid)" : "currentColor"}
                  className={related ? "" : "text-fg4"}
                  strokeWidth={
                    related
                      ? Math.min(2.6, 0.9 + g.together * 0.4)
                      : Math.min(2, 0.5 + g.together * 0.3)
                  }
                  strokeOpacity={muted ? 0.08 : related ? 0.8 : 0.16}
                  strokeLinecap="round"
                />
                <Flow g={g} active={related} muted={muted} seedIndex={g.key.charCodeAt(0) + g.together} />
              </g>
            );
          })}

          {nodes.map((n) => {
            const p = pos.get(n.addr);
            if (!p) return null;
            const isSel = selected === n.addr;
            const isRelated = relatedNodes?.has(n.addr) ?? false;
            const role = ROLE_TONE[n.behaviour.label];
            const baseR = n.degree >= 8 ? 8 : n.degree >= 5 ? 6.5 : 5;
            const r = isSel ? baseR + 1.5 : baseR;
            const muted = relatedNodes !== null && !isRelated;
            return (
              <g
                key={n.addr}
                onClick={() => selectWallet(n.addr)}
                className="mc-net-hit cursor-pointer"
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={`${shortAddr(n.addr, 6, 4)}, ${n.behaviour.label}, ${n.degree} repeat partners`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectWallet(n.addr);
                  }
                }}
              >
                {isSel && (
                  <>
                    <circle cx={p.x} cy={p.y} r={r + 9} fill="var(--color-acid)" fillOpacity={0.1} />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r + 5.5}
                      fill="none"
                      stroke="var(--color-acid)"
                      strokeWidth={1.5}
                      className="mc-net-sel"
                    />
                  </>
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={isSel ? "var(--color-acid)" : role}
                  fillOpacity={muted ? 0.22 : isSel ? 1 : isRelated ? 0.95 : 0.8}
                  className="mc-net-node"
                  style={{ animationDelay: `${(n.degree % 7) * -0.42}s` }}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 3}
                  fill="none"
                  stroke={isSel ? "var(--color-acid)" : role}
                  strokeWidth={n.degree >= 8 ? 1.3 : 0.9}
                  strokeOpacity={muted ? 0.04 : isSel ? 0.85 : Math.min(0.7, 0.18 + n.degree / 18)}
                  className="mc-net-ring"
                  style={{ animationDelay: `${(n.degree % 5) * -0.9}s` }}
                />
                <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                <title>{`${shortAddr(n.addr, 6, 4)} — ${n.behaviour.label}, ${n.profile.launchCount} launches, ${n.degree} repeat partners`}</title>
              </g>
            );
          })}
        </svg>
        <div className="border-t border-line px-2.5 py-1.5">
          <div className="flex flex-wrap gap-x-2.5 gap-y-1">
            {[...new Set(nodes.map((n) => n.behaviour.label))].map((label) => (
              <span
                key={label}
                className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.05em] text-fg4"
              >
                <span aria-hidden className="h-[4px] w-[4px]" style={{ background: ROLE_TONE[label] }} />
                {label}
              </span>
            ))}
          </div>
          <p className="mt-1 t-xs leading-relaxed text-fg4">
            An edge means two addresses appeared on the same launch. It is not proof of common
            ownership and not a transfer — the moving light shows which pairs are connected, not
            money changing hands. Node size and ring weight follow the number of repeat partners
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {selected && (
          <NetworkNodeDetail
            node={net.nodes.find((n) => n.addr === selected) as NetworkNode}
            edges={edges.filter((e) => e.a === selected || e.b === selected)}
            onClose={() => setSelected(null)}
          />
        )}

        {/* The table stays visible while something is selected. Hiding it behind
            the detail panel meant you could select from the graph but never
            switch from the table — the second direction simply had nowhere to
            click. */}
        <Panel title="Repeat participants" note="ranked by how many other addresses they keep appearing with" flush>
          <div>
            {nodes.slice(0, 7).map((n) => {
              const isSel = selected === n.addr;
              return (
                <button
                  key={n.addr}
                  type="button"
                  onClick={() => selectFromTable(n.addr)}
                  aria-pressed={isSel}
                  className={`drow flex w-full items-baseline gap-2 border-b border-line px-3 py-1.5 text-left last:border-b-0 ${
                    isSel ? "bg-acid/5" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className="mt-[4px] h-[5px] w-[5px] shrink-0"
                    style={{ background: ROLE_TONE[n.behaviour.label] }}
                  />
                  <Link
                    href={`/wallets/${n.addr}`}
                    className={`font-mono text-[10.5px] hover:text-acid ${isSel ? "text-acid" : "text-fg2"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
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
              );
            })}
          </div>
          <div className="border-t border-line px-3 py-1.5">
            <p className="t-xs leading-relaxed text-fg4">
              {net.core.length} addresses appear with at least three others more than once. The full
              graph holds {net.nodes.length} nodes and {net.edges.filter((e) => e.together >= 2).length} repeat pairs
            </p>
          </div>
        </Panel>

        <GroupRead />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Flow — particles travelling the actual path
 *
 * SVG motion rather than CSS offset-path: the path is already in the DOM, so
 * getPointAtLength is exact and works in every browser this product supports.
 *
 * This component is memoised and its animation effect depends only on the path
 * element and the seed. Selection is read from a ref inside the loop, so a
 * click changes how bright the particles are instead of tearing down the loop
 * and restarting every particle at offset zero.
 *
 * Direction is nominal. These edges mean "appeared together", which has no
 * direction, so the flow alternates along a pair rather than pretending money
 * moves one way.
 * ------------------------------------------------------------------ */

const FLOW_COUNT = 3;
const TRAIL = 6;

const Flow = memo(function Flow({
  g,
  active,
  muted,
  seedIndex,
}: {
  g: EdgeGeom;
  active: boolean;
  muted: boolean;
  seedIndex: number;
}) {
  const headRefs = useRef<(SVGCircleElement | null)[]>([]);
  const trailRefs = useRef<(SVGCircleElement | null)[][]>([]);
  const [pathEl, setPathEl] = useState<SVGPathElement | null>(null);

  // The loop reads these every frame, so selection changes take effect without
  // being an effect dependency. Writing them in an effect (not during render)
  // keeps the render pure.
  const live = useRef({ active, muted });
  useEffect(() => {
    live.current = { active, muted };
  }, [active, muted]);

  useEffect(() => {
    if (!pathEl) return;
    // Bound to a non-null const: the guard above narrows `pathEl` only in this
    // scope, and the closures below are separate scopes that TypeScript will
    // not carry the narrowing into.
    const path: SVGPathElement = pathEl;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const len = path.getTotalLength();
    if (len < 1) return;

    // Deterministic from the edge, so the pattern does not reshuffle when the
    // selection changes: three particles, spread out, each with its own speed
    // and direction.
    const parts = Array.from({ length: FLOW_COUNT }, (_, i) => {
      const seed = (seedIndex * (i + 3) * 37) % 1000;
      return {
        offset: seed / 1000,
        speed: 0.00006 + ((seed % 47) / 47) * 0.00007,
        dir: (seed + i) % 2 === 0 ? 1 : -1,
      };
    });

    let raf = 0;
    let visible = true;
    const started = performance.now();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(path);

    function tick(now: number) {
      const t = now - started;
      const { active: isActive, muted: isMuted } = live.current;
      for (let i = 0; i < FLOW_COUNT; i++) {
        const p = parts[i];
        const raw = (t * p.speed + p.offset) % 1;
        const u = p.dir === 1 ? raw : 1 - raw;

        const head = headRefs.current[i];
        if (head) {
          const pt = path.getPointAtLength(u * len);
          head.setAttribute("cx", pt.x.toFixed(2));
          head.setAttribute("cy", pt.y.toFixed(2));
          const edgeFade = u < 0.04 ? u / 0.04 : u > 0.96 ? (1 - u) / 0.04 : 1;
          head.style.opacity = String((isMuted ? 0.08 : isActive ? 1 : 0.3) * edgeFade);
        }

        // The trail is this particle's own previous positions on this curve,
        // which is what makes it read as light travelling the path rather than
        // a dot appearing somewhere new each frame.
        const dots = trailRefs.current[i];
        if (!dots) continue;
        for (let k = 0; k < TRAIL; k++) {
          const dot = dots[k];
          if (!dot) continue;
          const tu = u - (k + 1) * 0.018 * (p.dir === 1 ? 1 : -1);
          if (tu < 0.02 || tu > 0.98) {
            dot.style.opacity = "0";
            continue;
          }
          const tp = path.getPointAtLength(tu * len);
          dot.setAttribute("cx", tp.x.toFixed(2));
          dot.setAttribute("cy", tp.y.toFixed(2));
          const f = 1 - k / TRAIL;
          dot.style.opacity = String((isMuted ? 0.04 : isActive ? 0.46 : 0.13) * f * f);
        }
      }
      raf = visible && !motion.matches ? requestAnimationFrame(tick) : 0;
    }

    function hideAll() {
      for (const head of headRefs.current) if (head) head.style.opacity = "0";
      for (const dots of trailRefs.current) {
        if (!dots) continue;
        for (const dot of dots) if (dot) dot.style.opacity = "0";
      }
    }

    function start() {
      if (raf || motion.matches || !visible) return;
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      hideAll();
    }

    const onMotionChange = () => {
      if (motion.matches) stop();
      else start();
    };
    motion.addEventListener("change", onMotionChange);

    if (!motion.matches) start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      motion.removeEventListener("change", onMotionChange);
      io.disconnect();
    };
  }, [pathEl, seedIndex]);

  // Stable ref callbacks. Inline arrows here were re-created on every parent
  // render, so React detached and re-attached all ~900 particle refs whenever
  // the cursor crossed a node — one frame with no refs is one frame of black.
  const setTrail = useMemo(
    () =>
      Array.from({ length: FLOW_COUNT }, (_, i) =>
        Array.from(
          { length: TRAIL },
          (__, k) => (el: SVGCircleElement | null) => {
            if (!trailRefs.current[i]) trailRefs.current[i] = [];
            trailRefs.current[i][k] = el;
          },
        ),
      ),
    [],
  );
  const setHead = useMemo(
    () =>
      Array.from(
        { length: FLOW_COUNT },
        (_, i) => (el: SVGCircleElement | null) => {
          headRefs.current[i] = el;
        },
      ),
    [],
  );
  const setPath = useCallback((el: SVGPathElement | null) => setPathEl(el), []);

  const colour = active ? "var(--color-acid)" : "#7dd3fc";
  const key = g.key;

  return (
    <g className="pointer-events-none" aria-hidden>
      {/* the same geometry, invisible: Flow measures this element rather than
          reaching back into its parent's refs */}
      <path ref={setPath} d={g.path} fill="none" stroke="none" strokeWidth={0} />
      {Array.from({ length: FLOW_COUNT }).map((_, i) => (
        <g key={`${key}-p${i}`}>
          {Array.from({ length: TRAIL }).map((__, k) => (
            <circle
              key={k}
              ref={setTrail[i][k]}
              r={Math.max(0.5, 1.2 - k * 0.14)}
              fill={colour}
              opacity={0}
            />
          ))}
          <circle ref={setHead[i]} r={1.9} fill={colour} opacity={0} />
        </g>
      ))}
    </g>
  );
});

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
        {/* The tag carries the same colour the node does. A red tag on a
            patient holder read as a risk verdict when it was only a label. */}
        <span
          className="inline-flex shrink-0 items-center border px-1.5 py-[1px] font-mono text-[9px] uppercase leading-[1.5] tracking-[0.07em]"
          style={{
            color: ROLE_TONE[b.label] ?? "var(--color-fg3)",
            borderColor: `${ROLE_TONE[b.label] ?? "#7d8794"}55`,
            background: `${ROLE_TONE[b.label] ?? "#7d8794"}12`,
          }}
        >
          {b.label}
        </span>
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
