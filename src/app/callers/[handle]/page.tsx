import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, ProReveal, Split, Stat, Tag } from "@/components/ui";
import { FollowerEntryChart, Timeline } from "@/components/viz";
import { DEMO_TIMELINE, callerByHandle, callsByHandle, type DemoCall } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * CALLER PROFILE
 *
 * The page a trader opens before deciding whether to act on a call. It leads
 * with the one number that separates a good caller from a farm: exit price
 * against call price. Everything else is evidence for or against that number.
 * ==================================================================== */

// `params` is runtime data and cacheComponents is on, so the route must declare
// itself blocking rather than prerendered.
export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return { title: `@${handle}` };
}

/* The follower-entry histogram was ten literals, identical on every profile.
 * A caller page exists to differentiate one account from another, and a chart
 * that never changes differentiates nothing. What the dataset can support is
 * the shape of this caller's own calls, so that is what is drawn: each call
 * placed by how far it ran from the post price. */
function callSpread(calls: DemoCall[]): { label: string; pct: number }[] {
  const buckets = [
    { label: "dead", test: (m: number) => m < 1 },
    { label: "1–1.5×", test: (m: number) => m >= 1 && m < 1.5 },
    { label: "1.5–2×", test: (m: number) => m >= 1.5 && m < 2 },
    { label: "2–5×", test: (m: number) => m >= 2 && m < 5 },
    { label: "5×+", test: (m: number) => m >= 5 },
  ];
  const total = calls.length || 1;
  return buckets.map((b) => ({
    label: b.label,
    pct: Math.round(
      (calls.filter((c) => b.test(c.hoursToPeak === null ? 0 : c.peakMc / c.mcAtCall)).length /
        total) *
        100,
    ),
  }));
}

