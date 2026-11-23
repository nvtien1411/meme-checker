import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, ProReveal, Tag } from "@/components/ui";
import { Graph, type GraphEdge, type GraphNode } from "@/components/Graph";
import { ExitOrderTable, WalletNetworkView } from "@/components/Intelligence";
import { exitOrdering } from "@/lib/intel";
import { DEMO_TOKENS } from "@/lib/demo";

/* ==================================================================== *
 * INVESTIGATION WORKSPACE
 *
 * A canvas of connected entities. Every edge is a real, named relationship —
 * funded, bought, deployed, appears together — because a graph of unexplained
 * edges is decoration, and the reader cannot check decoration.
 * ==================================================================== */

export const metadata = { title: "Investigation" };

/* Discovery order: the token first, then what the scan reached outward. The
   graph's entrance sequence is this order, so the animation reports what was
   found when rather than decorating. */
const GRAPH_NODES: GraphNode[] = [
  { id: "rats", label: "RATS", sub: "launch", kind: "token", order: 0, href: "/token/solana/CwnbD9FpaFSNou634knczXVCRUjTqmzwCrs3AiQvpump" },
  { id: "dev", label: "deployer", sub: "3cJu…vyw", kind: "deployer", order: 1, href: "/deployers/3cJu879xPq7vXNbE2mKfTdRsWy4aHnLz8QpVd6Rdvyw" },
  { id: "b1", label: "bundle #1", sub: "18.7%", kind: "wallet", order: 2, href: "/wallets/BBPzEyKTdRm3wXqNa4vJhSc8LkPyU2gFtZoQx6RRbMNk" },
  { id: "funder", label: "funder", sub: "9xQe…4Ks", kind: "wallet", order: 3 },
  { id: "ins1", label: "insider", sub: "3.4%", kind: "wallet", order: 4 },
  { id: "cole", label: "@cryptocole", sub: "58.4k", kind: "caller", order: 5, href: "/callers/cryptocole" },
  { id: "mira", label: "@degenmira", sub: "18.9k", kind: "caller", order: 6, href: "/callers/degenmira" },
  { id: "trench", label: "@soltrenches", sub: "96.4k", kind: "caller", order: 7, href: "/callers/soltrenches" },
  { id: "peach", label: "PEACH", sub: "rugged", kind: "launch", order: 8 },
];

const GRAPH_EDGES: GraphEdge[] = [
  { from: "dev", to: "rats", label: "deployed", tone: "acid", directed: true },
  { from: "funder", to: "b1", label: "funded", tone: "info", directed: true },
  { from: "funder", to: "dev", label: "funded", tone: "bad", directed: true },
  { from: "b1", to: "rats", label: "bought block 0", tone: "bad", directed: true },
  { from: "ins1", to: "rats", label: "received 3.4%", tone: "warn", directed: true },
  { from: "cole", to: "rats", label: "posted", tone: "info", directed: true },
  { from: "mira", to: "rats", label: "posted +6m", tone: "info", directed: true },
  { from: "trench", to: "rats", label: "posted −13m", tone: "info", directed: true },
  { from: "dev", to: "peach", label: "deployed", tone: "bad", directed: true },
  // co-appearance only — no direction, so no particles
  { from: "b1", to: "ins1", label: "same launch block", tone: "warn" },
];



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

        <Panel
          title="RATS — connected entities"
          note="select a node to isolate its relationships; the graph redraws from the record"
          flush
        >
          <div className="p-2.5">
            <Graph nodes={GRAPH_NODES} edges={GRAPH_EDGES} height={420} />
          </div>

          {/* the legend is the edge list, not a colour key */}
          <div className="border-t border-line px-3 py-2">
            <span className="t-eyebrow">relationships drawn</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {GRAPH_EDGES.map((e) => {
                const a = GRAPH_NODES.find((n) => n.id === e.from);
                const b = GRAPH_NODES.find((n) => n.id === e.to);
                return (
                  <span key={`${e.from}-${e.to}`} className="border border-line px-1.5 py-[1px]">
                    <span className="font-mono text-[9px] text-fg3">
                      {a?.label} {e.directed ? "→" : "·"} {b?.label}
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
                "Three callers posted inside a 19-minute window, the last of them six minutes after the first",
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

        <div>
          <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
            <h2 className="t-section text-fg">Who keeps showing up</h2>
            <span className="t-xs text-fg4">
              the wallet network derived from every recorded launch, and who exits first
            </span>
          </div>
          <ProReveal
            title="The full relationship graph"
            shown={0}
            rows={[]}
            more={[
              "Every address that appears on two or more of the same launches",
              "Which of them bought inside the creation block on every shared launch",
              "The group's measured holding time and the point of the peak it exits at",
              "Whether the group leaves together or in sequence, in minutes",
              "How many of those launches collapsed after the group left",
              "Which single wallet left first, launch by launch",
            ]}
            note="Edges are co-appearance on a launch, drawn from history rather than inferred from a funding trace"
          >
            <div className="space-y-2.5">
              <WalletNetworkView />
              <ExitOrderTable rows={exitOrdering().slice(0, 12)} />
            </div>
          </ProReveal>
        </div>
      </div>
    </div>
  );
}
