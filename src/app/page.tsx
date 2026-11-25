import Link from "next/link";
import { ScanInput } from "@/components/ScanInput";
import { Demo, Panel, RiskDot } from "@/components/ui";
import { DEMO_CALLS, DEMO_RUGS, DEMO_TOKENS, callerByHandle, shortAddr } from "@/lib/demo";
import { fmtAge, fmtUsd } from "@/lib/http";
import { deployerRecord } from "@/lib/intel2";

/* ==================================================================== *
 * HOME
 *
 * Reference points, taken from shipping terminals rather than from design
 * principles: GMGN's front page is a paste field above a dense table, with no
 * sentence anywhere explaining what the site does. Axiom's is a list. Neither
 * opens with a slogan, four feature cards, or a paragraph.
 *
 * This page had all three. The slogan competed with ANALYZE for the eye, the
 * four cards restated the sidebar, and the result was a page where nothing was
 * the focus. Rewritten so there is exactly one thing to do, one row of
 * shortcuts, and then data:
 *
 *   1. paste        full width, the only bordered box that is not a table
 *   2. shortcuts    one line of text links, not four cards
 *   3. the tape     what is moving, what broke, what got called
 *
 * No value proposition, no "or jump straight to", no ⌘K hint in the body (the
 * top strip already carries the search).
 * ==================================================================== */

export const metadata = { title: "Meme Checker — token scan" };

const REFERENCE = Math.max(...DEMO_CALLS.map((c) => Date.parse(c.at)));

function ago(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "—";
  return fmtAge(Math.max(0, (REFERENCE - ms) / 36e5));
}

