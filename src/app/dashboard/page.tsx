import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "History",
  description: "Your plan, saved checks and usage",
};

const HISTORY = [
  { symbol: "BONK", chain: "Solana", verdict: "WATCH", score: 26, tone: "text-warn-400" },
  { symbol: "CAKE", chain: "BNB Chain", verdict: "NO RED FLAGS", score: 14, tone: "text-ok-400" },
  { symbol: "DEGEN", chain: "Base", verdict: "HIGH RISK", score: 58, tone: "text-risk-400" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[980px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="t-label">account</p>
          <h1 className="mt-2 t-display text-lit-50">History</h1>
        </div>
        <Link
          href="/check"
          className="glow-acid bg-brand-500 px-3.5 py-2 text-[12px] font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          Check a token
        </Link>
      </div>

      <div className="mt-5 flex items-start gap-2.5 border border-ink-800 px-3.5 py-2.5">
        <span aria-hidden className="mt-[6px] h-1 w-1 shrink-0 bg-warn-500" />
        <p className="t-small leading-relaxed text-mute-400">
          <span className="font-medium text-warn-400">Preview layout</span> Accounts, saved
          history and usage metering are not connected — the rows below show the intended
          structure, not your data
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-px border border-ink-800 bg-ink-800 sm:grid-cols-3">
        {[
          ["Plan", "Free", "no expiry"],
          ["Checks this month", "—", "not metered yet"],
          ["Saved tokens", "—", "requires an account"],
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-ink-950 px-4 py-3.5">
            <dt className="t-label">{label}</dt>
            <dd className="mt-1.5 font-mono text-[20px] leading-none tabular-nums text-lit-100">
              {value}
            </dd>
            <dd className="mt-1 t-meta text-mute-600">{sub}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8">
        <div className="flex items-baseline justify-between pb-2.5">
          <h2 className="t-section text-lit-100">Recent checks</h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute-600">
            placeholder
          </span>
        </div>

        <div className="border border-ink-800">
          <div className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-ink-800 px-4 py-1.5 sm:grid-cols-[110px_1fr_auto]">
            <span className="t-label">token</span>
            <span className="hidden t-label sm:block">chain / verdict</span>
            <span className="t-label text-right">risk</span>
          </div>
          <ul className="divide-y divide-ink-850">
            {HISTORY.map((h) => (
              <li
                key={h.symbol}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 sm:grid-cols-[110px_1fr_auto]"
              >
                <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-lit-100">
                  {h.symbol}
                </span>
                <span className="hidden items-center gap-2.5 sm:flex">
                  <span className="t-meta text-mute-600">{h.chain}</span>
                  <span className={`font-mono text-[9px] uppercase tracking-[0.08em] ${h.tone}`}>
                    {h.verdict}
                  </span>
                </span>
                <span className="text-right font-mono text-[11.5px] tabular-nums text-mute-400">
                  {h.score}
                  <span className="text-mute-600">/100</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-ink-800 pt-6 sm:grid-cols-2">
        <div>
          <h2 className="t-label">plan and billing</h2>
          <p className="mt-2 t-small leading-relaxed text-mute-400">
            You are on the free tier. Premium and Group are not available yet, so there is
            nothing to upgrade to and no payment method on file
          </p>
          <Link
            href="/pricing"
            className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.1em] text-brand-400 underline decoration-brand-700/60 underline-offset-4 hover:text-brand-300"
          >
            what premium will include
          </Link>
        </div>
        <div>
          <h2 className="t-label">telegram</h2>
          <p className="mt-2 t-small leading-relaxed text-mute-400">
            Linking a Telegram account to your history is planned. The bot runs the same eight
            checks as the website, against the same sources
          </p>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.1em] text-brand-400 underline decoration-brand-700/60 underline-offset-4 hover:text-brand-300"
          >
            open the bot ↗
          </a>
        </div>
      </div>
    </div>
  );
}
