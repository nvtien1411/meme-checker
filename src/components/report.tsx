"use client";

import { useState } from "react";
import type { AnalysisResult, CheckState } from "@/lib/types";
import { CHAIN_BY_ID } from "@/lib/chains";
import { fmtAge, fmtChange, fmtPct, fmtPrice, fmtUsd } from "@/lib/http";
import { Demo, Gauge, Locked, Panel, RiskDot, Split, Stat, Tag } from "./ui";
import {
  DistributionBar,
  ExitCurve,
  FlowBar,
  FollowerEntryChart,
  HolderDetail,
  HolderMap,
  HolderRows,
  TabBar,
  Timeline,
} from "./viz";
import {
  DEMO_TIMELINE,
  callersForMint,
  tokenByMint,
  type DemoToken,
} from "@/lib/demo";

/* ==================================================================== *
 * REPORT
 *
 * Nine layers, one tab strip. The order is the order a decision is made in:
 * verdict → who holds it → who bought the launch → who told you → the story →
 * what you can get out → everything else.
 *
 * Live data from /api/analyze always wins. The demo layer fills only what the
 * pipeline cannot answer yet, and every field taken from it is marked DEMO at
 * the point it appears — never as a footnote at the bottom.
 * ==================================================================== */

const BAND = {
  avoid: { word: "Critical", cls: "text-bad", wash: "rgba(255,77,94,0.22)", dot: "bg-bad" },
  risky: { word: "High risk", cls: "text-hot", wash: "rgba(255,138,61,0.20)", dot: "bg-hot" },
  watch: { word: "Moderate", cls: "text-warn", wash: "rgba(247,193,74,0.18)", dot: "bg-warn" },
  clean: { word: "Low risk", cls: "text-good", wash: "rgba(52,224,161,0.16)", dot: "bg-good" },
} as const;

const GLYPH: Record<CheckState, string> = { pass: "✓", fail: "✕", warn: "!", unknown: "?" };
const TONE: Record<CheckState, string> = {
  pass: "text-good border-good/35",
  fail: "text-bad border-bad/35",
  warn: "text-warn border-warn/35",
  unknown: "text-fg4 border-line2",
};

const TABS = [
  { id: "verdict", label: "Verdict" },
  { id: "holders", label: "Holders" },
  { id: "wallets", label: "Wallets", hint: "bundle, snipers, insiders, fresh" },
  { id: "callers", label: "Callers" },
  { id: "narrative", label: "Narrative" },
  { id: "exit", label: "Exit" },
  { id: "checks", label: "All checks" },
  { id: "sources", label: "Sources" },
];

/* ------------------------------------------------------------------ *
 * Identity strip
 * ------------------------------------------------------------------ */

