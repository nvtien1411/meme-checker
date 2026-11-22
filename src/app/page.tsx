import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

const CHECKS = [
  { q: "Can you sell it", d: "Honeypot simulation, freeze authority. The only check that matters if it fails." },
  { q: "Is the supply fixed", d: "Mint authority. A live mint is a dilution switch pointed at your position." },
  { q: "Can the liquidity be pulled", d: "LP lock and burn percentage. The classic rug, stated as a number." },
  { q: "Does one wallet hold too much", d: "Largest holder after removing pools, burns and exchanges." },
  { q: "Is the supply one entity in disguise", d: "Wallets that share a funding source, merged and counted once." },
  { q: "Has the creator done this before", d: "Every prior launch from the deployer wallet and how each one ended." },
  { q: "Is the trading real", d: "Buy/sell imbalance by volume across the recent tape, not just tx counts." },
  { q: "Can you actually get out", d: "How much you can sell before price impact hits 5%." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
      {/* hero */}
      <section className="border-b border-ink-800 py-10 sm:py-14">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono t-meta  text-mute-500">
              Solana · BNB Chain · Ethereum · Base · Robinhood
            </span>
            <span className="font-mono t-meta text-mute-500">
              free · no API key · no wallet
            </span>
          </div>

          <h1 className="mt-4 t-display leading-[1.15] tracking-tight text-slate-50 sm:t-display">
            Paste a contract address.
            <br />
            Find out what would actually
            <span className="text-brand-400"> cost you money</span>.
          </h1>

          <p className="mt-3 max-w-[62ch] t-body leading-relaxed text-mute-300">
            Eight checks in the order that matters. Every answer carries its
            source; anything we cannot verify says{" "}
            <span className="text-mute-400">unknown</span> instead of quietly
            becoming a pass.
          </p>
        </div>

        <div className="mt-6 max-w-3xl">
          <SearchBar size="lg" autoFocus />
        </div>

        <p className="mt-3 t-meta text-mute-500">
          Research tool, not a signal service. It cannot tell you what a token
          will do — only which rules it breaks.
        </p>
      </section>

      {/* the eight checks */}
      <section className="border-b border-ink-800 py-9">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="t-label text-mute-400">
            What gets checked
          </h2>
          <span className="font-mono t-meta text-mute-500">8 checks</span>
        </div>

        <div className="mt-4 grid gap-x-8 gap-y-0 border-t border-ink-800 sm:grid-cols-2">
          {CHECKS.map((c, i) => (
            <div
              key={c.q}
              className="flex gap-3 border-b border-ink-800 py-2.5"
            >
              <span className="mt-[2px] w-4 shrink-0 font-mono t-meta tabular-nums text-mute-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="t-body font-medium text-slate-200">{c.q}</p>
                <p className="mt-0.5 t-small leading-relaxed text-mute-500">{c.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="border-b border-ink-800 py-9">
        <h2 className="t-label text-mute-400">
          How it works
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Paste the CA",
              d: "Contract address, not the ticker. Chain is detected, or you pick one.",
            },
            {
              n: "02",
              t: "We read four sources",
              d: "DexScreener, GeckoTerminal, RugCheck and GoPlus. Each result is stamped with its source and snapshot time.",
            },
            {
              n: "03",
              t: "Read the failures first",
              d: "Checks are ordered worst-first. Expand any of them to see the number behind it and what would flip it.",
            },
          ].map((s) => (
            <li key={s.n} className="border-l-2 border-ink-700 pl-3">
              <div className="font-mono t-meta text-mute-500">{s.n}</div>
              <div className="mt-0.5 t-body font-medium text-slate-200">{s.t}</div>
              <p className="mt-1 t-small leading-relaxed text-mute-500">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* honesty block */}
      <section className="border-b border-ink-800 py-9">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h2 className="t-label text-mute-400">
              What this will not do
            </h2>
            <ul className="mt-3 space-y-2">
              {[
                "Predict price. There is no model here and no target.",
                "Call something safe. Passing eight checks is a floor, not a forecast.",
                "Fill gaps with guesses. Missing data renders as unknown and is excluded from the score.",
                "Label a wallet as dev, insider or smart money without evidence from the provider.",
              ].map((t) => (
                <li key={t} className="flex gap-2 t-small leading-relaxed text-mute-300">
                  <span aria-hidden className="mt-[3px] t-label text-bad-500">
                    ✕
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="t-label text-mute-400">
              What it is good at
            </h2>
            <ul className="mt-3 space-y-2">
              {[
                "Rejecting a token in five seconds when the answer is obvious.",
                "Showing you the number behind every verdict, with its source.",
                "Separating measured data from our own calculations from model output.",
                "Telling you when it does not know, instead of implying safety.",
              ].map((t) => (
                <li key={t} className="flex gap-2 t-small leading-relaxed text-mute-300">
                  <span aria-hidden className="mt-[3px] t-label text-ok-500">
                    ✓
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* telegram + pricing preview */}
      <section className="grid gap-5 border-b border-ink-800 py-9 lg:grid-cols-2">
        <div className="border border-ink-700 bg-ink-900 p-4">
          <h2 className="t-label text-mute-400">
            Same checks, inside Telegram
          </h2>
          <p className="mt-2 t-body leading-relaxed text-mute-300">
            Drop a contract address in a group and get the same verdict without
            leaving the chat. Same backend, same sources, same rules about
            unknown data.
          </p>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded border border-ink-600 px-2.5 py-1.5 t-small text-mute-300 transition hover:border-ink-500 hover:text-slate-100"
          >
            Open the bot <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="border border-ink-700 bg-ink-900 p-4">
          <h2 className="t-label text-mute-400">
            Free, and what sits behind it
          </h2>
          <ul className="mt-2 space-y-1.5 t-small">
            {[
              ["8 checks + verdict", "Free"],
              ["Top 10 holders + labels", "Free"],
              ["Narrative + project links", "Free"],
              ["Wallet cluster map", "Premium"],
              ["Dev wallet investigation", "Premium"],
              ["KOL intelligence", "Premium"],
            ].map(([f, tier]) => (
              <li key={f} className="flex items-baseline gap-2">
                <span className="text-mute-300">{f}</span>
                <span
                  className={`ml-auto font-mono t-label ${
                    tier === "Free" ? "text-ok-500" : "text-mute-500"
                  }`}
                >
                  {tier}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center gap-1.5 t-small text-brand-400 underline decoration-brand-600/40 decoration-dotted underline-offset-2 hover:text-brand-400/80"
          >
            See what premium includes
          </Link>
        </div>
      </section>

      {/* closing cta */}
      <section className="py-10">
        <div className="max-w-2xl">
          <h2 className="t-display text-slate-100">
            Check one now.
          </h2>
          <p className="mt-1.5 t-body leading-relaxed text-mute-400">
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
