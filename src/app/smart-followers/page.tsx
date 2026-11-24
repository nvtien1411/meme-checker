import Link from "next/link";
import type { Metadata } from "next";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, ProReveal, Stat, Tag } from "@/components/ui";
import { WalletProRows } from "@/components/ProRows";
import { NextSteps } from "@/components/NextSteps";
import { DEMO_CALLS, DEMO_WALLETS, shortAddr } from "@/lib/demo";
import { allCallerProfiles } from "@/lib/intel2";
import { walletProfile } from "@/lib/intel";

/* ==================================================================== *
 * SMART MONEY — who buys after a post, and whether they are the exit
 *
 * This page used to be six stat cards reading "5", "1,284", "186", "94",
 * "T+4m", "61%" — literal strings in the JSX with nothing behind them, plus a
 * five-step narrative that described a sequence of events the dataset has no
 * record of. Every number on it was a decoration shaped like evidence.
 *
 * Rewritten so that every figure is computed on the page from DEMO_CALLS and
 * the caller profiles. Where the demo dataset cannot support a metric, the
 * metric is gone rather than zeroed — a table of wallets is honest, a made-up
 * count of "1,284 follower wallets" is not.
 * ==================================================================== */

export const metadata: Metadata = {
  title: "Smart Money — Meme Checker",
  description: "Which wallets repeatedly buy after a call, and whether they beat the crowd out",
};

const REFERENCE = Math.max(...DEMO_CALLS.map((c) => Date.parse(c.at)));

