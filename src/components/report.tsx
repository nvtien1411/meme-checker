"use client";

import { useState } from "react";
import type { AnalysisResult, Check, CheckState } from "@/lib/types";
import { fmtAgo, fmtChange, fmtPrice, fmtUsd } from "@/lib/http";
import { CHAIN_BY_ID } from "@/lib/chains";
import { Badge, Copyable, QualityTag, Stat, Tooltip } from "./ui";

/* ------------------------------- verdict ------------------------------ */

const BAND = {
  avoid: {
    label: "AVOID",
    ring: "border-bad-600/60 bg-bad-600/10",
    text: "text-bad-500",
    bar: "bg-bad-600",
  },
  risky: {
    label: "HIGH RISK",
    ring: "border-orange-700/70 bg-orange-950/40",
    text: "text-orange-300",
    bar: "bg-orange-700",
  },
  watch: {
    label: "WATCH",
    ring: "border-brand-600/50 bg-brand-600/10",
    text: "text-brand-400",
    bar: "bg-brand-600",
  },
  clean: {
    label: "NO RED FLAGS",
    ring: "border-ok-600/50 bg-ok-600/10",
    text: "text-ok-500",
    bar: "bg-ok-600",
  },
} as const;

export function VerdictBanner({ data }: { data: AnalysisResult }) {
  const v = data.verdict;
  const band = BAND[v.band];
  const chain = CHAIN_BY_ID[data.token.chain];
  const change = fmtChange(data.market.priceChange24h, data.market.ageHours);

  return (
    <div className="border border-ink-700 bg-ink-900">
      {/* identity row */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-700 px-4 py-3">
        {data.token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.token.imageUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border border-ink-600 object-cover"
          />
        ) : (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-600 bg-ink-800 font-mono t-label text-mute-400">
            {(data.token.symbol ?? "?").slice(0, 3).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1 className="truncate t-display leading-tight tracking-tight text-slate-50">
              {data.token.name ?? "Unknown token"}
            </h1>
            {data.token.symbol && (
              <span className="font-mono t-body text-brand-400">
                {data.token.symbol.toUpperCase()}
              </span>
            )}
            <Badge tone="mute">{chain.label}</Badge>
            {data.token.dexId && (
              <span className="font-mono t-meta text-mute-500">{data.token.dexId}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <Copyable text={data.token.address} display={shorten(data.token.address)} />
            <a
              href={data.token.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono t-meta text-mute-500 underline decoration-ink-600 decoration-dotted underline-offset-2 transition hover:text-brand-400"
            >
              explorer ↗
            </a>
            <span className="font-mono t-meta text-mute-500">
              snapshot {fmtAgo(data.generatedAt)}
            </span>
          </div>
        </div>

        <div className={`shrink-0 rounded border px-3 py-2 ${band.ring}`}>
          <div className="font-mono t-label text-mute-500">
            verdict
          </div>
          <div className={`mt-0.5 t-body font-semibold uppercase leading-none tracking-[0.08em] ${band.text}`}>
            {band.label}
          </div>
          <div className="mt-1 font-mono t-meta tabular-nums text-mute-400">
            {v.score}/100 risk
          </div>
        </div>
      </div>

      {/* tldr + counters */}
      <div className="flex flex-col gap-y-2 border-b border-ink-700 px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
        <p className="w-full min-w-0 t-body leading-relaxed text-slate-300 sm:flex-1">
          {v.tldr}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <CountChip n={v.fails} label="failed" tone="bad" />
          <CountChip n={v.warns} label="watch" tone="warn" />
          <CountChip n={v.unknowns} label="unknown" tone="mute" />
          <CountChip n={v.passes} label="passed" tone="ok" />
        </div>
      </div>

      {/* market strip */}
      <div className="grid grid-cols-2 divide-x divide-ink-700 border-b border-ink-700 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
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
        <Stat
          label={data.market.capKind === "fdv" ? "FDV" : "Market cap"}
          value={fmtUsd(data.market.marketCap ?? data.market.fdv)}
          sub={
            data.market.capKind === "fdv"
              ? "reported as FDV — no circulating supply"
              : data.market.marketCap !== null
                ? `FDV ${fmtUsd(data.market.fdv)}`
                : "not reported"
          }
        />
        <Stat
          label="Liquidity"
          value={fmtUsd(data.market.liquidityUsd)}
          sub={
            data.market.pools.length > 1
              ? `top pool of ${data.market.pools.length}`
              : data.exit.liquidityCoverage !== null
                ? `${data.exit.liquidityCoverage.toFixed(1)}% of cap`
                : undefined
          }
        />
        <Stat
          label="Volume 24h"
          value={fmtUsd(data.market.volume24h)}
          sub={
            data.market.liquidityUsd && data.market.volume24h
              ? `${(data.market.volume24h / data.market.liquidityUsd).toFixed(1)}× liquidity`
              : undefined
          }
        />
        <Stat
          label="Age"
          value={fmtAgeLabel(data.market.ageHours)}
          sub={
            data.holders.totalHolders !== null
              ? `${data.holders.totalHolders.toLocaleString()} holders`
              : "holder count unknown"
          }
        />
        <Stat
          label="Eff. top-10"
          value={
            !data.holders.meaningful
              ? "n/a"
              : data.holders.effectiveTop10Pct === null
                ? "—"
                : `${data.holders.effectiveTop10Pct.toFixed(1)}%`
          }
          sub={!data.holders.meaningful ? "curve holds supply" : "ex-LP, clusters merged"}
        />
      </div>
    </div>
  );
}

function CountChip({ n, label, tone }: { n: number; label: string; tone: "bad" | "warn" | "ok" | "mute" }) {
  const cls =
    n === 0
      ? "border-ink-700 text-mute-500"
      : tone === "bad"
        ? "border-bad-600/50 text-bad-500"
        : tone === "warn"
          ? "border-warn-600/50 text-warn-500"
          : tone === "ok"
            ? "border-ok-600/50 text-ok-500"
            : "border-ink-600 text-mute-400";
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded border px-1.5 py-0.5 font-mono t-meta ${cls}`}
    >
      <span className="tnum font-semibold">{n}</span>
      <span className="t-label opacity-70">{label}</span>
    </span>
  );
}

/* -------------------------------- checks ------------------------------ */

const STATE_META: Record<CheckState, { dot: string; text: string; glyph: string }> = {
  pass: { dot: "bg-ok-600", text: "text-ok-500", glyph: "✓" },
  fail: { dot: "bg-bad-600", text: "text-bad-500", glyph: "✕" },
  warn: { dot: "bg-warn-600", text: "text-warn-500", glyph: "!" },
  unknown: { dot: "bg-ink-500", text: "text-mute-500", glyph: "?" },
};

export function CheckList({ checks }: { checks: Check[] }) {
  const [open, setOpen] = useState<string | null>(null);

  const ordered = [...checks].sort((a, b) => {
    const rank = { fail: 0, warn: 1, unknown: 2, pass: 3 };
    return rank[a.state] - rank[b.state];
  });

  return (
    <ul className="divide-y divide-ink-800">
      {ordered.map((c) => {
        const m = STATE_META[c.state];
        const expanded = open === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : c.id)}
              aria-expanded={expanded}
              className="flex w-full min-w-0 items-start gap-2.5 px-4 py-2.5 text-left transition hover:bg-ink-850/60"
            >
              <span
                aria-hidden
                className={`mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full t-label font-semibold text-ink-950 ${m.dot}`}
              >
                {m.glyph}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 t-body-strong text-slate-100">{c.label}</span>
                  <span
                    className={`shrink-0 text-right font-mono t-small tabular-nums ${m.text}`}
                  >
                    {c.reading}
                  </span>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono t-meta lowercase text-mute-500">{c.source}</span>
                  <QualityTag quality={c.quality} />
                </span>
              </span>
              <span aria-hidden className="mt-0.5 t-meta text-mute-500">
                {expanded ? "−" : "+"}
              </span>
            </button>
            {expanded && (
              <div className="border-t border-ink-800 bg-ink-850/40 px-4 py-2.5 pl-[42px]">
                <p className="t-small leading-relaxed text-mute-300">{c.detail}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------- holders ----------------------------- */

const LABEL_TEXT: Record<string, string> = {
  "liquidity-pool": "LP",
  burn: "burn",
  "bonding-curve": "curve",
  "launchpad-vault": "vault",
  exchange: "CEX",
  contract: "contract",
  locked: "locked",
};

export function HolderTable({ data }: { data: AnalysisResult }) {
  const { holders } = data;
  const chain = CHAIN_BY_ID[data.token.chain];
  const hasLabels = holders.rows.some((h) => h.label !== null);

  if (holders.rows.length === 0) {
    return (
      <div className="px-4 py-4">
        <p className="t-body text-mute-300">No holder list available for this token.</p>
        <p className="mt-1 t-small leading-relaxed text-mute-500">
          Neither provider returned holders. This is a coverage gap — it is not
          evidence that the distribution is healthy.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full min-w-0 max-w-full overflow-x-auto scroll-thin">
        <table className="w-full border-collapse t-small sm:min-w-[520px]">
          <thead>
            <tr className="border-b border-ink-700 text-left t-label text-mute-500">
              <th className="px-3 py-1.5 font-medium">#</th>
              <th className="px-2 py-1.5 font-medium">Wallet</th>
              <th className="hidden px-2 py-1.5 text-right font-medium sm:table-cell">Balance</th>
              <th className="px-2 py-1.5 text-right font-medium">Share</th>
              {hasLabels && (
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Tag</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {holders.rows.map((h) => (
              <tr key={h.address} className="transition hover:bg-ink-850/60">
                <td className="px-3 py-1.5 font-mono t-meta tabular-nums text-mute-500">
                  {h.rank}
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={chain.explorer(h.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono t-small text-mute-300 transition hover:text-brand-400"
                      title={h.address}
                    >
                      {shorten(h.address, 5)}
                    </a>
                    <Copyable text={h.address} title="Copy wallet address" />
                  </div>
                </td>
                <td className="hidden px-2 py-1.5 text-right font-mono t-small tabular-nums text-mute-300 sm:table-cell">
                  {h.balance === null ? "—" : compactNum(h.balance)}
                </td>
                <td className="px-2 py-1.5 text-right font-mono t-small tabular-nums">
                  <span
                    className={
                      h.pct === null
                        ? "text-mute-500"
                        : h.pct >= 10
                          ? "text-bad-500"
                          : h.pct >= 5
                            ? "text-warn-500"
                            : "text-mute-300"
                    }
                  >
                    {h.pct === null ? "—" : `${h.pct.toFixed(2)}%`}
                  </span>
                </td>
                {hasLabels && (
                  <td className="hidden px-3 py-2 sm:table-cell">
                    {h.label ? (
                      <Tooltip label={h.labelBasis ?? "Labelled by the data provider"}>
                        <Badge tone="mute">{LABEL_TEXT[h.label] ?? h.label}</Badge>
                      </Tooltip>
                    ) : (
                      <span className="t-meta text-mute-500">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-ink-800 px-4 py-2.5">
        {!holders.meaningful && holders.note && (
          <p className="mb-1.5 t-small leading-relaxed text-warn-500">{holders.note}</p>
        )}
        <p className="t-meta leading-relaxed text-mute-500">
          <span className="text-mute-400">How share is computed:</span> {holders.method}{" "}
          Labels come from the data provider; wallets without one are
          unclassified, not suspicious.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ narrative ---------------------------- */

export function NarrativePanel({ data }: { data: AnalysisResult }) {
  const n = data.narrative;

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warn">inferred — not a measurement</Badge>
        {n.theme && <Badge tone="brand">{n.theme}</Badge>}
      </div>

      {n.summary ? (
        <p className="mt-2.5 t-body leading-relaxed text-slate-300">{n.summary}</p>
      ) : (
        <p className="mt-2.5 t-body leading-relaxed text-mute-400">
          No theme matched this token&apos;s name or symbol.
        </p>
      )}

      {n.keywords.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {n.keywords.map((k) => (
            <span
              key={k}
              className="rounded border border-ink-700 px-1.5 py-0.5 font-mono t-meta text-mute-400"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 border-t border-ink-800 pt-2 t-meta leading-relaxed text-mute-500">
        {n.disclaimer}
      </p>
    </div>
  );
}

/* ------------------------------- project ----------------------------- */

export function ProjectPanel({ data }: { data: AnalysisResult }) {
  const p = data.project;
  const rows = [
    { label: "Website", value: p.website },
    { label: "X / Twitter", value: p.twitter },
    { label: "Telegram", value: p.telegram },
  ].filter((r) => r.value);

  return (
    <div className="px-4 py-3">
      {rows.length === 0 ? (
        <p className="t-body leading-relaxed text-mute-400">
          No website or social links were published for this token in the data we
          read. We do not guess them.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-baseline gap-2 t-small">
              <span className="w-[86px] shrink-0 text-mute-500">{r.label}</span>
              <a
                href={r.value!}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate font-mono t-small text-brand-400 underline decoration-brand-600/40 decoration-dotted underline-offset-2 hover:text-brand-400/80"
              >
                {r.value!.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </li>
          ))}
        </ul>
      )}
      {p.description && (
        <p className="mt-2.5 t-small leading-relaxed text-mute-300">{p.description}</p>
      )}
      <p className="mt-2.5 border-t border-ink-800 pt-2 t-meta text-mute-500">
        {p.source ? `Source: ${p.source}.` : "No source returned links."} Links are
        user-supplied by the project and are not verified by us.
      </p>
    </div>
  );
}

/* -------------------------------- exit ------------------------------- */

export function ExitPanel({ data }: { data: AnalysisResult }) {
  const e = data.exit;
  return (
    <div className="px-4 py-3">
      {!e.available ? (
        <p className="t-body leading-relaxed text-mute-400">{e.note}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 divide-x divide-ink-700 border border-ink-700">
            {[
              { k: "1% slip", v: e.maxSellUsd.slip1 },
              { k: "5% slip", v: e.maxSellUsd.slip5 },
              { k: "10% slip", v: e.maxSellUsd.slip10 },
            ].map((x) => (
              <div key={x.k} className="px-3 py-2.5">
                <div className="t-label text-mute-500">
                  {x.k}
                </div>
                <div className="mt-0.5 font-mono t-body tabular-nums text-slate-100">
                  {fmtUsd(x.v)}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 t-small leading-relaxed text-mute-400">
            Amount you can sell before price impact reaches that level. Your
            position should be a fraction of these, not near them.
          </p>
          {e.liquidityCoverage !== null && (
            <p className="mt-1.5 t-small text-mute-500">
              Pool holds{" "}
              <span
                className={
                  e.liquidityCoverage < 2 ? "text-bad-500" : e.liquidityCoverage < 8 ? "text-warn-500" : "text-mute-300"
                }
              >
                {e.liquidityCoverage.toFixed(1)}%
              </span>{" "}
              of the reported market cap.
            </p>
          )}
          <p className="mt-2 border-t border-ink-800 pt-2 t-meta leading-relaxed text-mute-500">
            {e.note}
          </p>
        </>
      )}
    </div>
  );
}

/* -------------------------------- flow ------------------------------- */

export function FlowPanel({ data }: { data: AnalysisResult }) {
  const f = data.flow;
  return (
    <div className="px-4 py-3">
      {!f.dataAvailable && f.note && (
        <p className="mb-2.5 rounded border border-ink-700 bg-ink-850 px-2.5 py-2 t-small leading-relaxed text-mute-400">
          {f.note}
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <MiniStat label="Buys" value={f.buys === null ? "—" : f.buys.toLocaleString()} />
        <MiniStat label="Sells" value={f.sells === null ? "—" : f.sells.toLocaleString()} />
        <MiniStat
          label="Net by volume"
          value={f.imbalance === null ? "—" : `${(f.imbalance * 100).toFixed(0)}%`}
          tone={f.imbalance === null ? "default" : f.imbalance >= 0 ? "up" : "down"}
        />
        <MiniStat
          label="Trades sampled"
          value={f.windowTrades > 0 ? f.windowTrades.toLocaleString() : "—"}
        />
      </div>
      {f.dataAvailable && f.buyVolumeUsd !== null && (
        <p className="mt-2 font-mono t-meta text-mute-500">
          {fmtUsd(f.buyVolumeUsd)} in / {fmtUsd(f.sellVolumeUsd)} out over{" "}
          {f.windowTrades} trades
        </p>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "up" | "down";
}) {
  return (
    <div>
      <div className="t-label text-mute-500">{label}</div>
      <div
        className={`mt-0.5 font-mono t-body tabular-nums ${
          tone === "up" ? "text-ok-500" : tone === "down" ? "text-bad-500" : "text-slate-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ------------------------------ deployer ----------------------------- */

export function DeployerPanel({ data }: { data: AnalysisResult }) {
  const d = data.deployer;
  const chain = CHAIN_BY_ID[data.token.chain];

  return (
    <div className="px-4 py-3">
      {!d.dataAvailable ? (
        <p className="t-body leading-relaxed text-mute-400">
          The creator wallet could not be identified for this token, so its
          history is unknown — not clean.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="t-label text-mute-500">
              Creator
            </span>
            {d.address ? (
              <a
                href={chain.explorer(d.address)}
                target="_blank"
                rel="noreferrer"
                className="font-mono t-small text-mute-300 hover:text-brand-400"
              >
                {shorten(d.address, 5)}
              </a>
            ) : (
              <span className="font-mono t-small text-mute-500">unknown</span>
            )}
            <span className="t-label text-mute-500">
              holds
            </span>
            <span className="font-mono t-small tabular-nums text-mute-300">
              {d.balancePct === null ? "unknown" : `${d.balancePct.toFixed(2)}%`}
            </span>
          </div>

          <div className="mt-2.5 border-t border-ink-800 pt-2">
            <div className="flex items-center justify-between">
              <span className="t-label text-mute-500">
                Prior launches
              </span>
              <span className="font-mono t-meta tabular-nums text-mute-400">
                {d.priorTokens.length}
                {d.ruggedCount > 0 && (
                  <span className="ml-1.5 text-bad-500">{d.ruggedCount} rugged</span>
                )}
              </span>
            </div>

            {d.priorTokens.length === 0 ? (
              <p className="mt-1.5 t-small leading-relaxed text-mute-500">
                Fresh wallet. No rug history — and no track record either.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {d.priorTokens.slice(0, 6).map((t) => (
                  <li key={t.address} className="flex items-center gap-2 t-small">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        t.rugged ? "bg-bad-600" : "bg-ok-600"
                      }`}
                    />
                    <a
                      href={chain.explorer(t.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-mute-300 hover:text-brand-400"
                    >
                      {t.symbol ?? shorten(t.address, 4)}
                    </a>
                    <span className={`ml-auto t-meta ${t.rugged ? "text-bad-500" : "text-mute-500"}`}>
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

/* ----------------------------- provenance ---------------------------- */

export function ProvenancePanel({ data }: { data: AnalysisResult }) {
  const failed = data.provenance.filter((p) => !p.ok).length;
  return (
    <div className="px-4 py-3">
      <details open={failed > 0}>
        <summary className="cursor-pointer list-none t-meta text-mute-400 transition hover:text-slate-200">
          {failed > 0 ? (
            <span className="text-bad-500">
              {failed} source{failed > 1 ? "s" : ""} did not answer
            </span>
          ) : (
            <span>All {data.provenance.length} sources answered</span>
          )}
          <span className="ml-1 text-mute-500">· details</span>
        </summary>
      <ul className="mt-2 space-y-1.5">
        {data.provenance.map((p, i) => (
          <li key={`${p.source}-${i}`} className="flex min-w-0 items-center gap-2 t-meta leading-relaxed">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.ok ? "bg-ok-600" : "bg-bad-600"}`}
            />
            <span className="truncate font-mono text-mute-300">{p.source}</span>
            <span
              className="ml-auto max-w-[52%] shrink-0 truncate text-right font-mono t-meta text-mute-500"
              title={p.ok ? undefined : (p.error ?? "failed")}
            >
              {p.ok ? (p.note === "cached" ? "cached" : `${p.ms}ms`) : (p.error ?? "failed")}
            </span>
          </li>
        ))}
      </ul>
      </details>
      <p className="mt-2.5 border-t border-ink-800 pt-2 t-meta leading-relaxed text-mute-500">
        {data.disclaimer}
      </p>
    </div>
  );
}

/* ------------------------------- helpers ----------------------------- */

function shorten(a: string, n = 4) {
  return a.length > n * 2 + 2 ? `${a.slice(0, n + 2)}…${a.slice(-n)}` : a;
}

function compactNum(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(2);
}

function fmtAgeLabel(h: number | null) {
  if (h === null) return "—";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 48) return `${Math.round(h)}h`;
  if (h < 720) return `${Math.round(h / 24)}d`;
  return `${(h / 24 / 30).toFixed(1)}mo`;
}
