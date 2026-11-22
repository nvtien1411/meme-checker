"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalysisResult, Check, CheckState } from "@/lib/types";
import { CHAIN_BY_ID } from "@/lib/chains";
import { fmtAgo, fmtAge, fmtChange, fmtPct, fmtPrice, fmtUsd } from "@/lib/http";
import { CopyButton } from "./feedback";
import { ChainChip } from "./ChainMark";
import { Metric, Note, QualityDot, Tag } from "./ui";
import {
  CheckRibbon,
  ConcentrationBar,
  Meter,
  ExitCurve,
  FlowBar,
  HolderRows,
  RiskArc,
} from "./viz";
import { sortBySeverity } from "@/lib/check-order";

/* ==================================================================== *
 * REPORT
 *
 * The previous version wrapped the verdict in a card that was visually
 * identical to the seven cards below it, and put the risk score in a 54px
 * donut beside the token name. Two consequences: the most important thing
 * on the page had the least visual weight, and the page read as a stack of
 * widgets rather than as an answer.
 *
 * This version inverts both. The verdict is a full-bleed masthead that owns
 * the top of the screen: band name in display serif, score at 76px, the
 * eight-check ribbon underneath. Everything after it is a document —
 * numbered sections divided by rules, with slabs only where the thing
 * really is a discrete object.
 * ==================================================================== */

const BAND = {
  avoid: { label: "Avoid", color: "text-bad-400", bg: "bg-bad-500" },
  risky: { label: "High risk", color: "text-risk-400", bg: "bg-risk-500" },
  watch: { label: "Watch", color: "text-warn-400", bg: "bg-warn-500" },
  clean: { label: "No red flags", color: "text-ok-400", bg: "bg-ok-500" },
} as const;

const CHECK_GLYPH: Record<CheckState, string> = {
  pass: "✓",
  fail: "✕",
  warn: "!",
  unknown: "?",
};

const CHECK_TONE: Record<CheckState, string> = {
  pass: "text-ok-400 border-ok-600/50",
  fail: "text-bad-400 border-bad-600/50",
  warn: "text-warn-400 border-warn-600/50",
  unknown: "text-mute-500 border-ink-600",
};

/* ------------------------------------------------------------------ *
 * Masthead — identity, verdict, evidence ribbon. Full bleed.
 * ------------------------------------------------------------------ */

