import { connection } from "next/server";
import Link from "next/link";
import { analyzeToken } from "@/lib/analyze";
import type { AnalysisResult } from "@/lib/types";
import { fmtPct, fmtPrice, fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * Hero evidence card
 *
 * The landing page's job is to answer "what does this actually do" in under
 * five seconds. A description cannot do that; a real report can. This runs a
 * token through the same pipeline the result page uses, at request time.
 *
 * Deliberately compact — verdict, ring, three worst readings, concentration.
 * Enough to look like the thing you would get, not so much that it becomes a
 * dashboard on the marketing page.
 *
 * If a source fails, the card says so. A hard-coded screenshot would be the
 * one element on the page that could not be trusted, on a product whose whole
 * premise is not making things up.
 * ==================================================================== */

const SAMPLE = {
  address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  chain: "solana" as const,
};

const BAND_COLOR = {
  avoid: "#f43f5e",
  risky: "#f97316",
  watch: "#f59e0b",
  clean: "#10b981",
} as const;

const BAND_LABEL = {
  avoid: "Avoid",
  risky: "High risk",
  watch: "Watch",
  clean: "No red flags",
} as const;

function TinyRing({ score, band, size = 54 }: { score: number; band: keyof typeof BAND_COLOR; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2 - 3;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * c;
  const color = BAND_COLOR[band];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none" stroke="#1f2530" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-[13px] font-semibold leading-none" style={{ color }}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}

export async function HeroReport() {
  await connection();

  let data: AnalysisResult | null = null;
  try {
    data = await analyzeToken({ address: SAMPLE.address, chain: SAMPLE.chain, budgetMs: 11_000 });
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="panel p-4">
        <p className="t-small text-mute-300">Live sample unavailable right now</p>
        <p className="mt-1.5 t-meta leading-relaxed text-mute-500">
          An upstream source did not answer. Nothing is fabricated in its place —
          try the checker directly.
        </p>
        <Link
          href="/check"
          className="mt-3 inline-block rounded-[3px] bg-brand-500 px-3 py-1.5 t-small font-semibold text-ink-950 transition hover:bg-brand-400"
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

  const stateColor: Record<string, string> = {
    fail: "#f43f5e",
    warn: "#f59e0b",
    pass: "#10b981",
    unknown: "#2f3846",
  };

  const readingColor: Record<string, string> = {
    fail: "text-bad-400",
    warn: "text-warn-400",
    pass: "text-ok-400",
    unknown: "text-mute-500",
  };

  return (
    <div className="panel overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-ink-750 px-4 py-3">
        {token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={token.imageUrl}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full border border-ink-650 object-cover"
          />
        ) : (
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink-650 bg-ink-800 font-mono text-[8px] text-mute-500">
            {(token.symbol ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="truncate t-body-strong text-lit-100">{token.name}</span>
            <span className="font-mono t-meta text-brand-400">{token.symbol?.toUpperCase()}</span>
          </div>
          <div className="font-mono t-meta text-mute-600">
            {fmtPrice(market.priceUsd)} · {fmtUsd(market.liquidityUsd)} liq
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-[3px] border border-ok-600/40 bg-ok-600/10 px-1.5 py-[3px] t-meta text-ok-400">
          <span aria-hidden className="pulse-dot h-1 w-1 rounded-full bg-ok-500" />
          live
        </span>
      </div>

      {/* verdict */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <TinyRing score={verdict.score} band={verdict.band} />
        <div className="min-w-0 flex-1">
          <div className="t-body-strong uppercase tracking-[0.05em]" style={{ color: BAND_COLOR[verdict.band] }}>
            {BAND_LABEL[verdict.band]}
          </div>
          <div className="mt-1 flex gap-[3px]" aria-hidden>
            {ordered.map((c) => (
              <span
                key={c.id}
                className="h-1.5 flex-1 rounded-[1px]"
                style={{ backgroundColor: stateColor[c.state] }}
              />
            ))}
          </div>
          <div className="mt-1.5 font-mono t-meta text-mute-500">{verdict.failuresLine}</div>
        </div>
      </div>

      {/* three worst readings */}
      <ul className="divide-y divide-ink-800 border-t border-ink-800">
        {ordered.slice(0, 3).map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
          >
            <span className="min-w-0 t-meta text-mute-300 sm:truncate">{c.label}</span>
            <span className={`font-mono t-meta tabular-nums sm:shrink-0 ${readingColor[c.state]}`}>
              {c.reading}
            </span>
          </li>
        ))}
      </ul>

      {/* concentration */}
      <div className="border-t border-ink-750 bg-ink-850/50 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="t-label">Top 10 combined</span>
          <span className="font-mono t-body-strong tabular-nums text-lit-100">{fmtPct(top10)}</span>
        </div>
        <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-[1px] bg-ink-800">
          {holders.rows.map((h, i) =>
            h.pct === null ? null : (
              <div
                key={h.address}
                className={i === 0 ? "bg-bad-500" : i < 4 ? "bg-warn-500/75" : "bg-ink-600"}
                style={{ width: `${Math.min(100, h.pct)}%` }}
              />
            ),
          )}
        </div>
      </div>

      <Link
        href={`/token/${SAMPLE.chain}/${SAMPLE.address}`}
        className="flex items-center justify-between gap-2 border-t border-ink-750 px-3.5 py-2 t-meta text-mute-500 transition hover:bg-ink-850 hover:text-brand-400"
      >
        <span>Open this full report</span>
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

export function HeroReportSkeleton() {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-ink-750 px-4 py-3">
        <div className="skeleton h-7 w-7 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-2.5 w-24" />
          <div className="skeleton h-2 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="skeleton h-[54px] w-[54px] rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-1.5 w-full" />
          <div className="skeleton h-2 w-28" />
        </div>
      </div>
      <div className="space-y-2.5 border-t border-ink-800 px-4 py-3.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-2.5 w-full" />
        ))}
      </div>
    </div>
  );
}
