import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Method",
  description:
    "What each check reads, where every threshold sits, and what the checks cannot see.",
};

/* The engine has four states, not two. A method page that only lists pass and
 * fail would describe a different product than the one that produces the
 * verdict — the bands in between are exactly where most tokens land, so they
 * are the part worth documenting. */

type Band = { state: "pass" | "caution" | "fail"; label: string };

type Check = {
  id: string;
  q: string;
  reads: string;
  bands: Band[];
  unknown: string | null;
  caveat: string;
  weight: "gate" | "signal";
};

const CHECKS: Check[] = [
  {
    id: "sell",
    q: "Can you sell it",
    reads: "Honeypot simulation (EVM) or freeze authority (Solana).",
    bands: [
      { state: "pass", label: "A simulated sell succeeds, or no authority can freeze your token account" },
      { state: "fail", label: "The sell reverts, or the issuer can freeze your account at will" },
    ],
    unknown: "The simulator did not return a result. Treated as unanswered.",
    caveat:
      "Solana has no honeypot mechanism. A sell can only be blocked there through the freeze authority, which is why this reads authority state rather than simulating a swap.",
    weight: "gate",
  },
  {
    id: "mint",
    q: "Is the supply fixed",
    reads: "Mint authority state from RugCheck and GoPlus.",
    bands: [
      { state: "pass", label: "Mint authority revoked" },
      { state: "caution", label: "Mint live, but the token is older than 30 days" },
      { state: "fail", label: "Mint live on a token under 30 days old" },
    ],
    unknown: "Authority state not reported by either provider.",
    caveat:
      "On a mature token a live mint is often a treasury or bridge function. It is graded as a caution rather than a failure so a four-year-old token is not judged by launch-day rules.",
    weight: "gate",
  },
  {
    id: "lp",
    q: "Can the liquidity be pulled",
    reads: "LP lock percentage and burn state.",
    bands: [
      { state: "pass", label: "90% or more locked or burned" },
      { state: "caution", label: "50% to 90% locked" },
      { state: "fail", label: "Under 50% locked" },
    ],
    unknown: "No LP lock or burn data was returned for the pool.",
    caveat:
      "A bonding curve has no LP token to withdraw, which is treated as a pass rather than a gap.",
    weight: "gate",
  },
  {
    id: "top-wallet",
    q: "Does one wallet hold too much",
    reads: "Largest holder after removing pools, burns and exchange wallets.",
    bands: [
      { state: "pass", label: "6% or less under 30 days; 15% or less for older tokens" },
      { state: "caution", label: "6–12% under 30 days; 15–30% for older tokens" },
      { state: "fail", label: "Over 12% under 30 days; over 30% for older tokens" },
    ],
    unknown: "No holder list available for the chain.",
    caveat:
      "Two bands exist because the top holder of a years-old token is usually a custodian or a locked treasury, while the top holder of a week-old token is usually a launch bundle.",
    weight: "gate",
  },
  {
    id: "cluster",
    q: "Is the supply one entity in disguise",
    reads: "Shared funding sources among the top wallets, merged into single entities.",
    bands: [
      { state: "pass", label: "Under 10% of supply held by linked wallets" },
      { state: "caution", label: "10% to 30%" },
      { state: "fail", label: "30% or more" },
    ],
    unknown:
      "Wallets could not be traced, the pair is older than seven days, or the chain is EVM.",
    caveat:
      "An untraced wallet is reported as unknown, never as independent. Seven days is the cutoff because a wallet funded months ago says nothing about a launch bundle.",
    weight: "gate",
  },
  {
    id: "deployer",
    q: "Has the creator done this before",
    reads: "Every prior token from the deployer wallet, and how each one ended.",
    bands: [
      { state: "pass", label: "Prior launches exist, none of which rugged" },
      { state: "fail", label: "Any prior token rugged" },
    ],
    unknown: "Fresh wallet, or creator history not available.",
    caveat:
      "A fresh wallet is unknown rather than safe: it has no rug history, but it also has no track record. Those are different claims.",
    weight: "gate",
  },
  {
    id: "flow",
    q: "Is the trading real",
    reads: "Buy and sell pressure by USD volume across the recent trade tape.",
    bands: [
      { state: "pass", label: "Net buying above +15%" },
      { state: "caution", label: "Between −20% and +15%" },
      { state: "fail", label: "Net selling beyond −20%" },
    ],
    unknown: "No trade tape returned for the pool.",
    caveat:
      "This is a snapshot of a few hundred trades and it can flip sign between page loads, so it is a signal and never a hard failure on its own.",
    weight: "signal",
  },
  {
    id: "exit",
    q: "Can you actually get out",
    reads: "Constant-product estimate from pool reserves.",
    bands: [
      { state: "pass", label: "$10,000 or more before 5% price impact" },
      { state: "caution", label: "$2,000 to $10,000" },
      { state: "fail", label: "Under $2,000" },
    ],
    unknown: "Pool reserves could not be read.",
    caveat:
      "Single-pool only. Multi-pool routing, CEX depth and MEV are not modelled, so the figure is a floor rather than a precise number. Weighted as a signal rather than a gate because thin liquidity is a market condition, not a contract defect — a token can be hard to exit without anyone having done anything wrong.",
    weight: "signal",
  },
];

const STATE: Record<Band["state"], { label: string; cls: string; dot: string }> = {
  pass: { label: "Pass", cls: "text-ok-400", dot: "bg-ok-500" },
  caution: { label: "Caution", cls: "text-warn-400", dot: "bg-warn-500" },
  fail: { label: "Fail", cls: "text-bad-400", dot: "bg-bad-500" },
};

