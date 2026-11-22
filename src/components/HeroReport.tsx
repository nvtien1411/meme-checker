import { connection } from "next/server";
import { analyzeToken } from "@/lib/analyze";
import type { AnalysisResult } from "@/lib/types";
import { fmtPct, fmtPrice, fmtUsd } from "@/lib/http";

/* ------------------------------------------------------------------ *
 * Hero report card
 *
 * The landing page was 100% text: a 1440x900 viewport contained 1024px2 of
 * image, which is nothing. Every reference product (Birdeye, DexScreener,
 * Nansen) puts a live data surface next to the claim, because the claim alone
 * reads as marketing and the surface reads as a product.
 *
 * This is the anchor. It renders a real analysis at request time — same
 * pipeline as the checker, no mock numbers — and it is deliberately compact:
 * verdict, the ring, the three worst checks, concentration. Enough to look
 * like the thing you would get, not so much that it becomes a wall.
 *
 * If a source fails, the card says so. A hard-coded screenshot would be the
 * one thing on this page that could not be trusted.
 * ------------------------------------------------------------------ */

const SAMPLE = {
  address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  chain: "solana" as const,
};

const BAND = {
  avoid: { text: "text-rose-400", ring: "stroke-rose-500", bg: "bg-rose-500" },
  risky: { text: "text-orange-300", ring: "stroke-orange-500", bg: "bg-orange-500" },
  watch: { text: "text-amber-400", ring: "stroke-amber-500", bg: "bg-amber-500" },
  clean: { text: "text-emerald-400", ring: "stroke-emerald-500", bg: "bg-emerald-500" },
} as const;

const STATE_TEXT: Record<string, string> = {
  fail: "text-rose-400",
  warn: "text-amber-400",
  pass: "text-emerald-400",
  unknown: "text-mute-500",
};

const STATE_BG: Record<string, string> = {
  fail: "bg-rose-500",
  warn: "bg-amber-500",
  pass: "bg-emerald-500",
  unknown: "bg-ink-500",
};

function RiskRing({ score, band }: { score: number; band: keyof typeof BAND }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} className="fill-none stroke-ink-700" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          className={`fill-none ${BAND[band].ring}`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-mono t-num leading-none text-slate-100">{score}</div>
          <div className="mt-0.5 text-[8px] uppercase tracking-[0.08em] text-mute-500">
            risk
          </div>
        </div>
      </div>
    </div>
  );
}

export async function HeroReport() {
  // Live numbers, therefore explicitly dynamic. Without this the build tries to
  // call four upstream APIs at compile time and fails the export.
  await connection();

  let data: AnalysisResult | null = null;
  try {
    data = await analyzeToken({ address: SAMPLE.address, chain: SAMPLE.chain, budgetMs: 11_000 });
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="border border-ink-700 bg-ink-900 p-4">
        <p className="t-small text-mute-300">Live sample unavailable right now.</p>
        <p className="mt-1 t-meta leading-relaxed text-mute-500">
          An upstream source did not answer. Nothing is faked in its place.
        </p>
      </div>
    );
  }

  const { verdict, token, market, checks, holders } = data;
  const rank: Record<string, number> = { fail: 0, warn: 1, unknown: 2, pass: 3 };
  const ordered = [...checks].sort((a, b) => rank[a.state] - rank[b.state]);
  const top10 = holders.rows.reduce((s, h) => s + (h.pct ?? 0), 0);
  const band = BAND[verdict.band];

  return (
    <div className="relative">
      {/* the soft backlight is the only gradient in the product, and it exists
          to separate this panel from the page, not to decorate it */}
      <div
        aria-hidden
        className="absolute -inset-px -z-10 bg-gradient-to-b from-brand-500/12 via-transparent to-transparent blur-[1px]"
      />

      <div className="border border-ink-700 bg-ink-900">
        {/* identity */}
        <div className="flex items-center gap-2.5 border-b border-ink-700 px-3.5 py-2.5">
          {token.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={token.imageUrl}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full border border-ink-600 object-cover"
            />
          ) : (
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink-600 bg-ink-800 font-mono text-[8px] text-mute-400">
              {(token.symbol ?? "?").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="truncate t-body-strong text-slate-100">{token.name}</span>
              <span className="font-mono t-meta text-brand-400">{token.symbol?.toUpperCase()}</span>
            </div>
            <div className="font-mono t-meta text-mute-500">
              {fmtPrice(market.priceUsd)} · {fmtUsd(market.liquidityUsd)} liq
            </div>
          </div>
          <span className="shrink-0 rounded border border-ink-600 px-1.5 py-0.5 font-mono t-meta text-mute-400">
            live
          </span>
        </div>

        {/* verdict + ring */}
        <div className="flex items-center gap-3.5 px-3.5 py-3">
          <RiskRing score={verdict.score} band={verdict.band} />
          <div className="min-w-0 flex-1">
            <div className={`t-title uppercase leading-none ${band.text}`}>{verdict.headline}</div>
            <p className="mt-1 t-meta leading-snug text-mute-400">
              {verdict.fails} failed · {verdict.warns} watch · {verdict.unknowns} unknown ·{" "}
              {verdict.passes} passed
            </p>
            {/* the eight marks, ordered worst first */}
            <div className="mt-2 flex gap-[3px]" aria-hidden>
              {ordered.map((c) => (
                <span key={c.id} className={`h-2 w-5 rounded-[1px] ${STATE_BG[c.state]}`} />
              ))}
            </div>
          </div>
        </div>

        {/* the three that matter */}
        <ul className="divide-y divide-ink-800 border-t border-ink-800">
          {ordered.slice(0, 3).map((c) => (
            <li key={c.id} className="flex items-baseline justify-between gap-3 px-3.5 py-1.5">
              <span className="min-w-0 truncate t-meta text-mute-300">{c.label}</span>
              <span className={`shrink-0 font-mono t-meta tabular-nums ${STATE_TEXT[c.state]}`}>
                {c.reading}
              </span>
            </li>
          ))}
        </ul>

        {/* concentration strip */}
        <div className="border-t border-ink-700 bg-ink-850/40 px-3.5 py-2">
          <div className="flex items-baseline justify-between">
            <span className="t-label">Top 10 combined</span>
            <span className="font-mono t-body-strong tabular-nums text-slate-100">
              {fmtPct(top10)}
            </span>
          </div>
          <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-[1px] bg-ink-800">
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

        <div className="border-t border-ink-700 bg-ink-850/60 px-3.5 py-1.5">
          <span className="font-mono t-meta text-mute-500">
            generated {new Date(data.generatedAt).toLocaleTimeString("en-GB")} ·{" "}
            {data.provenance.length} sources
          </span>
        </div>
      </div>
    </div>
  );
}

export function HeroReportSkeleton() {
  return (
    <div className="border border-ink-700 bg-ink-900">
      <div className="flex items-center gap-2.5 border-b border-ink-700 px-3.5 py-2.5">
        <div className="skeleton h-7 w-7 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-2.5 w-24 rounded-sm" />
          <div className="skeleton h-2 w-32 rounded-sm" />
        </div>
      </div>
      <div className="flex items-center gap-3.5 px-3.5 py-3">
        <div className="skeleton h-[68px] w-[68px] rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-28 rounded-sm" />
          <div className="skeleton h-2 w-40 rounded-sm" />
          <div className="skeleton h-1.5 w-44 rounded-sm" />
        </div>
      </div>
      <div className="space-y-2 border-t border-ink-800 px-3.5 py-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-2.5 w-full rounded-sm" />
        ))}
      </div>
    </div>
  );
}
