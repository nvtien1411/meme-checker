import Link from "next/link";
import { ScanInput } from "@/components/ScanInput";
import { Demo } from "@/components/ui";
import { DEMO_TOKENS } from "@/lib/demo";

/* ==================================================================== *
 * HOME — editorial, not a dashboard
 *
 * What wagmi.trade actually does, and what this page was not doing:
 *
 *   it opens ONE huge centred action on an empty canvas, with the nav and
 *   the data pushed to the margins. The first screen has one job and it is
 *   not "look at five panels". Everything a trader wants to see is one
 *   keystroke away, behind a search that is already focused.
 *
 * This page previously put the scan box above five competing panels, each the
 * same weight, all above the fold. That is a dashboard. A dashboard is what you
 * open once you already have a question; a home is where the question starts.
 *
 * Composition borrowed, surface not: wagmi is light and red, this stays dark
 * and acid because the product is a terminal and the data is dense. What is
 * copied is the discipline — one focal action, real negative space, type doing
 * the hierarchy instead of borders, and a single accent used three times.
 * ==================================================================== */

export const metadata = { title: "Meme Checker — check a token" };

export default function HomePage() {
  const tape = [...DEMO_TOKENS]
    .sort((a, b) => b.vol24 / b.liq - a.vol24 / a.liq)
    .slice(0, 3);

  return (
    <div className="relative flex min-h-[calc(100dvh-36px)] flex-col">
      {/* ---------------- the one thing ---------------- */}
      <div className="flex flex-1 items-center px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-14">
        <div className="w-full max-w-[600px]">
          {/* eyebrow: one line, one accent, says who this is for */}
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-[5px] w-[5px] bg-acid" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-acid">
              for memecoin traders
            </span>
            <span className="ml-auto">
              <Demo />
            </span>
          </div>

          {/* The headline is the largest object and it says what the tool does,
              in the reader's own vocabulary. No slogan, no value proposition
              paragraph — a trader reads three words and knows. */}
          <h1
            className="mt-6 text-[36px] font-semibold leading-[0.96] tracking-[-0.04em] text-fg sm:text-[44px] xl:text-[56px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Paste the contract.
            <br />
            <span className="text-acid">See who is inside.</span>
          </h1>

          <p className="mt-4 max-w-[420px] t-body leading-relaxed text-fg3">
            Bundle, snipers, insiders, exits — every check measured against its own number
          </p>

          <div className="mt-8 [--field-h:52px]">
            <ScanInput autoFocus />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="t-xs text-fg4">try</span>
            {tape.slice(0, 3).map((t) => (
              <Link
                key={t.mint}
                href={`/token/${t.chain}/${t.mint}`}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg3 underline decoration-line2 underline-offset-[3px] transition-colors hover:text-acid hover:decoration-acid"
              >
                {t.symbol}
              </Link>
            ))}
            <span aria-hidden className="mx-1 h-3 w-px bg-line" />
            <Link
              href="/check"
              className="t-xs text-fg3 underline decoration-line2 underline-offset-2 transition-colors hover:text-fg"
            >
              other chains
            </Link>
          </div>
        </div>

        {/* A sample of the artifact, not a feature list. wagmi puts a device
            mockup beside its headline so you can see the product before you
            commit a wallet; this is the same move for a scan. It is one small
            card, deliberately subordinate — same surface, no accent, so it reads
            as evidence rather than as a second thing to click. */}
        <div className="hidden xl:block">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="t-eyebrow">what a scan returns</span>
            <Link
              href={`/token/${DEMO_TOKENS[0].chain}/${DEMO_TOKENS[0].mint}`}
              className="ml-auto font-mono text-[9px] uppercase tracking-[0.05em] text-fg4 transition-colors hover:text-fg"
            >
              open one →
            </Link>
          </div>

          <div className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
              <span className="grid h-6 w-6 place-items-center border border-line bg-surf2 font-mono text-[8px] text-fg3">
                {DEMO_TOKENS[0].symbol.slice(0, 2)}
              </span>
              <span className="t-strong text-fg">{DEMO_TOKENS[0].symbol}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-fg4">
                {DEMO_TOKENS[0].chain}
              </span>
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.05em] text-bad">
                do not touch
              </span>
            </div>

            <div className="flex items-baseline gap-2 border-b border-line px-3 py-2.5">
              <span className="t-mono text-[26px] leading-none tabular-nums text-bad">
                {DEMO_TOKENS[0].score}
              </span>
              <span className="t-mono text-[9px] text-fg4">/100</span>
              <span className="ml-auto t-xs text-fg4">3 checks failed</span>
            </div>

            <div className="space-y-0">
              {[
                ["bundle share", `${DEMO_TOKENS[0].bundlePct.toFixed(1)}%`, "bad"],
                ["sniper wallets", `${DEMO_TOKENS[0].sniperCount}`, "hot"],
                ["insider supply", `${DEMO_TOKENS[0].insiderPct.toFixed(1)}%`, "hot"],
                ["holders", DEMO_TOKENS[0].holders.toLocaleString("en-US"), "fg"],
                ["exit window", `${DEMO_TOKENS[0].exitWindowSec}s`, "bad"],
              ].map(([label, value, tone]) => (
                <div
                  key={label}
                  className="flex items-baseline gap-2 border-b border-line px-3 py-[5px] last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate t-xs text-fg3">{label}</span>
                  <span
                    className={`t-mono text-[10.5px] tabular-nums ${
                      tone === "bad" ? "text-bad" : tone === "hot" ? "text-hot" : "text-fg2"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-3 py-2">
              <p className="t-xs leading-relaxed text-fg4">
                Five of the eight checks, each with the number behind it
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      <p className="border-t border-line px-4 py-2 text-center text-[10px] text-fg4/60">
        Not advice. Scores describe what the pipeline could measure
      </p>
    </div>
  );
}
