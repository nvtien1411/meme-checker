import { PageHead } from "@/components/Shell";
import { Demo, Panel, Tag } from "@/components/ui";
import { Graph, type GraphEdge, type GraphNode } from "@/components/Graph";
import { ExitOrderTable } from "@/components/Intelligence";
import { WalletNetworkView } from "@/components/WalletWorkspace";
import { exitOrdering } from "@/lib/intel";


/* ==================================================================== *
 * INVESTIGATION WORKSPACE
 *
 * A canvas of connected entities. Every edge is a real, named relationship —
 * funded, bought, deployed, appears together — because a graph of unexplained
 * edges is decoration, and the reader cannot check decoration.
 * ==================================================================== */

export const metadata = { title: "Wallet Intel" };

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
        title="Wallet Intel"
        note="one token, everything connected to it"
        right={
          <>
            <Demo />
            <Tag tone="acid">VIP</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">

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
                                      </div>

        <div>
          <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
            <h2 className="t-section text-fg">Who keeps showing up</h2>
            <span className="t-xs text-fg4">
              the wallet network derived from every recorded launch, and who exits first
            </span>
          </div>
          {/* The workspace is the page, not a preview of it. It used to sit
              behind a Pro reveal with zero rows, which meant a free visitor saw
              a locked box where the investigation surface should be — and every
              control in it (zoom, filter, path, cluster) was unreachable. The
              gate stays on the deeper per-wallet intelligence, which is a
              different claim from "can I look at the graph". */}
          <div className="space-y-2.5">
            <WalletNetworkView />
            <ExitOrderTable rows={exitOrdering().slice(0, 12)} />
          </div>
        </div>
      </div>
    </div>
  );
}
