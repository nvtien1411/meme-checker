"use client";

import { useState } from "react";
import type { AnalysisResult, Check, CheckState } from "@/lib/types";
import { CHAIN_BY_ID } from "@/lib/chains";
import { fmtAge, fmtChange, fmtPct, fmtPrice, fmtUsd } from "@/lib/http";
import { CopyButton } from "./feedback";
import { ChainChip } from "./ChainMark";
import { QualityDot } from "./ui";
import { CallersSection, ForensicsSection, NarrativeIntelSection } from "./forensics";
import {
  ConcentrationBar,
  ExitCurve,
  FlowBar,
  HolderDetail,
  HolderMap,
  HolderRows,
  Meter,
  RiskArc,
} from "./viz";
import { sortBySeverity } from "@/lib/check-order";

/* ==================================================================== *
 * REPORT — console layout
 *
 * v3 was a document: one column of numbered sections, read top to bottom.
 * That is the wrong shape for this job, and it is why the last rebuild did
 * not look different. A trader opening a token does not read a memo — they
 * ask one of five questions and want the answer to that one question.
 *
 * So the shape is now:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ identity strip — token, chain, price, liquidity, age     │
 *   ├──────────────┬───────────────────────────────────────────┤
 *   │              │ tabs: Verdict · Wallets · Holders · …      │
 *   │  score rail  ├───────────────────────────────────────────┤
 *   │  (sticky)    │ module cards for the selected tab          │
 *   └──────────────┴───────────────────────────────────────────┘
 *
 * The rail never scrolls away, so the score and the counts stay on screen
 * while you read any layer. Cards are discrete so each module can be
 * scanned independently — which is the entire point of a console.
 * ==================================================================== */

