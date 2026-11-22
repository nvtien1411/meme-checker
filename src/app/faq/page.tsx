import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Method",
  description: "What each check reads, where the data comes from, and what it cannot tell you.",
};

const CHECKS = [
  {
    id: "sell",
    q: "Can you sell it",
    reads: "Honeypot simulation (EVM) and freeze authority (Solana).",
    passes: "A simulated sell succeeds, or no wallet can be frozen.",
    fails: "The sell reverts, or the issuer can freeze your token account.",
    caveat:
      "Solana has no honeypot mechanism — a sell can only be blocked through the freeze authority, which is its own gate.",
  },
  {
    id: "mint",
    q: "Is the supply fixed",
    reads: "Mint authority state from RugCheck and GoPlus.",
    passes: "Mint authority is revoked.",
    fails: "Mint is live on a token under 30 days old — the issuer can print and sell into you.",
    caveat:
      "On a mature token a live mint is often a treasury function, so it is graded as a caution rather than a failure.",
  },
  {
    id: "lp",
    q: "Can the liquidity be pulled",
    reads: "LP lock percentage and burn state.",
    passes: "90% or more locked or burned.",
    fails: "Under 50% locked — the deployer can withdraw the pool.",
    caveat:
      "Launchpad bonding curves have no LP token to rug, which is treated as a pass.",
  },
  {
    id: "top-wallet",
    q: "Does one wallet hold too much",
    reads: "Largest holder after removing pools, burns and exchanges.",
    passes: "6% or less under 30 days, 15% or less for older tokens.",
    fails: "More than twice that in one address.",
    caveat:
      "The two bands exist because a four-year-old token's top holder is usually a custodian, not a launch bundle.",
  },
  {
    id: "cluster",
    q: "Is the supply one entity in disguise",
    reads: "Shared funding sources among the top wallets, merged into single entities.",
    passes: "Under 10% of supply held by linked wallets.",
    fails: "30% or more, following Bubblemaps' own published guidance.",
    caveat:
      "Solana only, and skipped for pairs older than seven days. An untraced wallet is reported as unknown, never as independent.",
  },
  {
    id: "deployer",
    q: "Has the creator done this before",
    reads: "Every prior token from the deployer wallet and whether it rugged.",
    passes: "Prior launches, none rugged.",
    fails: "Any prior token that rugged.",
    caveat:
      "A fresh wallet is reported as unknown — no rug history, but also no track record.",
  },
  {
    id: "flow",
    q: "Is the trading real",
    reads: "Buy/sell imbalance by USD volume across the recent trade tape.",
    passes: "Net buying above +15%.",
    fails: "Net selling beyond −20%.",
    caveat:
      "A snapshot of a few hundred trades that flips sign between page loads. It can never produce a hard failure on its own.",
  },
  {
    id: "exit",
    q: "Can you actually get out",
    reads: "Constant-product estimate from pool reserves.",
    passes: "$10,000 or more before 5% price impact.",
    fails: "Under $2,000.",
    caveat:
      "Single-pool only. Multi-pool routing, CEX depth and MEV are not modelled.",
  },
];

export default function MethodPage() {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-12 sm:px-6">
      <h1 className="t-display text-slate-50">How the checks work</h1>
      <p className="mt-2 max-w-xl t-body leading-relaxed text-mute-400">
        Every verdict on this site comes from these eight checks. Here is exactly
        what each one reads, where the line sits, and what it cannot see.
      </p>

      <div className="mt-7 divide-y divide-ink-800 border-y border-ink-800">
        {CHECKS.map((c, i) => (
          <article key={c.id} id={c.id} className="py-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono t-meta tabular-nums text-mute-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="t-title text-slate-100">{c.q}</h2>
            </div>

            <dl className="mt-2.5 space-y-1.5 pl-[30px]">
              {(
                [
                  ["Reads", c.reads],
                  ["Passes", c.passes],
                  ["Fails", c.fails],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex gap-3 t-small leading-relaxed">
                  <dt className="w-[52px] shrink-0 text-mute-600">{k}</dt>
                  <dd className="min-w-0 text-mute-300">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-2.5 ml-[30px] border-l-2 border-warn-600/35 pl-3">
              <p className="t-meta leading-relaxed text-mute-500">{c.caveat}</p>
            </div>
          </article>
        ))}
      </div>

      <section id="risk" className="panel mt-8 p-5">
        <h2 className="t-label">Risk disclosure</h2>
        <div className="mt-2.5 space-y-2.5 t-small leading-relaxed text-mute-300">
          <p>
            Meme Checker is a research aid. It is not financial advice, not a
            recommendation, and not a guarantee that a token is safe. Tokens that
            pass every check here have still gone to zero, and tokens that fail
            several have still run.
          </p>
          <p>
            All data comes from third-party public APIs. It can be wrong, delayed,
            incomplete, or describe a contract that has since changed. We do not
            audit contracts and we do not verify project claims.
          </p>
          <p>
            A missing value is shown as{" "}
            <span className="text-mute-200">unknown</span> and is excluded from
            the score. Unknown is never counted as a pass — if you see it, treat
            that check as unanswered rather than satisfied.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="t-label">Data sources</h2>
        <ul className="mt-3 space-y-2">
          {(
            [
              ["DexScreener", "pairs, price, liquidity, volume, age, project links"],
              ["GeckoTerminal", "trade tape, pool discovery for chains DexScreener does not index"],
              ["RugCheck", "Solana holders, authorities, creator history"],
              ["GoPlus", "EVM contract security, honeypot, taxes"],
              ["Solana RPC", "funding-source tracing for wallet clusters"],
            ] as const
          ).map(([n, d]) => (
            <li key={n} className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="t-body-strong text-slate-200">{n}</span>
              <span className="t-small text-mute-500">{d}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-9 border-t border-ink-800 pt-5">
        <Link
          href="/check"
          className="inline-flex rounded-[3px] bg-brand-500 px-3.5 py-2 t-small font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          Check a token
        </Link>
      </div>
    </div>
  );
}
