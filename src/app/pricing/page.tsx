import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Panel, Split, Tag } from "@/components/ui";

/* ==================================================================== *
 * PLANS
 *
 * The boundary is explained by what the reader learns, not by a feature
 * checklist. "Bundle wallets" means nothing; "who bought inside the launch
 * block, and whether they have sold" is the thing someone pays for.
 * ==================================================================== */

export const metadata = { title: "Plans" };

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    per: "forever",
    state: "available" as const,
    line: "Every check that produces a verdict, on every chain",
    leads: "Enough to decide not to buy something.",
    includes: [
      "Risk score with the band and the reasons behind it",
      "All contract checks: sellability, supply, LP, tax, ownership",
      "Top-10 holder distribution with pools and curves removed",
      "Bundle and sniper counts as headline figures",
      "Deployer address, holdings and prior launch count",
      "Which accounts posted the contract",
      "Liquidity depth and trade flow",
      "Three scans a day, no account needed",
    ],
    lacks: "The wallet layer — who is behind the numbers",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39",
    per: "per month",
    state: "planned" as const,
    line: "The wallet layer: who bought, who sold, and who is left holding",
    leads: "Enough to know who sells before you.",
    includes: [
      "Every free item, without the daily limit",
      "Bundle detail: each wallet, its funder, its entry and its exit",
      "Sell synchrony and exit window — how long you have to react",
      "Sniper wallets classified by sold, transferred or still holding",
      "Insider supply traced from the deployer wallet",
      "Fresh wallets and the funding source behind them",
      "Caller profiles with win rate, median multiple and exit-against-call",
      "Smart followers: which wallets repeat after each caller",
      "Narrative copy index, organic attention and usual lifespan",
      "Wallet, deployer and investigation lookup",
    ],
    lacks: "Cross-caller network analysis and alert rules",
  },
  {
    id: "group",
    name: "Group",
    price: "$79",
    per: "per month",
    state: "planned" as const,
    line: "The bot in your Telegram, scoring every contract the group drops",
    leads: "Enough for a whole group to check before anyone apes.",
    includes: [
      "Everything in Pro, for every member of the group",
      "The bot answers any contract pasted in the group",
      "Alerts posted into the group when a tracked wallet moves",
      "Leaderboard of who called what, and how each call ended",
      "Shared watchlist and saved investigations",
      "No per-member limit",
    ],
    lacks: "Nothing planned beyond this",
  },
];

export default function PlansPage() {
  return (
    <div>
      <PageHead
        title="Plans"
        note="what you can see, and what you learn by paying"
        right={<Tag tone="neutral">prices are proposals</Tag>}
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <Panel title="What separates the tiers" note="one sentence each">
          <div className="space-y-1.5">
            {TIERS.map((t) => (
              <div key={t.id} className="border-b border-line pb-1.5 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="t-xs font-semibold text-fg">{t.name}</span>
                  <span className="t-mono text-[10px] text-fg4">{t.price}</span>
                </div>
                <p className="mt-0.5 t-xs leading-relaxed text-fg3">{t.leads}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {TIERS.map((t) => {
            const free = t.id === "free";
            return (
              <section
                key={t.id}
                className={`panel flex flex-col ${free ? "border-acid/40" : ""}`}
              >
                <div className="border-b border-line px-3 py-2.5">
                  <div className="flex items-baseline gap-2">
                    <h2 className="t-section text-fg">{t.name}</h2>
                    <Tag tone={t.state === "available" ? "good" : "neutral"}>{t.state}</Tag>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className={`t-mono text-[24px] leading-none ${free ? "text-acid" : "text-fg"}`}>
                      {t.price}
                    </span>
                    <span className="t-xs text-fg4">{t.per}</span>
                  </div>
                  <p className="mt-1.5 t-xs leading-relaxed text-fg3">{t.line}</p>
                </div>

                <div className="flex-1 px-3 py-2.5">
                  <span className="t-eyebrow">includes</span>
                  <ul className="mt-1.5 space-y-1">
                    {t.includes.map((i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-good" />
                        <span className="t-xs leading-snug text-fg3">{i}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2.5 border-t border-line pt-2">
                    <span className="t-eyebrow">does not include</span>
                    <p className="mt-1 t-xs leading-relaxed text-fg4">{t.lacks}</p>
                  </div>
                </div>

                <div className="border-t border-line p-2.5">
                  {free ? (
                    <Link
                      href="/"
                      className="flex h-8 items-center justify-center bg-acid font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-bg transition-colors hover:bg-acid2"
                    >
                      scan a token
                    </Link>
                  ) : (
                    <div className="flex h-8 items-center justify-center border border-line2 font-mono text-[10.5px] uppercase tracking-[0.07em] text-fg4">
                      not built yet
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <Panel title="Why the wallet layer costs money" note="the honest accounting">
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <div>
              <p className="t-xs leading-relaxed text-fg3">
                A contract check is one request to a public API. It is cheap, it is cacheable, and it
                can be free forever. Reading the launch block, tracing funding through two hops and
                classifying a wallet history is thousands of RPC calls per token. That is what the
                subscription pays for — not a paywall on information that already existed
              </p>
            </div>
            <div>
              <div className="space-y-0">
                <Split label="free scan cost">~5 API calls</Split>
                <Split label="pro scan cost">~1,400 RPC calls</Split>
                <Split label="bundle trace">launch block, every tx, every funder</Split>
                <Split label="wallet classification">full trade history per wallet</Split>
              </div>
              <p className="mt-1.5 t-xs leading-relaxed text-fg4">
                A free tier that includes wallet forensics is a tier that cannot run
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="What is not for sale" note="stated plainly">
          <ul className="space-y-1">
            {[
              "No feature is withheld to make a screenshot look better — every module exists or is labelled as not built",
              "No fake scarcity, no countdowns, no trial that silently charges",
              "No ranking of tokens by how much they paid",
              "Nothing on a report is presented as advice",
            ].map((t) => (
              <li key={t} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
                <span className="t-xs leading-relaxed text-fg3">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