export default function MethodPage() {
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-12 sm:px-6">
      <h1 className="t-display text-lit-50">How the checks work</h1>
      <p className="mt-2 max-w-xl t-body leading-relaxed text-mute-400">
        Eight checks produce every verdict on this site. Each has up to four
        possible answers, not two — and the band in the middle is where most
        tokens land.
      </p>

      {/* state legend */}
      <div className="mt-5 grid gap-px overflow-hidden rounded-[4px] border border-ink-750 bg-ink-750 sm:grid-cols-4">
        {[
          { s: "pass", t: "Pass", d: "The reading is inside the safe band." },
          { s: "caution", t: "Caution", d: "Between the bands. Counts as a watch, not a failure." },
          { s: "fail", t: "Fail", d: "Outside the band. Drives the verdict." },
          { s: "unknown", t: "Unknown", d: "No data. Excluded from the score, never counted as a pass." },
        ].map((x) => (
          <div key={x.s} className="bg-ink-900 px-3.5 py-3">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${
                  x.s === "unknown" ? "bg-ink-500" : STATE[x.s as Band["state"]].dot
                }`}
              />
              <span
                className={`t-small font-semibold ${
                  x.s === "unknown" ? "text-mute-400" : STATE[x.s as Band["state"]].cls
                }`}
              >
                {x.t}
              </span>
            </div>
            <p className="mt-1 t-meta leading-relaxed text-mute-600">{x.d}</p>
          </div>
        ))}
      </div>

      {/* index */}
      <nav aria-label="Checks" className="mt-6 border-y border-ink-800 py-2.5">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {CHECKS.map((c, i) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                className="group inline-flex items-baseline gap-1.5 t-meta text-mute-500 transition hover:text-lit-200"
              >
                <span className="font-mono tabular-nums text-ink-600 group-hover:text-brand-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{c.q}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="divide-y divide-ink-800">
        {CHECKS.map((c, i) => (
          <article key={c.id} id={c.id} className="scroll-mt-[90px] py-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono t-meta tabular-nums text-ink-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="t-title text-lit-100">{c.q}</h2>
              <span
                className={`rounded-[3px] border px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] ${
                  c.weight === "gate"
                    ? "border-ink-650 text-mute-500"
                    : "border-brand-700/60 text-brand-500"
                }`}
              >
                {c.weight === "gate" ? "can fail a token" : "signal only"}
              </span>
            </div>

            <p className="mt-2 t-small leading-relaxed text-mute-400">
              <span className="text-mute-600">Reads </span>
              {c.reads}
            </p>

            <ul className="mt-2.5 space-y-1.5">
              {c.bands.map((b) => (
                <li key={b.state + b.label} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${STATE[b.state].dot}`}
                  />
                  <span className="t-small leading-relaxed text-mute-300">
                    <span className={`font-medium ${STATE[b.state].cls}`}>
                      {STATE[b.state].label}
                    </span>{" "}
                    {b.label}
                  </span>
                </li>
              ))}
              {c.unknown && (
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-500" />
                  <span className="t-small leading-relaxed text-mute-400">
                    <span className="font-medium text-mute-300">Unknown</span> {c.unknown}
                  </span>
                </li>
              )}
            </ul>

            <div className="mt-3 border-l-2 border-ink-700 pl-3">
              <p className="t-meta leading-relaxed text-mute-500">{c.caveat}</p>
            </div>
          </article>
        ))}
      </div>

      <section id="scoring" className="mt-8 scroll-mt-[90px]">
        <h2 className="t-title text-lit-100">How the score is built</h2>
        <div className="mt-2.5 space-y-2.5 t-small leading-relaxed text-mute-300">
          <p>
            Six checks are gates: sell, mint, liquidity, single wallet, cluster and
            creator history. A gate failure adds 26 points. The two signals —
            trading balance and exit depth — add 12. Cautions add 7, unanswered
            checks add 3, and the total is clamped to 100.
          </p>
          <p>
            Two gate failures, or any three failures, produce the worst band. One
            gate failure produces high risk. So a signal can raise the score but
            cannot disqualify a token alone, and no amount of passes averages away
            a gate failure.
          </p>
          <p>
            Fewer than six of the eight checks answered demotes the confidence
            label, and the header says how many are unanswered. A score built on
            half the evidence is not presented as if it were built on all of it.
          </p>
        </div>
      </section>

      <section id="risk" className="panel mt-8 p-5">
        <h2 className="t-label">Risk disclosure</h2>
        <div className="mt-2.5 space-y-2.5 t-small leading-relaxed text-mute-300">
          <p>
            Meme Checker is a research aid. It is not financial advice, not a
            recommendation, and not a guarantee that a token is safe. Tokens that
            pass every check have still gone to zero, and tokens that fail several
            have still run.
          </p>
          <p>
            All data comes from third-party public APIs. It can be wrong, delayed,
            incomplete, or describe a contract that has since changed. We do not
            audit contracts and we do not verify project claims.
          </p>
          <p>
            A missing value is shown as <span className="text-mute-100">unknown</span> and
            is excluded from the score. Unknown is never counted as a pass — if you
            see it, treat that check as unanswered rather than satisfied.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="t-label">Data sources</h2>
        <ul className="mt-3 space-y-2">
          {(
            [
              ["DexScreener", "pairs, price, liquidity, volume, age, project links"],
              ["GeckoTerminal", "trade tape and pool discovery for chains DexScreener does not index"],
              ["RugCheck", "Solana holders, authorities, creator history"],
              ["GoPlus", "EVM contract security, honeypot, taxes"],
              ["Solana RPC", "funding-source tracing for wallet clusters"],
            ] as const
          ).map(([n, d]) => (
            <li key={n} className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="t-body-strong text-lit-200">{n}</span>
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
