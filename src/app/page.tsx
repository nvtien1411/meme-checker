import Link from "next/link";
import { ScanInput } from "@/components/ScanInput";
import { Demo, Panel, RiskDot, Tag } from "@/components/ui";
import { DEMO_CALLS, DEMO_RUGS, DEMO_TOKENS, callerByHandle } from "@/lib/demo";
import { fmtAge, fmtUsd } from "@/lib/http";

/* ==================================================================== *
 * PULSE — the command centre
 *
 * The previous homepage was five stacked panels at the same visual weight as
 * every other page, which made the product's front door indistinguishable from
 * its filing cabinet. This is laid out as one screen read in the order a trader
 * actually works:
 *
 *   1. paste something        the only reason the page exists
 *   2. four doors             the four things people open this for
 *   3. the tape               what is moving, what just launched
 *   4. alpha                  who called what, and how it went
 *   5. warning                what broke
 *   6. resume                 where you left off
 *
 * No hero copy, no value proposition, no decorative chart. Every row links
 * somewhere real, and the demo badge sits in the header where it cannot be
 * missed rather than at the bottom of a card.
 * ==================================================================== */

export const metadata = { title: "Pulse" };

/** A timestamp rendered as how long ago, without pretending it is live.
 *
 *  A fixed reference is used rather than Date.now(): reading the clock during
 *  prerender is an unstable value, the build rejects it, and it would make the
 *  static page differ from the hydrated one. The reference is the newest event
 *  in the demo set, so "2h" means "2h before the newest call", which is stated
 *  in the panel note. */
const REFERENCE = Math.max(...DEMO_CALLS.map((c) => Date.parse(c.at)));

function ago(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "—";
  return fmtAge(Math.max(0, (REFERENCE - ms) / 36e5));
}

const DOORS = [
  {
    href: "/",
    glyph: "M2 8h3l2-4 2 8 2-4h3",
    label: "Token Scan",
    ask: "Is this safe to touch?",
    meta: "8 checks + bundle, sniper, insider",
  },
  {
    href: "/discover",
    glyph: "M8 2.5 9.7 6.3 14 7l-3 3 .7 4.2L8 12.4 4.3 14.2 5 10 2 7l4.3-.7z",
    label: "New Pairs",
    ask: "What just launched?",
    meta: "fresh + moving, ranked",
  },
  {
    href: "/smart-followers",
    glyph:
      "M2.5 12.5c1.5-2.5 3.5-4 5.5-4s4 1.5 5.5 4M8 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    label: "Smart Money",
    ask: "Who is buying well?",
    meta: "wallets that repeat on winners",
    pro: true,
  },
  {
    href: "/callers",
    glyph:
      "M6 7a2.2 2.2 0 1 0 0-4.4A2.2 2.2 0 0 0 6 7zM2 13c0-2 1.8-3.2 4-3.2s4 1.2 4 3.2M11 8.4a1.8 1.8 0 1 0 0-3.6M11.5 13c0-1.6-.6-2.6-1.5-3.2",
    label: "Alpha Calls",
    ask: "What is X calling?",
    meta: "public posts, free",
  },
];

