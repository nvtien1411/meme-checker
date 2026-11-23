"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/* ==================================================================== *
 * GRAPH — a canvas network whose motion is the data.
 *
 * The rule that separates this from a decorative network: every edge is a
 * relationship that exists in the record, and the order nodes appear is the
 * order the investigation found them. Nothing animates because it looks good.
 *
 * Three motion states, and each one means something:
 *
 *   discovered  the node exists in the record but this view has not reached it
 *   active      the currently selected path
 *   idle        known, not on the active path
 *
 * Edges draw with stroke-dashoffset in the direction of the relationship, and
 * particles travel along them only when the relationship has a direction worth
 * showing — a funder funded a wallet. Edges that mean "appears with" carry no
 * particles, because inventing a direction there would be a claim the data does
 * not make.
 *
 * Performance: one canvas, one requestAnimationFrame loop that stops when the
 * graph is off-screen or when reduced motion is set. No DOM node per particle.
 * ==================================================================== */

export interface GraphNode {
  id: string;
  label: string;
  sub?: string;
  kind: "token" | "wallet" | "deployer" | "caller" | "launch";
  /** Discovery order — drives the entrance sequence. */
  order: number;
  href?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  tone: "info" | "bad" | "acid" | "warn";
  /** True only when the edge has a real direction (funded, deployed, bought). */
  directed?: boolean;
}

const TONE: Record<GraphEdge["tone"], string> = {
  info: "#4ea8ff",
  bad: "#ff4d5e",
  acid: "#c6ff43",
  warn: "#f7c14a",
};

const KIND_COLOR: Record<GraphNode["kind"], string> = {
  token: "#c6ff43",
  wallet: "#4ea8ff",
  deployer: "#ff4d5e",
  caller: "#f7c14a",
  launch: "#a78bfa",
};

