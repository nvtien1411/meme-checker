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
  const interactionRef = useRef<{ selected: string | null; hover: string | null }>({
    selected: null,
    hover: null,
  });

  useEffect(() => {
    interactionRef.current.selected = selected;
  }, [selected]);

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

  const neighborsById = useMemo(() => {
    const byId = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!byId.has(e.from)) byId.set(e.from, new Set());
      if (!byId.has(e.to)) byId.set(e.to, new Set());
      byId.get(e.from)!.add(e.to);
      byId.get(e.to)!.add(e.from);
    }
    return byId;
  }, [edges]);

  // ---- draw loop ---------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = motionQuery.matches;
    const onMotionChange = (ev: MediaQueryListEvent) => {
      reduce = ev.matches;
      if (reduce) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
        draw(performance.now());
      } else {
        loop();
      }
    };
    motionQuery.addEventListener("change", onMotionChange);
    let raf = 0;
    let visible = true;
    const started = performance.now();
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

    /* ------------------------------------------------------------------
     * Curve geometry with an arc-length table.
     *
     * A quadratic Bézier does not advance at constant speed in its parameter:
     * t=0.5 sits closer to one end on curves with strong asymmetry, so a
     * particle moved by raw t visibly accelerates through the bend. The table
     * below is sampled once per edge and used to map distance -> point, which is
     * what makes a stream read as travelling at a steady rate.
     *
     * The control point is offset perpendicular to the chord, so every edge bows
     * the same way relative to its own direction and parallel edges fan apart
     * instead of overlapping.
     * ------------------------------------------------------------------ */

    interface Stream {
      phase: number;
      speed: number;
      dir: 1 | -1;
      colour: string;
      alpha: number;
    }

    interface EdgeGeom {
      edge: GraphEdge;
      p0: { x: number; y: number };
      p1: { x: number; y: number };
      ctrl: { x: number; y: number };
      pointAt: (u: number) => { x: number; y: number };
      streams: Stream[];
    }

    const SAMPLES = 24;
    const geometry: EdgeGeom[] = [];

    for (const e of edges) {
      const a = layout.get(e.from);
      const b = layout.get(e.to);
      if (!a || !b) continue;

      // Bow the chord perpendicular to its own direction.
      //
      // 12% was too shallow to read: with edges radiating from a centre, the
      // perpendicular offset is nearly radial and the curve looks like a
      // straight line at a glance. 26% is enough that every edge reads as an arc,
      // and the sign is derived from the edge id rather than always positive, so
      // edges on the same chord bow to opposite sides instead of stacking.
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const nx = -dy;
      const ny = dx;
      const nlen = Math.hypot(nx, ny) || 1;
      const chord = Math.hypot(dx, dy);
      const sign = ((e.from + e.to).length % 2 === 0) ? 1 : -1;
      const bow = (0.26 + (chord > 150 ? 0.06 : 0)) * chord * sign;
      const ctrl = { x: mx + (nx / nlen) * bow, y: my + (ny / nlen) * bow };

      // sample the curve, accumulate arc length
      const pts: { x: number; y: number }[] = [];
      const cum: number[] = [];
      let acc = 0;
      for (let i = 0; i <= SAMPLES; i++) {
        const t2 = i / SAMPLES;
        const it = 1 - t2;
        const x = it * it * a.x + 2 * it * t2 * ctrl.x + t2 * t2 * b.x;
        const y = it * it * a.y + 2 * it * t2 * ctrl.y + t2 * t2 * b.y;
        if (i > 0) {
          const prev = pts[i - 1];
          acc += Math.hypot(x - prev.x, y - prev.y);
        }
        pts.push({ x, y });
        cum.push(acc);
      }
      const total = acc || 1;

      // distance -> point, by binary search on the cumulative table
      const pointAt = (u: number) => {
        const target = Math.max(0, Math.min(1, u)) * total;
        let lo = 0;
        let hi = cum.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cum[mid] < target) lo = mid + 1;
          else hi = mid;
        }
        const i = Math.max(1, lo);
        const seg = cum[i] - cum[i - 1] || 1;
        const f = (target - cum[i - 1]) / seg;
        return {
          x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
          y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
        };
      };

      // Streams per edge: one for a plain co-appearance line, two for a
      // directed one. Deterministic from the edge id, so the pattern is stable
      // across renders instead of reshuffling on every state change.
      const seed = [...(e.from + e.to)].reduce((n, c) => n + c.charCodeAt(0), 0);
      const count = e.directed ? 2 : 1;
      const streams: Stream[] = [];
      for (let k = 0; k < count; k++) {
        const r1 = ((seed * (k + 7)) % 997) / 997;
        const r2 = ((seed * (k + 13)) % 991) / 991;
        streams.push({
          phase: r1,
          // 0.00009..0.00017 per ms -> a full traverse every 6-11s, which is
          // slow enough to read as flow rather than as a spinner
          speed: 0.00009 + r2 * 0.00008,
          // Directed edges alternate direction; undirected ones still flow so
          // the network looks alive, but they carry no arrowhead to contradict.
          dir: e.directed ? (k % 2 === 0 ? 1 : -1) : r1 > 0.5 ? 1 : -1,
          colour: e.tone === "bad" ? "#ff6b78" : e.tone === "warn" ? "#f7c14a" : "#c6ff43",
          alpha: 0.55 + r2 * 0.35,
        });
      }

      geometry.push({ edge: e, p0: a, p1: b, ctrl, pointAt, streams });
    }


    function draw(now: number) {
      if (!ctx) return;
      const t = now - started;
      const { selected: selectedId, hover: hoveredId } = interactionRef.current;
      const focus = selectedId ?? hoveredId;
      const selectedNeighbors = selectedId ? neighborsById.get(selectedId) : null;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;

      // =================================================================
      // EDGES — curved, with energy streams travelling along the real arc.
      //
      // Streams are pre-generated with their own phase and speed and then
      // advanced by modulo of elapsed time, so the loop is seamless and there is
      // no per-frame state to drift. A stream is drawn as a bright head plus a
      // short trail of decaying samples behind it, all resolved through the
      // same arc-length table the curve itself is drawn from — so a stream
      // physically follows the line rather than approximating it.
      // =================================================================

      const arrival = new Map<string, number>();

      for (const g of geometry) {
        const e = g.edge;
        const dim = focus !== null && !(e.from === focus || e.to === focus);
        const onPath = focus !== null && (e.from === focus || e.to === focus);

        // reveal: an edge appears only after both endpoints were discovered
        const na = nodeById.get(e.from);
        const nb = nodeById.get(e.to);
        const appear = reduce ? 0 : Math.max(na?.order ?? 0, nb?.order ?? 0) * 130;
        const progress = Math.max(0, Math.min(1, (t - appear) / 620));
        if (progress <= 0) continue;

        // ---- the line -------------------------------------------------
        ctx.save();
        ctx.strokeStyle = TONE[e.tone];
        ctx.globalAlpha = dim ? 0.06 : onPath ? 0.6 : 0.24;
        ctx.lineWidth = onPath ? 1.4 : 0.9;
        ctx.beginPath();
        ctx.moveTo(cx + g.p0.x, cy + g.p0.y);
        ctx.quadraticCurveTo(cx + g.ctrl.x, cy + g.ctrl.y, cx + g.p1.x, cy + g.p1.y);
        ctx.stroke();

        // direction marker: a small head tangent to the curve. Motion carries
        // the direction when streams run; this is for the static and
        // reduced-motion case, and it is deliberately small.
        if (e.directed && progress > 0.9) {
          const at = g.pointAt(0.68);
          const ahead = g.pointAt(0.70);
          const ang = Math.atan2(ahead.y - at.y, ahead.x - at.x);
          const size = onPath ? 5.5 : 4;
          ctx.globalAlpha = dim ? 0.06 : onPath ? 0.8 : 0.35;
          ctx.fillStyle = TONE[e.tone];
          ctx.beginPath();
          ctx.moveTo(cx + at.x, cy + at.y);
          ctx.lineTo(cx + at.x - Math.cos(ang - 0.45) * size, cy + at.y - Math.sin(ang - 0.45) * size);
          ctx.lineTo(cx + at.x - Math.cos(ang + 0.45) * size, cy + at.y - Math.sin(ang + 0.45) * size);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // ---- the streams ----------------------------------------------
        if (reduce || progress < 1) continue;

        for (const st of g.streams) {
          // u walks 0..1 forever. Modulo, so nothing ever resets visibly.
          const raw = (t * st.speed + st.phase) % 1;
          const u = st.dir === 1 ? raw : 1 - raw;

          // arrival bloom: the destination lights up as the head reaches it
          if (raw > 0.86) {
            const dest = st.dir === 1 ? g.edge.to : g.edge.from;
            const k = (raw - 0.86) / 0.14;
            arrival.set(dest, Math.max(arrival.get(dest) ?? 0, k));
          }

          const headAlpha = (dim ? 0.05 : onPath ? 1 : 0.42) * st.alpha;

          // trail: samples behind the head on the same arc, each smaller and
          // fainter. This is what makes it read as light moving rather than a
          // dot blinking.
          const TAIL = 7;
          for (let i = TAIL; i >= 0; i--) {
            const back = i * 0.022 * (st.dir === 1 ? 1 : -1);
            const uu = u + back;
            if (uu < 0.02 || uu > 0.98) continue;
            const pt = g.pointAt(uu);
            const f = 1 - i / TAIL;
            const a = headAlpha * f * f;
            if (a < 0.012) continue;
            ctx.save();
            ctx.globalAlpha = a;
            ctx.fillStyle = st.colour;
            ctx.beginPath();
            ctx.arc(cx + pt.x, cy + pt.y, 0.9 + f * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // the head itself: a small solid core and one soft halo. No
          // shadowBlur — it is the most expensive thing on this canvas.
          const hp = g.pointAt(u);
          ctx.save();
          ctx.globalAlpha = headAlpha * 0.22;
          ctx.fillStyle = st.colour;
          ctx.beginPath();
          ctx.arc(cx + hp.x, cy + hp.y, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = headAlpha;
          ctx.beginPath();
          ctx.arc(cx + hp.x, cy + hp.y, 1.7, 0, Math.PI * 2);
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

        const dim = selectedId !== null && selectedId !== n.id && !selectedNeighbors?.has(n.id);
        const isSelected = selectedId === n.id;
        const isHovered = selectedId === null && hoveredId === n.id;
        const colour = KIND_COLOR[n.kind];
        const ease = 1 - Math.pow(1 - k, 3);

        // A stream arriving lights the node it reaches. The bloom decays on its
        // own because `arrival` is rebuilt every frame from the streams that are
        // currently in their last 14% — nothing has to be timed or cleared.
        const hit = arrival.get(n.id) ?? 0;
        const pulse = reduce ? 0 : hit * hit * 1.6;

        // The hub carries a slow standing energy: a ring that widens and fades
        // on a 3.4s cycle, and a core that breathes 6%. Both are subtle enough
        // to stay invisible while reading and visible at rest.
        const isHub = p.x === 0 && p.y === 0;
        if (isHub && !reduce) {
          const cycle = (t % 3400) / 3400;
          ctx.save();
          ctx.globalAlpha = dim ? 0.03 : (1 - cycle) * 0.22;
          ctx.strokeStyle = colour;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx + p.x, cy + p.y, p.r + 5 + cycle * 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        const breathe = isHub && !reduce ? 1 + Math.sin(t / 680) * 0.06 : 1;

        const radius = p.r * ease * breathe * (isSelected ? 1.35 : 1) * (1 + pulse * 0.12);

        ctx.save();
        ctx.globalAlpha = dim ? 0.12 : 1;

        // halo: focus wins, otherwise the arrival bloom
        const halo = Math.max(isSelected ? 0.16 : 0, pulse * 0.18);
        if (halo > 0.005) {
          ctx.globalAlpha = dim ? 0.02 : halo;
          ctx.fillStyle = colour;
          ctx.beginPath();
          ctx.arc(cx + p.x, cy + p.y, radius + 7 + pulse * 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = dim ? 0.12 : 1;
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
          ctx.fillStyle = isSelected || isHovered ? "#f1f3f2" : "#cdd5e0";
          ctx.fillText(n.label, cx + p.x, ly);
        }
        ctx.restore();
      }

      raf = 0;
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    }

    function loop() {
      if (raf) return;
      // reduced motion: one frame, no loop
      if (reduce) {
        draw(performance.now());
        return;
      }
      raf = requestAnimationFrame(draw);
    }

    loop();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [nodes, edges, layout, neighborsById, height]);

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
            const id = hit(ev.clientX, ev.clientY);
            interactionRef.current.hover = id;
            if (canvasRef.current) canvasRef.current.style.cursor = id ? "pointer" : "default";
          }}
          onMouseLeave={() => {
            interactionRef.current.hover = null;
          }}
          onClick={(ev) => {
            const id = hit(ev.clientX, ev.clientY);
            const next = id && id !== interactionRef.current.selected ? id : null;
            interactionRef.current.selected = next;
            setSelected(next);
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
              <Link href={selectedNode.href} className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-fg4 hover:text-fg">
                open
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                interactionRef.current.selected = null;
                setSelected(null);
              }}
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
