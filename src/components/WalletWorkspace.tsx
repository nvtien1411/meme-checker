"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shortAddr } from "@/lib/demo";
import { CHAIN_BY_ID } from "@/lib/chains";
import {
  classifyWallet,
  walletNetwork,
  groupBehaviour,
  type Behaviour,
  type NetworkNode,
  type NetworkEdge,
} from "@/lib/intel";
import {
  buildGraph,
  clusters,
  compareWallets,
  neighboursOf,
  shortestPath,
  addressExplorer,
  type Cluster,
  type Graph,
  type WalletPath,
} from "@/lib/network";

/* ==================================================================== *
 * WALLET INVESTIGATION WORKSPACE
 *
 * Three regions, one selection:
 *
 *   graph       the map — zoom, pan, filter, path, cluster focus
 *   intelligence the tabbed read of the selected wallet
 *   inspector   the wallet itself, with the actions you take on it
 *
 * The graph is the primary surface, so it gets the space; the other two are
 * column-width and scroll independently. Everything derives from one
 * `selected` address and one `graph`, both memoised — a click changes what is
 * highlighted, never where anything is drawn.
 * ==================================================================== */

const ROLE_TONE: Record<string, string> = {
  "block-0 bundler": "#ff2d55",
  "launch sniper": "#ffb020",
  "insider supply": "#a855f7",
  "fast flipper": "#38bdf8",
  "mid-curve seller": "#94a3b8",
  "patient holder": "#4ade80",
  "insufficient history": "#52525f",
};

const ROLE_ORDER: Behaviour[] = [
  "block-0 bundler",
  "launch sniper",
  "insider supply",
  "fast flipper",
  "mid-curve seller",
  "patient holder",
  "insufficient history",
];

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
  symbols: string[];
}

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

/* ------------------------------------------------------------------ *
 * Layout
 *
 * Radii rather than a single ring: an address with many repeat partners is
 * more central in the literal sense, and putting it in the middle means its
 * edges are the shortest ones. Groups of three or more that share no edge with
 * the main mass sit on the outer ring, so clustered wallets read as a cluster
 * before you click anything.
 * ------------------------------------------------------------------ */

interface Layout {
  pos: Map<string, Pt>;
  radius: number;
}

function layout(nodes: NetworkNode[], g: Graph): Layout {
  const m = new Map<string, Pt>();
  const core = nodes.length <= 40;

  // sort by degree so the busiest addresses land nearest the middle
  const sorted = [...nodes].sort((a, b) => b.degree - a.degree);
  const inner = sorted.filter((n) => n.degree >= 4).slice(0, 8);
  const outer = sorted.filter((n) => !inner.includes(n));

  const CX = 500;
  const CY = 400;

  inner.forEach((n, i) => {
    const angle = (i / Math.max(1, inner.length)) * Math.PI * 2 - Math.PI / 2;
    const r = inner.length === 1 ? 0 : 130;
    m.set(n.addr, { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) });
  });

  // The outer ring is sorted so wallets that share edges sit next to each other.
  // Walking the adjacency instead of the raw order keeps a cluster contiguous
  // instead of scattering its members around the circle.
  const placed: string[] = [...inner.map((n) => n.addr)];
  const walled = outer.map((n) => n.addr);
  const ordered: string[] = [];
  const remaining = new Set(walled);
  let cursorAddr: string | null = placed[0] ?? null;

  while (remaining.size) {
    if (cursorAddr && remaining.has(cursorAddr)) {
      ordered.push(cursorAddr);
      remaining.delete(cursorAddr);
    }
    const last = ordered[ordered.length - 1] ?? null;
    let next: string | null = null;
    if (last) {
      const nbrs = (g.adjacency.get(last) ?? [])
        .map((e) => (e.a === last ? e.b : e.a))
        .filter((a) => remaining.has(a));
      next = nbrs[0] ?? null;
    }
    if (!next) next = remaining.values().next().value ?? null;
    cursorAddr = next;
    if (!cursorAddr) break;
  }

  ordered.forEach((addr, i) => {
    if (m.has(addr)) return;
    const angle = (i / Math.max(1, ordered.length)) * Math.PI * 2 - Math.PI / 2;
    const r = core ? 290 : 300;
    m.set(addr, { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) });
  });

  return { pos: m, radius: 400 };
}

/* ==================================================================== */

