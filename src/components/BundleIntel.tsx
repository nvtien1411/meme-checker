"use client";

import Link from "next/link";
import { Demo, Gated, Gauge, Panel, Split, Stat, Tag } from "./ui";
import { Timeline } from "./viz";
import { DEMO_WALLETS, type DemoToken, type DemoWallet } from "@/lib/demo";
import { fmtPrice, fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * BUNDLE INTELLIGENCE
 *
 * A bundle percentage is not an answer. The answer is: who is in it, what
 * have they done on other launches, how long do they hold, and are they
 * already selling.
 *
 * Free shows the shape of the finding — that a group exists and how much it
 * controls — because a user who cannot see that a bundle exists cannot decide
 * whether to investigate at all. VIP shows the wallets.
 * ==================================================================== */

function walletAge(born?: string): string {
  if (!born) return "unknown";
  const d = new Date(born);
  if (Number.isNaN(d.getTime())) return "unknown";
  const days = Math.max(0, Math.round((Date.now() - d.getTime()) / 86_400_000));
  if (days < 1) return "same day";
  if (days < 30) return `${days}d old`;
  if (days < 365) return `${Math.round(days / 30)}mo old`;
  return `${(days / 365).toFixed(1)}y old`;
}

/* ------------------------------------------------------------------ *
 * Free: the finding, stated plainly.
 * ------------------------------------------------------------------ */

export function BundleFree({ demo }: { demo: DemoToken }) {
  const bundle = demo.wallets.filter((w) => w.tags?.includes("bundler"));
  const pct = bundle.reduce((n, w) => n + (w.pct ?? 0), 0);
  const stillHolding = bundle.filter((w) => w.status === "holding");
  const soldSome = bundle.filter((w) => (w.sold ?? 0) > 0);
  const funded = bundle.filter((w) => w.funder).length;

  return (
    <Panel
      title="Launch bundle"
      note="wallets that bought inside the creation block"
      flush
    >
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:grid-cols-4">
        {[
          { label: "wallets", value: `${bundle.length}`, sub: "bought block 0" },
          {
            label: "supply held",
            value: `${pct.toFixed(1)}%`,
            sub: "of total supply",
            tone: pct > 20 ? "bad" : pct > 10 ? "hot" : "warn",
          },
          {
            label: "still holding",
            value: `${stillHolding.length}`,
            sub: `${soldSome.length} have sold some`,
            tone: soldSome.length > 0 ? "warn" : "good",
          },
          {
            label: "shared funder",
            value: funded > 1 ? "yes" : "no",
            sub: funded > 1 ? `${funded} of ${bundle.length} wallets` : "no common source",
            tone: funded > 1 ? "bad" : "default",
          },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5">
            <Stat
              label={s.label}
              value={s.value}
              sub={s.sub}
              size="md"
              tone={
                s.tone === "bad" ? "bad" : s.tone === "hot" ? "hot" : s.tone === "warn" ? "warn" : s.tone === "good" ? "good" : "default"
              }
            />
          </div>
        ))}
      </div>

      <div className="px-3 py-2.5">
        <p className="t-xs leading-relaxed text-fg3">
          {pct > 20
            ? `One group bought ${pct.toFixed(1)}% of supply in the block the token was created. At this size they can move the price on their own, and nothing about the contract prevents it — the risk is entirely in these wallets.`
            : pct > 5
              ? `${bundle.length} wallets bought ${pct.toFixed(1)}% inside the creation block. That is a real position but not one that can move the market alone.`
              : "No meaningful bundle was found in the creation block. On a launchpad token this is unusual and worth verifying against the launch slot."}
        </p>

        <div className="mt-2.5 grid grid-cols-2 gap-x-4">
          <Split label="sell synchrony" tone={demo.sellSynchrony > 0.6 ? "bad" : "warn"}>
            {(demo.sellSynchrony * 100).toFixed(0)}% in one slot
          </Split>
          <Split label="exit window" tone={demo.exitWindowSec < 60 ? "bad" : "warn"}>
            {demo.exitWindowSec}s to −50%
          </Split>
          <Split label="seeded before launch" tone="hot">
            11 min window
          </Split>
          <Split label="confidence" tone="warn">
            high — same block
          </Split>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * VIP: the same finding, opened up.
 * ------------------------------------------------------------------ */

export function BundleDeep({ demo }: { demo: DemoToken }) {
  const bundle = demo.wallets.filter((w) => w.tags?.includes("bundler"));
  const pct = bundle.reduce((n, w) => n + (w.pct ?? 0), 0);
  const totalBought = bundle.reduce((n, w) => n + (w.bought ?? 0), 0);
  const totalSold = bundle.reduce((n, w) => n + (w.sold ?? 0), 0);
  const held = bundle.map((w) => w.held ?? 0).filter((h) => h > 0);

  return (
    <Gated
      title="Bundle wallets, opened up"
      points={[
        "Each wallet, its age, and the wallet that funded it",
        "What it bought and what it has already sold",
        "Its record on other launches: how many, and how many collapsed",
        "Typical holding time before the first sell",
        "Whether the group exits together or one at a time",
        "The launch-to-distribution timeline for this token",
      ]}
    >
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: "bought", value: `${totalBought.toFixed(1)}%`, sub: "of supply, block 0" },
            { label: "sold since", value: `${totalSold.toFixed(0)}%`, sub: "of their own position", tone: "warn" },
            { label: "net held", value: `${pct.toFixed(1)}%`, sub: "right now", tone: "bad" },
            {
              label: "median hold",
              value: held.length ? `${(held.reduce((a, b) => a + b, 0) / held.length).toFixed(1)}h` : "—",
              sub: "before first sell",
            },
          ].map((s) => (
            <div key={s.label} className="panel p-2.5">
              <Stat
                label={s.label}
                value={s.value}
                sub={s.sub}
                size="md"
                tone={s.tone === "warn" ? "warn" : s.tone === "bad" ? "bad" : "default"}
              />
            </div>
          ))}
        </div>

        <Panel title="The wallets" note="click through to any address" flush>
          <div className="grid grid-cols-[minmax(0,1fr)_56px_56px_52px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1 sm:grid-cols-[minmax(0,1fr)_64px_56px_56px_52px]">
            <span className="t-eyebrow">wallet</span>
            <span className="t-eyebrow text-right">bought</span>
            <span className="t-eyebrow text-right">sold</span>
            <span className="hidden t-eyebrow text-right sm:block">held</span>
            <span className="t-eyebrow text-right">holds</span>
          </div>
          {bundle.map((w) => (
            <WalletLine key={w.addr} w={w} />
          ))}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Where the money came from" note="one wallet seeded the group">
            <div className="space-y-0">
              <Split label="shared funder">
                <span className="font-mono text-[10px]">
                  {DEMO_WALLETS.funder.slice(0, 8)}…{DEMO_WALLETS.funder.slice(-6)}
                </span>
              </Split>
              <Split label="wallets it seeded here" tone="bad">
                {bundle.length} of {bundle.length}
              </Split>
              <Split label="seed window" tone="hot">
                11 minutes
              </Split>
              <Split label="also funded the deployer" tone="bad">
                yes
              </Split>
              <Split label="prior tokens with this funder">6</Split>
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg4">
              Three wallets funded from one address inside eleven minutes, all buying the creation
              block. Funded together and buying together is one participant, not three — the count
              in the free view is a count of addresses, not of people
            </p>
          </Panel>

          <Panel title="Their record elsewhere" note="what these wallets did on prior launches">
            <div className="space-y-1">
              {bundle.map((w) => (
                <div key={w.addr} className="border-b border-line pb-1.5 last:border-b-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] text-fg2">
                      {w.addr.slice(0, 5)}…{w.addr.slice(-4)}
                    </span>
                    <span className="t-xs text-fg4">{walletAge(w.born)}</span>
                    <span className="ml-auto t-mono text-[10px] text-bad">
                      {w.priorRugs ?? 0}/{w.priorLaunches ?? 0} rugs
                    </span>
                  </div>
                  <div className="mt-1">
                    <Gauge
                      pct={((w.priorRugs ?? 0) / Math.max(1, w.priorLaunches ?? 1)) * 100}
                      tone="bad"
                      height={3}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg3">
              Every wallet in this group has a majority of prior launches ending in a collapse. That
              is a record, not a prediction — but it is the only evidence available about what they
              do next
            </p>
          </Panel>
        </div>

        <Panel title="How this launch played out" note="from creation to now">
          <Timeline
            events={[
              { t: -30, kind: "accumulate", text: `Bundle buys ${totalBought.toFixed(1)}% in the creation block` },
              { t: -12, kind: "accumulate", text: "Insider wallets funded by the deployer receive 6.2%" },
              { t: -3, kind: "surge", text: "Price already up 34% with no public post yet" },
              { t: 0, kind: "post", text: "First public call — the crowd arrives" },
              { t: 12, kind: "surge", text: "Follower inflow peaks: 41 wallets in six minutes" },
              { t: 25, kind: "distribute", text: "First bundle wallet sells into the inflow" },
              { t: 40, kind: "react", text: "Price −38% from the post-call high" },
            ]}
          />
        </Panel>

        <Gated
          title="Exit playbook"
          compact
          points={[
            "Where these wallets exited on their three prior bundles, in percent from peak",
            "The median time between their first sell and a 50% drawdown",
            "Whether they exit as a group or stagger, and the spread in seconds",
            "How much of each prior launch they still held a week later",
          ]}
        >
          <Panel title="Exit playbook" note="how this group exited their three prior bundles">
            <div className="space-y-2">
              {[
                { token: "PEACH", peak: 612900, exitFrom: 0.42, hoursToPeak: 6, dumpHours: 2 },
                { token: "JELLY", peak: 420000, exitFrom: 0.61, hoursToPeak: 4, dumpHours: 1 },
                { token: "MOGX", peak: 340000, exitFrom: 0.38, hoursToPeak: 9, dumpHours: 3 },
              ].map((p) => (
                <div key={p.token} className="border-b border-line pb-1.5 last:border-b-0">
                  <div className="flex items-baseline gap-2">
                    <span className="t-xs font-semibold text-fg">{p.token}</span>
                    <span className="t-xs text-fg4">peak {fmtUsd(p.peak)}</span>
                    <span className="ml-auto t-mono text-[10px] text-bad">
                      first sell at {(p.exitFrom * 100).toFixed(0)}% of peak
                    </span>
                  </div>
                  <div className="mt-1 h-[3px] w-full bg-surf3">
                    <div className="h-full bg-bad" style={{ width: `${p.exitFrom * 100}%` }} />
                  </div>
                  <div className="mt-0.5 t-xs text-fg4">
                    peaked {p.hoursToPeak}h after launch · −90% {p.dumpHours}h after the first sell
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg3">
              Across three launches they began selling between 38% and 61% of peak, and each time the
              collapse took under three hours. The pattern is not a guarantee here, but it is the
              only measured evidence of how this group behaves
            </p>
          </Panel>
        </Gated>

        <div className="flex flex-wrap items-center gap-1.5">
          <Demo />
          <span className="t-xs text-fg4">
            bundle detection is not wired to the pipeline yet — the layout is real, the figures are not
          </span>
        </div>
      </div>
    </Gated>
  );
}

function WalletLine({ w }: { w: DemoWallet }) {
  const sold = w.sold ?? 0;
  const holds = w.pct ?? 0;
  const bought = w.bought ?? 0;
  const statusTone =
    w.status === "sold" ? "text-fg3" : w.status === "transferred" ? "text-hot" : "text-warn";

  return (
    <div className="drow grid grid-cols-[minmax(0,1fr)_56px_56px_52px] items-center gap-x-2 border-b border-line px-3 py-1.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_64px_56px_56px_52px]">
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <Link
            href={`/wallets/${w.addr}`}
            className="truncate font-mono text-[10.5px] text-fg2 hover:text-acid"
          >
            {w.addr.slice(0, 6)}…{w.addr.slice(-4)}
          </Link>
          <span className={`font-mono text-[8.5px] uppercase tracking-[0.05em] ${statusTone}`}>
            {w.status ?? "holding"}
          </span>
          {(w.priorRugs ?? 0) > 0 && <Tag tone="bad">{w.priorRugs}r</Tag>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="t-xs text-fg4">{walletAge(w.born)}</span>
          {w.funder && (
            <span className="t-xs text-fg4">
              funded by{" "}
              <span className="font-mono text-fg3">
                {w.funder.slice(0, 4)}…{w.funder.slice(-4)}
              </span>
            </span>
          )}
          {w.avgEntry !== undefined && (
            <span className="t-xs text-fg4">entry {fmtPrice(w.avgEntry)}</span>
          )}
        </div>
      </div>
      <span className="text-right t-mono text-[10.5px] tabular-nums text-fg3">{bought.toFixed(2)}%</span>
      <span className={`text-right t-mono text-[10.5px] tabular-nums ${sold > 0 ? "text-hot" : "text-fg4"}`}>
        {sold > 0 ? `${sold}%` : "—"}
      </span>
      <span className="hidden text-right t-mono text-[10px] tabular-nums text-fg4 sm:block">
        {w.held !== undefined && w.held > 0 ? `${w.held}h` : "—"}
      </span>
      <span className={`text-right t-mono text-[11px] tabular-nums ${holds > 10 ? "text-bad" : "text-fg2"}`}>
        {holds.toFixed(2)}%
      </span>
    </div>
  );
}
