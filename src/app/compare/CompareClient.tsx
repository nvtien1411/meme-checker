"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Demo, Panel, Tag, Gauge, Split } from "@/components/ui";
import { DEMO_TOKENS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * COMPARE — pick any tokens, not the three that were hardcoded
 *
 * The page used to compare DEMO_TOKENS[0], [1] and [3], permanently. The link
 * from a token report now lands here with that token preselected, and every
 * slot is a real selector, so comparing a token you are looking at against two
 * others is two clicks instead of impossible.
 *
 * Token identity is the mint. Nothing is matched by position or index.
 * ==================================================================== */

type Token = (typeof DEMO_TOKENS)[number];

const ROWS: {
  label: string;
  hint: string;
  get: (t: Token) => string;
  better?: "low" | "high";
  numeric: (t: Token) => number;
}[] = [
  { label: "risk score", hint: "0 clean to 100 critical", get: (t) => `${t.score}`, better: "low", numeric: (t) => t.score },
  { label: "market cap", hint: "circulating supply × price", get: (t) => fmtUsd(t.mcap), numeric: (t) => t.mcap },
  { label: "liquidity", hint: "pool depth — how much can be sold without moving price", get: (t) => fmtUsd(t.liq), better: "high", numeric: (t) => t.liq },
  { label: "vol / liq", hint: "turnover against pool depth; high means churn", get: (t) => `${(t.vol24 / t.liq).toFixed(1)}×`, better: "low", numeric: (t) => t.vol24 / t.liq },
  { label: "age", hint: "hours since launch", get: (t) => `${t.ageHours}h`, numeric: (t) => t.ageHours },
  { label: "holders", hint: "distinct addresses holding", get: (t) => t.holders.toLocaleString("en-US"), better: "high", numeric: (t) => t.holders },
  { label: "top 10 merged", hint: "supply the ten largest wallets hold together", get: (t) => `${t.bundlePct.toFixed(1)}%`, better: "low", numeric: (t) => t.bundlePct },
  { label: "bundle wallets", hint: "wallets that bought in the creation block", get: (t) => `${t.bundleCount}`, better: "low", numeric: (t) => t.bundleCount },
  { label: "sniper wallets", hint: "wallets that bought inside the first two seconds", get: (t) => `${t.sniperCount}`, better: "low", numeric: (t) => t.sniperCount },
  { label: "insider supply", hint: "supply that arrived by transfer, not open-market buy", get: (t) => `${t.insiderPct.toFixed(1)}%`, better: "low", numeric: (t) => t.insiderPct },
  { label: "exit window", hint: "seconds before a normal sell moves price 5%", get: (t) => `${t.exitWindowSec}s`, better: "high", numeric: (t) => t.exitWindowSec },
  { label: "sell synchrony", hint: "how closely holders sell together — high is coordinated", get: (t) => `${(t.sellSynchrony * 100).toFixed(0)}%`, better: "low", numeric: (t) => t.sellSynchrony },
  { label: "narrative copy", hint: "how many times this idea has been launched before", get: (t) => (t.copyIndex === 1 ? "original" : `#${t.copyIndex}`), better: "low", numeric: (t) => t.copyIndex },
  { label: "organic attention", hint: "volume and replies that do not look automated", get: (t) => `${t.organicScore}/100`, better: "high", numeric: (t) => t.organicScore },
];

export function CompareClient() {
  const params = useSearchParams();
  const preselect = params.get("left");

  // Slots are a list of mints. A mint not in the tracked set cannot be compared
  // here, because every row reads from the demo record — so it is dropped
  // rather than rendered as a column of dashes.
  const [slots, setSlots] = useState<string[]>(() => {
    const known = new Set(DEMO_TOKENS.map((t) => t.mint));
    const seed = preselect && known.has(preselect) ? [preselect] : [];
    for (const t of DEMO_TOKENS) {
      if (seed.length >= 3) break;
      if (!seed.includes(t.mint)) seed.push(t.mint);
    }
    return seed.slice(0, 3);
  });

  const chosen = useMemo(
    () => slots.map((m) => DEMO_TOKENS.find((t) => t.mint === m)).filter((t): t is Token => !!t),
    [slots],
  );

  const setSlot = (i: number, mint: string) => {
    setSlots((cur) => {
      const next = [...cur];
      // one token cannot occupy two slots; clear the duplicate instead of
      // rendering the same column twice
      const dup = next.indexOf(mint);
      if (dup !== -1 && dup !== i) next[dup] = next[i];
      next[i] = mint;
      return next;
    });
  };

  const used = new Set(slots);
  const available = (i: number) =>
    DEMO_TOKENS.filter((t) => !used.has(t.mint) || t.mint === slots[i]);

  return (
    <div>
      <div className="border-b border-line px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="t-section text-fg">Compare</h1>
          <span className="t-xs text-fg4">same questions, side by side</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Demo />
            <Tag tone="neutral">{chosen.length} selected</Tag>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* ---------------- pickers ---------------- */}
        <div className="panel px-2.5 py-2">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="t-eyebrow">pick up to three</span>
            <span className="t-xs text-fg4">
              {DEMO_TOKENS.length} tokens in the tracked set
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {slots.map((mint, i) => {
              const t = DEMO_TOKENS.find((x) => x.mint === mint);
              return (
                <label key={i} className="flex items-center gap-1.5">
                  <span className="w-3 shrink-0 font-mono text-[9px] text-fg4">{i + 1}</span>
                  <select
                    value={mint}
                    onChange={(e) => setSlot(i, e.target.value)}
                    aria-label={`Token ${i + 1}`}
                    className="min-w-0 flex-1 border border-line bg-surf px-1.5 py-[3px] font-mono text-[10.5px] text-fg2 outline-none focus:border-acid"
                  >
                    {available(i).map((o) => (
                      <option key={o.mint} value={o.mint}>
                        {o.symbol} · {o.chain} · risk {o.score}
                      </option>
                    ))}
                  </select>
                  {t && (
                    <Link
                      href={`/token/${t.chain}/${t.mint}`}
                      className="shrink-0 border border-line px-1 py-[2px] font-mono text-[8px] uppercase text-fg4 hover:border-fg4 hover:text-fg2"
                      title={`Open ${t.symbol}`}
                    >
                      open
                    </Link>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* ---------------- table ---------------- */}
        {chosen.length < 2 ? (
          <Panel>
            <p className="t-xs leading-relaxed text-fg4">
              Pick at least two tokens to compare. The link on any token report opens this page with
              that token already in slot 1
            </p>
          </Panel>
        ) : (
          <Panel flush>
            <div
              className="grid items-baseline gap-x-3 border-b border-line bg-surf2/40 px-3 py-1.5"
              style={{ gridTemplateColumns: `minmax(0,110px) repeat(${chosen.length}, minmax(0,1fr))` }}
            >
              <span className="t-eyebrow">metric</span>
              {chosen.map((t) => (
                <Link
                  key={t.mint}
                  href={`/token/${t.chain}/${t.mint}`}
                  className="truncate t-strong text-fg hover:text-acid"
                  title={`${t.name} — open report`}
                >
                  {t.symbol}
                </Link>
              ))}
            </div>

            {ROWS.map((row) => {
              const values = chosen.map((t) => row.numeric(t));
              const best =
                row.better === "low"
                  ? Math.min(...values)
                  : row.better === "high"
                    ? Math.max(...values)
                    : null;
              const uniqueBest = best !== null && values.filter((v) => v === best).length < values.length;

              return (
                <div
                  key={row.label}
                  className="grid items-baseline gap-x-3 border-b border-line px-3 py-[5px] last:border-b-0"
                  style={{ gridTemplateColumns: `minmax(0,110px) repeat(${chosen.length}, minmax(0,1fr))` }}
                  title={row.hint}
                >
                  <span className="truncate t-xs text-fg4">{row.label}</span>
                  {chosen.map((t, i) => {
                    const isBest = uniqueBest && values[i] === best;
                    return (
                      <span
                        key={t.mint}
                        className={`t-mono text-[11px] tabular-nums ${isBest ? "text-good" : "text-fg2"}`}
                      >
                        {row.get(t)}
                        {isBest && <span className="ml-1 text-[8px] text-good">◆</span>}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </Panel>
        )}

        {/* ---------------- per-token read ---------------- */}
        {chosen.length >= 2 && (
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            {chosen.map((t) => (
              <Panel key={t.mint} title={t.symbol} note={t.narrative}>
                <div className="space-y-1">
                  <Split label="the case for" mono={false} tone="good">
                    {t.bundlePct < 5
                      ? "no launch bundle"
                      : t.exitWindowSec > 180
                        ? "wide exit window"
                        : t.organicScore > 60
                          ? "organic attention"
                          : "nothing strong"}
                  </Split>
                  <Split label="the case against" mono={false} tone="bad">
                    {t.bundlePct > 20
                      ? `${t.bundlePct.toFixed(0)}% in launch wallets`
                      : t.exitWindowSec < 30
                        ? `${t.exitWindowSec}s exit window`
                        : t.copyIndex > 5
                          ? `copy #${t.copyIndex} of the narrative`
                          : `${t.insiderPct.toFixed(1)}% insider supply`}
                  </Split>
                  <Split label="unknown" mono={false} tone="warn">
                    {t.freshCount > 5 ? "who funded the fresh wallets" : "dev history depth"}
                  </Split>
                </div>

                <div className="mt-2 border-t border-line pt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="t-eyebrow">risk</span>
                    <span className="t-mono text-[11px] text-fg3">{t.score}/100</span>
                  </div>
                  <div className="mt-1">
                    <Gauge
                      pct={t.score}
                      tone={t.score > 70 ? "bad" : t.score > 45 ? "hot" : "warn"}
                      height={4}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Link
                    href={`/token/${t.chain}/${t.mint}`}
                    className="inline-block border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase text-fg4 hover:border-fg4 hover:text-fg2"
                  >
                    open report →
                  </Link>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
