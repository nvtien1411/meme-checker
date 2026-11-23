import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Gated, Panel, Split, Stat, Tag, UpgradeStrip } from "@/components/ui";
import { FollowerEntryChart, Timeline } from "@/components/viz";
import { DEMO_TIMELINE, DEMO_WALLETS } from "@/lib/demo";

/* ==================================================================== *
 * SMART FOLLOWERS
 *
 * The product's sharpest module, and the one with the clearest question: who
 * buys after a caller posts, and are those buyers the exit? Everything here
 * exists to answer that, in that order.
 * ==================================================================== */

export const metadata = { title: "Smart Followers" };

const BUCKETS = [
  { label: "T−30", pct: 5 },
  { label: "T−20", pct: 8 },
  { label: "T−10", pct: 13 },
  { label: "T−5", pct: 19 },
  { label: "T+0", pct: 12 },
  { label: "T+5", pct: 28 },
  { label: "T+10", pct: 36 },
  { label: "T+20", pct: 21 },
  { label: "T+30", pct: 8 },
  { label: "T+60", pct: 3 },
];

const REPEAT = [
  { addr: DEMO_WALLETS.fol1, calls: 11, tokens: 9, entry: "T+2m", result: "+2.4×", holding: false },
  { addr: DEMO_WALLETS.fol2, calls: 9, tokens: 8, entry: "T+4m", result: "+1.1×", holding: true },
  { addr: DEMO_WALLETS.fol3, calls: 7, tokens: 7, entry: "T+1m", result: "−0.6×", holding: true },
  { addr: DEMO_WALLETS.fol4, calls: 6, tokens: 6, entry: "T+7m", result: "−0.4×", holding: true },
];

