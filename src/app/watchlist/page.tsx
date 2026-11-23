import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, ProReveal, RiskDot, Stat, Tag } from "@/components/ui";
import { WatchedWalletIntel } from "@/components/Intelligence3";
import { DEMO_TOKENS, DEMO_WALLETS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * WATCHLIST
 *
 * The page that decides whether this product is opened tomorrow. Its value is
 * not the list — it is the delta: what changed since you added it.
 * ==================================================================== */

export const metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  const watched = DEMO_TOKENS.slice(0, 4).map((t, i) => ({
    ...t,
    addedAt: ["2h ago", "1d ago", "3d ago", "6d ago"][i],
    mcapThen: [51200, 1580000, 940000, 3300000][i],
    riskThen: ["moderate", "moderate", "high", "low"][i],
    notes: [
      "watching the bundle wallet — 18.7% still unsold",
      "",
      "flagged on launch, added to see if it dumps",
      "baseline, tracking for a narrative study",
    ][i],
  }));

  return (
    <div>
      <PageHead
        title="Watchlist"
        note="what changed since you added it"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{watched.length} tokens</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <ProReveal
          title="What your watched wallets did since you added them"
          value="Behaviour, exits and co-appearances for every address on this list"
          clip={4}
          shown={0}
          rows={[]}
          more={[
            "Behaviour of each watched address across every launch it appears on",
            "Whether it has sold since you started watching, and at what point of the peak",
            "Addresses that keep appearing alongside your watched wallets",
            "Which of your watched callers are selling above their own call price",
            "Alerts on wallet behaviour rather than price movement",
          ]}
          note="A watchlist that only reports price is a chart. Watching what an address does is the version that gives you a warning before the chart moves"
        >
          <WatchedWalletIntel />
        </ProReveal>

        <Panel title="The point of this page" note="a list is not a workspace; the change is">
          <p className="t-xs leading-relaxed text-fg3">
            A token you checked three days ago at $51k is now $43k. A token whose risk you recorded
            as moderate now has a bundle wallet selling. Those two facts are the whole reason to
            come back — a static list of names you once liked is a bookmarks folder
          </p>
        </Panel>

        {watched.map((t) => {
          const delta = ((t.mcap - t.mcapThen) / t.mcapThen) * 100;
          const riskChanged = t.risk !== t.riskThen;
          return (
            <article key={t.mint} className="panel">
              <div className="flex flex-wrap items-center gap-x-2.5 border-b border-line px-3 py-2">
                <RiskDot risk={t.risk} />
                <Link href={`/token/${t.chain}/${t.mint}`} className="t-section text-fg hover:text-acid">
                  {t.symbol}
                </Link>
                <span className="t-xs text-fg4">{t.name}</span>
                <Tag tone="neutral">{t.chain}</Tag>
                {riskChanged && <Tag tone="bad">risk changed</Tag>}
                <span className="ml-auto t-mono text-[10px] text-fg4">added {t.addedAt}</span>
              </div>

              <div className="grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
                {[
                  { label: "mcap now", value: fmtUsd(t.mcap), tone: "default" },
                  {
                    label: "since added",
                    value: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`,
                    tone: delta < -15 ? "bad" : delta > 15 ? "good" : "default",
                  },
                  { label: "risk", value: t.risk, tone: t.risk === "critical" ? "bad" : t.risk === "high" ? "hot" : "default" },
                  { label: "top 10", value: `${t.bundlePct.toFixed(1)}%`, tone: t.bundlePct > 15 ? "bad" : "default" },
                ].map((s) => (
                  <div key={s.label} className="px-3 py-2">
                    <Stat
                      label={s.label}
                      value={s.value}
                      size="sm"
                      tone={s.tone === "bad" ? "bad" : s.tone === "hot" ? "hot" : s.tone === "good" ? "good" : "default"}
                    />
                  </div>
                ))}
              </div>

              {t.notes && (
                <div className="border-t border-line px-3 py-1.5">
                  <span className="t-eyebrow">your note</span>
                  <p className="mt-0.5 t-xs text-fg3">{t.notes}</p>
                </div>
              )}

              <div className="border-t border-line px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/token/${t.chain}/${t.mint}`}
                    className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] text-fg3 hover:border-line2 hover:text-acid"
                  >
                    re-scan
                  </Link>
                  <button
                    type="button"
                    className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] text-fg3 hover:border-line2 hover:text-fg"
                  >
                    note
                  </button>
                  <button
                    type="button"
                    className="border border-line px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.05em] text-fg3 hover:border-bad/50 hover:text-bad"
                  >
                    remove
                  </button>
                  <span className="ml-auto t-xs text-fg4">actions are illustrative in this build</span>
                </div>
              </div>
            </article>
          );
        })}

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Watched wallets" note="addresses you are tracking across tokens" flush>
            {[DEMO_WALLETS.bundle1, DEMO_WALLETS.smart1, DEMO_WALLETS.dev].map((addr, i) => (
              <div key={addr} className="flex items-baseline gap-2 border-b border-line px-3 py-1.5 last:border-b-0">
                <span className="font-mono text-[10.5px] text-fg2">
                  {addr.slice(0, 6)}…{addr.slice(-4)}
                </span>
                <Tag tone={i === 1 ? "good" : "bad"}>
                  {i === 0 ? "bundler" : i === 1 ? "smart money" : "deployer"}
                </Tag>
                <span className="ml-auto t-mono text-[10px] text-fg4">
                  {i === 0 ? "1 token" : i === 1 ? "3 tokens" : "4 launches"}
                </span>
              </div>
            ))}
          </Panel>

          <Panel title="Watched callers" note="accounts you are grading" flush>
            {["cryptocole", "lynk0x"].map((h) => (
              <Link
                key={h}
                href={`/callers/${h}`}
                className="drow flex items-baseline gap-2 border-b border-line px-3 py-1.5 last:border-b-0"
              >
                <span className="t-xs text-fg2">@{h}</span>
                <span className="ml-auto t-mono text-[10px] text-fg4">added 3d ago</span>
              </Link>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
