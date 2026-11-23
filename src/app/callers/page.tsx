import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, Tag } from "@/components/ui";
import { DEMO_CALLERS, DEMO_CALLS } from "@/lib/demo";

/* ==================================================================== *
 * CALLERS — the leaderboard, and the reason it exists
 *
 * A follower count is not credibility. Every row here carries the number that
 * actually predicts whether following this account costs money: the exit price
 * against the price at the moment they posted. Above 1.0 and they sold into
 * the people they told.
 * ==================================================================== */

export const metadata = { title: "Callers" };

export default function CallersPage() {
  const ranked = [...DEMO_CALLERS].sort((a, b) => b.smartFollowers - a.smartFollowers);

  return (
    <div>
      <PageHead
        title="Callers"
        note="who is talking, and what happened to the people who listened"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{ranked.length} tracked</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">

        <Panel title="Read this column first" note="exit price against the price at the moment they posted">
          <p className="t-xs leading-relaxed text-fg3">
            A caller who sells at a higher price than their post is selling into their own audience.
            Above 1.0× means the average exit landed above the price followers paid. It is a fact
            about the wallet, not a judgement about the account
          </p>
        </Panel>

        <Panel flush>
          <div className="grid grid-cols-[minmax(0,1fr)_56px_52px_60px_44px] items-baseline gap-x-2.5 border-b border-line bg-surf2/40 px-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_60px_56px_56px_64px_48px]">
            <span className="t-eyebrow">caller</span>
            <span className="t-eyebrow text-right">followers</span>
            <span className="hidden text-right t-eyebrow sm:block">win</span>
            <span className="t-eyebrow text-right">median</span>
            <span className="t-eyebrow text-right">exit/call</span>
            <span className="t-eyebrow text-right">smart</span>
          </div>

          {ranked.map((c) => {
            const winRate = (c.wins / c.calls) * 100;
            const sellsAbove = c.exitVsCall > 1;
            return (
              <Link
                key={c.handle}
                href={`/callers/${c.handle}`}
                className="drow grid grid-cols-[minmax(0,1fr)_56px_52px_60px_44px] items-center gap-x-2.5 border-b border-line px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_60px_56px_56px_64px_48px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="truncate t-xs font-semibold text-fg">@{c.handle}</span>
                    {sellsAbove && <Tag tone="bad">sells above call</Tag>}
                    {c.lead < 0 && <Tag tone="warn">posts before buying</Tag>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="truncate t-xs text-fg4">{c.calls} calls</span>
                    <span className="t-xs text-fg4">·</span>
                    <span className="t-xs text-fg4">{c.bots}% bot replies</span>
                  </div>
                </div>
                <span className="text-right t-mono text-[10.5px] text-fg3">
                  {(c.followers / 1000).toFixed(1)}k
                </span>
                <span
                  className={`hidden text-right t-mono text-[10.5px] sm:block ${
                    winRate > 50 ? "text-good" : winRate > 35 ? "text-warn" : "text-bad"
                  }`}
                >
                  {winRate.toFixed(0)}%
                </span>
                <span className="text-right t-mono text-[10.5px] text-fg3">{c.median.toFixed(1)}×</span>
                <span
                  className={`text-right t-mono text-[10.5px] ${sellsAbove ? "text-bad" : "text-good"}`}
                >
                  {c.exitVsCall.toFixed(2)}×
                </span>
                <span className="text-right t-mono text-[11px] text-acid">{c.smartFollowers}</span>
              </Link>
            );
          })}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="What each column means" note="no column here is a follower count">
            <div className="space-y-1.5">
              {[
                ["win", "share of calls that ever touched 2×. Calling a token that did a 2× and a token that died look identical on a timeline unless you count"],
                ["median", "the middle multiple across every call, including the ones that went to zero. Not the average, which one 30× call can rescue"],
                ["exit/call", "their average exit divided by the price at the moment they posted. Above 1.0 means the exit happened above what the post offered followers"],
                ["smart", "wallets with a profitable history that repeatedly buy within minutes of this account posting. A follower count counts bots; this counts conviction"],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-line pb-1.5 last:border-b-0">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-acid">{k}</span>
                  <p className="mt-0.5 t-xs leading-relaxed text-fg3">{v}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent calls" note="the last ten across every tracked account" flush>
            {DEMO_CALLS.slice(0, 8).map((c) => (
              <div
                key={`${c.handle}-${c.mint}-${c.at}`}
                className="flex items-baseline gap-2 border-b border-line px-3 py-1.5 last:border-b-0"
              >
                <span className="t-mono text-[9.5px] text-fg4">
                  {new Date(c.at).toISOString().slice(5, 10)}
                </span>
                <span className="min-w-0 flex-1 truncate t-xs text-fg3">@{c.handle}</span>
                <span className="t-xs font-semibold text-fg">{c.symbol}</span>
                <span
                  className={`t-mono text-[10px] ${
                    c.outcome === "won" ? "text-good" : c.outcome === "lost" ? "text-bad" : "text-fg4"
                  }`}
                >
                  {c.hoursToPeak !== null ? `${(c.peakMc / c.mcAtCall).toFixed(1)}×` : "—"}
                </span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
