import { PageHead } from "@/components/Shell";
import { Panel, Tag } from "@/components/ui";
import { MethodList, type MethodCheck } from "@/components/MethodList";

/* ==================================================================== *
 * METHOD — every threshold, stated
 *
 * A tool that will not show its thresholds cannot be checked. Each check is
 * listed with the bands it uses, what it cannot see, and its weight in the
 * score, because a number nobody can audit is a number nobody should act on.
 * ==================================================================== */

export const metadata = { title: "Method" };

export const CHECKS: MethodCheck[] = [
  {
    id: "sell",
    q: "Can you sell it",
    reads: "Freeze authority, honeypot simulation on a real route, transfer tax on the sell side",
    weight: 20,
    gate: true,
    bands: [
      { state: "pass", label: "sellable", note: "no freeze authority, simulated sell succeeds, tax under 5%" },
      { state: "warn", label: "tax present", note: "sell succeeds but the tax is between 5% and 15%" },
      { state: "fail", label: "cannot sell", note: "freeze authority active, or the simulation reverts" },
      { state: "unknown", label: "not read", note: "the simulation could not be run" },
    ],
    blind: "A tax that activates later, or a blacklist added after launch, is invisible until it happens",
  },
  {
    id: "supply",
    q: "Is the supply fixed",
    reads: "Mint authority, any issuance after launch, on the mint account directly",
    weight: 14,
    gate: true,
    bands: [
      { state: "pass", label: "fixed", note: "mint authority revoked" },
      { state: "fail", label: "still mintable", note: "the deployer can create new supply" },
      { state: "unknown", label: "not read", note: "the mint account could not be read" },
    ],
    blind: "Nothing — this is a binary read of the mint account",
  },
  {
    id: "lp",
    q: "Can the liquidity be pulled",
    reads: "LP token holder, lock expiry, burn status, pool ownership",
    weight: 16,
    gate: true,
    bands: [
      { state: "pass", label: "locked or burned", note: "no wallet can withdraw the pool" },
      { state: "warn", label: "locked, expiring", note: "locked but the lock ends within 30 days" },
      { state: "fail", label: "withdrawable", note: "the deployer holds the LP" },
      { state: "unknown", label: "not read", note: "LP ownership could not be determined" },
    ],
    blind: "A lock that is a promise from a third party is only as good as that party",
  },
  {
    id: "concentration",
    q: "Does one wallet hold too much",
    reads: "Top-10 share after removing pools, burns, curves and launch vaults; the largest single wallet",
    weight: 18,
    gate: true,
    bands: [
      { state: "pass", label: "spread", note: "largest under 5%, top ten under 25%" },
      { state: "warn", label: "concentrated", note: "largest 5–15%, or top ten 25–40%" },
      { state: "fail", label: "dominated", note: "largest over 15%, or top ten over 40%" },
      { state: "unknown", label: "not read", note: "no holder list was returned" },
    ],
    blind: "One entity across twenty wallets looks like a healthy spread until the funding is traced",
  },
  {
    id: "entity",
    q: "Is the supply one entity in disguise",
    reads: "Shared funding between top holders, identical buy sizing, same-block entries",
    weight: 14,
    gate: false,
    bands: [
      { state: "pass", label: "no links found", note: "no funding relationship between top holders was traced" },
      { state: "warn", label: "some shared funding", note: "two or more top holders share a funder" },
      { state: "fail", label: "one cluster", note: "more than a quarter of supply sits in linked wallets" },
      { state: "unknown", label: "not traced", note: "funding tracing did not run on this token" },
    ],
    blind: "Wallets funded through separate exchanges, or funded long before the launch, will not link",
  },
  {
    id: "deployer",
    q: "Has the creator done this before",
    reads: "Every prior token the deployer launched, and whether its liquidity was withdrawn",
    weight: 12,
    gate: false,
    bands: [
      { state: "pass", label: "clean record", note: "prior launches that did not collapse" },
      { state: "fail", label: "prior rug", note: "at least one prior token lost its liquidity" },
      { state: "unknown", label: "fresh wallet", note: "no history — which is not the same as a clean history" },
    ],
    blind: "A deployer using a new wallet each time is invisible, and that is the common case",
  },
  {
    id: "flow",
    q: "Is the trading real",
    reads: "Buy and sell volume on both sides, distinct traders, repeated identical sizes",
    weight: 8,
    gate: false,
    bands: [
      { state: "pass", label: "two-way", note: "buy and sell volume both meaningful, many distinct traders" },
      { state: "warn", label: "one-sided", note: "volume skews hard one way, or few distinct traders" },
      { state: "fail", label: "wash", note: "repeated identical sizes between the same wallets" },
      { state: "unknown", label: "not read", note: "no trade history was returned" },
    ],
    blind: "Wash trading spread across many wallets and slightly varied sizes defeats this",
  },
  {
    id: "exit",
    q: "Can you actually get out",
    reads: "Pool reserves, price impact at 1% and 5% slippage",
    weight: 12,
    gate: false,
    bands: [
      { state: "pass", label: "deep enough", note: "over $10,000 sellable before 5% impact" },
      { state: "warn", label: "thin", note: "$1,000–$10,000 sellable before 5% impact" },
      { state: "fail", label: "trapped", note: "under $1,000 sellable before 5% impact" },
      { state: "unknown", label: "not read", note: "pool reserves could not be read" },
    ],
    blind: "Liquidity is a market condition, not a contract defect — it can leave without anyone doing anything wrong",
  },
];