export default function PulsePage() {
  const tape = [...DEMO_TOKENS].sort((a, b) => b.vol24 / b.liq - a.vol24 / a.liq);
  const fresh = [...DEMO_TOKENS].sort((a, b) => a.ageHours - b.ageHours).slice(0, 4);
  const rugs = DEMO_RUGS.slice(0, 3);

  // Calls, newest first. This is the section that makes the homepage a terminal
  // rather than a directory: something happened, here it is.
  const calls = [...DEMO_CALLS].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 6);

  // Tokens where the tracked set already shows real bundle or insider weight.
  // Same numbers the report page reads — the radar is not a separate opinion.
  const dangerous = [...DEMO_TOKENS]
    .filter((t) => t.bundlePct > 15 || t.insiderPct > 5)
    .sort((a, b) => b.bundlePct + b.insiderPct * 2 - (a.bundlePct + a.insiderPct * 2))
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-3 pb-10 sm:px-4">
      {/* ---------------- 1. the input ---------------- */}
      <section className="pt-4 sm:pt-7">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="t-display text-[19px] leading-tight text-fg sm:text-[23px]">
            Find the next runner. Avoid the next rug
          </h1>
          <div className="ml-auto flex items-center gap-1.5">
            <Demo />
            <Tag tone="neutral">9 chains</Tag>
          </div>
        </div>

        <div className="mt-3 border border-line bg-surf">
          <ScanInput autoFocus />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="t-xs text-fg4">or jump straight to</span>
          <Link href="/wallets" className="t-xs text-acid hover:underline">
            a wallet
          </Link>
          <span aria-hidden className="h-2.5 w-px bg-line" />
          <Link href="/deployers" className="t-xs text-acid hover:underline">
            a deployer
          </Link>
          <span aria-hidden className="h-2.5 w-px bg-line" />
          <Link href="/investigation" className="t-xs text-acid hover:underline">
            the wallet network
          </Link>
          <span className="ml-auto hidden t-xs text-fg4 sm:inline">
            press <kbd className="border border-line px-1 font-mono text-[8.5px]">⌘K</kbd> anywhere
          </span>
        </div>
      </section>

      {/* ---------------- 2. four doors ---------------- */}
      <section className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {DOORS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group flex flex-col gap-1 border border-line bg-surf px-2.5 py-2 transition-colors hover:border-fg4/60"
          >
            <div className="flex items-center gap-1.5">
              <svg
                viewBox="0 0 16 16"
                className="h-[13px] w-[13px] shrink-0 text-fg4 group-hover:text-acid"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d={d.glyph} />
              </svg>
              <span className="t-eyebrow">{d.label}</span>
              {d.pro && (
                <span className="ml-auto font-mono text-[8px] uppercase text-acid/70">pro</span>
              )}
            </div>
            <span className="t-xs leading-snug text-fg2">{d.ask}</span>
            <span className="mt-auto font-mono text-[9px] text-fg4">{d.meta}</span>
          </Link>
        ))}
      </section>

      {/* ---------------- 3. the tape ---------------- */}
      <section className="mt-3 grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Moving now"
          note="volume against liquidity — the ratio that means someone is trading, not just holding"
          flush
          right={
            <Link href="/discover" className="text-acid hover:underline">
              all →
            </Link>
          }
        >
          <div className="grid grid-cols-[minmax(0,1fr)_62px_50px_42px] items-baseline gap-x-2 border-b border-line px-2.5 py-1">
            <span className="t-eyebrow">token</span>
            <span className="t-eyebrow text-right">mcap</span>
            <span className="t-eyebrow text-right">vol/liq</span>
            <span className="t-eyebrow text-right">risk</span>
          </div>
          {tape.map((t) => {
            const vp = t.vol24 / t.liq;
            return (
              <Link
                key={t.mint}
                href={`/token/${t.chain}/${t.mint}`}
                className="drow grid grid-cols-[minmax(0,1fr)_62px_50px_42px] items-center gap-x-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
              >
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <span className="truncate t-strong text-fg">{t.symbol}</span>
                  <span className="shrink-0 t-xs text-fg4">{t.chain}</span>
                  <span className="shrink-0 t-xs text-fg4">· {fmtAge(t.ageHours)}</span>
                </div>
                <span className="text-right t-mono text-[11px] text-fg2">{fmtUsd(t.mcap)}</span>
                <span
                  className={`text-right t-mono text-[11px] ${
                    vp > 8 ? "text-hot" : vp > 3 ? "text-warn" : "text-fg3"
                  }`}
                >
                  {vp.toFixed(1)}×
                </span>
                <span className="flex items-center justify-end gap-1">
                  <span className="t-mono text-[10px] tabular-nums text-fg3">{t.score}</span>
                  <RiskDot risk={t.risk} />
                </span>
              </Link>
            );
          })}
        </Panel>

        <div className="space-y-2.5">
          <Panel
            title="New pairs"
            note="newest first"
            flush
            right={
              <Link href="/discover" className="text-acid hover:underline">
                more →
              </Link>
            }
          >
            {fresh.map((t) => (
              <Link
                key={t.mint}
                href={`/token/${t.chain}/${t.mint}`}
                className="drow flex items-center gap-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate t-strong text-fg">{t.symbol}</span>
                <span className="shrink-0 t-mono text-[9.5px] text-fg4">{fmtAge(t.ageHours)}</span>
                <span className="shrink-0 t-mono text-[9.5px] tabular-nums text-fg3">{t.score}</span>
                <RiskDot risk={t.risk} />
              </Link>
            ))}
          </Panel>

          <Panel
            title="Risk radar"
            note="bundle or insider weight already visible in the tracked set"
            flush
            right={
              <Link href="/rugs" className="text-acid hover:underline">
                archive →
              </Link>
            }
          >
            {dangerous.map((t) => (
              <Link
                key={t.mint}
                href={`/token/${t.chain}/${t.mint}`}
                className="drow flex items-baseline gap-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate t-strong text-fg">{t.symbol}</span>
                {t.bundlePct > 15 && (
                  <span className="shrink-0 t-mono text-[9.5px] text-bad">
                    bundle {t.bundlePct.toFixed(0)}%
                  </span>
                )}
                {t.insiderPct > 5 && (
                  <span className="shrink-0 t-mono text-[9.5px] text-hot">
                    insider {t.insiderPct.toFixed(1)}%
                  </span>
                )}
              </Link>
            ))}
          </Panel>
        </div>
      </section>

      {/* ---------------- 4 + 5. alpha and what broke ---------------- */}
      <section className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Alpha calls"
          note="public X posts, free to read · ages are relative to the newest call in the set"
          flush
          right={
            <Link href="/callers" className="text-acid hover:underline">
              all callers →
            </Link>
          }
        >
          <div className="grid grid-cols-[minmax(0,1fr)_74px_54px_48px] items-baseline gap-x-2 border-b border-line px-2.5 py-1">
            <span className="t-eyebrow">caller · token</span>
            <span className="t-eyebrow text-right">at call</span>
            <span className="t-eyebrow text-right">when</span>
            <span className="t-eyebrow text-right">result</span>
          </div>
          {calls.map((c, i) => {
            const caller = callerByHandle(c.handle);
            const tone =
              c.outcome === "won" ? "text-acid" : c.outcome === "flat" ? "text-fg3" : "text-bad";
            const chain = DEMO_TOKENS.find((t) => t.mint === c.mint)?.chain ?? "solana";
            return (
              <div
                key={c.handle + c.symbol + i}
                className="drow grid grid-cols-[minmax(0,1fr)_74px_54px_48px] items-center gap-x-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
              >
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <Link
                    href={`/callers/${c.handle}`}
                    className="shrink-0 truncate t-mono text-[10.5px] text-fg3 hover:text-acid"
                  >
                    @{c.handle}
                  </Link>
                  <span aria-hidden className="shrink-0 t-xs text-fg4">
                    ·
                  </span>
                  <Link
                    href={`/token/${chain}/${c.mint}`}
                    className="truncate t-strong text-fg hover:text-acid"
                  >
                    {c.symbol}
                  </Link>
                </div>
                <span className="text-right t-mono text-[10.5px] text-fg2">
                  {fmtUsd(c.mcAtCall)}
                </span>
                <span className="text-right t-mono text-[9.5px] text-fg4">{ago(c.at)}</span>
                <a
                  href={c.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`text-right t-mono text-[9.5px] uppercase hover:underline ${tone}`}
                  title={`${caller?.name ?? c.handle} — post opens on X`}
                >
                  {c.outcome}
                </a>
              </div>
            );
          })}
        </Panel>

        <Panel
          title="Just went wrong"
          note="collapses with the signal that fired first"
          flush
          right={
            <Link href="/rugs" className="text-acid hover:underline">
              archive →
            </Link>
          }
        >
          {rugs.map((r) => (
            <div key={r.mint} className="border-b border-line px-2.5 py-[6px] last:border-b-0">
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="t-strong text-fg">{r.symbol}</span>
                <Tag tone={r.flag === "confirmed" ? "bad" : r.flag === "reported" ? "hot" : "warn"}>
                  {r.flag}
                </Tag>
                <span className="ml-auto t-mono text-[10.5px] text-bad">
                  −{r.drawdownPct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5">
                <span className="t-xs text-fg4">peak {fmtUsd(r.peakMc)}</span>
                <span aria-hidden className="h-2.5 w-px bg-line" />
                <span className="t-xs text-fg3">{r.signals[0]}</span>
              </div>
            </div>
          ))}
        </Panel>
      </section>

      {/* ---------------- 6. resume ---------------- */}
      <section className="mt-2.5 border border-line bg-surf px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="t-eyebrow">continue</span>
          <Link href="/history" className="t-xs text-fg3 hover:text-acid">
            scan history →
          </Link>
          <Link href="/watchlist" className="t-xs text-fg3 hover:text-acid">
            watchlist →
          </Link>
          <Link href="/investigation" className="t-xs text-fg3 hover:text-acid">
            last investigation →
          </Link>
          <span className="ml-auto hidden t-xs text-fg4 sm:inline">
            scans, wallets and graphs reopen where you left them
          </span>
        </div>
      </section>

      <p className="mt-3 px-0.5 t-xs leading-relaxed text-fg4">
        Not a signal service and not advice. A failed lookup is never a verdict, and a module that
        was never run is never a pass
      </p>
    </div>
  );
}