export function WalletNetworkView({ limit = 14 }: { limit?: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [compareWith, setCompareWith] = useState<string | null>(null);
  const [tab, setTab] = useState<"participants" | "launches" | "behaviour" | "connections">(
    "participants",
  );
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());
  const [pathFrom, setPathFrom] = useState<string | null>(null);
  const [pathTo, setPathTo] = useState<string | null>(null);
  const [clusterFocus, setClusterFocus] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pt>({ x: 0, y: 0 });
  const [copied, setCopied] = useState<string | null>(null);

  const net = useMemo(() => walletNetwork(), []);
  const g = useMemo(() => buildGraph(net), [net]);

  const allClusters = useMemo(() => clusters(g), [g]);

  // Filtering happens on role, before layout, so a hidden role cannot leave a
  // gap where its nodes used to be. Layout is computed from what is visible.
  const nodes = useMemo(() => {
    const pool = [...net.nodes]
      .filter((n) => !hiddenRoles.has(n.behaviour.label))
      .sort((a, b) => b.degree - a.degree || b.profile.launchCount - a.profile.launchCount);

    if (clusterFocus !== null) {
      const cl = allClusters.find((c) => c.id === clusterFocus);
      if (cl) return pool.filter((n) => cl.addrs.includes(n.addr));
    }
    return pool.slice(0, limit);
  }, [net, hiddenRoles, clusterFocus, allClusters, limit]);

  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.addr)), [nodes]);
  const edges = useMemo(
    () => g.strong.filter((e) => nodeIds.has(e.a) && nodeIds.has(e.b)),
    [g, nodeIds],
  );

  const { pos } = useMemo(() => layout(nodes, g), [nodes, g]);

  const geometry = useMemo<EdgeGeom[]>(() => {
    const out: EdgeGeom[] = [];
    for (const e of edges) {
      const a = pos.get(e.a);
      const b = pos.get(e.b);
      if (!a || !b) continue;
      const seed = [...(e.a + e.b)].reduce((n, c) => n + c.charCodeAt(0), 0);
      out.push({
        key: e.a + e.b,
        a: e.a,
        b: e.b,
        path: curve(a, b, 0.2, seed % 2 === 0 ? 1 : -1),
        together: e.together,
        symbols: e.symbols,
      });
    }
    return out;
  }, [edges, pos]);

  const svgRef = useRef<SVGSVGElement>(null);
  const graphWrapRef = useRef<HTMLDivElement>(null);

  const relatedEdges = useMemo(
    () =>
      selected
        ? new Set(geometry.filter((x) => x.a === selected || x.b === selected).map((x) => x.key))
        : null,
    [selected, geometry],
  );

  const relatedNodes = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    for (const x of geometry) {
      if (x.a === selected) set.add(x.b);
      if (x.b === selected) set.add(x.a);
    }
    return set;
  }, [selected, geometry]);

  const path = useMemo(
    () => (pathFrom && pathTo ? shortestPath(g, pathFrom, pathTo) : null),
    [g, pathFrom, pathTo],
  );
  const pathEdges = useMemo(
    () => (path ? new Set(path.edges.map((e) => e.a + e.b)) : null),
    [path],
  );
  const pathNodes = useMemo(() => (path ? new Set(path.addrs) : null), [path]);

  const selectWallet = useCallback((addr: string) => {
    setSelected((cur) => {
      if (cur === addr) return null;
      setHistory((h) => [addr, ...h.filter((x) => x !== addr)].slice(0, 8));
      return addr;
    });
  }, []);

  const selectFromList = useCallback(
    (addr: string) => {
      selectWallet(addr);
      graphWrapRef.current?.scrollIntoView({ block: "nearest" });
    },
    [selectWallet],
  );

  const reset = useCallback(() => {
    setSelected(null);
    setCompareWith(null);
    setPathFrom(null);
    setPathTo(null);
    setClusterFocus(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const fit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const copy = useCallback(async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(addr);
      setTimeout(() => setCopied((c) => (c === addr ? null : c)), 1400);
    } catch {
      // clipboard blocked: say nothing rather than claiming success
      setCopied(null);
    }
  }, []);

  // wheel zoom with ctrl/meta only, so a normal scroll still scrolls the page
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.5, z * (e.deltaY > 0 ? 0.92 : 1.08))));
  }, []);

  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as Element).closest("[role=button]")) return;
      dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    [pan],
  );
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  }, []);
  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const selectedNode = selected ? g.nodes.get(selected) ?? null : null;
  const comparison = useMemo(
    () => (selected && compareWith ? compareWallets(g, selected, compareWith) : null),
    [g, selected, compareWith],
  );

  const visibleRoles = useMemo(() => {
    const present = new Set(net.nodes.map((n) => n.behaviour.label));
    return ROLE_ORDER.filter((r) => present.has(r));
  }, [net]);

  return (
    <div className="space-y-2.5">
      {/* ---------- toolbar ---------- */}
      <div className="flex flex-wrap items-center gap-1.5 border border-line bg-panel px-2 py-1.5">
        <span className="t-eyebrow mr-1">wallet network</span>

        <div className="flex items-center gap-0.5">
          <ToolBtn onClick={() => setZoom((z) => Math.min(3, z * 1.25))} label="Zoom in">
            +
          </ToolBtn>
          <ToolBtn onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))} label="Zoom out">
            −
          </ToolBtn>
          <ToolBtn onClick={fit} label="Fit to screen">
            fit
          </ToolBtn>
          <ToolBtn onClick={reset} label="Reset selection and view">
            reset
          </ToolBtn>
        </div>

        <div className="mx-1 h-3.5 w-px bg-line" />

        <div className="flex flex-wrap items-center gap-1">
          {visibleRoles.map((role) => {
            const off = hiddenRoles.has(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() =>
                  setHiddenRoles((s) => {
                    const n = new Set(s);
                    if (n.has(role)) n.delete(role);
                    else n.add(role);
                    return n;
                  })
                }
                aria-pressed={!off}
                title={off ? `Show ${role}` : `Hide ${role}`}
                className={`flex items-center gap-1 border px-1.5 py-[2px] font-mono text-[8px] uppercase tracking-[0.05em] transition-colors ${
                  off
                    ? "border-line/50 text-fg4/35 line-through hover:text-fg4/60"
                    : "border-fg3/50 bg-fg/5 text-fg2 hover:border-fg3 hover:bg-fg/10"
                }`}
              >
                <span
                  aria-hidden
                  className="h-[4px] w-[4px]"
                  style={{
                    background: off ? "transparent" : ROLE_TONE[role],
                    boxShadow: off ? `inset 0 0 0 1px ${ROLE_TONE[role]}55` : "none",
                  }}
                />
                {role}
              </button>
            );
          })}
        </div>

        <span className="ml-auto font-mono text-[9px] tabular-nums text-fg4">
          {nodes.length} shown · {edges.length} edges
        </span>
      </div>

      {/* ---------- graph + inspector ---------- */}
      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div ref={graphWrapRef} className="panel overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 1000 800"
            className="mc-net block h-[420px] w-full cursor-grab touch-none select-none active:cursor-grabbing lg:h-[520px]"
            role="img"
            aria-label="Wallet relationship graph"
            data-selected={selected ?? ""}
            data-related={relatedNodes ? relatedNodes.size - 1 : 0}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              {geometry.map((x) => {
                const related = relatedEdges?.has(x.key) ?? false;
                const muted = relatedEdges !== null && !related;
                const onPath = pathEdges?.has(x.key) ?? false;
                return (
                  <g key={x.key}>
                    <path
                      d={x.path}
                      fill="none"
                      stroke={onPath ? "#7dd3fc" : related ? "var(--color-acid)" : "currentColor"}
                      className={onPath || related ? "" : "text-fg4"}
                      strokeWidth={
                        onPath ? 2.6 : related ? Math.min(2.6, 0.9 + x.together * 0.4) : Math.min(1.8, 0.5 + x.together * 0.28)
                      }
                      strokeOpacity={muted && !onPath ? 0.07 : onPath ? 0.95 : related ? 0.8 : 0.18}
                      strokeDasharray={onPath ? "5 3" : undefined}
                      strokeLinecap="round"
                    />
                    <Flow
                      g={x}
                      active={related}
                      muted={muted && !onPath}
                      onPath={onPath}
                      seedIndex={x.key.charCodeAt(0) + x.together}
                    />
                  </g>
                );
              })}

              {nodes.map((n) => {
                const p = pos.get(n.addr);
                if (!p) return null;
                const isSel = selected === n.addr;
                const isCmp = compareWith === n.addr;
                const isRelated = relatedNodes?.has(n.addr) ?? false;
                const isPath = pathNodes?.has(n.addr) ?? false;
                const role = ROLE_TONE[n.behaviour.label];
                const baseR = n.degree >= 8 ? 11 : n.degree >= 5 ? 9 : 7;
                const r = isSel ? baseR + 2 : baseR;
                const muted = relatedNodes !== null && !isRelated && !isPath;
                return (
                  <g
                    key={n.addr}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectWallet(n.addr);
                    }}
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
                        <circle cx={p.x} cy={p.y} r={r + 13} fill="var(--color-acid)" fillOpacity={0.09} />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={r + 7}
                          fill="none"
                          stroke="var(--color-acid)"
                          strokeWidth={1.5}
                          className="mc-net-sel"
                        />
                      </>
                    )}
                    {isCmp && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={r + 9}
                        fill="none"
                        stroke="#7dd3fc"
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r}
                      fill={role}
                      fillOpacity={muted ? 0.2 : isSel ? 1 : isRelated || isPath ? 0.95 : 0.8}
                      className="mc-net-node"
                      style={{ animationDelay: `${(n.degree % 7) * -0.42}s` }}
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r + 4}
                      fill="none"
                      stroke={role}
                      strokeWidth={n.degree >= 8 ? 1.3 : 0.9}
                      strokeOpacity={muted ? 0.04 : isSel ? 0.85 : Math.min(0.7, 0.18 + n.degree / 18)}
                      className="mc-net-ring"
                      style={{ animationDelay: `${(n.degree % 5) * -0.9}s` }}
                    />
                    <circle cx={p.x} cy={p.y} r={18} fill="transparent" />
                    <text
                      x={p.x}
                      y={p.y - r - 7}
                      textAnchor="middle"
                      className="pointer-events-none font-mono text-[13px]"
                      fill={muted ? "#3a3f47" : "#b6bfcb"}
                      stroke="#0b0d10"
                      strokeWidth={3}
                      paintOrder="stroke"
                    >
                      {shortAddr(n.addr, 6, 4)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="border-t border-line px-2.5 py-1.5">
            <p className="t-xs leading-relaxed text-fg4">
              An edge is two addresses appearing on the same launch — not a transfer and not proof
              of common ownership. <span className="text-acid">Lime</span> edges belong to the
              selected wallet, <span className="text-sky-400">blue</span> to a traced path, and
              every other edge stays faint so the highlighted shape reads first
            </p>
          </div>
        </div>

        <Inspector
          node={selectedNode}
          g={g}
          history={history}
          copied={copied}
          onCopy={copy}
          onSelect={selectWallet}
          onCompare={setCompareWith}
          compareWith={compareWith}
          clusters={allClusters}
          onFocusCluster={(id) => {
            setClusterFocus(id);
            setSelected(null);
          }}
          clusterFocus={clusterFocus}
        />
      </div>

      {/* ---------- path explorer ---------- */}
      <PathExplorer
        nodes={nodes}
        from={pathFrom}
        to={pathTo}
        onFrom={setPathFrom}
        onTo={setPathTo}
        path={path}
        onSelect={selectWallet}
      />

      {/* ---------- intelligence tabs ---------- */}
      <Intelligence
        tab={tab}
        onTab={setTab}
        selected={selectedNode}
        g={g}
        edges={edges}
        clusterFocus={clusterFocus}
        clause={allClusters}
        onSelect={selectFromList}
        onCompare={setCompareWith}
        compareWith={compareWith}
      />

      {comparison && (
        <Comparison
          cmp={comparison}
          onClear={() => setCompareWith(null)}
          onSelect={selectWallet}
        />
      )}
    </div>
  );
}