export function Graph({
  nodes,
  edges,
  height = 420,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Positions are computed once from the discovery order, on a ring with the
  // earliest-discovered entity at the centre. A layout that settles differently
  // on every render is a layout nobody can compare against last time.
  const layout = useMemo(() => {
    const byId = new Map<string, { x: number; y: number; r: number }>();
    const sorted = [...nodes].sort((a, b) => a.order - b.order);
    const R = Math.min(150, 110 + sorted.length * 3);

    sorted.forEach((n, i) => {
      if (i === 0) {
        byId.set(n.id, { x: 0, y: 0, r: 7.5 });
        return;
      }
      const ring = i <= 5 ? 0 : 1;
      const ringCount = ring === 0 ? Math.min(5, sorted.length - 1) : sorted.length - 6;
      const idx = ring === 0 ? i - 1 : i - 6;
      const radius = ring === 0 ? R * 0.55 : R;
      const angle = (idx / Math.max(1, ringCount)) * Math.PI * 2 - Math.PI / 2 + (ring === 1 ? 0.35 : 0);
      byId.set(n.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        r: n.kind === "token" ? 7 : 5.5,
      });
    });
    return byId;
  }, [nodes]);

  const activeSet = useMemo(() => {
    const focus = selected ?? hover;
    if (!focus) return null;
    const set = new Set<string>([focus]);
    for (const e of edges) {
      if (e.from === focus) set.add(e.to);
      if (e.to === focus) set.add(e.from);
    }
    return set;
  }, [selected, hover, edges]);

  // ---- draw loop ---------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let started = performance.now();
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Stop the loop entirely when the graph scrolls away. A canvas that keeps
    // drawing off-screen is the most common way a "lightweight" animation
    // drains a laptop battery.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) loop();
      },
      { rootMargin: "120px" },
    );
    io.observe(wrap);

    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    function draw(now: number) {
      if (!ctx) return;
      const t = now - started;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;

      // ---- edges ---------------------------------------------------------
      for (const e of edges) {
        const a = layout.get(e.from);
        const b = layout.get(e.to);
        if (!a || !b) continue;

        const focus = selected ?? hover;
        const dim = focus !== null && !(e.from === focus || e.to === focus);
        const onPath = focus !== null && (e.from === focus || e.to === focus);

        // draw-on: an edge appears only after both its endpoints were
        // discovered, and the delay is the later of the two orders. The
        // sequence is the information.
        const na = nodeById.get(e.from);
        const nb = nodeById.get(e.to);
        const appear = reduce ? 0 : Math.max(na?.order ?? 0, nb?.order ?? 0) * 130;
        const progress = Math.max(0, Math.min(1, (t - appear) / 620));
        if (progress <= 0) continue;

        const x1 = cx + a.x;
        const y1 = cy + a.y;
        const x2 = cx + b.x;
        const y2 = cy + b.y;
        const len = Math.hypot(x2 - x1, y2 - y1);

        ctx.save();
        ctx.strokeStyle = TONE[e.tone];
        ctx.globalAlpha = dim ? 0.07 : onPath ? 0.75 : 0.28;
        ctx.lineWidth = onPath ? 1.5 : 1;
        ctx.setLineDash([len, len]);
        ctx.lineDashOffset = len * (1 - progress);

        // direction: draw from the earlier-discovered end so the line grows
        // outward from what was known first.
        const fromA = (na?.order ?? 0) <= (nb?.order ?? 0);
        ctx.beginPath();
        if (fromA) {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        } else {
          ctx.moveTo(x2, y2);
          ctx.lineTo(x1, y1);
        }
        ctx.stroke();

        // arrowhead on directed edges only. Without it every line reads as
        // co-appearance, which is the weaker claim.
        if (e.directed && progress > 0.85) {
          const ang = Math.atan2(y2 - y1, x2 - x1);
          // Place the head 62% along the edge rather than at its tip: the tip is
          // inside the destination node, where a 5px triangle is invisible.
          const at = 0.62;
          const tipX = fromA ? x1 + (x2 - x1) * at : x2 + (x1 - x2) * at;
          const tipY = fromA ? y1 + (y2 - y1) * at : y2 + (y1 - y2) * at;
          const a2 = fromA ? ang : ang + Math.PI;
          const size = onPath ? 9 : 7;
          ctx.globalAlpha = dim ? 0.08 : onPath ? 0.9 : 0.4;
          ctx.fillStyle = TONE[e.tone];
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX - Math.cos(a2 - 0.4) * size, tipY - Math.sin(a2 - 0.4) * size);
          ctx.lineTo(tipX - Math.cos(a2 + 0.4) * size, tipY - Math.sin(a2 + 0.4) * size);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // ---- particles: only on directed edges, only when the path is live --
        if (e.directed && !reduce && onPath && progress >= 1) {
          const speed = 0.00022;
          const phase = (t * speed) % 1;
          const px = x1 + (x2 - x1) * phase;
          const py = y1 + (y2 - y1) * phase;
          ctx.save();
          ctx.fillStyle = TONE[e.tone];
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(px, py, 1.9, 0, Math.PI * 2);
          ctx.fill();
          // a short trail so the dot reads as movement, not a stray pixel
          ctx.globalAlpha = 0.28;
          ctx.beginPath();
          ctx.arc(x1 + (x2 - x1) * Math.max(0, phase - 0.04), y1 + (y2 - y1) * Math.max(0, phase - 0.04), 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ---- nodes ---------------------------------------------------------
      for (const n of nodes) {
        const p = layout.get(n.id);
        if (!p) continue;
        const appear = reduce ? 0 : n.order * 130;
        const k = Math.max(0, Math.min(1, (t - appear) / 380));
        if (k <= 0) continue;

        const dim = activeSet ? !activeSet.has(n.id) : false;
        const isFocus = (selected ?? hover) === n.id;
        const colour = KIND_COLOR[n.kind];
        const ease = 1 - Math.pow(1 - k, 3);
        const radius = p.r * ease * (isFocus ? 1.35 : 1);

        ctx.save();
        ctx.globalAlpha = dim ? 0.12 : 1;

        // halo on the focused node only — restrained, no neon bloom
        if (isFocus) {
          ctx.globalAlpha = 0.16;
          ctx.fillStyle = colour;
          ctx.beginPath();
          ctx.arc(cx + p.x, cy + p.y, radius + 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, Math.max(0.5, radius), 0, Math.PI * 2);
        ctx.fill();

        // the label rides with the node, revealed once it has arrived
        if (k > 0.65) {
          const ly = cy + p.y + radius + 12;
          ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.textAlign = "center";
          const tw = ctx.measureText(n.label).width;
          ctx.globalAlpha = dim ? 0.08 : 0.72;
          ctx.fillStyle = "#08090b";
          ctx.fillRect(cx + p.x - tw / 2 - 3, ly - 9, tw + 6, 13);
          ctx.globalAlpha = dim ? 0.15 : 1;
          ctx.fillStyle = isFocus ? "#f1f3f2" : "#cdd5e0";
          ctx.fillText(n.label, cx + p.x, ly);
        }
        ctx.restore();
      }

      raf = 0;
      if (visible) raf = requestAnimationFrame(draw);
    }

    function loop() {
      if (!raf) raf = requestAnimationFrame(draw);
    }

    started = performance.now();
    loop();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [nodes, edges, layout, selected, hover, activeSet, height, ready]);

  // ---- hit testing -------------------------------------------------------
  function hit(clientX: number, clientY: number): string | null {
    const el = canvasRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return null;
    const rect = wrap.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - height / 2;
    let best: string | null = null;
    let bestD = 16;
    for (const n of nodes) {
      const p = layout.get(n.id);
      if (!p) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) {
        bestD = d;
        best = n.id;
      }
    }
    return best;
  }

  const selectedNode = selected ? nodes.find((n) => n.id === selected) ?? null : null;
  const selectedEdges = selected
    ? edges.filter((e) => e.from === selected || e.to === selected)
    : [];

  return (
    <div className="border border-line">
      <div ref={wrapRef} className="relative" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="block"
          onMouseMove={(ev) => {
            if (!ready) setReady(true);
            const id = hit(ev.clientX, ev.clientY);
            setHover(id);
            if (canvasRef.current) canvasRef.current.style.cursor = id ? "pointer" : "default";
          }}
          onMouseLeave={() => setHover(null)}
          onClick={(ev) => {
            const id = hit(ev.clientX, ev.clientY);
            setSelected(id && id !== selected ? id : null);
          }}
          role="img"
          aria-label="Entity network: tokens, wallets, deployers and callers connected by recorded relationships"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
          {(Object.keys(KIND_COLOR) as GraphNode["kind"][]).map((k) => (
            <span key={k} className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.06em] text-fg4">
              <span aria-hidden className="h-[5px] w-[5px]" style={{ background: KIND_COLOR[k] }} />
              {k}
            </span>
          ))}
        </div>
      </div>

      {selectedNode ? (
        <div className="border-t border-line">
          <div className="flex flex-wrap items-baseline gap-2 bg-surf2/40 px-3 py-1.5">
            <span aria-hidden className="h-[5px] w-[5px] self-center" style={{ background: KIND_COLOR[selectedNode.kind] }} />
            <span className="t-xs font-semibold text-fg">{selectedNode.label}</span>
            {selectedNode.sub && <span className="t-xs text-fg4">{selectedNode.sub}</span>}
            {selectedNode.href && (
              <Link href={selectedNode.href} className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-acid hover:underline">
                open
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-mono text-[9px] uppercase tracking-[0.06em] text-fg4 hover:text-fg2"
            >
              clear
            </button>
          </div>
          <div className="px-3 py-1.5">
            {selectedEdges.length === 0 ? (
              <p className="t-xs text-fg4">No recorded relationship from this entity</p>
            ) : (
              selectedEdges.map((e) => {
                const other = e.from === selected ? e.to : e.from;
                const otherNode = nodes.find((n) => n.id === other);
                // The direction word matters: "funded" and "appears with" are
                // different strengths of claim.
                const dir = e.directed
                  ? e.from === selected
                    ? e.label
                    : `← ${e.label}`
                  : e.label;
                return (
                  <div key={e.from + e.to} className="flex items-baseline gap-2 border-b border-line py-[3px] last:border-b-0">
                    <span className="font-mono text-[9px] uppercase tracking-[0.05em]" style={{ color: TONE[e.tone] }}>
                      {dir}
                    </span>
                    <span className="t-xs text-fg3">{otherNode?.label ?? other}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-line px-3 py-1.5">
          <p className="t-xs leading-relaxed text-fg4">
            Arrowed edges carry a direction: funded, deployed, bought, posted. Plain lines are
            co-appearance only. The entrance order is the order the record found them
          </p>
        </div>
      )}
    </div>
  );
}
