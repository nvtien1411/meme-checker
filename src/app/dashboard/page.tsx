import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your plan, saved checks and usage.",
};

const HISTORY = [
  { symbol: "BONK", chain: "Solana", verdict: "WATCH", score: 26, tone: "warn" },
  { symbol: "CAKE", chain: "BNB Chain", verdict: "NO RED FLAGS", score: 14, tone: "ok" },
  { symbol: "DEGEN", chain: "Base", verdict: "HIGH RISK", score: 58, tone: "risky" },
];

const TONE_CLS: Record<string, string> = {
  warn: "text-warn-400 border-warn-600/45",
  ok: "text-ok-400 border-ok-600/45",
  risky: "text-risk-400 border-risk-600/45",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="t-display text-lit-50">Dashboard</h1>
        <Link
          href="/check"
          className="rounded-[3px] bg-brand-500 px-3 py-1.5 t-small font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          Check a token
        </Link>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-[3px] border border-warn-600/35 bg-warn-600/[0.06] px-3.5 py-2.5">
        <span aria-hidden className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-warn-500" />
        <p className="t-small leading-relaxed text-mute-400">
          <span className="font-medium text-warn-400">Preview layout.</span>{" "}
          Accounts, saved history and usage metering are not connected yet — the
          rows below show the intended structure, not your data.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Plan", value: "Free", sub: "no expiry" },
          { label: "Checks this month", value: "—", sub: "not metered yet" },
          { label: "Saved tokens", value: "—", sub: "requires an account" },
        ].map((s) => (
          <div key={s.label} className="panel px-4 py-3.5">
            <div className="t-label">{s.label}</div>
            <div className="mt-1.5 font-mono t-num-lg leading-none text-lit-100">{s.value}</div>
            <div className="mt-1 t-meta text-mute-600">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Panel
          title="Recent checks"
          right={<span className="font-mono text-[9.5px] uppercase tracking-[0.06em]">placeholder</span>}
          flush
        >
          <div className="flex items-center gap-x-3 border-b border-ink-800 bg-ink-850/40 px-4 py-1.5">
            <span className="w-16 t-meta text-mute-600">Token</span>
            <span className="t-meta text-mute-600">Chain</span>
            <span className="t-meta text-mute-600">Verdict</span>
            <span className="ml-auto t-meta text-mute-600">Risk score</span>
          </div>
          <ul className="divide-y divide-ink-800">
            {HISTORY.map((h) => (
              <li
                key={h.symbol}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
              >
                <span className="w-16 font-mono t-small text-lit-200">{h.symbol}</span>
                <span className="t-meta text-mute-600">{h.chain}</span>
                <span
                  className={`rounded-[3px] border px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.05em] ${TONE_CLS[h.tone]}`}
                >
                  {h.verdict}
                </span>
                <span className="ml-auto font-mono text-[11px] tabular-nums text-mute-500">
                  {h.score}/100
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Panel title="Plan and billing">
          <p className="t-small leading-relaxed text-mute-400">
            You are on the free tier. Premium and Group are not available yet, so
            there is nothing to upgrade to and no payment method on file.
          </p>
          <Link
            href="/pricing"
            className="mt-2.5 inline-block t-meta text-brand-400 underline decoration-brand-700 decoration-dotted underline-offset-2 hover:text-brand-300"
          >
            What premium will include →
          </Link>
        </Panel>

        <Panel title="Telegram">
          <p className="t-small leading-relaxed text-mute-400">
            Linking a Telegram account to your dashboard is planned. The bot
            itself will run the same checks as the website.
          </p>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-block t-meta text-brand-400 underline decoration-brand-700 decoration-dotted underline-offset-2 hover:text-brand-300"
          >
            Open the bot ↗
          </a>
        </Panel>
      </div>
    </div>
  );
}
