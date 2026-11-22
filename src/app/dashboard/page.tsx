import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your plan, saved checks and usage.",
};

const HISTORY = [
  { symbol: "BONK", chain: "Solana", verdict: "WATCH", score: 26, when: "2h ago" },
  { symbol: "CAKE", chain: "BNB Chain", verdict: "NO RED FLAGS", score: 14, when: "yesterday" },
  { symbol: "DEGEN", chain: "Base", verdict: "HIGH RISK", score: 58, when: "2 days ago" },
];

const BAND: Record<string, string> = {
  WATCH: "text-brand-400 border-brand-600/50",
  "NO RED FLAGS": "text-ok-500 border-ok-600/50",
  "HIGH RISK": "text-warn-500 border-warn-600/50",
  AVOID: "text-bad-500 border-bad-600/50",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="t-display text-slate-50">Dashboard</h1>
        <Link
          href="/check"
          className="rounded bg-brand-500 px-3 py-1.5 t-small font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          New check
        </Link>
      </div>

      <div className="mt-4 border border-ink-700 bg-ink-900 px-3.5 py-2.5">
        <p className="t-small leading-relaxed text-mute-300">
          <span className="font-medium text-warn-500">This is a preview layout.</span>{" "}
          Accounts, saved history and usage metering are not connected yet — the rows
          below are placeholders showing the intended structure, not your data.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Plan", value: "Free", sub: "no expiry" },
          { label: "Checks this month", value: "—", sub: "not metered yet" },
          { label: "Saved tokens", value: "—", sub: "requires an account" },
        ].map((s) => (
          <div key={s.label} className="border border-ink-700 bg-ink-900 px-3.5 py-3">
            <div className="t-label text-mute-500">{s.label}</div>
            <div className="mt-1 font-mono t-display tabular-nums text-slate-100">{s.value}</div>
            <div className="mt-0.5 t-meta text-mute-500">{s.sub}</div>
          </div>
        ))}
      </div>

      <section className="mt-6 border border-ink-700 bg-ink-900">
        <header className="flex items-center justify-between border-b border-ink-700 px-3.5 py-2.5">
          <h2 className="t-label text-mute-400">
            Recent checks
          </h2>
          <span className="font-mono t-label text-mute-500">
            placeholder
          </span>
        </header>
        <ul className="divide-y divide-ink-800">
          {HISTORY.map((h) => (
            <li key={h.symbol} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5">
              <span className="w-16 font-mono t-small text-slate-200">{h.symbol}</span>
              <span className="t-small text-mute-500">{h.chain}</span>
              <span
                className={`rounded border px-1.5 py-0.5 font-mono t-label ${BAND[h.verdict]}`}
              >
                {h.verdict}
              </span>
              <span className="ml-auto font-mono t-meta tabular-nums text-mute-500">
                {h.score}/100
              </span>
              <span className="w-20 text-right t-meta text-mute-500">{h.when}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="border border-ink-700 bg-ink-900 p-3.5">
          <h2 className="t-label text-mute-400">
            Plan and billing
          </h2>
          <p className="mt-1.5 t-small leading-relaxed text-mute-300">
            You are on the free tier. Premium and Group are not available yet, so
            there is nothing to upgrade to and no payment method on file.
          </p>
          <Link
            href="/pricing"
            className="mt-2.5 inline-block t-small text-brand-400 underline decoration-dotted underline-offset-2"
          >
            What premium will include
          </Link>
        </div>

        <div className="border border-ink-700 bg-ink-900 p-3.5">
          <h2 className="t-label text-mute-400">
            Telegram
          </h2>
          <p className="mt-1.5 t-small leading-relaxed text-mute-300">
            Linking a Telegram account to your dashboard is planned. The bot itself
            will run the same checks as the website.
          </p>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-block t-small text-brand-400 underline decoration-dotted underline-offset-2"
          >
            Open the bot ↗
          </a>
        </div>
      </div>
    </div>
  );
}