/* ==================================================================== *
 * Toolbar button
 * ==================================================================== */

function ToolBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="min-w-[22px] border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.04em] text-fg3 transition-colors hover:border-fg4 hover:text-fg2"
    >
      {children}
    </button>
  );
}

/* ==================================================================== *
 * Inspector — the selected wallet, and the actions on it
 * ==================================================================== */

function Inspector({
  node,
  g,
  history,
  copied,
  onCopy,
  onSelect,
  onCompare,
  compareWith,
  clusters,
  onFocusCluster,
  clusterFocus,
}: {
  node: NetworkNode | null;
  g: Graph;
  history: string[];
  copied: string | null;
  onCopy: (a: string) => void;
  onSelect: (a: string) => void;
  onCompare: (a: string | null) => void;
  compareWith: string | null;
  clusters: Cluster[];
  onFocusCluster: (id: number | null) => void;
  clusterFocus: number | null;
}) {
  if (!node) {
    return (
      <div className="panel flex flex-col overflow-hidden">
        <div className="border-b border-line px-2.5 py-1.5">
          <span className="t-eyebrow">inspector</span>
        </div>
        <div className="px-3 py-4">
          <p className="t-xs leading-relaxed text-fg4">
            Click a wallet in the graph to open it. Everything below follows that one selection
          </p>
        </div>

        {history.length > 0 && (
          <div className="border-t border-line px-2.5 py-2">
            <div className="t-eyebrow mb-1">recent</div>
            <div className="space-y-0.5">
              {history.slice(0, 5).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onSelect(a)}
                  className="block w-full truncate text-left font-mono text-[10px] text-fg3 hover:text-acid"
                >
                  {shortAddr(a, 8, 6)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-line px-2.5 py-2">
          <div className="t-eyebrow mb-1">clusters</div>
          <div className="space-y-0.5">
            {clusters.slice(0, 4).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onFocusCluster(clusterFocus === c.id ? null : c.id)}
                aria-pressed={clusterFocus === c.id}
                className={`flex w-full items-baseline gap-1.5 py-[2px] text-left text-[10px] ${
                  clusterFocus === c.id ? "text-acid" : "text-fg3 hover:text-fg2"
                }`}
              >
                <span className="font-mono tabular-nums">{c.size}w</span>
                <span className="truncate text-fg4">{c.symbols.slice(0, 3).join(" · ")}</span>
                <span className="ml-auto font-mono tabular-nums text-fg4">{c.coLaunches}L</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const p = node.profile;
  const b = classifyWallet(p);
  const nbrs = neighboursOf(g, node.addr);
  const tone = ROLE_TONE[b.label] ?? "#7d8794";
  const chain = CHAIN_BY_ID.solana;

  return (
    <div className="panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-2.5 py-1.5">
        <span className="t-eyebrow">inspector</span>
        <button
          type="button"
          onClick={() => onSelect(node.addr)}
          className="font-mono text-[9px] uppercase tracking-[0.06em] text-fg4 hover:text-fg2"
        >
          clear
        </button>
      </div>

      <div className="border-b border-line px-3 py-2">
        <div className="flex items-start gap-1.5">
          <span className="truncate font-mono text-[11px] text-fg2">{shortAddr(node.addr, 10, 8)}</span>
          <button
            type="button"
            onClick={() => onCopy(node.addr)}
            title="Copy full address"
            className="ml-auto shrink-0 border border-line px-1 py-[1px] font-mono text-[8px] uppercase text-fg4 hover:border-fg4 hover:text-fg2"
          >
            {copied === node.addr ? "copied" : "copy"}
          </button>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="inline-flex shrink-0 items-center border px-1.5 py-[1px] font-mono text-[9px] uppercase leading-[1.5] tracking-[0.07em]"
            style={{ color: tone, borderColor: `${tone}55`, background: `${tone}12` }}
          >
            {b.label}
          </span>
          <span className="font-mono text-[9px] tabular-nums text-fg4">
            {(b.confidence * 100).toFixed(0)}% conf
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-line">
        <Metric label="shared launches" value={String(p.launchCount)} hint="Recorded launches this address appears on" />
        <Metric label="connected" value={String(nbrs.length)} hint="Wallets sharing two or more launches with it" />
        <Metric
          label="median hold"
          value={p.medianHoldMin === null ? "—" : p.medianHoldMin < 60 ? `${p.medianHoldMin.toFixed(0)}m` : `${(p.medianHoldMin / 60).toFixed(1)}h`}
          hint="Median minutes between entering and its first sell"
          muted={p.medianHoldMin === null}
        />
        <Metric
          label="exit vs peak"
          value={p.medianExitAtPeak === null ? "—" : `${(p.medianExitAtPeak * 100).toFixed(0)}%`}
          hint="Share of the peak it typically sells at"
          muted={p.medianExitAtPeak === null}
        />
      </div>

      <div className="border-b border-line px-3 py-2">
        <div className="t-eyebrow mb-1">exit behaviour</div>
        <p className="t-xs leading-snug text-fg3">
          {p.stillHolding
            ? `Has not fully exited every position on record${
                p.soldShare === null
                  ? ""
                  : p.soldShare >= 1
                    ? " · sold its whole position in every launch"
                    : ` · sold ${(p.soldShare * 100).toFixed(0)}% of what it bought`
              }`
            : "Fully exited every position on record"}
          {p.rugCount > 0 && ` · ${p.rugCount} of ${p.launchCount} launches collapsed`}
        </p>
      </div>

      <div className="border-b border-line px-3 py-2">
        <div className="t-eyebrow mb-1">evidence</div>
        <ul className="space-y-1">
          {b.evidence.slice(0, 3).map((e) => (
            <li key={e} className="flex items-start gap-1.5">
              <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
              <span className="t-xs leading-snug text-fg3">{e}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-b border-line px-3 py-2">
        <div className="t-eyebrow mb-1">related</div>
        <div className="space-y-0.5">
          {nbrs.slice(0, 5).map(({ addr, edge }) => (
            <button
              key={addr}
              type="button"
              onClick={() => onSelect(addr)}
              className="flex w-full items-baseline gap-1.5 text-left"
            >
              <span
                aria-hidden
                className="mt-[4px] h-[4px] w-[4px] shrink-0"
                style={{ background: ROLE_TONE[g.nodes.get(addr)?.behaviour.label ?? ""] ?? "#7d8794" }}
              />
              <span className="font-mono text-[10px] text-fg3 hover:text-acid">{shortAddr(addr, 6, 4)}</span>
              <span className="ml-auto font-mono text-[9px] tabular-nums text-fg4">{edge.together}×</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-2.5 py-2">
        <a
          href={addressExplorer(chain.explorer(node.addr))}
          target="_blank"
          rel="noreferrer"
          className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.04em] text-fg3 hover:border-fg4 hover:text-fg2"
        >
          explorer
        </a>
        <Link
          href={`/wallets/${node.addr}`}
          className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.04em] text-fg3 hover:border-fg4 hover:text-fg2"
        >
          profile
        </Link>
        <button
          type="button"
          onClick={() => onCompare(compareWith === node.addr ? null : node.addr)}
          aria-pressed={compareWith === node.addr}
          className={`border px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.04em] ${
            compareWith === node.addr
              ? "border-acid text-acid"
              : "border-line text-fg3 hover:border-fg4 hover:text-fg2"
          }`}
        >
          {compareWith === node.addr ? "comparing" : "compare"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="border-t border-line px-2.5 py-1.5">
          <div className="t-eyebrow mb-1">recent</div>
          <div className="flex flex-wrap gap-1">
            {history.slice(0, 4).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onSelect(a)}
                className={`border px-1 py-[1px] font-mono text-[8px] ${
                  a === node.addr ? "border-acid/40 text-acid" : "border-line text-fg4 hover:text-fg2"
                }`}
              >
                {shortAddr(a, 4, 3)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  muted,
}: {
  label: string;
  value: string;
  hint: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-panel px-2.5 py-1.5" title={hint}>
      <div className="t-eyebrow">{label}</div>
      <div className={`font-mono text-[13px] tabular-nums ${muted ? "text-fg4" : "text-fg1"}`}>
        {value}
      </div>
    </div>
  );
}

/* ==================================================================== *
 * Path explorer
 * ==================================================================== */

function PathExplorer({
  nodes,
  from,
  to,
  onFrom,
  onTo,
  path,
  onSelect,
}: {
  nodes: NetworkNode[];
  from: string | null;
  to: string | null;
  onFrom: (a: string | null) => void;
  onTo: (a: string | null) => void;
  path: WalletPath | null;
  onSelect: (a: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = nodes.slice(0, 24);

  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <span className="t-eyebrow">path explorer</span>
        <span className="t-xs text-fg4">
          {path
            ? `${path.hops} hop${path.hops === 1 ? "" : "s"}`
            : "trace how two wallets are connected"}
        </span>
        <span className="ml-auto font-mono text-[9px] text-fg4">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-line px-2.5 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Select value={from} onChange={onFrom} options={options} label="from" />
            <span className="font-mono text-[9px] text-fg4">→</span>
            <Select value={to} onChange={onTo} options={options} label="to" />
            {from && to && (
              <button
                type="button"
                onClick={() => {
                  onFrom(null);
                  onTo(null);
                }}
                className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase text-fg4 hover:text-fg2"
              >
                clear
              </button>
            )}
          </div>

          {from && to && !path && (
            <p className="mt-1.5 t-xs leading-relaxed text-fg4">
              No path through shared launches at two or more co-appearances. These two may still be
              connected through pairs the graph does not draw — try lowering the co-appearance floor
            </p>
          )}

          {path && path.hops === 0 && (
            <p className="mt-1.5 t-xs text-fg4">Same wallet on both ends</p>
          )}

          {path && path.hops > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap items-center gap-1">
                {path.addrs.map((a, i) => (
                  <span key={a} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="font-mono text-[9px] text-fg4" title={`${path.via[i - 1].together} shared launches · ${path.via[i - 1].symbol}`}>
                        →
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelect(a)}
                      className="border border-line px-1 py-[1px] font-mono text-[9px] text-fg3 hover:border-acid hover:text-acid"
                    >
                      {shortAddr(a, 4, 3)}
                    </button>
                  </span>
                ))}
              </div>
              <p className="mt-1 t-xs leading-relaxed text-fg4">
                {path.hops} hop{path.hops === 1 ? "" : "s"} through{" "}
                {path.via.map((v) => `${v.symbol} (${v.together}×)`).join(", ")}. Highlighted in blue
                on the graph — this is co-appearance, not a funding trail
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string | null;
  onChange: (a: string | null) => void;
  options: NetworkNode[];
  label: string;
}) {
  return (
    <label className="flex items-center gap-1">
      <span className="font-mono text-[9px] uppercase text-fg4">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="max-w-[130px] border border-line bg-panel px-1 py-[2px] font-mono text-[9.5px] text-fg2 outline-none focus:border-acid"
      >
        <option value="">—</option>
        {options.map((n) => (
          <option key={n.addr} value={n.addr}>
            {shortAddr(n.addr, 5, 4)} · {n.degree}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ==================================================================== *
 * Intelligence tabs
 * ==================================================================== */

function Intelligence({
  tab,
  onTab,
  selected,
  g,
  edges,
  clusterFocus,
  clause,
  onSelect,
  onCompare,
  compareWith,
}: {
  tab: "participants" | "launches" | "behaviour" | "connections";
  onTab: (t: "participants" | "launches" | "behaviour" | "connections") => void;
  selected: NetworkNode | null;
  g: Graph;
  edges: NetworkEdge[];
  clusterFocus: number | null;
  clause: Cluster[];
  onSelect: (a: string) => void;
  onCompare: (a: string | null) => void;
  compareWith: string | null;
}) {
  const nbrs = selected ? neighboursOf(g, selected.addr) : [];
  const tabs = [
    { id: "participants" as const, label: "Repeat participants", n: nbrs.length },
    { id: "launches" as const, label: "Shared launches", n: selected?.profile.launchCount ?? 0 },
    { id: "behaviour" as const, label: "Wallet behaviour", n: null },
    { id: "connections" as const, label: "Connections", n: selected ? nbrs.length : edges.length },
  ];

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-0 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-pressed={tab === t.id}
            className={`border-r border-line px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.05em] transition-colors ${
              tab === t.id
                ? "border-b-2 border-b-acid bg-acid/8 text-acid"
                : "text-fg4 hover:text-fg2"
            }`}
          >
            {t.label}
            {t.n !== null && <span className="ml-1 tabular-nums text-fg4">{t.n}</span>}
          </button>
        ))}
        <span className="ml-auto px-2.5 font-mono text-[9px] text-fg4">
          {selected ? shortAddr(selected.addr, 6, 4) : "no wallet selected"}
        </span>
      </div>

      {tab === "participants" && (
        <Participants selected={selected} nbrs={nbrs} onSelect={onSelect} onCompare={onCompare} compareWith={compareWith} g={g} />
      )}
      {tab === "launches" && <SharedLaunches selected={selected} />}
      {tab === "behaviour" && <BehaviourTab selected={selected} />}
      {tab === "connections" && (
        <ConnectionsTab selected={selected} edges={edges} clusterFocus={clusterFocus} clause={clause} onSelect={onSelect} />
      )}
    </div>
  );
}

function Participants({
  selected,
  nbrs,
  g,
  onSelect,
  onCompare,
  compareWith,
}: {
  selected: NetworkNode | null;
  nbrs: { addr: string; edge: NetworkEdge }[];
  g: Graph;
  onSelect: (a: string) => void;
  onCompare: (a: string | null) => void;
  compareWith: string | null;
}) {
  if (!selected) {
    return (
      <div className="px-3 py-3">
        <p className="t-xs leading-relaxed text-fg4">
          Select a wallet in the graph to list the addresses it keeps appearing with, ranked by how
          many launches they share
        </p>
      </div>
    );
  }
  if (nbrs.length === 0) {
    return (
      <div className="px-3 py-3">
        <p className="t-xs leading-relaxed text-fg4">
          {shortAddr(selected.addr, 6, 4)} has no repeat partner at two or more shared launches. It
          appears alone in every recorded launch
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-b border-line px-3 py-1">
        <span className="t-eyebrow pl-[10px]">address</span>
        <span className="t-eyebrow text-right">shared</span>
        <span className="t-eyebrow text-right">symbols</span>
        <span className="w-14" />
      </div>
      {nbrs.map(({ addr, edge }) => {
        const nd = g.nodes.get(addr);
        return (
          <div
            key={addr}
            className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-b border-line px-3 py-1 last:border-b-0 ${
              compareWith === addr ? "bg-sky-400/5" : ""
            }`}
          >
            <button type="button" onClick={() => onSelect(addr)} className="flex min-w-0 items-center gap-1.5 text-left">
              <span
                aria-hidden
                className="h-[4px] w-[4px] shrink-0"
                style={{ background: ROLE_TONE[nd?.behaviour.label ?? ""] ?? "#7d8794" }}
              />
              <span className="truncate font-mono text-[10px] text-fg2 hover:text-acid">
                {shortAddr(addr, 6, 4)}
              </span>
              <span className="hidden shrink-0 text-[9px] text-fg4 sm:inline">
                {nd?.behaviour.label}
              </span>
            </button>
            <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
              {edge.together}×
            </span>
            <span className="max-w-[100px] truncate text-right text-[9px] text-fg4">
              {edge.symbols.slice(0, 2).join(" · ")}
            </span>
            <button
              type="button"
              onClick={() => onCompare(compareWith === addr ? null : addr)}
              className={`w-14 border px-1 py-[1px] font-mono text-[8px] uppercase ${
                compareWith === addr ? "border-sky-400 text-sky-400" : "border-line text-fg4 hover:text-fg2"
              }`}
            >
              {compareWith === addr ? "cmp" : "vs"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SharedLaunches({ selected }: { selected: NetworkNode | null }) {
  if (!selected) {
    return (
      <div className="px-3 py-3">
        <p className="t-xs text-fg4">Select a wallet to see the launches behind its numbers</p>
      </div>
    );
  }
  const app = selected.profile.appearances;
  if (app.length === 0) {
    return <div className="px-3 py-3"><p className="t-xs text-fg4">No recorded launch for this address</p></div>;
  }
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 border-b border-line px-3 py-1">
        <span className="t-eyebrow">launch</span>
        <span className="t-eyebrow text-right">bought</span>
        <span className="t-eyebrow text-right">sold</span>
        <span className="t-eyebrow text-right">held</span>
        <span className="t-eyebrow text-right">exit</span>
      </div>
      {app.map((a) => (
        <div
          key={a.launch.mint + a.row.addr}
          className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 border-b border-line px-3 py-1 last:border-b-0"
        >
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-mono text-[10px] text-fg2">{a.launch.symbol}</span>
            {a.launch.rugged && <span className="font-mono text-[8px] uppercase text-bad">rug</span>}
            {a.atLaunch && <span className="font-mono text-[8px] uppercase text-warn">0s</span>}
          </span>
          <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
            {a.row.bought.toFixed(1)}%
          </span>
          <span className="text-right font-mono text-[10px] tabular-nums text-fg4">
            {a.row.sold.toFixed(0)}%
          </span>
          <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
            {a.row.holdMin === null ? "—" : a.row.holdMin < 60 ? `${a.row.holdMin.toFixed(0)}m` : `${(a.row.holdMin / 60).toFixed(1)}h`}
          </span>
          <span className="text-right font-mono text-[10px] tabular-nums text-fg4">
            {a.row.exitAtPeakFrac === null ? "—" : `${(a.row.exitAtPeakFrac * 100).toFixed(0)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

function BehaviourTab({ selected }: { selected: NetworkNode | null }) {
  if (!selected) {
    return <div className="px-3 py-3"><p className="t-xs text-fg4">Select a wallet to read how it behaves</p></div>;
  }
  const p = selected.profile;
  const b = classifyWallet(p);
  const rows: { k: string; v: string; hint: string }[] = [
    { k: "verdict", v: b.label, hint: "Derived from its own rows, not a score" },
    { k: "confidence", v: `${(b.confidence * 100).toFixed(0)}%`, hint: "How much of the behaviour the rows actually pin down" },
    { k: "median entry", v: p.medianEntrySec === null ? "—" : `${p.medianEntrySec.toFixed(0)}s after open`, hint: "Inside 2s is the bundle signature" },
    { k: "bundle entries", v: `${p.bundleCount} of ${p.launchCount}`, hint: "Launches where it bought in the creation block" },
    { k: "median hold", v: p.medianHoldMin === null ? "—" : p.medianHoldMin < 60 ? `${p.medianHoldMin.toFixed(0)} min` : `${(p.medianHoldMin / 60).toFixed(1)} h`, hint: "Between entering and its first sell" },
    { k: "median exit vs peak", v: p.medianExitAtPeak === null ? "—" : `${(p.medianExitAtPeak * 100).toFixed(0)}%`, hint: "Higher means it sells closer to the top" },
    { k: "total bought", v: `${p.totalBought.toFixed(1)}%`, hint: "Sum of position sizes across launches" },
    { k: "share sold", v: p.soldShare === null ? "—" : `${(p.soldShare * 100).toFixed(0)}%`, hint: "Pooled across every position" },
    { k: "launches collapsed", v: `${p.rugCount} of ${p.launchCount}`, hint: "Fell more than 90% from peak after it appeared" },
  ];
  return (
    <div>
      {rows.map((r) => (
        <div key={r.k} className="flex items-baseline gap-2 border-b border-line px-3 py-1 last:border-b-0" title={r.hint}>
          <span className="text-[10px] text-fg4">{r.k}</span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-fg2">{r.v}</span>
        </div>
      ))}
      <div className="border-t border-line px-3 py-2">
        <div className="t-eyebrow mb-1">evidence</div>
        <ul className="space-y-1">
          {b.evidence.map((e) => (
            <li key={e} className="flex items-start gap-1.5">
              <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
              <span className="t-xs leading-snug text-fg3">{e}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ConnectionsTab({
  selected,
  edges,
  clusterFocus,
  clause,
  onSelect,
}: {
  selected: NetworkNode | null;
  edges: NetworkEdge[];
  clusterFocus: number | null;
  clause: Cluster[];
  onSelect: (a: string) => void;
}) {
  const cl = clusterFocus !== null ? clause.find((c) => c.id === clusterFocus) ?? null : null;

  return (
    <div>
      {selected && (
        <div className="border-b border-line px-3 py-2">
          <div className="t-eyebrow mb-1">group read</div>
          <GroupSummary addr={selected.addr} />
        </div>
      )}

      <div className="px-3 py-2">
        <div className="t-eyebrow mb-1">
          {cl ? `cluster of ${cl.size}` : `strongest pairs in view`}
        </div>
        <div className="space-y-0.5">
          {(cl ? edges.filter((e) => cl.addrs.includes(e.a) && cl.addrs.includes(e.b)) : [...edges].sort((a, b) => b.together - a.together))
            .slice(0, 8)
            .map((e) => (
              <button
                key={e.a + e.b}
                type="button"
                onClick={() => onSelect(e.a)}
                className="flex w-full items-baseline gap-1.5 text-left"
              >
                <span className="font-mono text-[9.5px] text-fg3 hover:text-acid">{shortAddr(e.a, 4, 3)}</span>
                <span className="font-mono text-[9px] text-fg4">↔</span>
                <span className="font-mono text-[9.5px] text-fg3 hover:text-acid">{shortAddr(e.b, 4, 3)}</span>
                <span className="ml-auto shrink-0 font-mono text-[9px] tabular-nums text-fg4">
                  {e.together}× {e.alwaysAtLaunch && <span className="text-warn">0s</span>}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function GroupSummary({ addr }: { addr: string }) {
  const nbrs = useMemo(() => {
    const net = walletNetwork();
    const g = buildGraph(net);
    return neighboursOf(g, addr).map((n) => n.addr);
  }, [addr]);

  const gb = useMemo(() => groupBehaviour([addr, ...nbrs.slice(0, 4)]), [addr, nbrs]);
  if (gb.coLaunches.length === 0) {
    return <p className="t-xs text-fg4">No launch shared with a repeat partner</p>;
  }
  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] text-fg4">shared launches</span>
        <span className="ml-auto font-mono text-[10px] tabular-nums text-fg2">{gb.coLaunches.length}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] text-fg4">median hold</span>
        <span className="ml-auto font-mono text-[10px] tabular-nums text-fg2">
          {gb.medianHoldMin === null ? "—" : gb.medianHoldMin < 60 ? `${gb.medianHoldMin.toFixed(0)}m` : `${(gb.medianHoldMin / 60).toFixed(1)}h`}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] text-fg4">exit style</span>
        <span className="ml-auto font-mono text-[10px] text-fg2">{gb.style}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] text-fg4">peak supply held</span>
        <span className="ml-auto font-mono text-[10px] tabular-nums text-fg2">{gb.peakGroupPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

/* ==================================================================== *
 * Comparison
 * ==================================================================== */

function Comparison({
  cmp,
  onClear,
  onSelect,
}: {
  cmp: NonNullable<ReturnType<typeof compareWallets>>;
  onClear: () => void;
  onSelect: (a: string) => void;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-2.5 py-1.5">
        <span className="t-eyebrow">comparison</span>
        <span className="font-mono text-[9px] text-fg4">
          {shortAddr(cmp.a.addr, 5, 4)} vs {shortAddr(cmp.b.addr, 5, 4)}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-fg4 hover:text-fg2"
        >
          close
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-panel px-3 py-1">
        <span className="t-eyebrow">metric</span>
        <span />
        <span className="t-eyebrow text-right">value</span>
      </div>

      {cmp.rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[1fr_1fr_1fr] items-baseline gap-2 border-b border-line px-3 py-1 last:border-b-0">
          <span
            className={`font-mono text-[10px] tabular-nums ${r.better === "a" ? "text-acid" : r.a === null ? "text-fg4" : "text-fg2"}`}
            title={r.hint}
          >
            {r.a ?? "—"}
          </span>
          <span className="text-center text-[9px] uppercase tracking-[0.04em] text-fg4">{r.label}</span>
          <span
            className={`text-right font-mono text-[10px] tabular-nums ${r.better === "b" ? "text-acid" : r.b === null ? "text-fg4" : "text-fg2"}`}
            title={r.hint}
          >
            {r.b ?? "—"}
          </span>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2 border-t border-line px-3 py-2">
        <div>
          <div className="t-eyebrow mb-1">shared launches</div>
          <p className="t-xs text-fg3">
            {cmp.shared.length === 0
              ? "None — they never appear on the same launch"
              : cmp.shared.map((l) => l.symbol).join(" · ")}
          </p>
        </div>
        <div>
          <div className="t-eyebrow mb-1">overlapping connections</div>
          <p className="t-xs text-fg3">
            {cmp.sharedNeighbours.length === 0
              ? "No wallet shares a launch with both"
              : `${cmp.sharedNeighbours.length} wallets share a launch with both`}
          </p>
        </div>
      </div>

      {cmp.path && cmp.path.hops > 0 && (
        <div className="border-t border-line px-3 py-2">
          <div className="t-eyebrow mb-1">path between them</div>
          <div className="flex flex-wrap items-center gap-1">
            {cmp.path.addrs.map((a, i) => (
              <span key={a} className="flex items-center gap-1">
                {i > 0 && <span className="font-mono text-[9px] text-fg4">→</span>}
                <button
                  type="button"
                  onClick={() => onSelect(a)}
                  className="border border-line px-1 py-[1px] font-mono text-[9px] text-fg3 hover:border-acid hover:text-acid"
                >
                  {shortAddr(a, 4, 3)}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================================================================== *
 * Flow — particles on the real path
 * ==================================================================== */

const FLOW_COUNT = 2;
const TRAIL = 5;

const Flow = memo(function Flow({
  g,
  active,
  muted,
  onPath,
  seedIndex,
}: {
  g: EdgeGeom;
  active: boolean;
  muted: boolean;
  onPath: boolean;
  seedIndex: number;
}) {
  const headRefs = useRef<(SVGCircleElement | null)[]>([]);
  const trailRefs = useRef<(SVGCircleElement | null)[][]>([]);
  const [pathEl, setPathEl] = useState<SVGPathElement | null>(null);

  const live = useRef({ active, muted, onPath });
  useEffect(() => {
    live.current = { active, muted, onPath };
  }, [active, muted, onPath]);

  useEffect(() => {
    if (!pathEl) return;
    const path: SVGPathElement = pathEl;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const len = path.getTotalLength();
    if (len < 1) return;

    const parts = Array.from({ length: FLOW_COUNT }, (_, i) => {
      const seed = (seedIndex * (i + 3) * 37) % 1000;
      return {
        offset: seed / 1000,
        speed: 0.00007 + ((seed % 47) / 47) * 0.00008,
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
      const { active: isActive, muted: isMuted, onPath: isPath } = live.current;
      for (let i = 0; i < FLOW_COUNT; i++) {
        const p = parts[i];
        const raw = (t * p.speed + p.offset) % 1;
        const u = p.dir === 1 ? raw : 1 - raw;

        const head = headRefs.current[i];
        if (head) {
          const pt = path.getPointAtLength(u * len);
          head.setAttribute("cx", pt.x.toFixed(2));
          head.setAttribute("cy", pt.y.toFixed(2));
          const fade = u < 0.04 ? u / 0.04 : u > 0.96 ? (1 - u) / 0.04 : 1;
          head.style.opacity = String((isMuted ? 0.05 : isPath ? 1 : isActive ? 0.95 : 0.28) * fade);
        }

        const dots = trailRefs.current[i];
        if (!dots) continue;
        for (let k = 0; k < TRAIL; k++) {
          const dot = dots[k];
          if (!dot) continue;
          const tu = u - (k + 1) * 0.02 * (p.dir === 1 ? 1 : -1);
          if (tu < 0.02 || tu > 0.98) {
            dot.style.opacity = "0";
            continue;
          }
          const tp = path.getPointAtLength(tu * len);
          dot.setAttribute("cx", tp.x.toFixed(2));
          dot.setAttribute("cy", tp.y.toFixed(2));
          const f = 1 - k / TRAIL;
          dot.style.opacity = String((isMuted ? 0.03 : isPath ? 0.5 : isActive ? 0.45 : 0.12) * f * f);
        }
      }
      raf = visible && !motion.matches ? requestAnimationFrame(tick) : 0;
    }

    function hideAll() {
      for (const h of headRefs.current) if (h) h.style.opacity = "0";
      for (const dots of trailRefs.current) {
        if (!dots) continue;
        for (const d of dots) if (d) d.style.opacity = "0";
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
    const onMotionChange = () => (motion.matches ? stop() : start());
    motion.addEventListener("change", onMotionChange);
    if (!motion.matches) start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      motion.removeEventListener("change", onMotionChange);
      io.disconnect();
    };
  }, [pathEl, seedIndex]);

  const setTrail = useMemo(
    () =>
      Array.from({ length: FLOW_COUNT }, (_, i) =>
        Array.from({ length: TRAIL }, (__, k) => (el: SVGCircleElement | null) => {
          if (!trailRefs.current[i]) trailRefs.current[i] = [];
          trailRefs.current[i][k] = el;
        }),
      ),
    [],
  );
  const setHead = useMemo(
    () =>
      Array.from({ length: FLOW_COUNT }, (_, i) => (el: SVGCircleElement | null) => {
        headRefs.current[i] = el;
      }),
    [],
  );
  const setPath = useCallback((el: SVGPathElement | null) => setPathEl(el), []);

  const colour = onPath ? "#7dd3fc" : active ? "var(--color-acid)" : "#7dd3fc";

  return (
    <g className="pointer-events-none" aria-hidden>
      <path ref={setPath} d={g.path} fill="none" stroke="none" strokeWidth={0} />
      {Array.from({ length: FLOW_COUNT }).map((_, i) => (
        <g key={`${g.key}-p${i}`}>
          {Array.from({ length: TRAIL }).map((__, k) => (
            <circle key={k} ref={setTrail[i][k]} r={Math.max(0.5, 1.1 - k * 0.15)} fill={colour} opacity={0} />
          ))}
          <circle ref={setHead[i]} r={1.7} fill={colour} opacity={0} />
        </g>
      ))}
    </g>
  );
});
