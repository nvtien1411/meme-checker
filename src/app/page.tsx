import Link from "next/link";
import { ScanInput } from "@/components/ScanInput";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, RiskDot, Tag } from "@/components/ui";
import { DEMO_CALLERS, DEMO_RUGS, DEMO_TOKENS } from "@/lib/demo";
import { fmtAge, fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * SCANNER — the operational homepage
 *
 * Not a landing page. There is no hero, no value proposition, no gradient
 * banner. The product is a field you paste into, followed by everything you
 * would otherwise have to open a second tab to see: what is moving, what
 * just died, who is calling what.
 *
 * The order is the order a trader works in: input → what is hot → what broke
 * → who is talking. Each block is a rail into a deeper workspace, so the
 * homepage is the top of a funnel rather than a wall.
 * ==================================================================== */

export const metadata = { title: "Token Scan" };

export default function HomePage() {
  const hot = [...DEMO_TOKENS].sort((a, b) => b.vol24 / b.liq - a.vol24 / a.liq).slice(0, 5);
  // Fresh excludes what is already listed above — the same token in two tables
  // in one viewport spends space without adding a decision.
  const hotMints = new Set(hot.map((t) => t.mint));
  const fresh = DEMO_TOKENS.filter((t) => !hotMints.has(t.mint)).sort((a, b) => a.ageHours - b.ageHours);
  const rugs = DEMO_RUGS.slice(0, 4);
  const callers = [...DEMO_CALLERS].sort((a, b) => b.smartFollowers - a.smartFollowers).slice(0, 4);

  return (
    <div>
      <PageHead
        title="Token Scan"
        note="paste a contract, or start from what is moving"
        right={
          <>
            <Demo />
            <Tag tone="neutral">9 chains</Tag>
          </>
        }
      />

      <div className="space-y-3 p-3 sm:p-4">
        {/* ---------------- scan ---------------- */}
        <section className="panel">
          <div className="border-b border-line px-3 py-2">
            <h2 className="t-section text-fg">Check a token</h2>
            <p className="mt-0.5 t-xs text-fg4">
              Every check carries the number behind it and the source it came from. What cannot be
              verified is marked unknown — it never becomes a pass
            </p>
          </div>
          <div className="p-3">
            <ScanInput autoFocus />
          </div>
        </section>

        {/* ---------------- hot ---------------- */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Panel
            title="Moving now"
            note="volume against liquidity, highest first"
            flush
            right={
              <Link href="/discover" className="text-acid hover:underline">
                discover →
              </Link>
            }
          >
            <div className="flex items-baseline gap-1.5 border-b border-line bg-surf2/30 px-3 py-1">
              <span className="t-xs text-fg4">risk score, 0 clean to 100 critical — higher is worse</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,72px))_56px] items-baseline gap-x-3 border-b border-line px-3 py-1">
              <span className="t-eyebrow">token</span>
              <span className="t-eyebrow text-right">mcap</span>
              <span className="t-eyebrow text-right">vol/liq</span>
              <span className="t-eyebrow text-right">risk</span>
            </div>
            {hot.map((t) => {
              const vp = t.vol24 / t.liq;
              return (
                <Link
                  key={t.mint}
                  href={`/token/${t.chain}/${t.mint}`}
                  className="drow grid grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,72px))_56px] items-center gap-x-3 border-b border-line px-3 py-1.5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-baseline gap-1.5">
                    <span className="truncate t-strong text-fg">{t.symbol}</span>
                    <span className="shrink-0 t-xs text-fg4">{t.chain}</span>
                    <span className="shrink-0 t-xs text-fg4">· {fmtAge(t.ageHours)}</span>
                  </div>
                  <span className="text-right t-mono text-[11.5px] text-fg2">{fmtUsd(t.mcap)}</span>
                  <span
                    className={`text-right t-mono text-[11.5px] ${
                      vp > 8 ? "text-hot" : vp > 3 ? "text-warn" : "text-fg3"
                    }`}
                  >
                    {vp.toFixed(1)}×
                  </span>
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="t-mono text-[10.5px] tabular-nums text-fg3">{t.score}</span>
                    <RiskDot risk={t.risk} />
                  </span>
                </Link>
              );
            })}
          </Panel>

          <Panel title="Fresh launches" note="newest first" flush>
            {fresh.map((t) => (
              <Link
                key={t.mint}
                href={`/token/${t.chain}/${t.mint}`}
                className="drow grid grid-cols-[minmax(0,1fr)_48px_52px] items-center gap-x-2.5 border-b border-line px-3 py-1.5 last:border-b-0"
              >
                <span className="truncate t-strong text-fg">{t.symbol}</span>
                <span className="text-right t-mono text-[10px] text-fg4">{fmtAge(t.ageHours)}</span>
                <span className="flex items-center justify-end gap-1">
                  <span className="t-mono text-[10px] tabular-nums text-fg3">{t.score}</span>
                  <RiskDot risk={t.risk} />
                </span>
              </Link>
            ))}
            {fresh.length === 0 && (
              <p className="px-3 py-2 t-xs leading-relaxed text-fg4">No token in the tracked set is outside the list on the left. On a live feed this table would carry launches from the last hour</p>
            )}
          </Panel>
        </div>

        {/* ---------------- rugs + callers ---------------- */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <Panel
            title="Recently rugged"
            note="confirmed collapses, with the signal that fired"
            flush
            right={
              <Link href="/rugs" className="text-acid hover:underline">
                database →
              </Link>
            }
          >
            {rugs.map((r) => (
              <div key={r.mint} className="border-b border-line px-3 py-2 last:border-b-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="t-strong text-fg">{r.symbol}</span>
                  <Tag
                    tone={r.flag === "confirmed" ? "bad" : r.flag === "reported" ? "hot" : "warn"}
                  >
                    {r.flag}
                  </Tag>
                  <span className="ml-auto t-mono text-[10.5px] text-bad">
                    −{r.drawdownPct.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="t-xs text-fg4">peak {fmtUsd(r.peakMc)}</span>
                  <span aria-hidden className="h-2.5 w-px bg-line" />
                  <span className="t-xs text-fg3">{r.signals[0]}</span>
                  <span className="t-mono text-[9.5px] text-fg4">· {r.at}</span>
                </div>
              </div>
            ))}
          </Panel>

          <Panel
            title="Callers worth checking"
            note="ranked by wallets that repeatedly buy after their post"
            flush
            right={
              <Link href="/callers" className="text-acid hover:underline">
                all callers →
              </Link>
            }
          >
            {callers.map((c) => (
              <Link
                key={c.handle}
                href={`/callers/${c.handle}`}
                className="drow flex items-center gap-2.5 border-b border-line px-3 py-2 last:border-b-0"
              >
                <div className="grid h-6 w-6 shrink-0 place-items-center border border-line bg-surf2 font-mono text-[10px] text-fg2">
                  {c.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate t-strong text-fg">@{c.handle}</span>
                    {c.exitVsCall > 1.3 && <Tag tone="bad">sells above call</Tag>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="t-mono text-[10px] text-fg4">{c.followers.toLocaleString("en-US")}</span>
                    <span className="t-mono text-[10px] text-fg4">·</span>
                    <span className="t-mono text-[10px] text-fg4">
                      {(c.wins / c.calls * 100).toFixed(0)}% win
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="t-mono text-[13px] text-acid">{c.smartFollowers}</div>
                  <div className="t-eyebrow">followers</div>
                </div>
              </Link>
            ))}
          </Panel>
        </div>

        {/* ---------------- what the tool does ---------------- */}
        <Panel title="What a scan answers" note="eight questions, in the order that decides money">
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {[
              ["Can you sell it", "freeze authority, honeypot simulation, transfer tax"],
              ["Is the supply fixed", "mint authority, post-launch issuance"],
              ["Can the liquidity be pulled", "LP lock, burn, ownership of the pool"],
              ["Does one wallet hold too much", "top-10 share with pools and curves removed"],
              ["Is the supply one entity in disguise", "shared funding, identical buy sizing, same-block entries"],
              ["Has the creator done this before", "every prior launch and how each one ended"],
              ["Is the trading real", "two-way flow, organic volume share, wash patterns"],
              ["Can you actually get out", "size sellable before 5% slippage"],
            ].map(([q, how]) => (
              <div key={q} className="flex items-start gap-2 border-b border-line py-1.5 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
                <div className="min-w-0">
                  <div className="t-xs text-fg2">{q}</div>
                  <div className="t-xs text-fg4">{how}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <p className="px-1 pb-2 t-xs leading-relaxed text-fg4">
          Not a signal service and not advice. A failed lookup is never a verdict, and a module that
          was never run is never a pass
        </p>
      </div>
    </div>
  );
}