export default function HomePage() {
  const tape = [...DEMO_TOKENS].sort((a, b) => b.vol24 / b.liq - a.vol24 / a.liq).slice(0, 10);
  const fresh = [...DEMO_TOKENS]
    .filter((t) => t.ageHours <= 72)
    .sort((a, b) => a.ageHours - b.ageHours)
    .slice(0, 5);
  const broken = DEMO_RUGS.slice(0, 5);
  const deployers = [...new Set(DEMO_RUGS.map((r) => r.deployer))]
    .map((addr) => deployerRecord(addr))
    .filter((d): d is NonNullable<ReturnType<typeof deployerRecord>> => d !== null)
    .sort((a, b) => b.launchCount - a.launchCount)
    .slice(0, 9);
  const calls = [...DEMO_CALLS].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 9);

  return (
    <div className="pb-14">
      {/*
        ONE AXIS. The scan box was max-w-760 centred while the tables below were
        max-w-1440, so the field sat on a different vertical line than every
        panel under it — the single most common thing that makes a dense page
        feel assembled rather than designed. Both now share one container, and
        the field is constrained by its own max-width without being re-centred.
      */}
      <div className="mx-auto w-full max-w-[1440px] px-3 pt-5 sm:px-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="t-page">Check a token</h1>
          <span className="hidden t-xs text-fg4 sm:inline">
            paste a contract, get every check
          </span>
          <span className="ml-auto">
            <Demo />
          </span>
        </div>

        <div className="mt-3 max-w-[820px]">
          <ScanInput autoFocus />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-3 pt-5 sm:px-4">
        {/* ---------------- the tape ---------------- */}
        <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="space-y-2.5">
            <Panel
              title="Moving now"
              flush
              right={
                <Link href="/discover" className="text-fg3 hover:text-fg hover:underline">
                  all →
                </Link>
              }
            >
              <div className="grid grid-cols-[minmax(0,1fr)_60px_52px_40px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-2.5 py-1">
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
                    className="drow grid grid-cols-[minmax(0,1fr)_60px_52px_40px] items-center gap-x-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
                  >
                    <div className="flex min-w-0 items-baseline gap-1.5">
                      <span className="truncate t-strong text-fg">{t.symbol}</span>
                      <span className="shrink-0 t-xs text-fg4">· {fmtAge(t.ageHours)}</span>
                    </div>
                    <span className="text-right t-mono text-[10.5px] tabular-nums text-fg2">
                      {fmtUsd(t.mcap)}
                    </span>
                    <span
                      className={`text-right t-mono text-[10.5px] tabular-nums ${
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
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="font-mono text-[8.5px] uppercase tracking-[0.05em] text-fg4">
                  risk
                </span>
                <span className="flex items-center gap-1 t-xs text-fg4">
                  <RiskDot risk="low" />0–34
                  <RiskDot risk="moderate" />35–54
                  <RiskDot risk="high" />55–69
                  <RiskDot risk="critical" />70+
                </span>
              </div>
            </Panel>

            {/* The left column ended ~200px before the right one, which read as an
                unfinished page rather than a dense one. This is not padding: it is
                the question a reader asks next after "what is moving" — who keeps
                launching the tokens that die. */}
            <Panel
              title="Launch records"
              flush
              className="flex flex-1 flex-col"
              right={
                <Link href="/deployers" className="text-fg3 hover:text-fg hover:underline">
                  all →
                </Link>
              }
            >
              {deployers.map((d) => (
                <Link
                  key={d.addr}
                  href={`/deployers/${d.addr}`}
                  className="drow flex items-center gap-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate t-mono text-[10.5px] text-fg2">
                    {shortAddr(d.addr, 6, 4)}
                  </span>
                  <span className="shrink-0 t-mono text-[10px] tabular-nums text-fg3">
                    {d.launchCount} {d.launchCount === 1 ? "launch" : "launches"}
                  </span>
                  <span
                    className={`shrink-0 t-mono text-[10px] tabular-nums ${
                      d.rugCount > 0 ? "text-bad" : "text-good"
                    }`}
                  >
                    {d.rugCount > 0 ? `${d.rugCount} dead` : "clean"}
                  </span>
                </Link>
              ))}
            </Panel>
          </div>



          <div className="space-y-2.5">
          <Panel
          title="Just broke"
          flush
          right={
          <Link href="/rugs" className="text-fg3 hover:text-fg hover:underline">
          archive →
          </Link>
          }
          >
          {broken.map((r) => (
          <Link
          key={r.mint}
          href={`/token/${r.chain}/${r.mint}`}
          className="drow flex items-center gap-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
          >
          <span className="min-w-0 flex-1 truncate t-strong text-fg">{r.symbol}</span>
          <span className="shrink-0 t-xs text-fg4">{r.at.slice(5)}</span>
          <span className="shrink-0 t-mono text-[10px] tabular-nums text-bad">
          −{r.drawdownPct.toFixed(0)}%
          </span>
          </Link>
          ))}
          </Panel>
            <Panel
              title="Just launched"
              flush
              right={
                <Link href="/discover" className="text-fg3 hover:text-fg hover:underline">
                  more →
                </Link>
              }
            >
              <div className="flex items-center gap-2 border-b border-line bg-surf2/40 px-2.5 py-1">
                <span className="min-w-0 flex-1 t-eyebrow">token</span>
                <span className="t-eyebrow">age</span>
                <span className="t-eyebrow">risk</span>
              </div>
              {fresh.map((t) => (
                <Link
                  key={t.mint}
                  href={`/token/${t.chain}/${t.mint}`}
                  className="drow flex items-center gap-2 border-b border-line px-2.5 py-[5px] last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate t-strong text-fg">{t.symbol}</span>
                  <span className="shrink-0 t-mono text-[9.5px] tabular-nums text-fg4">
                    {fmtAge(t.ageHours)}
                  </span>
                  <span className="shrink-0 t-mono text-[9.5px] tabular-nums text-fg3">
                    {t.score}
                  </span>
                  <RiskDot risk={t.risk} />
                </Link>
              ))}
            </Panel>

            <Panel
              title="Latest calls"
              flush
              right={
                <Link href="/callers" className="text-fg3 hover:text-fg hover:underline">
                  all →
                </Link>
              }
            >
              {calls.map((c) => {
                const caller = callerByHandle(c.handle);
                return (
                  <Link
                    key={`${c.handle}-${c.mint}-${c.at}`}
                    href={`/callers/${c.handle}`}
                    className="drow flex items-baseline gap-1.5 border-b border-line px-2.5 py-[5px] last:border-b-0"
                  >
                    <span className="w-7 shrink-0 t-mono text-[9px] text-fg4">{ago(c.at)}</span>
                    <span className="min-w-0 flex-1 truncate t-xs text-fg2">
                      {c.symbol}
                      <span className="text-fg4"> @</span>
                      {c.handle}
                      {caller && caller.exitVsCall > 1 && c.hoursToPeak === null && (
                        <span
                          className="ml-1.5 font-mono text-[8.5px] uppercase text-bad"
                          title="Their exit landed above the call price and the call never recovered"
                        >
                          exit on call
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 text-right t-mono text-[10px] tabular-nums ${
                        c.hoursToPeak === null ? "text-bad" : "text-good"
                      }`}
                    >
                      {c.hoursToPeak === null ? "dead" : `${(c.peakMc / c.mcAtCall).toFixed(1)}×`}
                    </span>
                  </Link>
                );
              })}
            </Panel>
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-fg4/70">
          Not advice. Scores describe what the pipeline could measure
        </p>
      </div>
    </div>
  );
}
