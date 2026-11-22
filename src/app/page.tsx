import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { LiveSample, LiveSampleSkeleton } from "@/components/HeroReport";

/* ==================================================================== *
 * LANDING
 *
 * The previous landing was a two-column hero — headline left, small card
 * right — over a strip of four stat boxes. That composition is the default
 * of every generated SaaS page, which is why it read as generic no matter
 * how the type was set.
 *
 * This version is built around a single idea: the product is a scanner, so
 * the input is the composition. The headline runs to the full measure, the
 * CA field sits directly beneath it as the largest control on the page, and
 * the evidence panel is deliberately offset rather than mirrored. Below
 * that, the page is a document — numbered sections, rules, no cards.
 * ==================================================================== */

const CHECKS = [
  {
    q: "Can you sell it?",
    d: "Honeypot simulation on EVM, freeze authority on Solana. A token you cannot exit is not a position, it is a donation",
  },
  {
    q: "Is the supply fixed?",
    d: "A live mint is a dilution switch pointed at your entry. Graded harder on tokens under 30 days old",
  },
  {
    q: "Can the liquidity be pulled?",
    d: "The classic rug, expressed as one percentage: how much of the pool is locked or burned",
  },
  {
    q: "Does one wallet hold too much?",
    d: "Largest holder after removing pools, burns and exchange wallets — the seller who can move price against you",
  },
  {
    q: "Is the supply one entity in disguise?",
    d: "Wallets sharing a funding source are merged and counted once. Ten addresses from one wallet is one wallet",
  },
  {
    q: "Has the creator done this before?",
    d: "Every prior launch from the deployer wallet, and how each one ended. The strongest on-chain predictor there is",
  },
  {
    q: "Is the trading real?",
    d: "Buy and sell pressure by dollar volume, not transaction count. Wash trading inflates counts, not capital",
  },
  {
    q: "Can you actually get out?",
    d: "How much you can sell before price impact eats the position, from pool reserves",
  },
];