function ago(iso: string): string {
  const mins = Math.round((REFERENCE - Date.parse(iso)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default function SmartFollowersPage() {
  const profiles = allCallerProfiles();

  // How many distinct tokens each tracked caller has posted, and how many of
  // those posts were profitable for someone who bought at the call price.
  const totalCalls = DEMO_CALLS.length;
  const wonAtCall = DEMO_CALLS.filter(
    (c) => c.hoursToPeak !== null && c.peakMc / c.mcAtCall >= 2,
  ).length;

  // Callers whose own exit landed above the price of their post: these are the
  // accounts where "buying after the post" is structurally buying their exit.
  const sellingInto = profiles.filter((p) => p.sellsAboveCall);
  const leadNegative = profiles.filter((p) => p.lead < 0);

  // The tracked follower wallets, with whatever the profile function can
  // actually support. Anything it returns null for renders as a dash.
  const followerAddrs = [DEMO_WALLETS.fol1, DEMO_WALLETS.fol2, DEMO_WALLETS.fol3, DEMO_WALLETS.fol4];
  const followerRows = followerAddrs
    .map((addr) => ({ addr, p: walletProfile(addr) }))
    .filter((r): r is { addr: string; p: NonNullable<ReturnType<typeof walletProfile>> } => r.p !== null);

  return (
    <div>
      <PageHead
        title="Smart Money"
        note="who buys after a caller posts, and whether they are the exit"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{profiles.length} callers</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* what is actually measured */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="panel p-2.5">
            <Stat
              label="calls on record"
              value={String(totalCalls)}
              sub={`across ${profiles.length} tracked accounts`}
              size="md"
            />
          </div>
          <div className="panel p-2.5">
            <Stat
              label="reached 2×"
              value={`${Math.round((wonAtCall / totalCalls) * 100)}%`}
              sub={`${wonAtCall} of ${totalCalls} calls`}
              size="md"
            />
          </div>
          <div className="panel p-2.5">
            <Stat
              label="sell above their call"
              value={String(sellingInto.length)}
              sub={`of ${profiles.length} callers`}
              size="md"
            />
          </div>
          <div className="panel p-2.5">
            <Stat
              label="posted before buying"
              value={String(leadNegative.length)}
              sub="negative lead time"
              size="md"
            />
          </div>
        </div>

        {/* the boundary, stated in the place it matters */}
        <Panel title="What this page can and cannot count" note="stated up front, because the difference decides the verdict">
          <p className="t-xs leading-relaxed text-fg3">
            Two things are measurable with the data behind this build: what each caller&apos;s own
            wallet did with their own call, and how the calls themselves resolved. What is{" "}
            <span className="text-fg2">not</span> measurable yet is the follower side — matching a
            wallet to a post requires ingesting X, then reconciling buyer addresses against post
            timestamps. That pipeline is not wired, so this page shows the caller-side evidence in
            full and marks the follower-side module as unmeasured rather than filling it with
            plausible numbers
          </p>
        </Panel>

        {/* caller-side evidence, real rows */}
        <Panel
          title="Callers, worst first"
          note="their own exit against the price of their own post"
          flush
        >
          <div className="grid grid-cols-[minmax(0,1fr)_52px_54px_48px_76px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-2.5 py-1.5 sm:grid-cols-[minmax(0,1fr)_56px_58px_52px_76px]">
            <span className="t-eyebrow">caller</span>
            <span className="t-eyebrow text-right" title="their exit ÷ the price at their post">exit/call</span>
            <span className="t-eyebrow text-right" title="seconds between their buy and their post">lead</span>
            <span className="hidden t-eyebrow text-right sm:block" title="share of their own position sold after posting">sold</span>
            <span className="t-eyebrow text-right">verdict</span>
          </div>
          {[...profiles]
            .sort((a, b) => b.exitVsCall - a.exitVsCall)
            .map((p) => (
              <Link
                key={p.caller.handle}
                href={`/callers/${p.caller.handle}`}
                className="drow grid grid-cols-[minmax(0,1fr)_52px_54px_48px_76px] items-baseline gap-x-2 border-b border-line px-2.5 py-[6px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_56px_58px_52px_76px]"
              >
                <div className="min-w-0">
                  <span className="truncate t-xs font-semibold text-fg">@{p.caller.handle}</span>
                  <div className="mt-0.5 t-xs text-fg4">
                    {p.calls} calls · {p.caller.smartFollowers} smart followers
                  </div>
                </div>
                <span
                  className={`text-right t-mono text-[10.5px] tabular-nums ${
                    p.exitVsCall > 1 ? "text-bad" : "text-good"
                  }`}
                >
                  {p.exitVsCall.toFixed(2)}×
                </span>
                <span
                  className={`text-right t-mono text-[10.5px] tabular-nums ${
                    p.lead < 0 ? "text-warn" : "text-fg3"
                  }`}
                >
                  {p.lead === 0 ? "same" : `${p.lead > 0 ? "+" : ""}${p.lead}s`}
                </span>
                <span
                  className={`hidden text-right t-mono text-[10.5px] tabular-nums sm:block ${
                    p.soldAfter > 45 ? "text-bad" : "text-fg3"
                  }`}
                >
                  {p.soldAfter.toFixed(0)}%
                </span>
                <span className="whitespace-nowrap text-right font-mono text-[9px] uppercase tracking-[0.04em]">
                  <span
                    className={
                      p.verdict === "exit liquidity"
                        ? "text-bad"
                        : p.verdict === "worth following"
                          ? "text-good"
                          : "text-warn"
                    }
                  >
                    {p.verdict}
                  </span>
                </span>
              </Link>
            ))}
        </Panel>

        {/* recent calls, dated from the dataset reference, not the clock */}
        <Panel
          title="Calls, newest first"
          note={`${DEMO_CALLS.length} on record — times relative to the newest`}
          flush
        >
          <div className="grid grid-cols-[56px_minmax(0,1fr)_62px_44px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-2.5 py-1.5">
            <span className="t-eyebrow">when</span>
            <span className="t-eyebrow">caller</span>
            <span className="t-eyebrow">token</span>
            <span className="t-eyebrow text-right" title="peak market cap ÷ market cap at the call">
              peak
            </span>
          </div>
          {[...DEMO_CALLS]
            .sort((a, b) => b.at.localeCompare(a.at))
            .map((c) => (
              <div
                key={`${c.handle}-${c.mint}-${c.at}`}
                className="grid grid-cols-[56px_minmax(0,1fr)_62px_44px] items-baseline gap-x-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
              >
                <span className="t-mono text-[9.5px] text-fg4">{ago(c.at)}</span>
                <Link
                  href={`/callers/${c.handle}`}
                  className="min-w-0 truncate t-xs text-fg3 hover:text-acid"
                >
                  @{c.handle}
                </Link>
                <span className="truncate t-xs font-semibold text-fg">{c.symbol}</span>
                <span
                  className={`text-right t-mono text-[10px] tabular-nums ${
                    c.outcome === "won" ? "text-good" : c.outcome === "lost" ? "text-bad" : "text-fg4"
                  }`}
                >
                  {c.hoursToPeak !== null ? `${(c.peakMc / c.mcAtCall).toFixed(1)}×` : "dead"}
                </span>
              </div>
            ))}
        </Panel>

        {/* the tracked follower wallets — real profiles, no invented counts */}
        <Panel
          title="Tracked buyer wallets"
          note={`${followerRows.length} wallets in this dataset with a launch history`}
          flush
        >
          {followerRows.length === 0 ? (
            <p className="px-3 py-2.5 t-xs text-fg4">
              None of the tracked buyer wallets appear in a launch this scanner recorded
            </p>
          ) : (
            <div className="divide-y divide-line">
              {followerRows.map(({ addr, p }) => (
                <div key={addr} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-2.5 py-[6px]">
                  <Link
                    href={`/wallets/${addr}`}
                    className="font-mono text-[10.5px] text-fg2 hover:text-acid"
                  >
                    {shortAddr(addr, 6, 4)}
                  </Link>
                  <span className="t-xs text-fg4">{p.launchCount} launches</span>
                  {p.bundleCount > 0 && <Tag tone="bad">{p.bundleCount} in creation block</Tag>}
                  {p.medianHoldMin !== null && (
                    <span className="t-mono text-[9.5px] text-fg4">
                      holds {p.medianHoldMin.toFixed(0)}m
                    </span>
                  )}
                  <Link
                    href={`/investigation?w=${addr}`}
                    className="ml-auto border border-line px-1.5 py-[1px] font-mono text-[9px] uppercase text-fg4 hover:border-acid/40 hover:text-acid"
                  >
                    investigate
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* what the paid layer would add, with the honest reason it is empty */}
        <ProReveal
          title="Follower-side matching"
          value={`${followerRows.length} buyer wallets have a launch history on record; the post-to-wallet match needs X ingestion`}
          clip={4}
          shown={2}
          rows={[<WalletProRows key="wp" addrs={followerAddrs} />]}
          more={[
            "Which wallets bought within N minutes of a specific post, per caller",
            "Repeat followers: wallets that arrive after the same account three or more times",
            "Wallets shared across callers — the same crowd following several accounts",
            "Median entry time after a post, and how much of the move they captured",
            "Which followers were already holding before the post, and when they left",
          ]}
          note="The rows above are real wallet histories. The follower-to-post link is the missing pipeline, and no amount of framing turns it into a measurement"
        />

                <NextSteps
          title="From a caller's follower problem"
          steps={[
            {
              from: "A caller sells above their own call",
              to: "Every call they made, with exits",
              href: "/callers/cryptocole",
              tone: "bad",
            },
            {
              from: "The same wallets keep arriving",
              to: "The graph of who bought together",
              href: "/investigation",
            },
            {
              from: "A token is being called by several accounts",
              to: "What the contract itself says",
              href: "/check",
              tone: "acid",
            },
          ]}
        />
      </div>
    </div>
  );
}
