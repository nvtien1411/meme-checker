"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalysisResult, Check, CheckState } from "@/lib/types";
import { fmtAge, fmtChange, fmtPrice, fmtUsd, fmtPct, fmtAgo } from "@/lib/http";
import { CHAIN_BY_ID } from "@/lib/chains";
import { Metric, QualityDot, Tag } from "./ui";
import { CopyButton } from "./feedback";
import {
  CheckStrip,
  ConcentrationBar,
  CoverageMeter,
  ExitLadder,
  FlowBalance,
  HolderBars,
  RiskRing,
  sortBySeverity,
  STATE_TEXT,
} from "./viz";

/* ==================================================================== *
 * REPORT
 *
 * Structure follows the question a trader asks, in order:
 *   what is it → how bad → why → who holds it → what it claims
 *
 * The verdict block is deliberately not a dashboard. It is one number, one
 * band, and eight marks, because at this point in the flow the reader wants a
 * decision, not data. Everything explanatory lives below it.
 * ==================================================================== */

const BAND_LABEL = {
  avoid: "Avoid",
  risky: "High risk",
  watch: "Watch",
  clean: "No red flags",
} as const;

const BAND_TEXT = {
  avoid: "text-bad-400",
  risky: "text-orange-400",
  watch: "text-warn-400",
  clean: "text-ok-400",
} as const;


/* ------------------------------------------------------------------ *
 * Verdict header
 * ------------------------------------------------------------------ */