export function VerdictMasthead({ data }: { data: AnalysisResult }) {
  const v = data.verdict;
  const band = BAND[v.band];
  const change = fmtChange(data.market.priceChange24h, data.market.ageHours);

  return (
    <header className="verdict-wash lattice border-b border-ink-800">
      {/* identity strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 sm:px-6 lg:px-8">
        {data.token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.token.imageUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full border border-ink-700 object-cover"
          />
        ) : (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink-700 bg-ink-850 font-mono text-[9px] text-mute-600">
            {(data.token.symbol ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="truncate t-title text-lit-50">
            {data.token.name ?? "Unknown token"}
          </h1>
          {data.token.symbol && (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute-400">
              {data.token.symbol}
            </span>
          )}
<ChainChip chain={data.token.chain} />
        </div>

        <div className="flex w-full items-center gap-x-3 gap-y-1 sm:ml-auto sm:w-auto">
          <CopyButton
            text={data.token.address}
            display={`${data.token.address.slice(0, 6)}…${data.token.address.slice(-4)}`}
            label="Contract address copied"
            title="Copy contract address"
            className="font-mono text-[10.5px] text-mute-500 transition-colors hover:text-lit-200"
          />
          <a
            href={data.token.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10.5px] text-mute-500 transition-colors hover:text-lit-200"
          >
            explorer ↗
          </a>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-mute-600">
            <span aria-hidden className="live-dot h-1 w-1 rounded-full bg-brand-500" />
            {fmtAgo(data.generatedAt)}
          </span>
        </div>
      </div>

      {/* the verdict itself — the band name is the headline, the score supports it */}
      <div className="border-t border-ink-800 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 items-end gap-x-12 gap-y-7 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span aria-hidden className={`h-[6px] w-[6px] ${band.bg}`} />
              <span className="t-label text-mute-500">verdict</span>
            </div>

            <h2
              className={`mt-3 text-[clamp(38px,7vw,52px)] leading-[0.94] tracking-[-0.04em] ${band.color}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {band.label}
            </h2>

            <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-lit-200">
              {v.tldr}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {(
                [
                  ["fail", v.fails, "failed", "text-bad-400"],
                  ["warn", v.warns, "to watch", "text-warn-400"],
                  ["unknown", v.unknowns, "unknown", "text-mute-500"],
                  ["pass", v.passes, "passed", "text-ok-400"],
                ] as const
              )
                .filter(([, n]) => n > 0)
                .map(([state, n, word, cls]) => (
                  <span key={state} className="inline-flex items-baseline gap-1.5">
                    <span className={`font-mono text-[13px] tabular-nums ${cls}`}>{n}</span>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mute-600">
                      {word}
                    </span>
                  </span>
                ))}
            </div>
          </div>

          <div className="flex items-end gap-6">
            <RiskArc score={v.score} band={v.band} size={168} />
          </div>
        </div>

        <div className="mt-7">
          <CheckRibbon checks={data.checks} showLegend={false} />
        </div>
      </div>

      {/* market strip */}
      <div className="grid grid-cols-2 divide-x divide-ink-800 border-t border-ink-800 sm:grid-cols-3 lg:grid-cols-6">
        <Metric
          label="Price"
          value={fmtPrice(data.market.priceUsd)}
          sub={change.text === "—" ? "no history" : `${change.text} ${change.label}`}
          tone={
            data.market.priceChange24h === null
              ? "default"
              : data.market.priceChange24h >= 0
                ? "up"
                : "down"
          }
        />
        <Metric
          label={data.market.capKind === "fdv" ? "FDV" : "Market cap"}
          value={fmtUsd(data.market.marketCap ?? data.market.fdv)}
          sub={
            data.market.capKind === "fdv"
              ? "no circulating supply"
              : data.market.fdv !== null
                ? `FDV ${fmtUsd(data.market.fdv)}`
                : "not reported"
          }
        />
        <Metric
          label="Liquidity"
          value={fmtUsd(data.market.liquidityUsd)}
          sub={
            data.market.pools.length > 1
              ? `top of ${data.market.pools.length} pools`
              : data.exit.liquidityCoverage !== null
                ? `${data.exit.liquidityCoverage.toFixed(1)}% of cap`
                : undefined
          }
        />
        <Metric
          label="Volume 24h"
          value={fmtUsd(data.market.volume24h)}
          sub={
            data.market.liquidityUsd && data.market.volume24h
              ? `${(data.market.volume24h / data.market.liquidityUsd).toFixed(1)}× liquidity`
              : undefined
          }
        />
        <Metric
          label="Age"
          value={fmtAge(data.market.ageHours)}
          sub={
            data.holders.totalHolders !== null
              ? `${data.holders.totalHolders.toLocaleString()} holders`
              : "holder count unavailable"
          }
        />
        <Metric
          label="Top 10 merged"
          value={
            !data.holders.meaningful
              ? "n/a"
              : data.holders.effectiveTop10Pct === null
                ? "—"
                : fmtPct(data.holders.effectiveTop10Pct)
          }
          sub={!data.holders.meaningful ? "curve holds supply" : "ex-LP, clusters merged"}
        />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Checks — a numbered ledger, not a card of accordions.
 *
 * Each row is a rule-separated line: glyph, question, reading, source. The
 * detail opens in place. The left glyph column is the scan path.
 * ------------------------------------------------------------------ */

export function CheckLedger({ checks }: { checks: Check[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const ordered = sortBySeverity(checks);

  return (
    <div className="border-t border-ink-800">
      <ul>
        {ordered.map((c) => {
          const isOpen = open === c.id;
          return (
            <li key={c.id} className="border-b border-ink-850">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.id)}
                aria-expanded={isOpen}
                className="row-acid group grid w-full grid-cols-[24px_minmax(0,1fr)] items-start gap-x-3 px-1 py-3 pl-2 text-left transition-colors hover:bg-ink-900 sm:grid-cols-[24px_minmax(0,1fr)_auto] sm:gap-x-4"
              >
                <span
                  aria-hidden
                  className={`mt-[1px] grid h-[18px] w-[18px] place-items-center border font-mono text-[10px] leading-none ${CHECK_TONE[c.state]}`}
                >
                  {CHECK_GLYPH[c.state]}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2.5">
                    <span className="t-body-strong text-lit-100">{c.label}</span>
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        c.state === "fail"
                          ? "text-bad-400"
                          : c.state === "warn"
                            ? "text-warn-400"
                            : c.state === "pass"
                              ? "text-ok-400"
                              : "text-mute-500"
                      }`}
                    >
                      {c.reading}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-mute-600">
                      {c.source}
                    </span>
                    <QualityDot quality={c.quality} />
                  </div>
                </div>

                <span
                  aria-hidden
                  className={`col-start-2 mt-1 shrink-0 justify-self-end font-mono text-[11px] text-mute-600 transition-transform sm:col-start-3 sm:mt-0 sm:self-center ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
              </button>

              {isOpen && (
                <div className="rise border-t border-ink-850 bg-ink-900/60 px-1 py-3 pl-[40px] pr-4">
                  <p className="max-w-[74ch] t-small leading-relaxed text-mute-300">{c.detail}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Holders
 * ------------------------------------------------------------------ */

export function HolderSection({ data }: { data: AnalysisResult }) {
  const h = data.holders;
  const chain = CHAIN_BY_ID[data.token.chain];
  const largest = h.rows.reduce((m, r) => Math.max(m, r.pct ?? 0), 0);
  const linked = data.clusters.linkedSupplyPct;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-8">
      <div className="min-w-0">
        <ConcentrationBar
          top10={h.meaningful ? h.effectiveTop10Pct : null}
          largest={h.meaningful ? largest : null}
          linkedPct={linked}
        />
        <Note>{h.method}</Note>
      </div>

      <div className="min-w-0">
        <div className="slab overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2">
            <span className="t-label">top holders</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-mute-600">
              {h.totalHolders !== null ? `of ${h.totalHolders.toLocaleString()}` : "total unknown"}
            </span>
          </div>
          <HolderRows rows={h.rows} explorer={chain.explorer} />
        </div>
        <p className="mt-2 t-meta leading-relaxed text-mute-600">
          Pools, burn addresses and launch curves are excluded. Bars are scaled to the largest
          holder, not to total supply. An unlabelled wallet is unclassified — not suspicious
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Signals — exit depth and trade flow, side by side.
 * ------------------------------------------------------------------ */

export function SignalsSection({ data }: { data: AnalysisResult }) {
  const e = data.exit;
  const f = data.flow;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between pb-2.5">
          <h3 className="t-title text-lit-100">Exit depth</h3>
          <Meter
            label="liquidity vs market cap"
            value={e.liquidityCoverage}
          />
        </div>
        <div className="border-t border-ink-800 pt-3">
          <ExitCurve
            maxSell5pct={e.maxSellUsd.slip5}
            maxSell1pct={e.maxSellUsd.slip1}
            liquidityUsd={data.market.liquidityUsd}
          />
          {e.note && <Note>{e.note}</Note>}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between pb-2.5">
          <h3 className="t-title text-lit-100">Trading flow</h3>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-mute-600">
            sampled tape
          </span>
        </div>
        <div className="border-t border-ink-800 pt-3">
          <FlowBar
            buyVol={f.buyVolumeUsd}
            sellVol={f.sellVolumeUsd}
            imbalance={f.imbalance}
            buys={f.buys}
            sells={f.sells}
          />
          <Note>
            A snapshot of the recent tape. It can flip sign between page loads, so it can
            never fail a token on its own.
          </Note>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Narrative + project — the only place inference is allowed, and it says so.
 * ------------------------------------------------------------------ */

export function ContextSection({ data }: { data: AnalysisResult }) {
  const n = data.narrative;
  const p = data.project;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between pb-2.5">
          <h3 className="t-title text-lit-100">Narrative</h3>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="text-[8px] text-mute-500">
              ○
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-mute-600">
              inferred
            </span>
          </span>
        </div>
        <div className="border-t border-ink-800 pt-3">
          {n ? (
            <>
              <p className="t-body leading-relaxed text-mute-300">{n.summary}</p>
              {n.keywords.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {n.keywords.map((t) => (
                    <Tag key={t} tone="neutral">
                      {t}
                    </Tag>
                  ))}
                </div>
              )}
              <Note>
                Derived from the token name, symbol and description by keyword matching — not
                from social data. Treat it as a hint, not a measurement.
              </Note>
            </>
          ) : (
            <p className="t-small leading-relaxed text-mute-500">
              No name, description or links were returned, so there is nothing to classify
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between pb-2.5">
          <h3 className="t-title text-lit-100">Project</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-mute-600">
            self-published
          </span>
        </div>
        <div className="border-t border-ink-800 pt-3">
          {p && (p.website || p.twitter || p.telegram || p.description) ? (
            <>
              {p.description && (
                <p className="line-clamp-4 t-small leading-relaxed text-mute-400">
                  {p.description}
                </p>
              )}
              <dl className="mt-3 space-y-1.5">
                {(
                  [
                    ["Website", p.website],
                    ["X", p.twitter],
                    ["Telegram", p.telegram],
                  ] as const
                )
                  .filter(([, url]) => Boolean(url))
                  .map(([label, url]) => (
                    <div key={label} className="flex items-baseline gap-3">
                      <dt className="w-[62px] shrink-0 t-meta text-mute-600">{label}</dt>
                      <dd className="min-w-0">
                        <a
                          href={url as string}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate font-mono text-[11px] text-brand-400 underline decoration-brand-700/60 underline-offset-2 hover:text-brand-300"
                        >
                          {(url as string).replace(/^https?:\/\//, "")}
                        </a>
                      </dd>
                    </div>
                  ))}
              </dl>
              <Note>Links are published by the token itself. We do not verify them.</Note>
            </>
          ) : (
            <p className="t-small leading-relaxed text-mute-500">
              The token publishes no website, social account or description
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Creator — the sidebar's most important block.
 * ------------------------------------------------------------------ */

export function CreatorSlab({ data }: { data: AnalysisResult }) {
  const d = data.deployer;
  const chain = CHAIN_BY_ID[data.token.chain];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2">
        <span className="t-label">deployer</span>
        {d.ruggedCount > 0 ? (
          <Tag tone="bad">{d.ruggedCount} rugged</Tag>
        ) : !d.dataAvailable ? (
          <Tag tone="neutral">unknown</Tag>
        ) : d.priorTokens.length === 0 ? (
          <Tag tone="neutral">no history</Tag>
        ) : (
          <Tag tone="ok">no rugs</Tag>
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {d.address ? (
            <>
              <a
                href={chain.explorer(d.address)}
                target="_blank"
                rel="noreferrer"
                title={d.address}
                className="truncate font-mono text-[11.5px] text-mute-300 underline decoration-ink-600 underline-offset-2 transition-colors hover:text-lit-100"
              >
                {d.address.slice(0, 8)}…{d.address.slice(-6)}
              </a>
              <CopyButton
                text={d.address}
                label="Deployer address copied"
                title="Copy deployer address"
                className="shrink-0 font-mono text-[10px] text-mute-600 transition-colors hover:text-mute-300"
              />
            </>
          ) : (
            <span className="font-mono text-[11.5px] text-mute-600">not identified</span>
          )}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <dt className="t-meta text-mute-600">holds</dt>
            <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-lit-200">
              {d.balancePct === null ? "—" : `${d.balancePct.toFixed(2)}%`}
            </dd>
          </div>
          <div>
            <dt className="t-meta text-mute-600">prior launches</dt>
            <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-lit-200">
              {d.dataAvailable ? d.priorTokens.length : "—"}
            </dd>
          </div>
        </dl>

        {!d.dataAvailable && (
          <p className="mt-2.5 t-meta leading-relaxed text-mute-500">
            No deployer history is available for this token, so this is unknown rather than
            clean
          </p>
        )}
        {d.dataAvailable && d.priorTokens.length === 0 && (
          <p className="mt-2.5 t-meta leading-relaxed text-mute-500">
            A fresh wallet: no rug history, and no track record either
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Provenance — every source and whether it answered.
 * ------------------------------------------------------------------ */

export function ProvenanceSlab({ data }: { data: AnalysisResult }) {
  const answered = data.provenance.filter((s) => s.ok).length;

  return (
    <div>
      <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2">
        <span className="t-label">sources</span>
        <span
          className={`font-mono text-[9.5px] uppercase tracking-[0.08em] ${
            answered === data.provenance.length ? "text-brand-500" : "text-warn-400"
          }`}
        >
          {answered}/{data.provenance.length} answered
        </span>
      </div>

      <ul className="divide-y divide-ink-850">
        {data.provenance.map((s) => (
          <li key={s.source} className="flex items-baseline gap-2.5 px-4 py-[7px]">
            <span
              aria-hidden
              className={`mt-[5px] h-1 w-1 shrink-0 rounded-full ${
                s.ok ? "bg-ok-500" : "bg-bad-500"
              }`}
            />
            <span className="min-w-0 flex-1 truncate text-[11.5px] text-mute-300">{s.source}</span>
            <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-mute-600">
              {s.ok ? `${s.ms}ms` : "failed"}
            </span>
          </li>
        ))}
      </ul>

      <p className="border-t border-ink-800 px-4 py-2.5 t-meta leading-relaxed text-mute-600">
        A source that failed leaves its check unknown — never a pass
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Roadmap — clearly not built, no padlock.
 * ------------------------------------------------------------------ */

const ROADMAP = [
  ["Wallet cluster map", "wallets sharing a funder, drawn"],
  ["Bundle wallet analysis", "first-block buys, grouped"],
  ["Deployer graph", "every launch from this wallet"],
  ["KOL intelligence", "who actually posted it"],
  ["Smart alerts", "ping on holder or LP changes"],
];

export function RoadmapSlab() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2">
        <span className="t-label">not built yet</span>
        <Link
          href="/pricing"
          className="font-mono text-[9px] uppercase tracking-[0.08em] text-mute-500 transition-colors hover:text-lit-200"
        >
          plans →
        </Link>
      </div>
      <ul className="divide-y divide-ink-850">
        {ROADMAP.map(([name, note]) => (
          <li key={name} className="px-4 py-[9px]">
            <div className="flex items-baseline gap-2">
              <span aria-hidden className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-ink-500" />
              <span className="text-[12px] text-mute-300">{name}</span>
            </div>
            <p className="mt-0.5 pl-[12px] t-meta text-mute-600">{note}</p>
          </li>
        ))}
      </ul>
      <p className="border-t border-ink-800 px-4 py-2.5 t-meta leading-relaxed text-mute-600">
        None of this exists, and nothing on this report is withheld behind it
      </p>
    </div>
  );
}