export function IdentityBar({ data, demo }: { data: AnalysisResult; demo: DemoToken | null }) {
  const m = data.market;
  const ch = fmtChange(m.priceChange24h, m.ageHours);
  const risk = data.verdict.band === "avoid" ? "critical" : data.verdict.band === "risky" ? "high" : data.verdict.band === "watch" ? "moderate" : "low";

  const cells = [
    {
      label: "price",
      value: fmtPrice(m.priceUsd),
      sub: ch.text === "—" ? undefined : `${ch.text} ${ch.label}`,
      tone: m.priceChange24h === null ? undefined : m.priceChange24h > 0 ? "good" : "bad",
    },
    { label: m.capKind === "fdv" ? "fdv" : "mcap", value: fmtUsd(m.marketCap ?? m.fdv) },
    { label: "liquidity", value: fmtUsd(m.liquidityUsd) },
    {
      label: "vol 24h",
      value: fmtUsd(m.volume24h),
      sub:
        m.volume24h !== null && m.liquidityUsd
          ? `${(m.volume24h / m.liquidityUsd).toFixed(1)}× liq`
          : undefined,
    },
    { label: "age", value: fmtAge(m.ageHours) },
    {
      label: "top 10",
      value: data.holders.meaningful ? fmtPct(data.holders.effectiveTop10Pct) : "—",
      tone: data.holders.meaningful && (data.holders.effectiveTop10Pct ?? 0) >= 30 ? "bad" : undefined,
    },
    {
      label: "holders",
      value: data.holders.totalHolders !== null ? data.holders.totalHolders.toLocaleString("en-US") : "—",
    },
  ] as { label: string; value: string; sub?: string; tone?: "good" | "bad" }[];

  return (
    <div className="panel">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-3 py-2">
        {data.token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.token.imageUrl}
            alt=""
            className="h-7 w-7 shrink-0 border border-line object-cover"
          />
        ) : (
          <div className="grid h-7 w-7 shrink-0 place-items-center border border-line bg-surf2 font-mono text-[9px] text-fg4">
            {(data.token.symbol ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <h1 className="truncate t-display text-fg">{data.token.name ?? "Unknown token"}</h1>
          {data.token.symbol && (
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg3">
              {data.token.symbol}
            </span>
          )}
          <Tag tone="neutral">{CHAIN_BY_ID[data.token.chain].label}</Tag>
          <span className="flex items-center gap-1.5">
            <RiskDot risk={risk} />
            <span className={`t-mono text-[10.5px] ${BAND[data.verdict.band].cls}`}>
              {BAND[data.verdict.band].word}
            </span>
          </span>
          {demo && <Demo />}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <CopyAddr addr={data.token.address} />
          <a
            href={data.token.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="t-xs text-fg4 transition-colors hover:text-fg2"
          >
            explorer ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-line sm:grid-cols-4 lg:grid-cols-7">
        {cells.map((c, i) => (
          <div
            key={c.label}
            className={`px-2.5 py-1.5 ${i > 0 ? "border-line sm:border-l" : ""} ${i >= 4 ? "border-t border-line sm:border-t-0" : ""}`}
          >
            <Stat
              label={c.label}
              value={c.value}
              sub={c.sub}
              size="sm"
              tone={
                c.tone === "bad" ? "bad" : c.tone === "good" ? "good" : "default"
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyAddr({ addr }: { addr: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(addr);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked — the address is still selectable */
        }
      }}
      title={addr}
      className="font-mono text-[10.5px] text-fg4 transition-colors hover:text-acid"
    >
      {done ? "copied ✓" : `${addr.slice(0, 4)}…${addr.slice(-4)}`}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Report shell
 * ------------------------------------------------------------------ */

export function ReportConsole({ data }: { data: AnalysisResult }) {
  const [tab, setTab] = useState("verdict");
  const demo = tokenByMint(data.token.address);

  return (
    <div className="space-y-2.5">
      <IdentityBar data={data} demo={demo} />

      <div className="panel">
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="fade-up">
          <div className="space-y-2.5 p-2.5">
            {tab === "verdict" && <VerdictTab data={data} demo={demo} />}
            {tab === "holders" && <HoldersTab data={data} />}
            {tab === "wallets" && <WalletsTab demo={demo} />}
            {tab === "callers" && <CallersTab data={data} demo={demo} />}
            {tab === "narrative" && <NarrativeTab data={data} demo={demo} />}
            {tab === "exit" && <ExitTab data={data} />}
            {tab === "checks" && <ChecksTab data={data} />}
            {tab === "sources" && <SourcesTab data={data} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== *
 * VERDICT
 * ==================================================================== */

function VerdictTab({ data, demo }: { data: AnalysisResult; demo: DemoToken | null }) {
  const v = data.verdict;
  const band = BAND[v.band];
  const ordered = [...data.checks].sort((a, b) => {
    const rank: Record<CheckState, number> = { fail: 0, warn: 1, unknown: 2, pass: 3 };
    return rank[a.state] - rank[b.state];
  });
  const finds = ordered.filter((c) => c.state !== "pass").slice(0, 4);
  const largest = data.holders.rows.reduce((m, r) => Math.max(m, r.pct ?? 0), 0);

  return (
    <>
      {/* the score, then the reasons, side by side */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <section
          className="score-wash border border-line bg-surf p-3"
          style={{ "--wash": band.wash } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="t-eyebrow">risk score</span>
            <span aria-hidden className={`h-[5px] w-[5px] ${band.dot}`} />
          </div>
          <div className="mt-2 flex items-end gap-1.5">
            <span className={`t-num-xl ${band.cls}`}>{v.score}</span>
            <span className="pb-1 t-mono text-[11px] text-fg4">/100</span>
          </div>
          <div className={`mt-1 text-[17px] font-semibold tracking-[-0.02em] ${band.cls}`} style={{ fontFamily: "var(--font-display)" }}>
            {band.word}
          </div>

          <div className="mt-2.5 grid grid-cols-4 border-y border-line">
            {(
              [
                [v.fails, "fail", "text-bad"],
                [v.warns, "watch", "text-warn"],
                [v.unknowns, "unk", "text-fg3"],
                [v.passes, "pass", "text-good"],
              ] as const
            ).map(([n, label, cls]) => (
              <div
                key={label}
                className="py-1.5 text-center [&:not(:first-child)]:border-l [&:not(:first-child)]:border-line"
              >
                <div className={`t-mono text-[14px] tabular-nums ${n > 0 ? cls : "text-fg4"}`}>{n}</div>
                <div className="t-eyebrow">{label}</div>
              </div>
            ))}
          </div>

          <p className="mt-2 t-xs leading-relaxed text-fg3">{v.tldr}</p>
          <p className="mt-1.5 t-xs leading-relaxed text-fg4">
            The band comes from how many checks failed, not from the number. One disqualifying
            finding sets a floor the rest cannot average away
          </p>
        </section>

        <div className="space-y-2.5">
          <Panel
            title="What fired"
            note={finds.length === 0 ? "nothing worse than a pass" : "worst first, with the number behind it"}
            flush
          >
            {finds.length === 0 && (
              <p className="px-3 py-3 t-xs leading-relaxed text-fg3">
                Every check the pipeline could run came back inside its band. That is not a verdict
                that a token is safe — only that nothing it could measure was out of range
              </p>
            )}
            {finds.map((c) => (
              <div key={c.id} className="flex items-start gap-2 border-b border-line px-3 py-2 last:border-b-0">
                <span
                  aria-hidden
                  className={`mt-[1px] grid h-[15px] w-[15px] shrink-0 place-items-center border font-mono text-[8.5px] leading-none ${TONE[c.state]}`}
                >
                  {GLYPH[c.state]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="t-xs font-semibold text-fg">{c.label}</span>
                    <span className="t-mono text-[10.5px] text-fg2">{c.reading}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.06em] text-fg4">
                      {c.source}
                    </span>
                    <span className="t-xs text-fg4">· {c.quality}</span>
                  </div>
                </div>
              </div>
            ))}
          </Panel>

          {demo && (
            <Panel title="The layer this tool exists for" note="what the contract checks cannot see" flush>
              <div className="grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
                {[
                  { label: "bundle", value: demo.bundleCount, sub: `${demo.bundlePct.toFixed(1)}% supply`, tone: demo.bundlePct > 10 ? "bad" : "default" },
                  { label: "snipers", value: demo.sniperCount, sub: `${demo.sniperPct.toFixed(1)}% supply`, tone: demo.sniperPct > 8 ? "hot" : "default" },
                  { label: "insiders", value: `${demo.insiderPct.toFixed(1)}%`, sub: "supply handed out", tone: demo.insiderPct > 5 ? "hot" : "default" },
                  { label: "exit window", value: `${demo.exitWindowSec}s`, sub: "sell to −50%", tone: demo.exitWindowSec < 30 ? "bad" : "default" },
                ].map((c) => (
                  <div key={c.label} className="px-2.5 py-2">
                    <Stat
                      label={c.label}
                      value={c.value}
                      sub={c.sub}
                      size="sm"
                      tone={c.tone === "bad" ? "bad" : c.tone === "hot" ? "hot" : "default"}
                    />
                  </div>
                ))}
              </div>
              <div className="border-t border-line px-2.5 py-1.5">
                <Demo />
                <span className="ml-1.5 t-xs text-fg4">
                  These four modules are not wired to the pipeline yet
                </span>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <Panel title="Supply concentration" note="pools, burns and curves removed">
          <DistributionBar
            largest={data.holders.meaningful ? largest : null}
            top10={data.holders.meaningful ? data.holders.effectiveTop10Pct : null}
            linked={data.clusters.linkedSupplyPct}
          />
        </Panel>

        <Panel title="Deployer" note="what the creator did with its own supply">
          <DeployerBlock data={data} />
        </Panel>
      </div>
    </>
  );
}

function DeployerBlock({ data }: { data: AnalysisResult }) {
  const d = data.deployer;
  if (!d.address) {
    return <p className="t-xs leading-relaxed text-fg4">The deployer could not be identified</p>;
  }
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <a
          href={`${data.token.explorerUrl.split("/tx/")[0]}/address/${d.address}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[11px] text-fg2 underline decoration-line2 underline-offset-2 hover:text-acid"
        >
          {d.address.slice(0, 6)}…{d.address.slice(-4)}
        </a>
        {d.ruggedCount > 0 && (
          <Tag tone="bad">
            {d.ruggedCount} prior rug{d.ruggedCount === 1 ? "" : "s"}
          </Tag>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3">
        <Split label="holds">{d.balancePct === null ? "—" : `${d.balancePct.toFixed(2)}%`}</Split>
        <Split label="prior launches">{d.priorTokens.length}</Split>
      </div>

      {d.priorTokens.length === 0 && d.dataAvailable && (
        <p className="mt-1.5 t-xs leading-relaxed text-fg4">
          A fresh wallet: no rug history, and no track record either
        </p>
      )}

      {d.ruggedCount > 0 && (
        <p className="mt-1.5 t-xs leading-relaxed text-warn">
          This deployer has launched tokens that later collapsed. That is a fact about the wallet,
          not a prediction about this one
        </p>
      )}
    </div>
  );
}

/* ==================================================================== *
 * HOLDERS
 * ==================================================================== */

function HoldersTab({ data }: { data: AnalysisResult }) {
  const h = data.holders;
  const chain = CHAIN_BY_ID[data.token.chain];
  const [picked, setPicked] = useState<string | null>(null);
  const sel = picked ? (h.rows.find((r) => r.address === picked) ?? null) : null;

  if (h.rows.length === 0) {
    return (
      <Panel title="Holder distribution" note={h.note ?? "no holder list returned"}>
        <p className="t-xs leading-relaxed text-fg4">
          The holder list could not be read. An empty list is not evidence that supply is spread
          out — it is evidence that this was not measured
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <div className="space-y-2.5">
        <Panel title="Concentration" note="area proportional to share">
          <div className="border border-line bg-surf2">
            <HolderMap rows={h.rows} selected={picked} onSelect={setPicked} />
            {sel && (
              <HolderDetail holder={sel} explorer={chain.explorer} onClose={() => setPicked(null)} />
            )}
          </div>
          <div className="mt-2">
            <DistributionBar
              largest={h.rows.reduce((m, r) => Math.max(m, r.pct ?? 0), 0)}
              top10={h.effectiveTop10Pct}
              linked={data.clusters.linkedSupplyPct}
            />
          </div>
        </Panel>

        <Panel title="What this does not say" note="read before acting on concentration">
          <p className="t-xs leading-relaxed text-fg3">
            A high top-10 share on a young token is often the bonding curve and the pool, which are
            removed above — but not always. A low share does not mean the supply is not one entity:
            that requires funding traces, which live under Wallets
          </p>
          <p className="mt-1.5 t-xs leading-relaxed text-fg4">{h.method}</p>
        </Panel>
      </div>

      <Panel
        title="Top holders"
        flush
        right={h.totalHolders !== null ? `${h.totalHolders.toLocaleString("en-US")} total` : undefined}
      >
        <div className="grid grid-cols-[18px_minmax(0,1fr)_60px_58px] items-baseline gap-x-2.5 border-b border-line px-3 py-1">
          <span className="t-eyebrow">#</span>
          <span className="t-eyebrow">wallet</span>
          <span className="t-eyebrow text-right">share</span>
          <span className="t-eyebrow text-right">balance</span>
        </div>
        <HolderRows rows={h.rows} explorer={chain.explorer} selected={picked} onSelect={setPicked} />
        <p className="border-t border-line px-3 py-1.5 t-xs text-fg4">
          An unlabelled wallet is unclassified — not suspicious
        </p>
      </Panel>
    </div>
  );
}

/* ==================================================================== *
 * WALLETS — bundle, snipers, insiders, fresh
 * ==================================================================== */

function WalletsTab({ demo }: { demo: DemoToken | null }) {
  if (!demo) {
    return (
      <Panel title="Wallet forensics" note="who bought the launch, and what they did since">
        <p className="t-xs leading-relaxed text-fg4">
          The launch block was not read for this token, so bundle, sniper, insider and fresh-wallet
          detection did not run. A module that was never run is not a module that came back clean
        </p>
        <ul className="mt-2 space-y-1">
          {[
            "Bundle detection — who bought inside the launch block, and what that group has done since",
            "Snipers — wallets that took the open, and whether they still hold",
            "Insider supply — supply transferred rather than bought",
            "Fresh wallets — buyers created in the week before launch",
            "Exit window — seconds from first sell to a 50% drawdown",
          ].map((t) => (
            <li key={t} className="flex items-start gap-1.5">
              <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-fg4" />
              <span className="t-xs leading-snug text-fg3">{t}</span>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }

  const bundle = demo.wallets.filter((w) => w.tags?.includes("bundler"));
  const snipers = demo.wallets.filter((w) => w.tags?.includes("sniper bot"));
  const insiders = demo.wallets.filter((w) => w.tags?.includes("insider"));
  const fresh = demo.wallets.filter(
    (w) => w.tags?.includes("single-use") || (w.born ?? "").startsWith("2026-11-19") || (w.born ?? "").startsWith("2026-11-23"),
  );

  // Every figure below is summed from the lists rendered next to it, so the
  // headline and the detail cannot disagree.
  const sumPct = (ws: typeof demo.wallets) => ws.reduce((n, w) => n + (w.pct ?? 0), 0);
  const bundlePct = sumPct(bundle);
  const sniperPct = sumPct(snipers);
  const insiderPct = sumPct(insiders);
  const freshPct = sumPct(fresh);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Demo />
        <span className="t-xs text-fg4">
          the four wallet modules below are illustrative — the pipeline does not populate them yet
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "bundle", n: `${bundle.length}`, pct: bundlePct, tone: "bad" as const },
          { label: "snipers", n: `${snipers.length}`, pct: sniperPct, tone: "hot" as const },
          { label: "insiders", n: `${insiders.length}`, pct: insiderPct, tone: "hot" as const },
          { label: "fresh", n: `${fresh.length}`, pct: freshPct, tone: "warn" as const },
        ].map((k) => (
          <div key={k.label} className="panel p-2.5">
            <Stat
              label={k.label}
              value={k.n}
              size="md"
              tone={k.tone === "bad" ? "bad" : k.tone === "hot" ? "hot" : "warn"}
            />
            <div className="mt-1.5">
              <Gauge pct={k.pct} tone={k.tone} height={3} />
            </div>
            <div className="mt-1 t-xs text-fg4">{k.pct.toFixed(1)}% of supply</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        <Panel title="Launch bundle" note={`${bundle.length} wallets, ${bundlePct.toFixed(1)}% supply`} flush>
          <WalletList wallets={bundle} />
          <div className="border-t border-line px-3 py-2">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="sell sync" value={`${(demo.sellSynchrony * 100).toFixed(0)}%`} size="sm" tone="bad" sub="sold in one slot" />
              <Stat label="exit window" value={`${demo.exitWindowSec}s`} size="sm" tone="bad" sub="first sell to −50%" />
              <Stat label="funder" value="shared" size="sm" tone="hot" sub="one wallet funded all" />
            </div>
          </div>
        </Panel>

        <div className="space-y-2.5">
          <Panel title="Snipers" note={`${snipers.length} wallets, ${sniperPct.toFixed(1)}% supply`} flush>
            <WalletList wallets={snipers} />
          </Panel>
          <Panel title="Insider supply" note={`${insiders.length} wallets, ${insiderPct.toFixed(1)}% supply — received, not bought`} flush>
            <WalletList wallets={insiders} />
          </Panel>
        </div>
      </div>

      <Panel title="Fresh wallets" note="created in the week before launch" flush>
        <WalletList wallets={fresh} />
      </Panel>

      <Locked
        title="Traced funding origins"
        points={[
          "Which CEX hot wallet funded each bundle member, and when",
          "Wallets the same funder has backed on other launches",
          "Full multi-hop trail from the funding source to the buy",
          "Which of these wallets appear together on prior tokens",
          "How much of each prior launch they exited, and at what point",
          "Whether the deployer wallet has ever received from the same source",
        ]}
      />
    </>
  );
}

function WalletList({ wallets }: { wallets: DemoToken["wallets"] }) {
  if (wallets.length === 0) {
    return <p className="px-3 py-2.5 t-xs text-fg4">None identified in this token</p>;
  }
  return (
    <div>
      {wallets.map((w) => {
        const sold = w.sold ?? 0;
        const tone =
          w.status === "sold" ? "text-fg3" : w.status === "transferred" ? "text-hot" : "text-warn";
        return (
          <div key={w.addr} className="border-b border-line px-3 py-1.5 last:border-b-0">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-mono text-[10.5px] text-fg2">
                {w.addr.slice(0, 6)}…{w.addr.slice(-4)}
              </span>
              <span className={`font-mono text-[8.5px] uppercase tracking-[0.05em] ${tone}`}>
                {w.status ?? "holding"}
              </span>
              {(w.priorRugs ?? 0) > 0 && (
                <Tag tone="bad">
                  {w.priorRugs} prior rug{w.priorRugs === 1 ? "" : "s"}
                </Tag>
              )}
              {w.tags
                ?.filter((t) => t !== "bundler" && t !== "sniper bot" && t !== "insider")
                .slice(0, 1)
                .map((t) => (
                  <span key={t} className="font-mono text-[8.5px] uppercase tracking-[0.05em] text-fg4">
                    {t}
                  </span>
                ))}
              <span className="ml-auto t-mono text-[10.5px] text-fg3">
                {w.pct !== undefined ? `${w.pct.toFixed(2)}%` : "—"}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              {w.bought !== undefined && w.bought > 0 && (
                <span className="t-xs text-fg4">bought {w.bought.toFixed(2)}%</span>
              )}
              {sold > 0 && <span className="t-xs text-hot">sold {sold}%</span>}
              {w.avgEntry !== undefined && (
                <span className="t-xs text-fg4">entry {fmtPrice(w.avgEntry)}</span>
              )}
              {(w.priorLaunches ?? 0) > 0 && (
                <span className="t-xs text-fg4">{w.priorLaunches} prior launches</span>
              )}
              {w.funder && (
                <span className="t-xs text-fg4">
                  funded by{" "}
                  <span className="font-mono text-fg3">
                    {w.funder.slice(0, 4)}…{w.funder.slice(-4)}
                  </span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ==================================================================== *
 * CALLERS
 * ==================================================================== */

function CallersTab({ data, demo }: { data: AnalysisResult; demo: DemoToken | null }) {
  const calls = callersForMint(data.token.address);
  const [open, setOpen] = useState<string | null>(calls[0]?.handle ?? null);

  const beforeBars = [
    { label: "T−30", pct: 6 },
    { label: "T−20", pct: 9 },
    { label: "T−10", pct: 14 },
    { label: "T−5", pct: 18 },
    { label: "T+0", pct: 11 },
    { label: "T+5", pct: 26 },
    { label: "T+10", pct: 34 },
    { label: "T+20", pct: 22 },
    { label: "T+30", pct: 9 },
    { label: "T+60", pct: 4 },
  ];

  if (calls.length === 0) {
    return (
      <Panel title="Who called it" note="accounts that posted this contract">
        <p className="t-xs leading-relaxed text-fg4">
          No caller was found for this contract in the tracked set. That is not evidence nobody
          called it — it is evidence that this was not matched
        </p>
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title="Called this contract"
        note="every account that posted it, and what each did with their own position"
        flush
      >
        {calls.map((c) => {
          const isOpen = open === c.handle;
          return (
            <div key={c.handle} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.handle)}
                aria-expanded={isOpen}
                className="drow flex w-full items-center gap-2 px-3 py-2 text-left"
                data-active={isOpen}
              >
                <div className="grid h-6 w-6 shrink-0 place-items-center border border-line bg-surf2 font-mono text-[10px] text-fg2">
                  {c.handle.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="t-xs font-semibold text-fg">@{c.handle}</span>
                    {c.outcome === "lost" && <Tag tone="bad">call went to zero</Tag>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="t-mono text-[10px] text-fg4">
                      {new Date(c.at).toISOString().slice(0, 16).replace("T", " ")} UTC
                    </span>
                    <span className="t-xs text-fg4">mcap at call {fmtUsd(c.mcAtCall)}</span>
                  </div>
                </div>
                <span className="shrink-0 t-mono text-[10px] text-fg4">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="fade-up border-t border-line bg-surf2/50 px-3 py-2.5">
                  <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-4">
                    <Stat label="peak after" value={fmtUsd(c.peakMc)} size="sm" tone={c.peakMc > c.mcAtCall * 2 ? "good" : "default"} />
                    <Stat
                      label="multiple"
                      value={c.peakMc > 0 ? `${(c.peakMc / c.mcAtCall).toFixed(1)}×` : "—"}
                      size="sm"
                    />
                    <Stat label="hours to peak" value={c.hoursToPeak !== null ? `${c.hoursToPeak}h` : "never"} size="sm" />
                    <Stat label="outcome" value={c.outcome} size="sm" tone={c.outcome === "won" ? "good" : c.outcome === "lost" ? "bad" : "default"} />
                  </div>
                  <a
                    href={c.postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block t-xs text-acid hover:underline"
                  >
                    original post ↗
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </Panel>

      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        <Panel title="Follower entry timing" note="when wallets that bought after the post actually bought">
          <FollowerEntryChart buckets={beforeBars} postIndex={4} />
          <p className="mt-2 t-xs leading-relaxed text-fg4">
            Bars left of the divider are wallets that bought before the public post. On this token
            that is 47% of the addresses that later sold into the inflow
          </p>
        </Panel>

        <Panel title="The sequence" note="minute by minute, relative to the post">
          <Timeline events={DEMO_TIMELINE} />
        </Panel>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Demo />
        <span className="t-xs text-fg4">
          caller matching and follower tracking are not wired to the pipeline yet
        </span>
      </div>

      <Locked
        title="Caller intelligence"
        points={[
          "Full call history with win rate, median multiple and dead-call share",
          "Wallet behind each account, and whether it bought before or after posting",
          "Share of their own position sold after followers arrived",
          "Exit price against the price at the moment they posted",
          "Smart followers — wallets that repeatedly buy after this account posts",
          "Repeat-follower overlap with other callers",
          "Coordination signals: shared funding, synchronised entry, cross-caller networks",
          "Scripted timeline of who bought, when, and who sold into whom",
        ]}
      />

      {demo && (
        <Panel title="Cabal assessment" note="detected coordination signals, not an accusation">
          <div className="flex items-baseline gap-2">
            <span className="t-mono text-[22px] text-bad">{demo.bundlePct > 15 ? "Elevated" : "Low"}</span>
            <span className="t-xs text-fg4">
              {demo.bundlePct > 15
                ? "3 independent signals, on 2 of 4 tracked callers"
                : "no more than one signal fired"}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {[
              ["Pre-call accumulation", demo.bundlePct > 15, "related wallets bought before the first public post"],
              ["Shared funding", demo.bundlePct > 10, "bundle members funded from one wallet"],
              ["Synchronised entry", demo.sellSynchrony > 0.6, "multiple wallets bought or sold inside one slot"],
              ["Repeat participation", false, "same wallets appear across this caller's prior calls"],
            ].map(([label, fired, why]) => (
              <div key={label as string} className="flex items-start gap-2 border-b border-line py-1 last:border-b-0">
                <span
                  aria-hidden
                  className={`mt-[4px] h-[5px] w-[5px] shrink-0 ${fired ? "bg-bad" : "bg-line2"}`}
                />
                <div className="min-w-0">
                  <span className={`t-xs ${fired ? "text-fg" : "text-fg3"}`}>{label as string}</span>
                  <span className="ml-1.5 t-xs text-fg4">{why as string}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 t-xs leading-relaxed text-fg4">
            Shared buying alone is not proof of coordination — a launch crowd and a coordinated
            group look identical on a chart. The assessment reports signals that fired, and how
            many, never an accusation
          </p>
        </Panel>
      )}
    </>
  );
}

/* ==================================================================== *
 * NARRATIVE
 * ==================================================================== */

function NarrativeTab({ data, demo }: { data: AnalysisResult; demo: DemoToken | null }) {
  const n = data.narrative;
  const p = data.project;

  return (
    <>
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <Panel title="What it claims" note="written by the project, not measured">
          {n.summary ? (
            <p className="t-xs leading-relaxed text-fg2">{n.summary}</p>
          ) : (
            <p className="t-xs text-fg4">No description was found</p>
          )}
          {n.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {n.keywords.slice(0, 8).map((k) => (
                <Tag key={k} tone="neutral">
                  {k}
                </Tag>
              ))}
            </div>
          )}
          {p.description && <p className="mt-2 t-xs leading-relaxed text-fg3">{p.description}</p>}

          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2">
            {[
              ["website", p.website],
              ["x", p.twitter],
              ["telegram", p.telegram],
            ].map(([label, url]) =>
              url ? (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-line px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.05em] text-fg3 transition-colors hover:border-line2 hover:text-acid"
                >
                  {label} ↗
                </a>
              ) : null,
            )}
          </div>
        </Panel>

        {demo && (
          <Panel title="Narrative position" note="where this idea sits in its own cycle">
            <div className="grid grid-cols-2 gap-x-3">
              <Split label="narrative">{demo.narrative}</Split>
              <Split label="copies in 7d" tone={demo.copyIndex > 3 ? "bad" : "default"}>
                {demo.copyIndex === 1 ? "original" : `#${demo.copyIndex}`}
              </Split>
              <Split label="organic" tone={demo.organicScore < 40 ? "warn" : "good"}>
                {demo.organicScore}/100
              </Split>
              <Split label="usual lifespan">{demo.narrativeLifespanHours}h</Split>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="t-xs text-fg4">organic attention</span>
                <span className="t-mono text-[10.5px] text-fg3">{demo.organicScore}/100</span>
              </div>
              <div className="mt-1">
                <Gauge pct={demo.organicScore} tone={demo.organicScore < 40 ? "warn" : "good"} height={4} />
              </div>
              <p className="mt-1 t-xs leading-relaxed text-fg4">
                Share of mentions that carry no contract address — people talking about the idea
                rather than the chart. Low means the story only exists while money is being spent
              </p>
            </div>
          </Panel>
        )}
      </div>

      {demo && demo.copyIndex > 3 && (
        <Panel title="This idea has already run" note={`copy #${demo.copyIndex} in seven days`} flush>
          {[
            { symbol: "RATIO", peak: 4200000, toPeak: 6, toZero: 34 },
            { symbol: "MICE", peak: 890000, toPeak: 3, toZero: 12 },
            { symbol: "SQUEAK", peak: 210000, toPeak: 2, toZero: 8 },
          ].map((i) => (
            <div key={i.symbol} className="flex flex-wrap items-baseline gap-x-2 border-b border-line px-3 py-1.5 last:border-b-0">
              <span className="t-xs font-semibold text-fg">{i.symbol}</span>
              <span className="t-xs text-fg4">peak {fmtUsd(i.peak)}</span>
              <span className="t-xs text-fg4">after {i.toPeak}h</span>
              <span className="ml-auto t-mono text-[10.5px] text-bad">−90% in {i.toZero}h</span>
            </div>
          ))}
          <div className="px-3 py-1.5">
            <Demo />
            <span className="ml-1.5 t-xs text-fg4">
              lifespan shown is what these instances did, not a forecast
            </span>
          </div>
        </Panel>
      )}
    </>
  );
}

/* ==================================================================== *
 * EXIT
 * ==================================================================== */

function ExitTab({ data }: { data: AnalysisResult }) {
  const e = data.exit;
  const f = data.flow;

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
      <Panel title="What you can sell" note="estimated from pool reserves, not a quote">
        <ExitCurve
          maxSell5pct={e.maxSellUsd.slip5}
          maxSell1pct={e.maxSellUsd.slip1}
          liquidityUsd={data.market.liquidityUsd}
        />
        {e.liquidityCoverage !== null && (
          <div className="mt-2 border-t border-line pt-2">
            <Split label="liquidity vs mcap">{e.liquidityCoverage.toFixed(2)}%</Split>
            <p className="mt-1 t-xs leading-relaxed text-fg4">
              A thin pool relative to market cap means the chart you see is not the size you can
              actually exit
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Trade flow" note={`last ${f.windowTrades} trades`}>
        <FlowBar
          buyVol={f.buyVolumeUsd}
          sellVol={f.sellVolumeUsd}
          imbalance={f.imbalance}
          buys={f.buys}
          sells={f.sells}
        />
        <div className="mt-2 border-t border-line pt-2">
          <Split label="distinct traders">{f.distinctTraders ?? "—"}</Split>
          <Split label="window">{f.windowTrades} trades</Split>
        </div>
        {!f.dataAvailable && <p className="mt-1.5 t-xs text-fg4">{f.note ?? "No trade data returned"}</p>}
      </Panel>
    </div>
  );
}

/* ==================================================================== *
 * CHECKS
 * ==================================================================== */

function ChecksTab({ data }: { data: AnalysisResult }) {
  const [open, setOpen] = useState<string | null>(null);
  const ordered = [...data.checks].sort((a, b) => {
    const rank: Record<CheckState, number> = { fail: 0, warn: 1, unknown: 2, pass: 3 };
    return rank[a.state] - rank[b.state];
  });

  return (
    <Panel title="Every check" note="worst first — open a row for the number behind it" flush>
      {ordered.map((c) => {
        const isOpen = open === c.id;
        return (
          <div key={c.id} className="border-b border-line last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : c.id)}
              aria-expanded={isOpen}
              className="drow flex w-full items-start gap-2 px-3 py-2 text-left"
            >
              <span
                aria-hidden
                className={`mt-[1px] grid h-[15px] w-[15px] shrink-0 place-items-center border font-mono text-[8.5px] leading-none ${TONE[c.state]}`}
              >
                {GLYPH[c.state]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="t-xs font-semibold text-fg">{c.label}</span>
                  <span
                    className={`t-mono text-[10.5px] ${
                      c.state === "fail"
                        ? "text-bad"
                        : c.state === "warn"
                          ? "text-warn"
                          : c.state === "pass"
                            ? "text-good"
                            : "text-fg4"
                    }`}
                  >
                    {c.reading}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.06em] text-fg4">
                    {c.source}
                  </span>
                  <span className="t-xs text-fg4">· {c.quality}</span>
                </div>
              </div>
              <span aria-hidden className={`shrink-0 t-mono text-[10px] text-fg4 transition-transform ${isOpen ? "rotate-90" : ""}`}>
                ›
              </span>
            </button>
            {isOpen && (
              <div className="fade-up border-t border-line bg-surf2/60 px-3 py-2 pl-[38px]">
                <p className="max-w-[76ch] t-xs leading-relaxed text-fg3">{c.detail}</p>
              </div>
            )}
          </div>
        );
      })}
    </Panel>
  );
}

/* ==================================================================== *
 * SOURCES
 * ==================================================================== */

function SourcesTab({ data }: { data: AnalysisResult }) {
  const failed = data.provenance.filter((s) => !s.ok);
  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
      <Panel title="Where this came from" note="every source, and how long it took" flush>
        {data.provenance.map((s) => (
          <div key={s.source} className="flex items-baseline gap-2 border-b border-line px-3 py-1.5 last:border-b-0">
            <span aria-hidden className={`h-[5px] w-[5px] shrink-0 ${s.ok ? "bg-good" : "bg-bad"}`} />
            <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-fg2">{s.source}</span>
            <span className="t-mono text-[9.5px] text-fg4">{s.ok ? `${Math.round(s.ms)}ms` : "failed"}</span>
          </div>
        ))}
      </Panel>

      <Panel title="What that means" note="read before trusting a clean result">
        <p className="t-xs leading-relaxed text-fg3">
          {failed.length === 0
            ? "Every source answered. That means the checks could run — not that the token is safe."
            : `${failed.length} source${failed.length === 1 ? "" : "s"} did not answer. Every check that depended on them is marked unknown, never passed.`}
        </p>
        <ul className="mt-2 space-y-1">
          {[
            "observed — read directly from a source that reports it",
            "derived — computed by this tool; the formula is in the row",
            "inferred — produced by a model from text, never mixed with the two above",
          ].map((t) => (
            <li key={t} className="flex items-start gap-1.5">
              <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-fg4" />
              <span className="t-xs leading-snug text-fg3">{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-line pt-2 t-xs leading-relaxed text-fg4">
          Snapshot taken {new Date(data.generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC
          {data.cached ? " · served from cache" : ""}
        </p>
      </Panel>
    </div>
  );
}
