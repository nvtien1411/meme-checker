import { connection } from "next/server";
import Link from "next/link";
import { analyzeToken } from "@/lib/analyze";
import type { AnalysisResult } from "@/lib/types";
import { fmtPct, fmtPrice, fmtUsd } from "@/lib/http";
import { RiskArc } from "@/components/viz";
import { CHAIN_BY_ID } from "@/lib/chains";
import { sortBySeverity } from "@/lib/check-order";

/* ==================================================================== *
 * LIVE SAMPLE
 *
 * The landing page's central claim is that the product reads real data.
 * A screenshot cannot support that claim; this runs the same pipeline the
 * report page runs, at request time, and says so when a source fails.
 *
 * Kept deliberately short — the arc, the band, the three worst readings.
 * Enough to prove the thing works, not so much that the marketing page
 * becomes a dashboard.
 * ==================================================================== */

const SAMPLE = {
  address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  chain: "solana" as const,
};

const BAND_TEXT = {
  avoid: "text-bad-400",
  risky: "text-risk-400",
  watch: "text-warn-400",
  clean: "text-ok-400",
} as const;

const BAND_LABEL = {
  avoid: "Avoid",
  risky: "High risk",
  watch: "Watch",
  clean: "No red flags",
} as const;

/* Canonical order from the method page, so a row here and a row there carry the
   same number. */
const CHECK_NO: Record<string, string> = {
  sell: "01",
  mint: "02",
  lp: "03",
  "top-wallet": "04",
  cluster: "05",
  deployer: "06",
  flow: "07",
  exit: "08",
};

const STATE_WORD = {
  fail: "failed",
  warn: "watch",
  pass: "passed",
  unknown: "unknown",
} as const;

const STATE_TEXT = {
  fail: "text-bad-400",
  warn: "text-warn-400",
  pass: "text-ok-400",
  unknown: "text-mute-500",
} as const;

export async function LiveSample() {
  await connection();

  let data: AnalysisResult | null = null;
  try {
    data = await analyzeToken({ address: SAMPLE.address, chain: SAMPLE.chain, budgetMs: 11_000 });
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="border border-ink-800 px-4 py-5">
        <p className="t-label text-warn-400">sample unavailable</p>
        <p className="mt-2 t-small leading-relaxed text-mute-400">
          An upstream source did not answer. Nothing is invented to fill the gap — run a check
          and you will see the same honest failure
        </p>
        <Link
          href="/check"
          className="mt-3 inline-block glow-acid bg-brand-500 px-3 py-1.5 text-[12px] font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          Check a token
        </Link>
      </div>
    );
  }

  const { verdict, token, market, checks, holders } = data;
  const ordered = sortBySeverity(checks);
  const top10 = holders.rows.reduce((s, h) => s + (h.pct ?? 0), 0);

  return (
    <div className="border border-ink-800">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-ink-800 px-4 py-2.5">
        {token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={token.imageUrl}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full border border-ink-700 object-cover"
          />
        ) : (
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink-700 bg-ink-850 font-mono text-[8px] text-mute-600">
            {(token.symbol ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="min-w-0 truncate text-[12.5px] font-medium text-lit-100">
          {token.name}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-mute-500">
          {token.symbol}
        </span>
        <span
          className="hidden shrink-0 border px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] sm:inline"
          style={{
            color: CHAIN_BY_ID[token.chain].tint,
            borderColor: `color-mix(in srgb, ${CHAIN_BY_ID[token.chain].tint} 35%, transparent)`,
          }}
        >
          {CHAIN_BY_ID[token.chain].short}
        </span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5">
          <span aria-hidden className="live-dot h-1.5 w-1.5 rounded-full bg-ok-500" />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ok-400">
            live
          </span>
        </span>
      </div>

      {/* verdict */}
      <div className="flex items-center gap-5 px-4 py-4">
        <RiskArc score={verdict.score} band={verdict.band} size={124} neutralNumber />
        <div className="min-w-0 flex-1">
          <div className={`t-title ${BAND_TEXT[verdict.band]}`}>{BAND_LABEL[verdict.band]}</div>
          <div className="mt-1 font-mono text-[10px] tabular-nums text-mute-500">
            {fmtPrice(market.priceUsd)} · {fmtUsd(market.liquidityUsd)} liquidity
          </div>
          <div className="mt-2 font-mono text-[9.5px] uppercase leading-relaxed tracking-[0.06em] text-mute-600">
            {verdict.failuresLine}
          </div>
        </div>
      </div>

      {/* three worst */}
      <div className="border-t border-ink-800 px-4 py-1.5">
        <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-600">
          worst three, with source
        </span>
      </div>
      <ul>
        {ordered.slice(0, 3).map((c) => (
          <li key={c.id} className="border-b border-ink-850 py-2 pl-4 pr-4 last:border-b-0">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <span className="flex min-w-0 gap-2 pr-2">
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-mute-600">
                  #{CHECK_NO[c.id] ?? "—"}
                </span>
                <span className="min-w-0 text-[11.5px] leading-snug text-mute-400">{c.label}</span>
              </span>
              <span
                className={`shrink-0 font-mono text-[11px] tabular-nums sm:text-right ${STATE_TEXT[c.state]}`}
              >
                {c.reading}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2 font-mono text-[8.5px] uppercase tracking-[0.08em]">
              <span className={STATE_TEXT[c.state]}>{STATE_WORD[c.state]}</span>
              <span className="text-mute-600">{c.source}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* concentration — a separate measurement, not a fourth check row */}
      <div className="border-t border-ink-800 bg-ink-925 px-4 py-2">
        <div className="flex items-baseline justify-between font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-600">
          <span>supply concentration</span>
          <span>rugcheck</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="text-[11.5px] text-mute-400">top 10 wallets hold</span>
          <span
            className={`font-mono text-[12.5px] tabular-nums ${
              top10 >= 30 ? "text-bad-400" : top10 >= 10 ? "text-warn-400" : "text-lit-200"
            }`}
          >
            {fmtPct(top10)}
          </span>
        </div>
      </div>

      <Link
        href={`/token/${SAMPLE.chain}/${SAMPLE.address}`}
        className="group flex min-h-[44px] items-center justify-between border-t border-ink-800 bg-ink-900 px-4 py-2.5 text-[11.5px] font-medium text-lit-100 transition-colors hover:bg-ink-850"
      >
        <span>Open the full report</span>
        <span
          aria-hidden
          className="font-mono text-mute-500 transition-transform group-hover:translate-x-0.5 group-hover:text-lit-100"
        >
          →
        </span>
      </Link>
    </div>
  );
}

export function LiveSampleSkeleton() {
  return (
    <div className="border border-ink-800">
      <div className="flex items-center gap-2.5 border-b border-ink-800 px-4 py-2.5">
        <div className="skeleton h-6 w-6 rounded-full" />
        <div className="skeleton h-2.5 w-24" />
        <div className="ml-auto skeleton h-2 w-10" />
      </div>
      <div className="flex items-center gap-5 px-4 py-4">
        <div className="skeleton h-[132px] w-[132px] rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-2 w-28" />
          <div className="skeleton h-2 w-24" />
        </div>
      </div>
      <div className="space-y-2.5 border-t border-ink-800 px-4 py-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-2.5 w-full" />
        ))}
      </div>
    </div>
  );
}