export default async function CallerPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const c = callerByHandle(handle);
  if (!c) notFound();

  const calls = callsByHandle(c.handle);
  const winRate = (c.wins / c.calls) * 100;
  const sellsAbove = c.exitVsCall > 1;

  const signals = [
    { label: "Pre-call accumulation", fired: c.preRun > 20, note: `${c.preRun}% moved before the post` },
    { label: "Posts before buying", fired: c.lead < 0, note: c.lead < 0 ? `${Math.abs(c.lead)}s before their own buy` : `${c.lead}s after their own buy` },
    { label: "Sells above call price", fired: sellsAbove, note: `${c.exitVsCall.toFixed(2)}× the post price` },
    { label: "High automated replies", fired: c.bots > 50, note: `${c.bots}% of replies` },
    { label: "Renamed accounts", fired: c.renamed > 0, note: `${c.renamed} accounts renamed within 30 days` },
  ];
  const firedCount = signals.filter((s) => s.fired).length;

  return (
    <div>
      <PageHead
        title={`@${c.handle}`}
        note={c.name}
        right={
          <>
            <Demo />
            <Tag tone="neutral">{c.followers.toLocaleString("en-US")} followers</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* the number that matters */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <Panel title="Exit against call" note="their average exit, divided by the price when they posted">
            <div className="flex items-end gap-2">
              <span className={`t-num-xl ${sellsAbove ? "text-bad" : "text-good"}`}>
                {c.exitVsCall.toFixed(2)}×
              </span>
            </div>
            <div
              className={`mt-1 text-[15px] font-semibold ${sellsAbove ? "text-bad" : "text-good"}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {sellsAbove ? "Sold above the call price" : "Sold below the call price"}
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg3">
              {sellsAbove
                ? `Followers paid the post price. This wallet's average exit landed ${((c.exitVsCall - 1) * 100).toFixed(0)}% above it — the gap came from the people who bought after reading the post`
                : "Exits landed below what the post offered, which is the behaviour of someone who was early and took profit before the crowd arrived, not after"}
            </p>

            <div className="mt-2.5">
              <Gauge
                pct={Math.min(100, (c.exitVsCall / 2.5) * 100)}
                tone={sellsAbove ? "bad" : "good"}
                height={5}
                label={
                  <span className="flex justify-between">
                    <span>0×</span>
                    <span className="text-fg3">1.0× = sells at call price</span>
                    <span>2.5×</span>
                  </span>
                }
              />
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[
              { label: "calls", value: `${c.calls}`, sub: "tracked" },
              { label: "win rate", value: `${winRate.toFixed(0)}%`, sub: "touched 2×", tone: winRate > 50 ? "good" : winRate > 35 ? "warn" : "bad" },
              { label: "median", value: `${c.median.toFixed(1)}×`, sub: "every call, zeros included", tone: c.median > 1.5 ? "good" : c.median > 1 ? "warn" : "bad" },
              { label: "best", value: `${c.best.toFixed(0)}×`, sub: "single best call", tone: "good" },
              { label: "dead calls", value: `${c.deadCalls}%`, sub: "never reached 2×", tone: c.deadCalls > 50 ? "bad" : "warn" },
              { label: "smart followers", value: `${c.smartFollowers}`, sub: "profitable wallets that follow", tone: "default" },
            ].map((s) => (
              <div key={s.label} className="panel p-2.5">
                <Stat
                  label={s.label}
                  value={s.value}
                  sub={s.sub}
                  size="md"
                  tone={s.tone === "good" ? "good" : s.tone === "warn" ? "warn" : s.tone === "bad" ? "bad" : "default"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* signals */}
        <Panel
          title="Coordination signals"
          note={`${firedCount} of ${signals.length} fired — this is a count of detected signals, not an accusation`}
          flush
        >
          {signals.map((s) => (
            <div key={s.label} className="flex items-start gap-2 border-b border-line px-3 py-1.5 last:border-b-0">
              <span
                aria-hidden
                className={`mt-[4px] h-[5px] w-[5px] shrink-0 ${s.fired ? "bg-bad" : "bg-line2"}`}
              />
              <span className={`min-w-0 flex-1 t-xs ${s.fired ? "text-fg" : "text-fg3"}`}>{s.label}</span>
              <span className={`shrink-0 t-mono text-[10px] ${s.fired ? "text-bad" : "text-fg4"}`}>
                {s.note}
              </span>
            </div>
          ))}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel
            title="How far its calls ran"
            note="every recorded call, bucketed by peak against the price at the post"
          >
            {calls.length === 0 ? (
              <p className="py-3 t-xs text-fg4">
                No individual call is on record for this account — only its aggregate record, which
                is counted over every call it has made, not just the ones this scan saw
              </p>
            ) : (
              <FollowerEntryChart buckets={callSpread(calls)} postIndex={0} mode="bucket" unit="of its calls" />
            )}
            <div className="mt-2 grid grid-cols-2 gap-x-3">
              {calls.length === 0 ? (
                <>
                  <Split label="best call">{`${c.best.toFixed(1)}×`}</Split>
                  <Split label="dead calls" tone="warn">{`${c.deadCalls}%`}</Split>
                </>
              ) : (
                <>
                  <Split label="best call">
                    {`${Math.max(...calls.map((x) => (x.hoursToPeak === null ? 0 : x.peakMc / x.mcAtCall))).toFixed(1)}×`}
                  </Split>
                  <Split label="never recovered" tone="warn">
                    {`${calls.filter((x) => x.hoursToPeak === null).length} of ${calls.length}`}
                  </Split>
                </>
              )}
            </div>
          </Panel>

          <Panel
            title="The sequence"
            note={
              calls.length > 0
                ? `relative to ${calls[0].symbol}'s post — the launch pattern, not this account's own trade`
                : "what happened, relative to the post"
            }
          >
            <Timeline events={DEMO_TIMELINE} />
          </Panel>
        </div>

        {/* call history */}
        <Panel title="Call history" note="every tracked call, with the outcome" flush>
          <div className="grid grid-cols-[52px_minmax(0,1fr)_60px_56px_60px] items-baseline gap-x-2.5 border-b border-line bg-surf2/40 px-3 py-1.5">
            <span className="t-eyebrow">date</span>
            <span className="t-eyebrow">token</span>
            <span className="t-eyebrow text-right">at call</span>
            <span className="t-eyebrow text-right">peak</span>
            <span className="t-eyebrow text-right">result</span>
          </div>
          {calls.map((call) => (
            <Link
              key={`${call.mint}-${call.at}`}
              href={`/token/solana/${call.mint}`}
              className="drow grid grid-cols-[52px_minmax(0,1fr)_60px_56px_60px] items-center gap-x-2.5 border-b border-line px-3 py-1.5 last:border-b-0"
            >
              <span className="t-mono text-[9.5px] text-fg4">
                {new Date(call.at).toISOString().slice(5, 10)}
              </span>
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate t-xs font-semibold text-fg">{call.symbol}</span>
                {call.outcome === "lost" && <Tag tone="bad">zero</Tag>}
                {call.outcome === "won" && <Tag tone="good">won</Tag>}
              </div>
              <span className="text-right t-mono text-[10px] text-fg4">{fmtUsd(call.mcAtCall)}</span>
              <span className="text-right t-mono text-[10px] text-fg3">{fmtUsd(call.peakMc)}</span>
              <span
                className={`text-right t-mono text-[10.5px] ${
                  call.outcome === "won" ? "text-good" : call.outcome === "lost" ? "text-bad" : "text-fg4"
                }`}
              >
                {call.hoursToPeak !== null ? `${(call.peakMc / call.mcAtCall).toFixed(1)}×` : "—"}
              </span>
            </Link>
          ))}
        </Panel>

        <ProReveal
          title="Everything behind this record"
          shown={2}
          rows={calls.slice(0, 4).map((c) => (
            <div key={c.mint} className="panel flex flex-wrap items-baseline gap-x-3 gap-y-1 px-2.5 py-1.5">
              <span className="font-mono text-[11px] text-fg">{c.symbol}</span>
              <span
                className={`font-mono text-[9px] uppercase ${
                  c.outcome === "won" ? "text-good" : c.outcome === "lost" ? "text-bad" : "text-fg4"
                }`}
              >
                {c.outcome}
              </span>
              <span className="t-xs tabular-nums text-fg4">called at {fmtUsd(c.mcAtCall)}</span>
              <span className="t-xs tabular-nums text-fg4">peak {fmtUsd(c.peakMc)}</span>
              <span className="ml-auto t-mono text-[10px] tabular-nums text-fg3">
                {c.hoursToPeak !== null ? `${(c.peakMc / c.mcAtCall).toFixed(1)}x` : "flat"}
              </span>
              <span className="t-xs text-fg4">{c.at}</span>
            </div>
          ))}
          more={[
            "The wallet behind the account, and its position before each call",
            "Exact buy time, post time and first sell time for every call, to the second",
            "Repeat-follower wallets: which addresses appear on three or more calls",
            "Follower overlap with other callers, and whether those wallets are one group",
            "Which smart wallets copy the whole call and which exit first",
            "Funding connections between the caller's wallet and pre-call buyers",
            "How many followers who bought still hold, and how many are underwater",
          ]}
          note="The last four calls on record with their real market caps. The free view shows the two most recent"
        />

        <p className="t-xs leading-relaxed text-fg4">
          Signals are counts of detected behaviour, not proof of intent. Shared buying happens in
          every launch crowd, and a wallet selling above a post price is what a profitable trader
          does — the report says what was observed and lets you decide what it means
        </p>
      </div>
    </div>
  );
}
