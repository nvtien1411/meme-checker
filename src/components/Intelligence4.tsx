"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Panel, Tag } from "./ui";
import { DEMO_RUGS, DEMO_WALLETS, shortAddr } from "@/lib/demo";
import { exitOrdering, walletProfile, classifyWallet } from "@/lib/intel";
import { deployerRecord } from "@/lib/intel2";

/* ==================================================================== *
 * CASE FILE + ALERT RULES
 *
 * Two surfaces with real content behind them: the forensic read of a single
 * collapse, and worked examples of behavioural alert rules.
 * ==================================================================== */

/* ------------------------------------------------------------------ *
 * Rug case file — the worst collapse in the database, opened
 * ------------------------------------------------------------------ */

export function RugCaseFile() {
  const worst = useMemo(
    () => [...DEMO_RUGS].sort((a, b) => b.drawdownPct - a.drawdownPct)[0],
    [],
  );
  const rec = useMemo(() => deployerRecord(worst.deployer), [worst.deployer]);
  const exits = useMemo(() => exitOrdering().filter((r) => r.symbol === worst.symbol), [worst.symbol]);

  // The wallets in this case that also appear in the other confirmed rugs.
  const crossRefs = useMemo(() => {
    const others = DEMO_RUGS.filter((r) => r.mint !== worst.mint);
    return exits
      .map((e) => {
        const inOthers = others.filter((o) => {
          const p = walletProfile(e.addr);
          return p?.appearances.some((a) => a.launch.mint === o.mint) ?? false;
        });
        return { addr: e.addr, others: inOthers.map((o) => o.symbol) };
      })
      .filter((x) => x.others.length > 0);
  }, [exits, worst.mint]);

  return (
    <div className="space-y-2.5">
      <Panel
        title={`${worst.symbol} — -${worst.drawdownPct}%`}
        note={`peak ${worst.peakMc.toLocaleString("en-US")} · deployer ${shortAddr(worst.deployer, 5, 4)}`}
        right={<Tag tone={worst.flag === "confirmed" ? "bad" : "warn"}>{worst.flag}</Tag>}
        flush
      >
        <div className="grid grid-cols-[minmax(0,1fr)_44px_52px_52px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1">
          <span className="t-eyebrow">who sold, in order</span>
          <span className="t-eyebrow text-right">order</span>
          <span className="t-eyebrow text-right">held</span>
          <span className="t-eyebrow text-right">at peak</span>
        </div>
        {exits.length === 0 ? (
          <p className="px-3 py-2 t-xs text-fg4">
            No exit order recorded for this token. The database holds the collapse, not the trades
          </p>
        ) : (
          exits.map((e) => {
            const p = walletProfile(e.addr);
            const b = p ? classifyWallet(p) : null;
            return (
              <div
                key={e.addr}
                className="grid grid-cols-[minmax(0,1fr)_44px_52px_52px] items-baseline gap-x-2 border-b border-line px-3 py-[6px] last:border-b-0"
              >
                <span className="flex min-w-0 items-baseline gap-1.5">
                  <Link href={`/wallets/${e.addr}`} className="font-mono text-[10px] text-fg2 hover:text-acid">
                    {shortAddr(e.addr, 5, 3)}
                  </Link>
                  {b && <span className="truncate font-mono text-[8.5px] uppercase tracking-[0.04em] text-fg4">{b.label}</span>}
                </span>
                <span className={`text-right font-mono text-[10px] tabular-nums ${e.position === 1 ? "text-bad" : "text-fg3"}`}>
                  #{e.position}
                </span>
                <span className="text-right font-mono text-[10px] tabular-nums text-fg4">
                  {e.holdMin < 60 ? `${Math.round(e.holdMin)}m` : `${(e.holdMin / 60).toFixed(1)}h`}
                </span>
                <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
                  {e.exitAtPeakFrac === null ? "—" : `${(e.exitAtPeakFrac * 100).toFixed(0)}%`}
                </span>
              </div>
            );
          })
        )}
      </Panel>

      {rec && (
        <Panel title="This deployer's record" note={`${rec.launchCount} launches, ${rec.rugCount} collapsed`} flush>
          {rec.launches.map((l) => (
            <div key={l.mint} className="flex flex-wrap items-baseline gap-x-2 border-b border-line px-3 py-[5px] last:border-b-0">
              <span className="font-mono text-[10px] text-fg2">{l.symbol}</span>
              <span className="t-xs text-fg4">{l.at}</span>
              <span className="t-xs text-fg4">{l.signals[0]}</span>
              <span className="ml-auto font-mono text-[10px] tabular-nums text-bad">-{l.drawdownPct}%</span>
            </div>
          ))}
          <div className="border-t border-line px-3 py-1.5">
            <p className="t-xs leading-relaxed text-fg4">
              {rec.verdict === "serial rugger"
                ? `Every one of this address's recorded launches lost more than 90%. That is a record, and it is the only evidence available about the next one`
                : `This address's record is mixed — ${rec.rugCount} of ${rec.launchCount} collapsed. A mixed record is not a defence; it is the absence of a pattern`}
            </p>
          </div>
        </Panel>
      )}

      <Panel title="Same wallets, other rugs" note="cross-reference across the database" flush>
        {crossRefs.length === 0 ? (
          <p className="px-3 py-2 t-xs text-fg4">
            None of the wallets in this case appear in the other confirmed rugs on record
          </p>
        ) : (
          crossRefs.map((x) => (
            <div key={x.addr} className="flex items-baseline gap-2 border-b border-line px-3 py-[5px] last:border-b-0">
              <Link href={`/wallets/${x.addr}`} className="font-mono text-[10px] text-fg2 hover:text-acid">
                {shortAddr(x.addr, 5, 3)}
              </Link>
              <span className="ml-auto font-mono text-[9.5px] text-bad">{x.others.join(" · ")}</span>
            </div>
          ))
        )}
        <div className="border-t border-line px-3 py-1.5">
          <p className="t-xs leading-relaxed text-fg4">
            A wallet that appears in more than one confirmed rug is the strongest evidence this database
            can produce. It is still a record of events, not a claim about intent
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Alert rule examples — worked, with the condition and the reason
 * ------------------------------------------------------------------ */

const RULES = [
  {
    when: "a bundle wallet sells, and price is above its own entry",
    why: "A wallet selling at a loss is not the event. One selling into profit on a position it took at block 0 is.",
    sev: "critical" as const,
  },
  {
    when: "two wallets from the same cluster act within 60 seconds",
    why: "One wallet moving is noise. Two moving together is the cluster, and the cluster is what moves the price.",
    sev: "critical" as const,
  },
  {
    when: "a tracked deployer's new token takes its first bundle buy",
    why: "This is the only moment where you are early rather than reacting. It fires before the price has moved.",
    sev: "high" as const,
  },
  {
    when: "the deployer wallet transfers supply to a wallet younger than 24 hours",
    why: "The classic preparation step. It happens before the launch, not during it.",
    sev: "high" as const,
  },
  {
    when: "a tracked caller posts and a known cluster buys inside five minutes",
    why: "The follower inflow is the exit window. Knowing it started is worth more than knowing it ended.",
    sev: "high" as const,
  },
  {
    when: "holders are rising while price is flat for six hours",
    why: "Quiet accumulation. It is the pattern that looks like nothing on a chart and precedes the move.",
    sev: "medium" as const,
  },
];

export function AlertRuleExamples() {
  return (
    <div className="space-y-2.5">
      <Panel title="Six rules, and why each one" note="the condition is the whole product" flush>
        {RULES.map((r) => (
          <div key={r.when} className="border-b border-line px-3 py-2 last:border-b-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-acid">
                when
              </span>
              <span className="t-xs font-semibold text-fg2">{r.when}</span>
              <Tag tone={r.sev === "critical" ? "bad" : r.sev === "high" ? "warn" : "neutral"}>
                {r.sev}
              </Tag>
            </div>
            <p className="mt-1 t-xs leading-relaxed text-fg3">{r.why}</p>
          </div>
        ))}
      </Panel>

      <Panel title="Why these and not price" note="the honest answer">
        <p className="t-xs leading-relaxed text-fg3">
          A price alert is a TradingView feature and every exchange gives it away. It also tells you
          what already happened. Every rule above fires on an action taken by a wallet that has a
          reason to act before you do — which is the only kind of warning that arrives early enough
          to matter. {DEMO_WALLETS.bundle1 ? "" : ""}
        </p>
      </Panel>
    </div>
  );
}