export default function Home() {
  return (
    <div>
      {/* ---------------------------------------------------------------- *
       * HERO
       * ---------------------------------------------------------------- */}
      <section className="border-b border-ink-800">
        <div className="grid grid-cols-1 gap-y-10 px-4 pb-10 pt-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-x-14 lg:px-8 lg:pb-12 lg:pt-12">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-mute-600">
              <span className="text-mute-400">on-chain risk intelligence</span>
              <span aria-hidden className="h-[3px] w-[3px] bg-ink-600" />
              <span className="hidden sm:inline">solana · bnb chain · ethereum · base · robinhood chain</span><span className="sm:hidden">solana · bnb · ethereum · base · robinhood</span>
            </div>

            <h1 className="mt-5 max-w-[17ch] t-hero text-lit-50">
              Find out what could
              <br />
              <em className="not-italic text-bad-400">cost you money</em>
              <br />
              before you buy
            </h1>

            <p className="mt-4 max-w-[600px] t-body leading-relaxed text-mute-400">
              Paste a contract address and get eight checks in the order that matters, each one
              carrying the number behind it and the source it came from. What we cannot verify is
              marked <span className="font-mono text-[12px] text-lit-200">unknown</span> — it never
              quietly becomes a pass
            </p>

            {/* the console: the largest control on the page, on purpose */}
            <div className="mt-7 max-w-[600px]">
              <SearchBar size="lg" autoFocus />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-ink-800 pt-4">
              {[
                ["8", "checks"],
                ["5", "chains"],
                ["0", "API keys"],
                ["~3s", "typical"],
              ].map(([n, label]) => (
                <div key={label} className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[14px] tabular-nums text-lit-100">{n}</span>
                  <span className="t-meta text-mute-600">{label}</span>
                </div>
              ))}
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.1em] text-mute-600">
                research tool · not a signal service
              </span>
            </div>
          </div>

          {/* offset evidence panel */}
          <div className="min-w-0 lg:pt-2">
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="t-label">live sample</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute-600">
                bonk
              </span>
            </div>
            <Suspense fallback={<LiveSampleSkeleton />}>
              <LiveSample />
            </Suspense>
            <p className="mt-2 t-meta leading-relaxed text-mute-600">
              Run against the live pipeline on every page load, for BONK. If a source fails this
              says so instead of filling the gap
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * THE EIGHT CHECKS — a numbered ledger, not a feature grid
       * ---------------------------------------------------------------- */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t-display text-lit-50">What gets checked</h2>
          <Link
            href="/faq"
            className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-mute-500 transition-colors hover:text-lit-100"
          >
            thresholds and blind spots
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-px border border-ink-800 bg-ink-800 sm:grid-cols-4">
          {[
            ["pass", "inside the band", "text-ok-400", "bg-ok-500"],
            ["watch", "between bands", "text-warn-400", "bg-warn-500"],
            ["fail", "outside the band", "text-bad-400", "bg-bad-500"],
            ["unknown", "no data — not a pass", "text-mute-400", "bg-ink-500"],
          ].map(([word, note, cls, dot]) => (
            <div key={word} className="bg-ink-950 px-3.5 py-2.5">
              <dt className="flex items-center gap-1.5">
                <span aria-hidden className={`h-1 w-1 ${dot}`} />
                <span className={`font-mono text-[9.5px] uppercase tracking-[0.1em] ${cls}`}>
                  {word}
                </span>
              </dt>
              <dd className="mt-1 t-meta text-mute-600">{note}</dd>
            </div>
          ))}
        </dl>

        <ol className="mt-7 grid grid-cols-1 gap-x-14 border-t border-ink-800 sm:grid-cols-2">
          {CHECKS.map((c, i) => (
            <li key={c.q} className="flex gap-4 border-b border-ink-800 py-4">
              <span className="mt-[3px] w-6 shrink-0 font-mono text-[10px] tabular-nums tracking-[0.08em] text-brand-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="t-body-strong text-lit-100">{c.q}</p>
                <p className="mt-1.5 max-w-[52ch] t-small leading-relaxed text-mute-500">{c.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- *
       * WHAT IT WILL NOT DO — the honesty block, in three columns
       * ---------------------------------------------------------------- */}
      <section className="border-y border-ink-800 bg-ink-925 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <div>
            <h2 className="t-display text-lit-50">
              What this
              <br />
              will not do
            </h2>
            <p className="mt-3 max-w-[34ch] t-small leading-relaxed text-mute-500">
              The limits are part of the product. A tool that hides them is selling confidence,
              not evidence
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
            {[
              ["Predict price", "There is no forecast here and no target. It reports which rules a contract breaks."],
              ["Call something safe", "Passing eight checks is a floor. Tokens that passed every check have still gone to zero."],
              ["Fill gaps with guesses", "Missing data is shown as unknown, excluded from the score, and never counted as a pass."],
              ["Invent wallet labels", "A wallet is only called a pool, a burn or an exchange when the provider says so."],
            ].map(([t, d]) => (
              <div key={t} className="border-l border-ink-700 pl-4">
                <p className="t-body-strong text-lit-100">{t}</p>
                <p className="mt-1.5 t-small leading-relaxed text-mute-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * HOW IT WORKS
       * ---------------------------------------------------------------- */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="t-display text-lit-50">How a check runs</h2>
        <div className="mt-7 grid grid-cols-1 gap-x-10 border-t border-ink-800 sm:grid-cols-3">
          {[
            ["Paste the address", "The contract address, not the ticker. Chain is detected, or you pick one to skip the lookup."],
            ["Every source is read", "DexScreener, GeckoTerminal, RugCheck, GoPlus and a Solana RPC. Each call is timed and listed, including the ones that failed."],
            ["Read the failures first", "Checks are ordered worst-first. Open any row for the reading, its source, and what would change the answer."],
          ].map(([t, d], i) => (
            <div key={t} className="border-b border-ink-800 py-5 sm:border-b-0 sm:border-r sm:pr-8 sm:last:border-r-0">
              <span className="font-mono text-[10px] tabular-nums tracking-[0.08em] text-mute-600">
                0{i + 1}
              </span>
              <p className="mt-2 t-body-strong text-lit-100">{t}</p>
              <p className="mt-1.5 t-small leading-relaxed text-mute-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * CLOSING
       * ---------------------------------------------------------------- */}
      <section className="border-t border-ink-800 px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          <div>
            <h2 className="max-w-[16ch] t-display text-lit-50">
              Check one before the chart does it for you
            </h2>
            <p className="mt-3 max-w-[46ch] t-small leading-relaxed text-mute-500">
              No signup, no wallet connection, no key. The same eight checks run on every token,
              on every chain we support
            </p>
          </div>
          <div>
            <SearchBar size="sm" />
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-800 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute-600">
            meme checker — research aid, not financial advice
          </span>
          <div className="ml-auto flex flex-wrap gap-x-5 gap-y-1">
            {[
              ["/faq", "method"],
              ["/pricing", "plans"],
              ["/check", "checker"],
              ["https://t.me/", "telegram ↗"],
            ].map(([href, label]) => (
              <Link
                key={label}
                href={href}
                className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute-600 transition-colors hover:text-lit-200"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