export default function MethodPage() {
  const totalWeight = CHECKS.reduce((s, c) => s + c.weight, 0);

  return (
    <div>
      <PageHead
        title="Method"
        note="every threshold, and what each check cannot see"
        right={<Tag tone="neutral">{CHECKS.length} checks · 100 weight</Tag>}
      />

      <div className="mx-auto max-w-5xl space-y-4 p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-start">
        <Panel title="How the score works" note="three rules, and nothing hidden">
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["a floor, not an average", "One disqualifying finding sets the minimum. Three fails cannot be averaged away by five passes — which is why a score of 34 can still be high risk"],
              ["the band comes from counts", "The word next to the number is decided by how many checks failed, not by the number itself. Two fails is high risk whatever the arithmetic says"],
              ["unknown is not zero", "A check that could not run contributes nothing and is counted separately. It never silently becomes a pass, and it is never treated as a warning"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-line py-2 last:border-b-0 sm:border-b-0 sm:border-r sm:py-0 sm:pr-4 sm:last:border-r-0 lg:border-b lg:border-r-0 lg:py-2 lg:pr-0 lg:last:border-b-0">
                <div className="t-xs font-semibold text-fg2">{k}</div>
                <p className="mt-0.5 t-xs leading-relaxed text-fg4">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Weights" note="what the score is made of" flush>
          <div className="px-3 py-2">
            {CHECKS.map((c) => (
              <div key={c.id} className="border-b border-line py-1.5 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate t-xs text-fg3">{c.q}</span>
                  {c.gate && <Tag tone="warn">gate</Tag>}
                  <span className="t-mono text-[10px] text-fg4">{c.weight}/{totalWeight}</span>
                </div>
                <div className="mt-1.5 h-[3px] w-full bg-surf3">
                  <div
                    className={c.gate ? "h-full bg-bad/70" : "h-full bg-acid/70"}
                    style={{ width: `${(c.weight / totalWeight) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-line px-3 py-2 t-xs leading-relaxed text-fg4">
            A gate check failing changes the band directly, regardless of weight
          </p>
        </Panel>

        </div>

        <MethodList checks={CHECKS} />

        <Panel title="What this tool will not do" note="stated once, clearly">
          <ul className="space-y-2">
            {[
              "It will not tell you a token is safe. A clean score means the measured checks were inside their bands",
              "It will not predict a price. Nothing here is a forecast",
              "It will not fill in a gap to look complete. A missing source makes the check unknown",
              "It will not score a token on social hype alone, and a high follower count never improves a score",
              "It will not accuse anyone. A coordination signal is a count of observed behaviour",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span aria-hidden className="mt-[7px] h-[4px] w-[4px] shrink-0 bg-bad" />
                <span className="t-xs leading-relaxed text-fg3">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
