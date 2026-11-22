import Link from "next/link";
import { connection } from "next/server";
import { analyzeToken } from "@/lib/analyze";
import type { AnalysisResult } from "@/lib/types";
import { fmtPct, fmtPrice, fmtUsd } from "@/lib/http";
import { Badge } from "./ui";

/* ------------------------------------------------------------------ *
 * Sample report
 *
 * Every reviewer of the first landing page said the same thing: it describes
 * eight checks but never shows one. In a category full of tools asking for a
 * contract address, a claim without a screenshot reads as a claim without a
 * product.
 *
 * This renders a real report from a real token through the same analysis
 * pipeline the result page uses — no mock data, no hard-coded numbers. If the
 * upstream sources are down, the block says so rather than showing a pretty
 * fake, because a fake sample would be the one thing that destroys trust in
 * everything else on the page.
 * ------------------------------------------------------------------ */

const SAMPLE = {
  address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  chain: "solana" as const,
  label: "BONK",
};

const BAND_TEXT: Record<string, string> = {
  avoid: "text-rose-400",
  risky: "text-orange-300",
  watch: "text-brand-400",
  clean: "text-emerald-400",
};

const STATE_BAR: Record<string, string> = {
  fail: "bg-rose-500",
  warn: "bg-amber-500",
  pass: "bg-emerald-500",
  unknown: "bg-ink-500",
};

export async function SampleReport() {
  // This block shows live numbers, so it must opt out of prerendering. Without
  // this the build tries to fetch four upstream APIs at compile time and fails.
  // Everything around it stays static.
  await connection();

  let data: AnalysisResult | null = null;
  try {
    data = await analyzeToken({ address: SAMPLE.address, chain: SAMPLE.chain, budgetMs: 12_000 });
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="border border-ink-700 bg-ink-900 px-4 py-6">
        <p className="t-body text-mute-300">
          The live sample could not be loaded right now — one of the upstream
          sources did not answer.
        </p>
        <p className="mt-1 t-meta leading-relaxed text-mute-500">
          Rather than hard-code a screenshot of a report that does not reflect
          current data, this block stays empty. Try the checker directly.
        </p>
        <Link
          href="/check"
          className="mt-3 inline-block rounded bg-brand-500 px-3 py-1.5 t-small font-semibold text-ink-950 hover:bg-brand-400"
        >
          Check a token
        </Link>
      </div>
    );
  }

  const { verdict, token, market, checks, holders } = data;
  const rank: Record<string, number> = { fail: 0, warn: 1, unknown: 2, pass: 3 };
  const ordered = [...checks].sort((a, b) => rank[a.state] - rank[b.state]);
  const top10 = holders.rows.reduce((s, h) => s + (h.pct ?? 0), 0);

  return (
    <div className="border border-ink-700 bg-ink-900">
      {/* header strip — the same information architecture as the real report */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-700 px-4 py-3">
        {token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={token.imageUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full border border-ink-600 object-cover"
          />
        ) : (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink-600 bg-ink-800 font-mono text-[9px] text-mute-400">
            {(token.symbol ?? "?").slice(0, 3).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="t-title truncate text-slate-100">{token.name ?? "Unknown"}</span>
            <span className="font-mono t-small text-brand-400">
              {token.symbol?.toUpperCase()}
            </span>
            <Badge tone="mute">{token.chain}</Badge>
          </div>
          <div className="mt-0.5 font-mono t-meta text-mute-500">
            {fmtPrice(market.priceUsd)} · {fmtUsd(market.liquidityUsd)} liquidity
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className={`t-title uppercase ${BAND_TEXT[verdict.band]}`}>
            {verdict.headline}
          </div>
          <div className="font-mono t-meta text-mute-500">{verdict.score}/100 risk</div>
        </div>
      </div>

      {/* the eight checks, as marks */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ink-700 px-4 py-2.5">
        <div className="flex gap-[3px]" aria-hidden>
          {ordered.map((c) => (
            <span key={c.id} className={`h-4 w-2 rounded-[1px] ${STATE_BAR[c.state]}`} />
          ))}
        </div>
        <span className="t-meta text-mute-400">
          {verdict.fails} failed · {verdict.warns} watch · {verdict.unknowns} unknown ·{" "}
          {verdict.passes} passed
        </span>
      </div>

      {/* three of the checks, verbatim from the pipeline */}
      <div className="flex items-baseline justify-between px-4 pb-1 pt-2.5">
        <span className="t-label">worst three of {checks.length}</span>
      </div>
      <ul className="divide-y divide-ink-800">
        {ordered.slice(0, 3).map((c) => (
          <li key={c.id} className="flex items-baseline justify-between gap-3 px-4 py-2">
            <span className="min-w-0 t-small text-slate-200">{c.label}</span>
            <span
              className={`shrink-0 font-mono t-meta tabular-nums ${
                c.state === "fail"
                  ? "text-rose-400"
                  : c.state === "warn"
                    ? "text-amber-400"
                    : c.state === "pass"
                      ? "text-emerald-400"
                      : "text-mute-500"
              }`}
            >
              {c.reading}
            </span>
          </li>
        ))}
      </ul>

      {/* concentration, the metric the whole product exists for — visually
          separated from the checks because it is not one of them */}
      <div className="border-t border-ink-700 bg-ink-850/40 px-4 py-2.5">
        <div className="flex items-baseline justify-between t-meta text-mute-500">
          <span className="t-label">concentration</span>
          <span className="font-mono text-slate-200">{fmtPct(top10)}</span>
        </div>
        <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-[2px] bg-ink-800">
          {holders.rows.map((h, i) =>
            h.pct === null ? null : (
              <div
                key={h.address}
                className={i === 0 ? "bg-rose-500" : i < 4 ? "bg-amber-500/70" : "bg-ink-500"}
                style={{ width: `${Math.min(100, h.pct)}%` }}
              />
            ),
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-700 bg-ink-850/50 px-4 py-2">
        <span className="t-meta text-mute-500">
          Live data · {data.provenance.length} sources · generated just now
        </span>
        <Link
          href={`/token/${SAMPLE.chain}/${SAMPLE.address}`}
          className="ml-auto t-meta text-brand-400 underline decoration-brand-600/40 decoration-dotted underline-offset-2 hover:text-brand-400/80"
        >
          Open the full report →
        </Link>
      </div>
    </div>
  );
}

export function SampleReportFallback() {
  return (
    <div className="border border-ink-700 bg-ink-900 p-4">
      <div className="flex items-center gap-2">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3 w-32 rounded-sm" />
          <div className="skeleton h-2.5 w-48 rounded-sm" />
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-4 w-2 rounded-[1px]" />
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-2.5 w-full rounded-sm" />
        ))}
      </div>
    </div>
  );
}