export default function SmartFollowersPage() {
  return (
    <div>
      <PageHead
        title="Smart Followers"
        note="who buys after a caller posts, and whether they are the exit"
        right={
          <>
            <Demo />
            <Tag tone="acid">VIP</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <UpgradeStrip what="Who bought after each post, and whether they were the exit — the whole module is Pro" />

        {/* the question, stated once */}
        <Panel title="The question this answers" note="one sentence, and every panel below is evidence for it">
          <p className="t-body leading-relaxed text-fg2">
            When an account posts a token, a crowd buys. Some of those buyers are real followers.
            Others were positioned before the post and are selling into the crowd.{" "}
            <span className="text-fg">
              This module counts which is which, for every tracked caller.
            </span>
          </p>
        </Panel>

        {/* network overview */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "callers tracked", value: "5", sub: "with wallet matching" },
            { label: "follower wallets", value: "1,284", sub: "bought after a post" },
            { label: "repeat followers", value: "186", sub: "3+ posts of one account" },
            { label: "shared wallets", value: "94", sub: "follow 2+ callers" },
            { label: "median entry", value: "T+4m", sub: "after the post" },
            { label: "underwater", value: "61%", sub: "of followers now" },
          ].map((s) => (
            <div key={s.label} className="panel p-2.5">
              <Stat label={s.label} value={s.value} sub={s.sub} size="md" />
            </div>
          ))}
        </div>

        {/* the core analysis */}
        <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel
            title="Follower entry against the post"
            note="every wallet that bought within an hour, bucketed by minute"
          >
            <FollowerEntryChart buckets={BUCKETS} postIndex={4} />
            <div className="mt-2.5 grid grid-cols-2 gap-x-4">
              <Split label="before the post" tone="bad">
                45%
              </Split>
              <Split label="after the post">55%</Split>
              <Split label="median entry">T+4m</Split>
              <Split label="peak inflow">T+10m</Split>
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg4">
              45% of the wallets that later sold into the inflow had bought before the post. Those
              wallets were not followers — they were positioned, and the post was their bid
            </p>
          </Panel>

          <Panel title="The sequence" note="RATS, relative to the first public post">
            <Timeline events={DEMO_TIMELINE} />
          </Panel>
        </div>

        {/* exit liquidity */}
        <Panel title="Are followers the exit?" note="the chain, as observed" flush>
          <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-5 sm:divide-x sm:divide-y-0">
            {[
              { step: "1", label: "early wallets buy", detail: "22.4% in the launch block", tone: "text-info" },
              { step: "2", label: "caller posts", detail: "mcap $41k at post", tone: "text-acid" },
              { step: "3", label: "followers buy", detail: "41 wallets in 6 minutes", tone: "text-fg" },
              { step: "4", label: "early wallets sell", detail: "68% of position, 25m later", tone: "text-hot" },
              { step: "5", label: "price reacts", detail: "−38% from post-call high", tone: "text-bad" },
            ].map((s) => (
              <div key={s.step} className="px-3 py-2.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="t-mono text-[9px] text-fg4">{s.step}</span>
                  <span className={`t-xs font-semibold ${s.tone}`}>{s.label}</span>
                </div>
                <p className="mt-0.5 t-xs leading-snug text-fg4">{s.detail}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-line px-3 py-1.5">
            <span className="t-xs text-fg3">
              Observed transactions: steps 1, 3 and 4. Estimated: the share attributed to each
              bucket. Inferred: that the post was timed to the inflow — the timing is consistent
              with it and does not prove it
            </span>
          </div>
        </Panel>

        {/* repeat followers */}
        <Panel
          title="Repeat followers"
          note="wallets that buy after the same account, three or more times"
          flush
        >
          <div className="grid grid-cols-[minmax(0,1fr)_44px_52px_56px] items-baseline gap-x-2.5 border-b border-line bg-surf2/40 px-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_52px_56px_56px_64px_68px]">
            <span className="t-eyebrow">wallet</span>
            <span className="t-eyebrow text-right">calls</span>
            <span className="hidden text-right t-eyebrow sm:block">tokens</span>
            <span className="t-eyebrow text-right">entry</span>
            <span className="hidden text-right t-eyebrow sm:block">result</span>
            <span className="t-eyebrow text-right">holds</span>
          </div>
          {REPEAT.map((w) => (
            <div
              key={w.addr}
              className="drow grid grid-cols-[minmax(0,1fr)_44px_52px_56px] items-center gap-x-2.5 border-b border-line px-3 py-1.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_52px_56px_56px_64px_68px]"
            >
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate font-mono text-[10.5px] text-fg2">
                  {w.addr.slice(0, 6)}…{w.addr.slice(-4)}
                </span>
                {w.calls >= 9 && <Tag tone="warn">frequent</Tag>}
              </div>
              <span className="text-right t-mono text-[10.5px] text-fg3">{w.calls}</span>
              <span className="hidden text-right t-mono text-[10.5px] text-fg4 sm:block">{w.tokens}</span>
              <span className="text-right t-mono text-[10px] text-fg3">{w.entry}</span>
              <span
                className={`hidden text-right t-mono text-[10.5px] sm:block ${
                  w.result.startsWith("+") ? "text-good" : "text-bad"
                }`}
              >
                {w.result}
              </span>
              <span className={`text-right t-mono text-[10px] ${w.holding ? "text-warn" : "text-fg4"}`}>
                {w.holding ? "yes" : "no"}
              </span>
            </div>
          ))}
        </Panel>

        {/* cabal */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Cabal intelligence" note="coordination signals across the tracked network">
            <div className="flex items-baseline gap-2">
              <span className="t-mono text-[24px] text-bad">Elevated</span>
              <span className="t-xs text-fg4">4 of 7 signals fired</span>
            </div>
            <div className="mt-2 space-y-1">
              {[
                ["Pre-call accumulation", true, "wallets bought before the first post"],
                ["Repeated participation", true, "3 wallets on 4 prior calls"],
                ["Shared funding", true, "bundle funded from one address"],
                ["Wallet clusters", true, "6 addresses, 2 clusters"],
                ["Coordinated entry", false, "no same-slot entry detected"],
                ["Caller-wallet connection", false, "no direct transfer found"],
                ["Early distribution", false, "sellers were pre-call, not the caller"],
              ].map(([label, fired, note]) => (
                <div key={label as string} className="flex items-start gap-2 border-b border-line py-1 last:border-b-0">
                  <span
                    aria-hidden
                    className={`mt-[4px] h-[5px] w-[5px] shrink-0 ${fired ? "bg-bad" : "bg-line2"}`}
                  />
                  <span className={`min-w-0 flex-1 t-xs ${fired ? "text-fg" : "text-fg3"}`}>
                    {label as string}
                  </span>
                  <span className="shrink-0 t-mono text-[9.5px] text-fg4">{note as string}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg4">
              Four signals is a pattern worth reading, not a conclusion. A busy launch produces
              most of these by accident — what makes it notable is that the same clusters appear
              again on other callers&apos; tokens
            </p>
          </Panel>

          <Panel title="Follower overlap" note="wallets following more than one caller" flush>
            {[
              { pair: "@cryptocole → @degenmira", shared: 61, total: 148 },
              { pair: "@cryptocole → @soltrenches", shared: 44, total: 212 },
              { pair: "@degenmira → @soltrenches", shared: 38, total: 190 },
              { pair: "@lynk0x → @ricofintech", shared: 12, total: 96 },
            ].map((o) => (
              <div key={o.pair} className="border-b border-line px-3 py-1.5 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate t-xs text-fg2">{o.pair}</span>
                  <span className="t-mono text-[10.5px] text-fg3">
                    {o.shared}/{o.total}
                  </span>
                </div>
                <div className="mt-1">
                  <Gauge pct={(o.shared / o.total) * 100} tone={o.shared / o.total > 0.3 ? "bad" : "warn"} height={3} />
                </div>
              </div>
            ))}
            <p className="px-3 py-1.5 t-xs leading-relaxed text-fg4">
              Two callers sharing 41% of their follower base is either a shared audience or a
              shared operator. The distinction needs the wallet graph, below
            </p>
          </Panel>
        </div>

        <Gated
          title="The full Smart Follower graph"
          points={[
            "Per-caller follower list with entry time, entry price and current position",
            "Which follower wallets were created within 24h of the call",
            "Funding connections between follower wallets and the caller's own wallet",
            "Repeat-follower chains: the same addresses across three or more callers",
            "Historical follower outcomes for every prior call, not just the current one",
            "Wallet-cluster graph with edges labelled by the actual transfer",
            "Alerts when a tracked caller posts and a known cluster buys within five minutes",
          ]}
        />

        <p className="t-xs leading-relaxed text-fg4">
          Nothing here accuses an account of anything. It reports which wallets bought, when, and
          what they did next — the reader decides what that pattern means
        </p>
      </div>
    </div>
  );
}