const BAND = {
  avoid: {
    label: "Extreme risk",
    color: "text-bad-400",
    bg: "bg-bad-500",
    wash: "rgba(240,55,92,0.30)",
  },
  risky: {
    label: "High risk",
    color: "text-risk-400",
    bg: "bg-risk-500",
    wash: "rgba(242,100,25,0.26)",
  },
  watch: {
    label: "Watch",
    color: "text-warn-400",
    bg: "bg-warn-500",
    wash: "rgba(232,163,23,0.22)",
  },
  clean: {
    label: "No red flags",
    color: "text-ok-400",
    bg: "bg-ok-500",
    wash: "rgba(25,199,155,0.22)",
  },
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
 * SnapshotTime — the clock time of the reading, not its age.
 *
 * fmtAgo calls Date.now(), which Next refuses to evaluate while prerendering;
 * that threw "unstable value Date.now() while prerendering" and the route
 * never hydrated, so the tab strip rendered and clicking it did nothing.
 * A fixed local time needs no clock at all, is identical on server and
 * client, and is more useful here: the report is a snapshot, and you want to
 * know when it was taken.
 * ------------------------------------------------------------------ */

function SnapshotTime({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <>snapshot</>;
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return (
    <>
      {hh}:{mm}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Identity strip — the facts, always visible, never the judgement.
 * ------------------------------------------------------------------ */

export function IdentityBar({ data }: { data: AnalysisResult }) {
  const m = data.market;
  const change = fmtChange(m.priceChange24h, m.ageHours);

  return (
    <div className="card mb-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5">
        {data.token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.token.imageUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border border-ink-750 object-cover"
          />
        ) : (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-750 bg-ink-850 font-mono text-[10px] text-mute-600">
            {(data.token.symbol ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="truncate t-display text-lit-50">{data.token.name ?? "Unknown token"}</h1>
          {data.token.symbol && (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute-500">
              {data.token.symbol}
            </span>
          )}
          <ChainChip chain={data.token.chain} />
        </div>

        <div className="flex items-center gap-2.5 sm:ml-auto">
          <CopyButton
            text={data.token.address}
            display={`${data.token.address.slice(0, 4)}…${data.token.address.slice(-4)}`}
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
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-mute-600">
            <span aria-hidden className="live-dot h-1 w-1 rounded-full bg-brand-500" />
            <SnapshotTime iso={data.generatedAt} />
          </span>
        </div>
      </div>

      {/* market facts, as a dense strip rather than six cards */}
      <div className="grid grid-cols-2 border-t border-ink-800 sm:grid-cols-3 lg:grid-cols-6">
        <Fact
          label="Price"
          value={fmtPrice(m.priceUsd)}
          sub={change.text === "—" ? undefined : `${change.text} ${change.label}`}
          tone={
            m.priceChange24h === null
              ? undefined
              : m.priceChange24h > 0
                ? "up"
                : m.priceChange24h < 0
                  ? "down"
                  : undefined
          }
        />
        <Fact label={m.capKind === "fdv" ? "FDV" : "Market cap"} value={fmtUsd(m.marketCap ?? m.fdv)} />
        <Fact label="Liquidity" value={fmtUsd(m.liquidityUsd)} />
        <Fact label="Volume 24h" value={fmtUsd(m.volume24h)} sub={ratio(m.volume24h, m.liquidityUsd)} />
        <Fact label="Age" value={fmtAge(m.ageHours)} />
        <Fact
          label="Top 10"
          value={data.holders.meaningful ? fmtPct(data.holders.effectiveTop10Pct) : "—"}
          tone={
            data.holders.meaningful && (data.holders.effectiveTop10Pct ?? 0) >= 30 ? "bad" : undefined
          }
        />
      </div>
    </div>
  );
}

/**
 * Thousands separator, pinned to en-US. `toLocaleString()` with no argument
 * reads the OS locale, so on a Vietnamese machine 1176 rendered as "1.176" —
 * one-point-one-seven-six to anyone reading an English interface.
 */
export function count(n: number): string {
  return n.toLocaleString("en-US");
}

function ratio(a: number | null, b: number | null): string | undefined {
  if (a === null || b === null || b <= 0) return undefined;
  return `${(a / b).toFixed(1)}× liquidity`;
}

function Fact({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down" | "bad";
}) {
  const cls =
    tone === "up"
      ? "text-ok-400"
      : tone === "down"
        ? "text-bad-400"
        : tone === "bad"
          ? "text-bad-400"
          : "text-lit-100";
  return (
    <div className="border-ink-800 px-3.5 py-2.5 [&:not(:first-child)]:border-l">
      <div className="t-label">{label}</div>
      <div className={`mt-1 font-mono text-[15px] tabular-nums ${cls}`}>{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[9.5px] text-mute-600">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Score rail — the one number, plus why. Sticky on desktop.
 * ------------------------------------------------------------------ */

export function ScoreRail({ data }: { data: AnalysisResult }) {
  const v = data.verdict;
  const band = BAND[v.band];

  const worst = sortBySeverity(data.checks)
    .filter((c) => c.state === "fail" || c.state === "warn")
    .slice(0, 3);

  return (
    <div
      className="rail score-wash h-full border border-ink-800 p-4 lg:sticky lg:top-[64px]"
      style={{ "--wash": band.wash } as React.CSSProperties}
    >
      <div className="flex items-center justify-between">
        <span className="t-label">Risk score</span>
        <span className={`h-[6px] w-[6px] ${band.bg}`} aria-hidden />
      </div>

      <div className="mt-2.5 flex items-end gap-2">
        <span className={`t-verdict ${band.color}`}>{v.score}</span>
        <span className="pb-1.5 font-mono text-[11px] text-mute-600">/100</span>
      </div>

      <div
        className={`mt-1.5 text-[19px] font-semibold leading-tight tracking-[-0.02em] ${band.color}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {band.label}
      </div>

      <p className="mt-2.5 t-small leading-relaxed text-mute-300">{v.tldr}</p>

      {/* counts, as a compact ledger */}
      <div className="mt-3.5 grid grid-cols-4 border-y border-ink-800">
        {(
          [
            [v.fails, "fail", "text-bad-400"],
            [v.warns, "watch", "text-warn-400"],
            [v.unknowns, "unk", "text-mute-500"],
            [v.passes, "pass", "text-ok-400"],
          ] as const
        ).map(([n, word, cls]) => (
          <div
            key={word}
            className="px-1 py-2 text-center [&:not(:first-child)]:border-l [&:not(:first-child)]:border-ink-800"
          >
            <div className={`font-mono text-[16px] tabular-nums ${n > 0 ? cls : "text-mute-600"}`}>
              {n}
            </div>
            <div className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-600">
              {word}
            </div>
          </div>
        ))}
      </div>

      {worst.length > 0 && (
        <div className="mt-3.5">
          <div className="t-label">Worst readings</div>
          <ul className="mt-2 space-y-2">
            {worst.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline gap-1.5">
                  <span
                    aria-hidden
                    className={`grid h-[15px] w-[15px] shrink-0 place-items-center border font-mono text-[9px] leading-none ${CHECK_TONE[c.state]}`}
                  >
                    {CHECK_GLYPH[c.state]}
                  </span>
                  <span className="min-w-0 t-meta font-medium text-lit-200">{c.label}</span>
                </div>
                <div className="mt-0.5 pl-[21px] font-mono text-[10px] text-mute-500">{c.reading}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tabs
 * ------------------------------------------------------------------ */

const TABS = [
  { id: "verdict", label: "Verdict" },
  { id: "wallets", label: "Wallets" },
  { id: "holders", label: "Holders" },
  { id: "callers", label: "Callers" },
  { id: "narrative", label: "Narrative" },
  { id: "liquidity", label: "Liquidity" },
  { id: "checks", label: "All checks" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ *
 * Report body
 * ------------------------------------------------------------------ */

export function ReportConsole({ data }: { data: AnalysisResult }) {
  const [tab, setTab] = useState<TabId>("verdict");

  return (
    <div>
      <IdentityBar data={data} />

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[268px_minmax(0,1fr)]">
        <ScoreRail data={data} />

        <div className="min-w-0">
          {/* tab strip */}
          <div className="card mb-3">
            <div role="tablist" aria-label="Report sections" className="no-bar flex gap-5 overflow-x-auto px-3.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  id={`tab-${t.id}`}
                  className="tab"
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === "wallets" && !data.forensics?.enabled && (
                    <span aria-hidden className="text-[9px] text-mute-600">
                      ·
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="rise">
            {tab === "verdict" && <VerdictPanel data={data} onJump={setTab} />}
            {tab === "wallets" && (
              <Panel title="Wallet forensics" note="who bought the launch, and what they have done since">
                <ForensicsSection data={data.forensics} chain={data.token.chain} />
              </Panel>
            )}
            {tab === "holders" && (
              <Panel
                title="Holder distribution"
                note="pools, burns and curves removed"
                right={
                  data.holders.totalHolders !== null
                    ? `${count(data.holders.totalHolders)} holders`
                    : undefined
                }
              >
                <HolderTab data={data} />
              </Panel>
            )}
            {tab === "callers" && (
              <Panel title="Who called it" note="and what the account did with its own position">
                <CallersSection data={data.callers} />
              </Panel>
            )}
            {tab === "narrative" && (
              <div className="space-y-3">
                <Panel title="Narrative" note="how many times this idea has already been tried">
                  <NarrativeIntelSection data={data.narrativeIntel} />
                </Panel>
                <Panel title="Project" note="what the token claims, kept separate from what was measured">
                  <ProjectPanel data={data} />
                </Panel>
              </div>
            )}
            {tab === "liquidity" && (
              <Panel title="Liquidity and flow" note="what you get out, and what the tape looks like">
                <LiquidityPanel data={data} />
              </Panel>
            )}
            {tab === "checks" && (
              <Panel
                title="Every check"
                note="worst first — open a row for the number behind it"
                right={`${data.checks.length}`}
              >
                <CheckList checks={data.checks} />
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Panel — one card. Every tab renders panels, so the page keeps a single
 * surface language across seven different views.
 * ------------------------------------------------------------------ */

function Panel({
  title,
  note,
  right,
  children,
}: {
  title: string;
  note?: string;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <header className="card-head">
        <h2 className="t-section text-lit-100">{title}</h2>
        {right && (
          <span className="ml-auto font-mono text-[10px] tabular-nums text-mute-600">{right}</span>
        )}
      </header>
      {note && <p className="border-b border-ink-850 px-3.5 py-2 t-meta text-mute-600">{note}</p>}
      <div className="p-3.5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Verdict tab — the reading order, as a grid of facts
 * ------------------------------------------------------------------ */

function VerdictPanel({ data, onJump }: { data: AnalysisResult; onJump: (t: TabId) => void }) {
  // Only cells the pipeline actually answered. Four of six reading "not
  // measured" in the prime position made a working product look empty — the
  // unknown modules are still named, but in one line underneath, not as
  // quarter-screen tiles.
  const measured = [
    {
      label: "Top 10",
      value: data.holders.meaningful ? fmtPct(data.holders.effectiveTop10Pct) : null,
      sub: "share of supply",
      jump: "holders" as TabId,
      tone:
        data.holders.meaningful && (data.holders.effectiveTop10Pct ?? 0) >= 30
          ? ("bad" as const)
          : undefined,
    },
    {
      label: "Exit depth",
      value: data.exit.maxSellUsd.slip5 !== null ? fmtUsd(data.exit.maxSellUsd.slip5) : null,
      sub: "sellable before 5% slip",
      jump: "liquidity" as TabId,
      tone: undefined,
    },
    {
      label: "Creator holds",
      value: data.deployer.address ? fmtPct(data.deployer.balancePct) : null,
      sub:
        data.deployer.ruggedCount > 0
          ? `${data.deployer.ruggedCount} prior rug${data.deployer.ruggedCount === 1 ? "" : "s"}`
          : "no rug history",
      jump: "holders" as TabId,
      tone:
        data.deployer.ruggedCount > 0
          ? ("bad" as const)
          : (data.deployer.balancePct ?? 0) >= 10
            ? ("bad" as const)
            : undefined,
    },
    {
      label: data.holders.totalHolders !== null ? "Holders" : "Pools",
      value:
        data.holders.totalHolders !== null
          ? count(data.holders.totalHolders)
          : `${data.market.pools.length}`,
      sub: data.holders.totalHolders !== null ? "wallets holding" : "trading pairs",
      jump: "holders" as TabId,
      tone: undefined,
    },
    {
      label: "Volume 24h",
      value: fmtUsd(data.market.volume24h),
      sub:
        data.market.liquidityUsd && data.market.volume24h
          ? `${(data.market.volume24h / data.market.liquidityUsd).toFixed(1)}× liquidity`
          : "no comparison",
      jump: "liquidity" as TabId,
      tone: undefined,
    },
    {
      label: "Fill",
      value: data.flow.dataAvailable && data.flow.imbalance !== null ? fmtPct(data.flow.imbalance * 100) : null,
      sub: "buy minus sell pressure",
      jump: "liquidity" as TabId,
      tone:
        data.flow.imbalance !== null && data.flow.imbalance < -0.2
          ? ("bad" as const)
          : undefined,
    },
  ].filter((c) => c.value !== null);

  // Named, counted, and honest: these were not run, so they get a line, not a tile.
  const unmeasured = [
    !data.forensics?.enabled && "bundle",
    !data.forensics?.enabled && "sniper",
    !data.forensics?.enabled && "insider",
    !data.forensics?.enabled && "fresh wallets",
    !data.callers?.available && "callers",
    !data.narrativeIntel?.available && "narrative history",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-3">
      <Panel title="Key readings" note="what the pipeline answered, with the number behind each">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {measured.map((cell) => (
            <button
              key={cell.label}
              type="button"
              onClick={() => onJump(cell.jump)}
              className="row-acid border border-ink-800 bg-ink-925 p-3 text-left transition-colors hover:border-ink-700 hover:bg-ink-850"
            >
              <div className="t-label">{cell.label}</div>
              <div
                className={`mt-1 font-mono text-[22px] tabular-nums leading-none ${
                  cell.value === null ? "text-mute-600" : cell.tone === "bad" ? "text-bad-400" : "text-lit-100"
                }`}
              >
                {cell.value === null ? "—" : cell.value}
              </div>
              <div className="mt-1 font-mono text-[9.5px] text-mute-600">{cell.sub}</div>
            </button>
          ))}
        </div>

        {unmeasured.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-ink-850 pt-2.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute-600">
              not run
            </span>
            <span className="t-meta text-mute-500">{unmeasured.join(" · ")}</span>
            <span className="t-meta text-mute-600">
              — never run is not the same as came back clean
            </span>
          </div>
        )}
      </Panel>

      <Panel title="Why this score" note="the score is not an average: one disqualifying finding sets a floor the rest cannot lift">
        <ScoreBreakdown data={data} />
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Largest wallet" note="share of supply, pools removed">
          <ConcentrationBar
            top10={data.holders.meaningful ? data.holders.effectiveTop10Pct : null}
            largest={
              data.holders.meaningful
                ? data.holders.rows.reduce((m, r) => Math.max(m, r.pct ?? 0), 0)
                : null
            }
            linkedPct={data.clusters.linkedSupplyPct}
          />
        </Panel>
        <Panel title="Creator" note="what the deployer has done with its own supply">
          <CreatorPanel data={data} />
        </Panel>
      </div>

      <Panel title="Sources" note="a source that failed leaves its check unknown — never a pass">
        <ProvenancePanel data={data} />
      </Panel>
    </div>
  );
}

function ScoreBreakdown({ data }: { data: AnalysisResult }) {
  const ordered = sortBySeverity(data.checks);
  const failing = ordered.filter((c) => c.state === "fail");
  const rest = ordered.filter((c) => c.state !== "fail");

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
      {failing.length === 0 && (
        <p className="t-small leading-relaxed text-mute-400">
          No check failed outright. {data.verdict.warns} to watch, {data.verdict.unknowns} the
          pipeline could not read
        </p>
      )}
      {failing.length > 0 && failing.length <= 3 && (
        <p className="mb-2 t-small leading-relaxed text-mute-400">
          Failures are above; everything else is below. A check that passed is not a promise —
          it is one question the pipeline could answer
        </p>
      )}
      {failing.length > 0 && (
        <ul className="space-y-2">
          {failing.slice(3).map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <span
                aria-hidden
                className={`mt-[3px] grid h-[16px] w-[16px] shrink-0 place-items-center border font-mono text-[9px] ${CHECK_TONE[c.state]}`}
              >
                ✕
              </span>
              <div className="min-w-0">
                <span className="t-body-strong text-lit-100">{c.label}</span>
                <p className="mt-0.5 font-mono text-[11px] text-bad-400">{c.reading}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>

      {rest.length > 0 && (
        <div className="border-t border-ink-850 pt-2.5 lg:border-t-0 lg:border-l lg:border-ink-850 lg:pl-8 lg:pt-0">
          <div className="t-label">Other checks</div>
          <ul className="mt-2 divide-y divide-ink-850">
            {rest.map((c) => (
              <li key={c.id} className="flex items-start gap-2 py-2">
                <span
                  aria-hidden
                  className={`mt-[2px] grid h-[14px] w-[14px] shrink-0 place-items-center border font-mono text-[8px] leading-none ${
                    c.state === "pass"
                      ? "text-ok-500 border-ok-600/40"
                      : c.state === "warn"
                        ? "text-warn-500 border-warn-600/40"
                        : "text-mute-500 border-ink-600"
                  }`}
                >
                  {CHECK_GLYPH[c.state]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="t-meta leading-snug text-mute-200">{c.label}</div>
                  <div
                    className={`mt-0.5 font-mono text-[10px] tabular-nums ${
                      c.state === "pass"
                        ? "text-ok-500"
                        : c.state === "warn"
                          ? "text-warn-500"
                          : "text-mute-500"
                    }`}
                  >
                    {c.reading}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Holders — map plus table inside one panel
 * ------------------------------------------------------------------ */

function HolderTab({ data }: { data: AnalysisResult }) {
  const h = data.holders;
  const chain = CHAIN_BY_ID[data.token.chain];
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked ? (h.rows.find((r) => r.address === picked) ?? null) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,290px)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between pb-1.5">
          <span className="t-label">share of supply</span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-600">
            to scale
          </span>
        </div>
        <div className="border border-ink-800 bg-ink-925">
          <HolderMap rows={h.rows} selected={picked} onSelect={setPicked} />
          {selected && (
            <HolderDetail holder={selected} explorer={chain.explorer} onClose={() => setPicked(null)} />
          )}
        </div>
        <p className="mt-2 t-meta leading-relaxed text-mute-600">
          Top {h.rows.length}, area proportional to share. Click a bubble to inspect it
        </p>
      </div>

      <div className="min-w-0">
        <div className="border border-ink-800 bg-ink-925">
          <div className="grid grid-cols-[20px_minmax(0,1fr)_auto_auto] items-baseline gap-x-3 border-b border-ink-800 px-3 py-1.5">
            <span className="t-label">#</span>
            <span className="t-label">wallet</span>
            <span className="t-label text-right">share</span>
            <span className="t-label text-right">balance</span>
          </div>
          <HolderRows rows={h.rows} explorer={chain.explorer} selected={picked} onSelect={setPicked} />
        </div>
        <p className="mt-2 t-meta leading-relaxed text-mute-600">
          An unlabelled wallet is unclassified — not suspicious
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Liquidity
 * ------------------------------------------------------------------ */

function LiquidityPanel({ data }: { data: AnalysisResult }) {
  const e = data.exit;
  const f = data.flow;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between pb-2">
          <h3 className="t-title text-lit-100">Exit depth</h3>
          <Meter label="of market cap" value={e.liquidityCoverage} />
        </div>
        <div className="border-t border-ink-800 pt-3">
          {e.available ? (
            <ExitCurve
              maxSell5pct={e.maxSellUsd.slip5}
              maxSell1pct={e.maxSellUsd.slip1}
              liquidityUsd={data.market.liquidityUsd}
            />
          ) : (
            <p className="t-small text-mute-500">{e.note ?? "No pool data"}</p>
          )}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between pb-2">
          <h3 className="t-title text-lit-100">Trade flow</h3>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-mute-600">
            {f.windowTrades} trades
          </span>
        </div>
        <div className="border-t border-ink-800 pt-3">
          {f.dataAvailable ? (
            <FlowBar
              buyVol={f.buyVolumeUsd}
              sellVol={f.sellVolumeUsd}
              imbalance={f.imbalance}
              buys={f.buys}
              sells={f.sells}
            />
          ) : (
            <p className="t-small text-mute-500">{f.note ?? "No trade data"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Project — claims only, never mixed with measurements
 * ------------------------------------------------------------------ */

function ProjectPanel({ data }: { data: AnalysisResult }) {
  const p = data.project;
  const n = data.narrative;
  const any = p.website || p.twitter || p.telegram || p.description || n.summary;

  if (!any) {
    return (
      <p className="t-small leading-relaxed text-mute-500">
        No project information was found. Nothing is invented to fill the gap
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {n.summary && (
        <div>
          <div className="t-label">Narrative</div>
          <p className="mt-1 t-body leading-relaxed text-mute-300">{n.summary}</p>
          {n.keywords.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {n.keywords.slice(0, 8).map((k) => (
                <span
                  key={k}
                  className="border border-ink-750 px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.06em] text-mute-500"
                >
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {p.description && (
        <div>
          <div className="t-label">Description</div>
          <p className="mt-1 t-small leading-relaxed text-mute-400">{p.description}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-ink-850 pt-2.5">
        {[
          ["Website", p.website],
          ["X", p.twitter],
          ["Telegram", p.telegram],
        ].map(([label, url]) =>
          url ? (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="border border-ink-750 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-mute-300 transition-colors hover:border-brand-700 hover:text-brand-400"
            >
              {label} ↗
            </a>
          ) : null,
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * All checks — the ledger
 * ------------------------------------------------------------------ */

function CheckList({ checks }: { checks: Check[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const ordered = sortBySeverity(checks);

  return (
    <ul>
      {ordered.map((c) => {
        const isOpen = open === c.id;
        return (
          <li key={c.id} className="border-b border-ink-850 last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : c.id)}
              aria-expanded={isOpen}
              className="row-acid grid w-full grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-x-2.5 py-2.5 pl-2 text-left transition-colors hover:bg-ink-850"
            >
              <span
                aria-hidden
                className={`mt-[1px] grid h-[17px] w-[17px] place-items-center border font-mono text-[9px] leading-none ${CHECK_TONE[c.state]}`}
              >
                {CHECK_GLYPH[c.state]}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="t-body-strong text-lit-100">{c.label}</span>
                  <span
                    className={`font-mono text-[10.5px] tabular-nums ${
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
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-mute-600">
                    {c.source}
                  </span>
                  <QualityDot quality={c.quality} />
                </div>
              </div>
              <span
                aria-hidden
                className={`mt-0.5 font-mono text-[10px] text-mute-600 transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                ›
              </span>
            </button>
            {isOpen && (
              <div className="rise border-t border-ink-850 bg-ink-925 px-3 py-2.5 pl-[38px]">
                <p className="max-w-[74ch] t-small leading-relaxed text-mute-300">{c.detail}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Creator — small, panel-scale
 * ------------------------------------------------------------------ */

function CreatorPanel({ data }: { data: AnalysisResult }) {
  const d = data.deployer;
  if (!d.address) {
    return <p className="t-small leading-relaxed text-mute-500">The deployer could not be identified</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <CopyButton
          text={d.address}
          display={`${d.address.slice(0, 6)}…${d.address.slice(-4)}`}
          label="Deployer address copied"
          title="Copy deployer address"
          className="font-mono text-[11px] text-mute-300 underline decoration-ink-700 underline-offset-2 hover:text-lit-100"
        />
        {d.ruggedCount > 0 && (
          <span className="border border-bad-600/50 px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.06em] text-bad-400">
            {d.ruggedCount} prior rug{d.ruggedCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3">
        <div>
          <div className="t-label">Holds</div>
          <div className="font-mono text-[14px] tabular-nums text-lit-100">{fmtPct(d.balancePct)}</div>
        </div>
        <div>
          <div className="t-label">Prior launches</div>
          <div className="font-mono text-[14px] tabular-nums text-lit-100">{d.priorTokens.length}</div>
        </div>
      </div>

      {d.priorTokens.length === 0 && d.dataAvailable && (
        <p className="mt-2 t-meta leading-relaxed text-mute-600">
          A fresh wallet: no rug history, and no track record either
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Provenance
 * ------------------------------------------------------------------ */

function ProvenancePanel({ data }: { data: AnalysisResult }) {
  return (
    <div>
      <ul className="space-y-1">
        {data.provenance.map((s) => (
          <li key={s.source} className="flex items-baseline gap-2">
            <span
              aria-hidden
              className={`h-1 w-1 shrink-0 rounded-full ${s.ok ? "bg-ok-500" : "bg-bad-500"}`}
            />
            <span className="font-mono text-[10.5px] text-mute-300">{s.source}</span>
            <span className="ml-auto font-mono text-[9.5px] tabular-nums text-mute-600">
              {s.ok ? `${Math.round(s.ms)}ms` : "failed"}
            </span>
          </li>
        ))}
      </ul>
      {data.provenance.some((s) => !s.ok) && (
        <p className="mt-2 border-t border-ink-850 pt-2 t-meta leading-relaxed text-warn-400">
          A source failed. Its checks are unknown, not passed
        </p>
      )}
    </div>
  );
}

export { RiskArc, fmtAge };