export function VerdictHeader({ data }: { data: AnalysisResult }) {
  const v = data.verdict;
  const chain = CHAIN_BY_ID[data.token.chain];
  const change = fmtChange(data.market.priceChange24h, data.market.ageHours);

  return (
    <div className="panel overflow-hidden">
      {/* identity bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-750 px-4 py-3">
        {data.token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.token.imageUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full border border-ink-650 object-cover"
          />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-650 bg-ink-800 font-mono text-[10px] text-mute-500">
            {(data.token.symbol ?? "?").slice(0, 3).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h1 className="truncate t-display text-slate-50">
              {data.token.name ?? "Unknown token"}
            </h1>
            {data.token.symbol && (
              <span className="font-mono t-body-strong text-brand-400">
                {data.token.symbol.toUpperCase()}
              </span>
            )}
            <Tag tone="outline">{chain.label}</Tag>
            {data.token.dexId && (
              <span className="t-meta text-mute-600">{data.token.dexId}</span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <CopyButton
              text={data.token.address}
              display={`${data.token.address.slice(0, 8)}…${data.token.address.slice(-6)}`}
              label="Contract address copied"
              title="Copy contract address"
            />
            <span aria-hidden className="t-meta text-ink-600">
              ·
            </span>
            <a
              href={data.token.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="t-meta text-mute-500 underline decoration-ink-600 decoration-dotted underline-offset-2 transition hover:text-brand-400"
            >
              explorer ↗
            </a>
            <span aria-hidden className="t-meta text-ink-600">
              ·
            </span>
            <span className="t-meta text-mute-600">
              snapshot {fmtAgo(data.generatedAt)}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className={`t-title uppercase tracking-[0.06em] ${BAND_TEXT[v.band]}`}>
            {BAND_LABEL[v.band]}
          </div>
          <div className="mt-0.5 font-mono t-meta text-mute-500">
            {v.failuresLine}
          </div>
        </div>
      </div>

      {/* verdict body: ring + reasoning */}
      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-4">
          <RiskRing score={v.score} band={v.band} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="t-body leading-relaxed text-slate-200">{v.tldr}</p>
          <div className="mt-3">
            <CheckStrip checks={data.checks} />
          </div>
        </div>
      </div>

      {/* market strip */}
      <div className="grid grid-cols-2 divide-x divide-ink-800 border-t border-ink-750 sm:grid-cols-3 lg:grid-cols-6">
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
              ? "no circulating supply reported"
              : data.market.marketCap !== null
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
          label="Top 10 (merged)"
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
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Check list
 * ------------------------------------------------------------------ */

const GLYPH: Record<CheckState, string> = { pass: "✓", fail: "✕", warn: "!", unknown: "?" };

export function CheckList({ checks }: { checks: Check[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const ordered = sortBySeverity(checks);

  return (
    <ul className="divide-y divide-ink-800">
      {ordered.map((c) => {
        const expanded = open === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : c.id)}
              aria-expanded={expanded}
              className="row-hover flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ink-850/70"
            >
              <span
                aria-hidden
                className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                  c.state === "pass"
                    ? "bg-ok-600/20 text-ok-400"
                    : c.state === "fail"
                      ? "bg-bad-600/20 text-bad-400"
                      : c.state === "warn"
                        ? "bg-warn-600/20 text-warn-400"
                        : "bg-ink-750 text-mute-500"
                }`}
              >
                {GLYPH[c.state]}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="t-body-strong text-slate-100">{c.label}</span>
                  <span
                    className={`shrink-0 font-mono text-[12px] tabular-nums ${STATE_TEXT[c.state]}`}
                  >
                    {c.reading}
                  </span>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="t-meta text-mute-600">{c.source}</span>
                  <QualityDot quality={c.quality} />
                </span>
              </span>

              <span
                aria-hidden
                className={`mt-0.5 shrink-0 text-mute-600 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              >
                ›
              </span>
            </button>

            {expanded && (
              <div className="fade-up border-t border-ink-800 bg-ink-850/50 px-4 py-3 pl-[46px]">
                <p className="t-small leading-relaxed text-mute-300">{c.detail}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Holders
 * ------------------------------------------------------------------ */

export function HolderPanel({ data }: { data: AnalysisResult }) {
  const chain = CHAIN_BY_ID[data.token.chain];
  const { holders } = data;

  if (holders.rows.length === 0) {
    return (
      <div className="p-4">
        <div className="rounded-[3px] border border-dashed border-warn-600/35 px-4 py-5">
          <p className="t-body-strong text-mute-300">No holder list available</p>
          <p className="mt-1 t-small leading-relaxed text-mute-500">
            Neither provider returned holders for this token. This is a coverage
            gap, not evidence of healthy distribution — treat concentration as
            unverified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pt-3.5">
        <ConcentrationBar
          rows={holders.rows}
          linkedPct={data.clusters.linkedSupplyPct}
        />
      </div>

      <div className="mt-3 border-t border-ink-800">
        <HolderBars rows={holders.rows} explorer={chain.explorer} />
      </div>

      <div className="border-t border-ink-800 px-4 py-3">
        {!holders.meaningful && holders.note && (
          <p className="mb-2 t-small leading-relaxed text-warn-400">{holders.note}</p>
        )}
        <p className="t-meta leading-relaxed text-mute-600">
          {holders.method} Wallets without a tag are unclassified, not
          suspicious.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Exit + flow
 * ------------------------------------------------------------------ */

export function ExitPanel({ data }: { data: AnalysisResult }) {
  const e = data.exit;
  if (!e.available) {
    return (
      <div className="p-4">
        <p className="t-small leading-relaxed text-mute-400">{e.note}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <ExitLadder
        slip1={e.maxSellUsd.slip1}
        slip5={e.maxSellUsd.slip5}
        slip10={e.maxSellUsd.slip10}
      />
      <p className="t-meta leading-relaxed text-mute-500">
        How much you can sell before price impact reaches that level. Size your
        position as a fraction of these, not near them.
      </p>
      <div className="border-t border-ink-800 pt-3">
        <CoverageMeter coverage={e.liquidityCoverage} />
      </div>
      <p className="border-t border-ink-800 pt-2.5 t-meta leading-relaxed text-mute-600">
        {e.note}
      </p>
    </div>
  );
}

export function FlowPanel({ data }: { data: AnalysisResult }) {
  const f = data.flow;
  if (!f.dataAvailable && f.note) {
    return (
      <div className="p-4">
        <div className="rounded-[3px] border border-ink-750 bg-ink-850 px-3 py-2.5">
          <p className="t-meta leading-relaxed text-mute-400">{f.note}</p>
        </div>
        {f.buys !== null && f.sells !== null && (
          <div className="mt-3">
            <FlowBalance buys={f.buys} sells={f.sells} imbalance={null} buyVol={null} sellVol={null} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      {f.buys !== null && f.sells !== null ? (
        <FlowBalance
          buys={f.buys}
          sells={f.sells}
          imbalance={f.imbalance}
          buyVol={f.buyVolumeUsd}
          sellVol={f.sellVolumeUsd}
        />
      ) : (
        <p className="t-small text-mute-500">No trade tape and no pair summary.</p>
      )}
      <p className="mt-3 border-t border-ink-800 pt-2.5 t-meta leading-relaxed text-mute-600">
        Sampled from the last {f.windowTrades || "—"} trades. A snapshot of a few
        hundred swaps, not a trend.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Creator
 * ------------------------------------------------------------------ */

export function CreatorPanel({ data }: { data: AnalysisResult }) {
  const d = data.deployer;
  const chain = CHAIN_BY_ID[data.token.chain];

  return (
    <div className="p-4">
      {!d.dataAvailable ? (
        <p className="t-small leading-relaxed text-mute-400">
          The creator wallet could not be identified, so its history is unknown —
          not clean.
        </p>
      ) : (
        <>
          <dl className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="t-meta text-mute-500">Wallet</dt>
              <dd className="min-w-0">
                {d.address ? (
                  <span className="inline-flex items-center gap-2">
                    <a
                      href={chain.explorer(d.address)}
                      target="_blank"
                      rel="noreferrer"
                      title={d.address}
                      className="truncate font-mono text-[11.5px] text-mute-300 underline decoration-ink-700 decoration-dotted underline-offset-2 hover:text-brand-400"
                    >
                      {d.address.slice(0, 6)}…{d.address.slice(-5)}
                    </a>
                    <CopyButton text={d.address} label="Creator address copied" title="Copy creator address" />
                  </span>
                ) : (
                  <span className="font-mono t-meta text-mute-600">unknown</span>
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="t-meta text-mute-500">Holds</dt>
              <dd className="font-mono text-[11.5px] tabular-nums text-mute-300">
                {d.balancePct === null ? "unknown" : fmtPct(d.balancePct, 2)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="t-meta text-mute-500">Prior launches</dt>
              <dd className="font-mono text-[11.5px] tabular-nums text-mute-300">
                {d.priorTokens.length}
                {d.ruggedCount > 0 && (
                  <span className="ml-1.5 text-bad-400">{d.ruggedCount} rugged</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-3 border-t border-ink-800 pt-2.5">
            {d.priorTokens.length === 0 ? (
              <p className="t-meta leading-relaxed text-mute-500">
                Fresh wallet. No rug history — and no track record either.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {d.priorTokens.slice(0, 6).map((t) => (
                  <li key={t.address} className="flex items-center gap-2 t-meta">
                    <span
                      aria-hidden
                      className={`h-1 w-1 shrink-0 rounded-full ${t.rugged ? "bg-bad-500" : "bg-ok-500"}`}
                    />
                    <a
                      href={chain.explorer(t.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-mute-300 hover:text-brand-400"
                    >
                      {t.symbol ?? `${t.address.slice(0, 5)}…`}
                    </a>
                    <span className={`ml-auto ${t.rugged ? "text-bad-400" : "text-mute-600"}`}>
                      {t.rugged ? "rugged" : "survived"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Narrative + project
 * ------------------------------------------------------------------ */

export function NarrativePanel({ data }: { data: AnalysisResult }) {
  const n = data.narrative;
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <QualityDot quality="inferred" />
        {n.theme && <Tag tone="warn">{n.theme}</Tag>}
      </div>

      {n.summary ? (
        <p className="mt-2.5 t-small leading-relaxed text-mute-300">{n.summary}</p>
      ) : (
        <p className="mt-2.5 t-small leading-relaxed text-mute-500">
          No theme matched this token&apos;s name or symbol.
        </p>
      )}

      {n.keywords.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {n.keywords.map((k) => (
            <span
              key={k}
              className="rounded-[3px] border border-ink-750 px-1.5 py-0.5 font-mono text-[10.5px] text-mute-500"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 border-t border-ink-800 pt-2.5 t-meta leading-relaxed text-mute-600">
        {n.disclaimer}
      </p>
    </div>
  );
}

export function ProjectPanel({ data }: { data: AnalysisResult }) {
  const p = data.project;
  const rows = [
    { label: "Website", value: p.website },
    { label: "X", value: p.twitter },
    { label: "Telegram", value: p.telegram },
  ].filter((r) => r.value);

  return (
    <div className="p-4">
      {rows.length === 0 ? (
        <p className="t-small leading-relaxed text-mute-500">
          No website or social links were published for this token in the data we
          read. We do not guess them.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-baseline gap-3">
              <span className="w-16 shrink-0 t-meta text-mute-500">{r.label}</span>
              <a
                href={r.value!}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate font-mono text-[11.5px] text-brand-400 underline decoration-brand-700 decoration-dotted underline-offset-2 hover:text-brand-300"
              >
                {r.value!.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </li>
          ))}
        </ul>
      )}
      {p.description && (
        <p className="mt-3 t-small leading-relaxed text-mute-300">{p.description}</p>
      )}
      <p className="mt-3 border-t border-ink-800 pt-2.5 t-meta leading-relaxed text-mute-600">
        Posted by the project, not verified by us.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Provenance — diagnostics, collapsed unless something failed
 * ------------------------------------------------------------------ */

export function ProvenancePanel({ data }: { data: AnalysisResult }) {
  const failed = data.provenance.filter((p) => !p.ok);

  return (
    <div className="p-4">
      <details open={failed.length > 0}>
        <summary className="cursor-pointer list-none t-small text-mute-400 transition hover:text-slate-200">
          {failed.length > 0 ? (
            <span className="text-bad-400">
              {failed.length} source{failed.length > 1 ? "s" : ""} did not answer
            </span>
          ) : (
            <span>All {data.provenance.length} sources answered</span>
          )}
          <span className="ml-1.5 text-mute-600">· details</span>
        </summary>

        <ul className="mt-2.5 space-y-1.5">
          {data.provenance.map((p, i) => (
            <li key={`${p.source}-${i}`} className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className={`h-1 w-1 shrink-0 rounded-full ${p.ok ? "bg-ok-500" : "bg-bad-500"}`}
              />
              <span className="truncate font-mono t-meta text-mute-400">{p.source}</span>
              <span
                className="ml-auto max-w-[48%] shrink-0 truncate text-right font-mono t-meta text-mute-600"
                title={p.ok ? undefined : (p.error ?? "failed")}
              >
                {p.ok ? (p.note === "cached" ? "cached" : `${p.ms}ms`) : (p.error ?? "failed")}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-3 border-t border-ink-800 pt-2.5 t-meta leading-relaxed text-mute-600">
        {data.disclaimer}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Premium preview
 *
 * Stated as planned, not as locked. Nothing above is withheld, so this is
 * framed as a roadmap, not a paywall — misrepresenting it either way would be
 * the fastest way to lose a user's trust.
 * ------------------------------------------------------------------ */

const PREMIUM = [
  { name: "Wallet cluster map", note: "Who is one entity in disguise" },
  { name: "Bundle wallet analysis", note: "Coordinated launch buying" },
  { name: "Dev wallet investigation", note: "Full creator history" },
  { name: "KOL intelligence", note: "Who is actually shilling" },
  { name: "Smart alerts", note: "Notify when a holder exits" },
];

export function PremiumPreview() {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-750 px-4 py-2.5">
        <h2 className="t-label">On the roadmap</h2>
        <Tag tone="warn">not built</Tag>
      </div>

      <ul className="divide-y divide-ink-800">
        {PREMIUM.map((f) => (
          <li key={f.name} className="flex items-start gap-2.5 px-4 py-2.5">
            <span
              aria-hidden
              className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ink-500"
            />
            <div className="min-w-0">
              <div className="t-small text-mute-300">{f.name}</div>
              <div className="t-meta text-mute-600">{f.note}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-ink-750 px-4 py-2.5">
        <p className="t-meta leading-relaxed text-mute-600">
          These do not exist yet, and nothing on this report is hidden behind
          them. Listed so you know what is coming, not to sell you a wall.
        </p>
        <Link
          href="/pricing"
          className="mt-2 inline-block t-meta text-brand-400 underline decoration-brand-700 decoration-dotted underline-offset-2 hover:text-brand-300"
        >
          See what premium will include →
        </Link>
      </div>
    </div>
  );
}
