import Link from "next/link";
import { ScanInput } from "@/components/ScanInput";
import { Demo } from "@/components/ui";
import { DEMO_TOKENS } from "@/lib/demo";

/* The entry screen is an Operate surface: one contract-address action first,
 * then one clearly labeled sample of the report. The app keeps its dark
 * terminal palette and uses the benchmark only for hierarchy and first-use
 * clarity. Demo values stay explicit and come from the shared demo dataset. */

export const metadata = { title: "Meme Checker — check a token" };

export default function HomePage() {
  const sample = DEMO_TOKENS[0];
  const metrics: [string, string, "bad" | "hot" | "fg"][] = [
    ["bundle share", `${sample.bundlePct.toFixed(1)}%`, "bad"],
    ["sniper wallets", `${sample.sniperCount}`, "hot"],
    ["insider supply", `${sample.insiderPct.toFixed(1)}%`, "hot"],
    ["holders", sample.holders.toLocaleString("en-US"), "fg"],
    ["exit window", `${sample.exitWindowSec}s`, "bad"],
  ];

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col lg:min-h-[calc(100dvh-56px)]">
      <div className="flex flex-1 flex-col items-center px-4 pt-12 pb-10 sm:px-8 sm:pt-14 lg:justify-center lg:pt-8">
        <section className="w-full max-w-[760px] text-center" aria-labelledby="home-title">
          {/* eyebrow: one line, one accent, says who this is for */}
          <div className="mb-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span aria-hidden className="h-[5px] w-[5px] bg-acid" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-acid">
              Pre-ape token scan
            </span>
            <span aria-hidden className="mx-1 h-3 w-px bg-line2" />
            <span className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-fg4">Solana · Robinhood Chain · BNB Chain · Base · Ethereum</span>
          </div>

          {/* The headline is the largest object and it says what the tool does,
              in the reader's own vocabulary. No slogan, no value proposition
              paragraph — a trader reads three words and knows. */}
          <h1
            id="home-title"
            className="mx-auto max-w-[15ch] text-balance text-[clamp(2.35rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.06em] text-fg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Before you ape,
            <span className="block text-acid">check who’s holding</span>
          </h1>

          <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-relaxed text-fg2 sm:text-base">
            Paste the contract address to check holder concentration, contract risks and estimated exit depth
          </p>

          <div className="mx-auto mt-7 w-full max-w-[680px]">
            <ScanInput hero />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-fg4">
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-[5px] w-[5px] bg-fg4" />
              Read-only · no wallet connection or transaction signing
            </span>
            <span aria-hidden className="hidden h-3 w-px bg-line sm:block" />
            <Link
              href="/check"
              className="inline-flex min-h-11 items-center text-fg3 underline decoration-line2 underline-offset-2 transition-colors hover:text-fg sm:min-h-0"
            >
              choose another chain
            </Link>
          </div>
        </section>

        <section className="mt-9 w-full max-w-[600px]" aria-labelledby="sample-title">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 id="sample-title" className="t-eyebrow">What a scan returns</h2>
            <Demo />
            <Link
              href={`/token/${sample.chain}/${sample.mint}`}
              className="ml-auto inline-flex min-h-11 items-center font-mono text-[9px] uppercase tracking-[0.05em] text-fg4 underline decoration-line2 underline-offset-2 transition-colors hover:text-fg hover:decoration-fg sm:min-h-0"
            >
              open sample report →
            </Link>
          </div>

          <div className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
              <span className="grid h-7 w-7 place-items-center border border-line bg-surf2 font-mono text-[9px] text-fg3">
                {sample.symbol.slice(0, 2)}
              </span>
              <span className="t-strong text-fg">{sample.symbol}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-fg4">
                {sample.chain}
              </span>
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-bad">
                {sample.risk} risk
              </span>
            </div>

            <div className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-4">
              <span className="font-mono text-[28px] leading-none tabular-nums text-bad">
                {sample.score}
              </span>
              <span className="font-mono text-[9px] text-fg4">/100 · risk score</span>
              <span className="ml-auto text-right">
                <span className="block font-mono text-[9px] uppercase tracking-[0.05em] text-fg3">sample read</span>
                <span className="block text-[10px] text-fg4">Not live chain data</span>
              </span>
            </div>

            <div>
              {metrics.map(([label, value, tone]) => (
                <div
                  key={label}
                  className="flex min-h-8 items-center gap-3 border-b border-line px-3 last:border-b-0 sm:px-4"
                >
                  <span className="min-w-0 flex-1 truncate t-xs text-fg3">{label}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      tone === "bad" ? "text-bad" : tone === "hot" ? "text-hot" : "text-fg2"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <p className="border-t border-line px-3 py-2 text-[10px] text-fg4 sm:px-4">
              Demo dataset · example metrics only
            </p>
          </div>
        </section>
      </div>

      <p className="border-t border-line px-4 py-2 text-center text-[10px] text-fg4/70">
        Not advice · scores describe what the pipeline could measure
      </p>
    </div>
  );
}
