import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { HeroReport, HeroReportSkeleton } from "@/components/HeroReport";

const CHECKS = [
  { q: "Can you sell it", d: "A token you cannot exit is not an investment, it is a donation. Honeypot simulation and freeze authority." },
  { q: "Is the supply fixed", d: "A live mint is a dilution switch pointed at your position." },
  { q: "Can the liquidity be pulled", d: "The classic rug, expressed as a single percentage." },
  { q: "Does one wallet hold too much", d: "Largest holder after removing pools, burns and exchanges." },
  { q: "Is the supply one entity in disguise", d: "Wallets sharing a funding source, merged and counted once." },
  { q: "Has the creator done this before", d: "Every prior launch from the deployer, and how each one ended." },
  { q: "Is the trading real", d: "Buy and sell pressure by volume, not just transaction counts." },
  { q: "Can you actually get out", d: "How much you can sell before price impact eats the position." },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
      {/* ---------------------------------------------------------------- *
       * HERO — claim left, evidence right
       * ---------------------------------------------------------------- */}
      <section className="border-b border-ink-800">
        <div className="grid items-start gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,398px)] lg:gap-12 lg:py-14">
          <div className="min-w-0">
            <div className="space-y-1">
              <div className="t-label">Solana · BNB · Ethereum · Base · Robinhood Chain</div>
              <div className="t-meta text-mute-500">free tier · no key · no wallet</div>
            </div>

            <h1 className="mt-4 t-hero text-lit-50">
              Find out what
              <br />
              could <span className="text-brand-400">cost you money</span>
              <br />
              before you buy.
            </h1>

            <p className="mt-4 max-w-[52ch] t-body leading-relaxed text-mute-300">
              Paste a contract address. Get eight checks in the order that
              matters, each one carrying the number behind it and the source it
              came from. Anything we cannot verify says{" "}
              <span className="text-mute-200">unknown</span> instead of quietly
              becoming a pass.
            </p>

            <div className="mt-6 max-w-xl">
              <SearchBar size="lg" autoFocus />
            </div>

            <p className="mt-4 t-meta text-mute-600">
              A research tool, not a signal service. It cannot tell you what a
              token will do — only which rules it breaks.
            </p>
          </div>

          <div className="min-w-0">
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="t-label">Live example</span>
              <Link
                href="/check"
                className="t-meta text-mute-500 underline decoration-ink-600 decoration-dotted underline-offset-2 transition hover:text-brand-400"
              >
                check your own →
              </Link>
            </div>
            <Suspense fallback={<HeroReportSkeleton />}>
              <HeroReport />
            </Suspense>
            <p className="mt-2 t-meta leading-relaxed text-mute-600">
              Pulled from the live pipeline on page load. Not a mockup — if a
              source fails, this says so.
            </p>
          </div>
        </div>

        {/* stat strip */}
        <dl className="grid grid-cols-2 gap-px border-t border-ink-800 bg-ink-800 sm:grid-cols-4">
          {[
            { k: "8", v: "checks per token", s: "ordered by severity" },
            { k: "5", v: "chains supported", s: "Solana and four EVM" },
            { k: "0", v: "API keys required", s: "no signup to check" },
            { k: "~3s", v: "typical result", s: "cached for repeat views" },
          ].map((x) => (
            <div key={x.v} className="bg-ink-950 px-4 py-3.5">
              <dt className="font-mono t-num-lg leading-none text-lit-100">{x.k}</dt>
              <dd className="mt-1.5 t-small text-mute-300">{x.v}</dd>
              <dd className="mt-0.5 t-meta text-mute-600">{x.s}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------------------------------------------------------- *
       * WHAT GETS CHECKED
       * ---------------------------------------------------------------- */}
      <section className="border-b border-ink-800 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t-display text-lit-100">What gets checked</h2>
          <span className="t-meta text-mute-600">
            thresholds and blind spots documented on the{" "}
            <Link href="/faq" className="text-mute-400 underline decoration-ink-600 decoration-dotted underline-offset-2 hover:text-lit-200">
              method page
            </Link>
          </span>
        </div>

        <div className="mt-5 grid gap-x-10 border-t border-ink-800 sm:grid-cols-2">
          {CHECKS.map((c, i) => (
            <div key={c.q} className="flex gap-3.5 border-b border-ink-800 py-3.5">
              <span className="mt-[2px] w-5 shrink-0 font-mono t-meta tabular-nums text-ink-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="t-body-strong text-lit-200">{c.q}</p>
                <p className="mt-1 t-small leading-relaxed text-mute-500">{c.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * HOW IT WORKS
       * ---------------------------------------------------------------- */}
      <section className="border-b border-ink-800 py-10">
        <h2 className="t-display text-lit-100">How it works</h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Paste the address",
              d: "The contract address, not the ticker. Chain is detected, or you pick one to skip a lookup.",
            },
            {
              n: "02",
              t: "We read every source",
              d: "DexScreener, GeckoTerminal, RugCheck, GoPlus and a Solana RPC. Each call is timed and shown, including the ones that failed.",
            },
            {
              n: "03",
              t: "Read the failures first",
              d: "Checks are ordered worst-first. Open any row for the reading, its source, and what would change the answer.",
            },
          ].map((s) => (
            <li key={s.n} className="border-l-2 border-ink-700 pl-4">
              <div className="font-mono t-meta text-mute-600">{s.n}</div>
              <div className="mt-1 t-body-strong text-lit-200">{s.t}</div>
              <p className="mt-1.5 t-small leading-relaxed text-mute-500">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- *
       * HONESTY — what it will not do
       * ---------------------------------------------------------------- */}
      <section className="grid gap-8 border-b border-ink-800 py-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="t-display text-lit-100">What this will not do</h2>
          <ul className="mt-4 space-y-2.5">
            {[
              "Predict price. There is no model here and no target.",
              "Call something safe. Passing eight checks is a floor, not a forecast.",
              "Fill gaps with guesses. Missing data reads as unknown and is excluded from the score.",
              "Label a wallet as dev, insider or smart money without the provider saying so.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5 t-body leading-relaxed text-mute-300">
                <span aria-hidden className="mt-[7px] h-[3px] w-[7px] shrink-0 rounded-full bg-bad-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="t-display text-lit-100">What it is good at</h2>
          <ul className="mt-4 space-y-2.5">
            {[
              "Rejecting a token in five seconds when the answer is obvious.",
              "Showing the number behind every verdict, with its source.",
              "Separating measured data from our arithmetic from inference.",
              "Telling you when it does not know, instead of implying safety.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5 t-body leading-relaxed text-mute-300">
                <span aria-hidden className="mt-[7px] h-[3px] w-[7px] shrink-0 rounded-full bg-ok-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- *
       * SURFACES — web + telegram, free vs premium
       * ---------------------------------------------------------------- */}
      <section className="grid gap-4 border-b border-ink-800 py-10 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="t-title text-lit-100">Same checks, inside Telegram</h2>
          <p className="mt-2 t-small leading-relaxed text-mute-400">
            Drop a contract address into a group and get the same verdict without
            leaving the chat. Same backend, same sources, same rules about
            unknown data.
          </p>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-[3px] border border-ink-650 px-3 py-1.5 t-small text-mute-300 transition hover:border-ink-500 hover:text-lit-100"
          >
            Open the bot <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="panel p-5">
          <h2 className="t-title text-lit-100">Free, and what sits behind it</h2>
          <ul className="mt-3 space-y-1.5">
            {[
              ["8 checks + verdict", "Free", true],
              ["Top 10 holders with labels", "Free", true],
              ["Narrative + project links", "Free", true],
              ["Wallet cluster map", "Planned", false],
              ["Dev wallet investigation", "Planned", false],
              ["KOL intelligence", "Planned", false],
            ].map(([f, tier, free]) => (
              <li key={f as string} className="flex items-baseline gap-2 t-small">
                <span className={free ? "text-mute-300" : "text-mute-600"}>{f as string}</span>
                <span
                  className={`ml-auto font-mono text-[10px] uppercase tracking-[0.06em] ${
                    free ? "text-ok-500" : "text-mute-600"
                  }`}
                >
                  {tier as string}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/pricing"
            className="mt-3.5 inline-block t-meta text-brand-400 underline decoration-brand-700 decoration-dotted underline-offset-2 hover:text-brand-300"
          >
            See what premium will include →
          </Link>
        </div>
      </section>

      {/* closing */}
      <section className="py-12">
        <div className="max-w-xl">
          <h2 className="t-display text-lit-100">Check one now</h2>
          <p className="mt-1.5 t-small leading-relaxed text-mute-400">
            No signup, no wallet connection, no rate-limit wall on the free tier.
          </p>
          <div className="mt-4">
            <SearchBar size="sm" />
          </div>
        </div>
      </section>
    </div>
  );
}
