"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel, Tag } from "./ui";
import { shortAddr } from "@/lib/demo";
import {
  allCallerProfiles,
  allNarratives,
  callerOverlaps,
  deployerRecord,
  tokenOverlaps,
  type CallerProfile,
} from "@/lib/intel2";

/* ==================================================================== *
 * SECOND INTELLIGENCE LAYER
 *
 * One component per domain: callers, narratives, deployers, cross-token
 * overlap. Each renders only inside a ProReveal, so the free reader sees the
 * shape of the analysis and the paid reader gets the rows.
 *
 * Every figure comes from intel2.ts. Nothing is typed into a component.
 * ==================================================================== */

const VERDICT_TONE: Record<string, "bad" | "warn" | "good" | "neutral"> = {
  "exit liquidity": "bad",
  mixed: "warn",
  "worth following": "good",
  "insufficient history": "neutral",
};

/* ------------------------------------------------------------------ *
 * Callers
 * ------------------------------------------------------------------ */

export function CallerTable({ limit = 6 }: { limit?: number }) {
  const [picked, setPicked] = useState<string | null>(null);
  const profiles = useMemo(() => allCallerProfiles(), []);
  const sel = profiles.find((p) => p.caller.handle === picked) ?? null;

  return (
    <div className="space-y-2.5">
      <Panel flush>
        <div className="grid grid-cols-[minmax(0,1fr)_58px_54px_54px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1 sm:grid-cols-[minmax(0,1fr)_64px_58px_58px_70px]">
          <span className="t-eyebrow">caller</span>
          <span className="t-eyebrow text-right">exit/call</span>
          <span className="t-eyebrow text-right">win</span>
          <span className="hidden t-eyebrow text-right sm:block">smart</span>
          <span className="t-eyebrow text-right">verdict</span>
        </div>
        {profiles.slice(0, limit).map((p) => (
          <button
            key={p.caller.handle}
            type="button"
            onClick={() => setPicked(picked === p.caller.handle ? null : p.caller.handle)}
            className="drow grid w-full grid-cols-[minmax(0,1fr)_58px_54px_54px] items-baseline gap-x-2 border-b border-line px-3 py-[7px] text-left last:border-b-0 sm:grid-cols-[minmax(0,1fr)_64px_58px_58px_70px]"
          >
            <span className="flex min-w-0 items-baseline gap-1.5">
              <Link
                href={`/callers/${p.caller.handle}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate font-mono text-[10.5px] text-fg2 hover:text-acid"
              >
                @{p.caller.handle}
              </Link>
              <span className="shrink-0 t-xs text-fg4">{p.sellsAboveCall ? "sold above" : "sold below"}</span>
            </span>
            <span
              className={`text-right font-mono text-[10.5px] tabular-nums ${
                p.sellsAboveCall ? "text-bad" : "text-good"
              }`}
            >
              {p.exitVsCall.toFixed(2)}x
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
              {p.winRate === null ? "—" : `${Math.round(p.winRate * 100)}%`}
            </span>
            <span className="hidden text-right font-mono text-[10px] tabular-nums text-fg4 sm:block">
              {p.caller.smartFollowers}
            </span>
            <span
              className={`text-right font-mono text-[8.5px] uppercase tracking-[0.04em] ${
                p.verdict === "exit liquidity"
                  ? "text-bad"
                  : p.verdict === "worth following"
                    ? "text-good"
                    : p.verdict === "mixed"
                      ? "text-warn"
                      : "text-fg4"
              }`}
            >
              {p.verdict === "exit liquidity" ? "exit liq" : p.verdict === "insufficient history" ? "no data" : p.verdict}
            </span>
          </button>
        ))}
      </Panel>

      {sel && <CallerDetail p={sel} />}

      <OverlapTable />
    </div>
  );
}

function CallerDetail({ p }: { p: CallerProfile }) {
  return (
    <Panel
      title={`@${p.caller.handle}`}
      note={`${p.calls} calls on record`}
      right={<Tag tone={VERDICT_TONE[p.verdict]}>{p.verdict}</Tag>}
      flush
    >
      <ul className="space-y-1 px-3 py-2">
        {p.evidence.map((e) => (
          <li key={e} className="flex items-start gap-1.5">
            <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
            <span className="t-xs leading-snug text-fg3">{e}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 divide-x divide-line border-t border-line sm:grid-cols-4">
        {[
          { k: "median multiple", v: `${p.caller.median}x`, s: "every call, wins included" },
          { k: "dead calls", v: p.deadShare === null ? "—" : `${Math.round(p.deadShare * 100)}%`, s: "never reached 2x" },
          { k: "pre-call move", v: `${p.preRun}%`, s: "3 min before the post" },
          { k: "sold after", v: `${p.soldAfter}%`, s: "of their own position" },
        ].map((c) => (
          <div key={c.k} className="p-2.5">
            <div className="t-eyebrow">{c.k}</div>
            <div className="mt-0.5 font-mono text-[14px] leading-none tabular-nums text-fg">{c.v}</div>
            <div className="mt-1 t-xs leading-snug text-fg4">{c.s}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-3 py-1.5">
        <p className="t-xs leading-relaxed text-fg4">
          Exit price divided by the price at the moment they posted. {p.sellsAboveCall
            ? "Above 1.0 means they sold higher than the price their own post produced — the gap came from the people who acted on it"
            : "Below 1.0 means they exited below their own call, which is what a caller who is not using their audience looks like"}
        </p>
      </div>
    </Panel>
  );
}

function OverlapTable() {
  const overlaps = useMemo(() => callerOverlaps(), []);
  const tight = overlaps.filter((o) => o.tightestGapSec <= 900);

  return (
    <Panel
      title="Same token, same window"
      note="callers who posted the same contract within fifteen minutes of each other"
      flush
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_56px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1">
        <span className="t-eyebrow">first</span>
        <span className="t-eyebrow">second</span>
        <span className="t-eyebrow text-right">gap</span>
      </div>
      {tight.length === 0 ? (
        <p className="px-3 py-2 t-xs text-fg4">No two tracked callers posted the same contract inside 15 minutes</p>
      ) : (
        tight.map((o) => (
          <div
            key={o.a + o.b}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_56px] items-baseline gap-x-2 border-b border-line px-3 py-[5px] last:border-b-0"
          >
            <span className="truncate font-mono text-[10px] text-fg2">@{o.a}</span>
            <span className="truncate font-mono text-[10px] text-fg2">
              @{o.b} <span className="text-fg4">· {o.symbols.join(",")}</span>
            </span>
            <span
              className={`text-right font-mono text-[10px] tabular-nums ${
                o.tightestGapSec <= 300 ? "text-bad" : "text-warn"
              }`}
            >
              {Math.round(o.tightestGapSec / 60)}m
            </span>
          </div>
        ))
      )}
      <div className="border-t border-line px-3 py-1.5">
        <p className="t-xs leading-relaxed text-fg4">
          A shared contract inside fifteen minutes is a shared audience or a shared group chat. {tight.length > 0 ? `${tight.length} such pairs on record` : "None on record"} — it is a reason to look at the wallets, not a conclusion about the accounts
        </p>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Narratives
 * ------------------------------------------------------------------ */

export function NarrativeTable() {
  const rows = useMemo(() => allNarratives(), []);

  return (
    <Panel title="Narrative state, computed" note="copy count against attention, per idea" flush>
      <div className="grid grid-cols-[minmax(0,1fr)_46px_58px_64px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1 sm:grid-cols-[minmax(0,1fr)_52px_64px_64px_76px]">
        <span className="t-eyebrow">narrative</span>
        <span className="t-eyebrow text-right">copies</span>
        <span className="t-eyebrow text-right">mindshare</span>
        <span className="hidden t-eyebrow text-right sm:block">life</span>
        <span className="t-eyebrow text-right">state</span>
      </div>
      {rows.map((n) => (
        <div
          key={n.name}
          className="grid grid-cols-[minmax(0,1fr)_46px_58px_64px] items-baseline gap-x-2 border-b border-line px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_52px_64px_64px_76px]"
        >
          <div className="min-w-0">
            <div className="truncate t-xs font-semibold text-fg2">{n.name}</div>
            <div className="mt-0.5 t-xs leading-snug text-fg4">{n.reason}</div>
          </div>
          <span className="text-right font-mono text-[10px] tabular-nums text-fg3">{n.tokens}</span>
          <span className="text-right font-mono text-[10px] tabular-nums text-fg4">{n.mindshare7d}%</span>
          <span className="hidden text-right font-mono text-[10px] tabular-nums text-fg4 sm:block">
            {n.medianLifespanHours === null ? "—" : `${Math.round(n.medianLifespanHours)}h`}
          </span>
          <span
            className={`text-right font-mono text-[8.5px] uppercase tracking-[0.05em] ${
              n.fit === "early"
                ? "text-good"
                : n.fit === "crowded"
                  ? "text-bad"
                  : n.fit === "dying"
                    ? "text-warn"
                    : "text-fg4"
            }`}
          >
            {n.fit}
          </span>
        </div>
      ))}
      <div className="border-t border-line px-3 py-1.5">
        <p className="t-xs leading-relaxed text-fg4">
          &ldquo;Life&rdquo; is the median time prior tokens on this narrative held their peak before losing 90%.
          It describes what the idea usually does, not what this token will do
        </p>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Deployer
 * ------------------------------------------------------------------ */

export function DeployerRecordPanel({ addr }: { addr: string }) {
  const rec = useMemo(() => deployerRecord(addr), [addr]);
  if (!rec) {
    return (
      <Panel title="Deployer record" note="no launch history for this address">
        <p className="t-xs leading-relaxed text-fg4">
          This address has no recorded launches. That is not a clean record — it is the absence of
          one, and the two must not be presented the same way
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Deployer record"
      note={`${rec.launchCount} launches, ${rec.rugCount} collapsed`}
      right={
        <Tag tone={rec.verdict === "serial rugger" ? "bad" : rec.verdict === "clean record" ? "good" : "warn"}>
          {rec.verdict}
        </Tag>
      }
      flush
    >
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:grid-cols-4">
        {[
          { k: "launches", v: String(rec.launchCount), s: "on record" },
          {
            k: "collapse rate",
            v: rec.rugRate === null ? "—" : `${Math.round(rec.rugRate * 100)}%`,
            s: `${rec.rugCount}/${rec.launchCount}`,
          },
          {
            k: "median drawdown",
            v: rec.medianDrawdown === null ? "—" : `-${rec.medianDrawdown.toFixed(0)}%`,
            s: "across launches",
          },
          { k: "active for", v: rec.activeDays === null ? "—" : `${rec.activeDays}d`, s: "first to latest" },
        ].map((c) => (
          <div key={c.k} className="p-2.5">
            <div className="t-eyebrow">{c.k}</div>
            <div className="mt-0.5 font-mono text-[14px] leading-none tabular-nums text-fg">{c.v}</div>
            <div className="mt-1 t-xs text-fg4">{c.s}</div>
          </div>
        ))}
      </div>
      <div>
        {rec.launches.map((l) => (
          <Link
            key={l.mint}
            href={`/token/${l.chain}/${l.mint}`}
            className="drow flex flex-wrap items-baseline gap-x-2 border-b border-line px-3 py-[6px] last:border-b-0"
          >
            <span className="font-mono text-[10.5px] text-fg2">{l.symbol}</span>
            <span className="t-xs text-fg4">{l.at}</span>
            <span className="t-xs text-fg4">{l.signals[0]}</span>
            <span className="ml-auto font-mono text-[10px] tabular-nums text-bad">
              -{l.drawdownPct}%
            </span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Cross-token overlap — the Compare answer nobody else gives
 * ------------------------------------------------------------------ */

export function TokenOverlapPanel() {
  const overlaps = useMemo(() => tokenOverlaps(), []);

  return (
    <Panel
      title="Same wallets, different token"
      note="which compared tokens share holders, and what those wallets have done before"
      flush
    >
      {overlaps.length === 0 ? (
        <p className="px-3 py-2 t-xs text-fg4">None of the compared tokens share a holder in this dataset</p>
      ) : (
        overlaps.map((o) => (
          <div key={o.a + o.b} className="border-b border-line px-3 py-[7px] last:border-b-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[10.5px] text-fg2">
                {o.a} <span className="text-fg4">↔</span> {o.b}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-bad">
                {o.shared.length} shared
              </span>
              {o.sharedRugRate !== null && (
                <span className="font-mono text-[10px] tabular-nums text-fg4">
                  {Math.round(o.sharedRugRate * 100)}% prior rug rate
                </span>
              )}
              <span className="ml-auto t-xs text-fg4">{o.note}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
              {o.shared.slice(0, 5).map((a) => (
                <Link
                  key={a}
                  href={`/wallets/${a}`}
                  className="font-mono text-[9.5px] text-fg4 hover:text-acid"
                >
                  {shortAddr(a, 4, 4)}
                </Link>
              ))}
              {o.shared.length > 5 && (
                <span className="font-mono text-[9.5px] text-fg4">+{o.shared.length - 5}</span>
              )}
            </div>
          </div>
        ))
      )}
      <div className="border-t border-line px-3 py-1.5">
        <p className="t-xs leading-relaxed text-fg4">
          Comparing two tokens on price is what every screener does. Comparing who holds both is the
          question that changes the decision
        </p>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Smart follower entry quality
 * ------------------------------------------------------------------ */

export function FollowerQualityPanel() {
  const profiles = useMemo(() => allCallerProfiles(), []);

  return (
    <Panel title="Follower quality by caller" note="who brings real followers, and who brings buyers" flush>
      <div className="grid grid-cols-[minmax(0,1fr)_62px_62px_62px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1 sm:grid-cols-[minmax(0,1fr)_70px_70px_70px_70px]">
        <span className="t-eyebrow">caller</span>
        <span className="t-eyebrow text-right">smart</span>
        <span className="t-eyebrow text-right">bots</span>
        <span className="t-eyebrow text-right">renamed</span>
        <span className="hidden t-eyebrow text-right sm:block">pre-move</span>
      </div>
      {profiles.map((p) => (
        <div
          key={p.caller.handle}
          className="grid grid-cols-[minmax(0,1fr)_62px_62px_62px] items-baseline gap-x-2 border-b border-line px-3 py-[6px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_70px_70px_70px_70px]"
        >
          <Link href={`/callers/${p.caller.handle}`} className="truncate font-mono text-[10px] text-fg2 hover:text-acid">
            @{p.caller.handle}
          </Link>
          <span className="text-right font-mono text-[10px] tabular-nums text-good">
            {p.caller.smartFollowers}
          </span>
          <span
            className={`text-right font-mono text-[10px] tabular-nums ${
              p.caller.bots > 50 ? "text-bad" : "text-fg4"
            }`}
          >
            {p.caller.bots}%
          </span>
          <span
            className={`text-right font-mono text-[10px] tabular-nums ${
              p.caller.renamed > 2 ? "text-warn" : "text-fg4"
            }`}
          >
            {p.caller.renamed}
          </span>
          <span className="hidden text-right font-mono text-[10px] tabular-nums text-fg4 sm:block">
            {p.preRun}%
          </span>
        </div>
      ))}
      <div className="border-t border-line px-3 py-1.5">
        <p className="t-xs leading-relaxed text-fg4">
          Smart followers are wallets that repeatedly buy after this account posts. Bots is the share
          of replies judged automated. Pre-move is how much of the price had already run three minutes
          before the post — the portion a follower cannot capture
        </p>
      </div>
    </Panel>
  );
}
