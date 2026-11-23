import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Gated, Panel, Tag, UpgradeStrip } from "@/components/ui";
import { DEMO_TOKENS } from "@/lib/demo";

/* ==================================================================== *
 * INVESTIGATION WORKSPACE
 *
 * A canvas of connected entities. Every edge is a real, named relationship —
 * funded, bought, deployed, appears together — because a graph of unexplained
 * edges is decoration, and the reader cannot check decoration.
 * ==================================================================== */

export const metadata = { title: "Investigation" };

type Node = { id: string; kind: "token" | "wallet" | "caller" | "deployer"; label: string; sub?: string; x: number; y: number };
type Edge = { from: string; to: string; label: string; tone: "info" | "bad" | "acid" | "warn" };

const NODES: Node[] = [
  { id: "rats", kind: "token", label: "RATS", sub: "launch", x: 50, y: 50 },
  { id: "dev", kind: "deployer", label: "deployer", sub: "3cJu…vyw", x: 17, y: 20 },
  { id: "funder", kind: "wallet", label: "funder", sub: "9xQe…4Ks", x: 17, y: 50 },
  { id: "b1", kind: "wallet", label: "bundle #1", sub: "18.7%", x: 17, y: 78 },
  { id: "ins1", kind: "wallet", label: "insider", sub: "3.4%", x: 50, y: 16 },
  { id: "cole", kind: "caller", label: "@cryptocole", sub: "58.4k", x: 83, y: 24 },
  { id: "mira", kind: "caller", label: "@degenmira", sub: "18.9k", x: 83, y: 44 },
  { id: "trench", kind: "caller", label: "@soltrenches", sub: "96.4k", x: 83, y: 64 },
  { id: "peach", kind: "token", label: "PEACH", sub: "rugged", x: 50, y: 88 },
];

const EDGES: Edge[] = [
  { from: "dev", to: "rats", label: "deployed", tone: "acid" },
  { from: "funder", to: "b1", label: "funded", tone: "info" },
  { from: "funder", to: "dev", label: "funded", tone: "bad" },
  { from: "b1", to: "rats", label: "bought block 0", tone: "bad" },
  { from: "ins1", to: "rats", label: "received 3.4%", tone: "warn" },
  { from: "cole", to: "rats", label: "posted", tone: "info" },
  { from: "mira", to: "rats", label: "posted +6m", tone: "info" },
  { from: "trench", to: "rats", label: "posted −13m", tone: "info" },
  { from: "dev", to: "peach", label: "deployed", tone: "bad" },
  { from: "funder", to: "peach", label: "funded", tone: "bad" },
];

const TONE_STROKE = { info: "#4ea8ff", bad: "#ff4d5e", acid: "#c6ff43", warn: "#f7c14a" };

export default function InvestigationPage() {
  return (
    <div>
      <PageHead
        title="Investigation"
        note="one token, everything connected to it"
        right={
          <>
            <Demo />
            <Tag tone="acid">VIP</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <UpgradeStrip what="The graph, every named edge and each edge's transaction are Pro — the free view shows the shape only" />

        <Panel title="How to use this" note="three rules, because a graph without rules is a picture">
          <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-3">
            {[
              ["every edge is a named relationship", "funded, bought, deployed, posted, appears together. If an edge cannot be named it is not drawn"],
              ["a line means one observed event", "two wallets that moved value six times show one line labelled six transfers, not six lines"],
              ["grey means no longer holding", "a wallet that has exited is still on the graph, because the exit is part of the story"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-line pb-2 last:border-b-0 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 sm:last:border-r-0">
                <div className="t-xs font-semibold text-fg2">{k}</div>
                <p className="mt-0.5 t-xs leading-relaxed text-fg4">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="RATS — connected entities" note="click a node in a live build; here the layout is fixed" flush>
          <div className="relative w-full bg-surf" style={{ aspectRatio: "16 / 10", minHeight: 340 }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              {EDGES.map((e, i) => {
                const a = NODES.find((n) => n.id === e.from);
                const b = NODES.find((n) => n.id === e.to);
                if (!a || !b) return null;
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={TONE_STROKE[e.tone]}
                    strokeWidth="0.22"
                    strokeOpacity="0.55"
                    strokeDasharray={e.tone === "warn" ? "0.8 0.8" : undefined}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {NODES.map((n) => {
              const kindCls =
                n.kind === "token"
                  ? "border-acid/50 bg-acid/10 text-acid"
                  : n.kind === "deployer"
                    ? "border-bad/50 bg-bad/10 text-bad"
                    : n.kind === "caller"
                      ? "border-info/50 bg-info/10 text-info"
                      : "border-line2 bg-surf2 text-fg2";
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                  <div className={`border px-2 py-1 ${kindCls}`}>
                    <div className="whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.04em]">
                      {n.label}
                    </div>
                    {n.sub && <div className="t-mono text-[8px] opacity-70">{n.sub}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* the legend is the edge list, not a colour key */}
          <div className="border-t border-line px-3 py-2">
            <span className="t-eyebrow">relationships drawn</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {EDGES.map((e) => {
                const a = NODES.find((n) => n.id === e.from);
                const b = NODES.find((n) => n.id === e.to);
                return (
                  <span key={`${e.from}-${e.to}`} className="border border-line px-1.5 py-[1px]">
                    <span className="font-mono text-[9px] text-fg3">
                      {a?.label} → {b?.label}
                    </span>
                    <span className="ml-1 font-mono text-[8.5px] uppercase tracking-[0.04em] text-fg4">
                      {e.label}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          <Panel title="What this graph shows" note="the finding, in words">
            <ul className="space-y-1.5">
              {[
                "The wallet that funded the deployer also funded the largest launch-block buyer",
                "That buyer holds 18.7% and has not sold",
                "Three callers posted within 13 minutes of each other, two of them after the price had already moved",
                "The same deployer's previous token is in this graph because the funder is shared",
              ].map((t) => (
                <li key={t} className="flex items-start gap-1.5">
                  <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-bad" />
                  <span className="t-xs leading-snug text-fg3">{t}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="What it does not show" note="the limits, stated rather than hidden">
            <ul className="space-y-1.5">
              {[
                "Whether the funder and the deployer are the same person — shared funding is a relationship, not an identity",
                "Whether the callers knew each other — posting at the same time happens organically",
                "Anything outside seven days of history, which is the current trace depth",
                "Wallets funded from an exchange hot wallet, where the trail ends",
              ].map((t) => (
                <li key={t} className="flex items-start gap-1.5">
                  <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-line2" />
                  <span className="t-xs leading-snug text-fg4">{t}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Next step" note="where to go from here">
            <div className="space-y-1.5">
              {[
                ["open the wallet", `/wallets`],
                ["read the deployer record", `/deployers`],
                ["check the callers", `/callers/cryptocole`],
                ["see the token report", `/token/solana/${DEMO_TOKENS[0].mint}`],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between border border-line px-2 py-1.5 transition-colors hover:border-line2 hover:bg-surf2"
                >
                  <span className="t-xs text-fg2">{label}</span>
                  <span aria-hidden className="font-mono text-[10px] text-acid">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <Gated
          title="The full investigation canvas"
          points={[
            "Expand any node into its own graph without losing the first one",
            "Click an edge to see the actual transaction behind it",
            "Add any wallet, token or caller to the canvas by address",
            "Save a canvas and return to it — the graph keeps updating as new data lands",
            "Compare two canvases side by side to find a shared wallet",
            "Export the evidence for a canvas as a dated record",
          ]}
        />
      </div>
    </div>
  );
}
