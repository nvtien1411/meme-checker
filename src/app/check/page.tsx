import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "Token Checker",
  description: "Paste a contract address and run the eight checks",
};

const LIMITS = [
  {
    t: "Wallet clusters are Solana-only",
    d: "EVM needs decoded transfer logs, which the free sources do not expose. On EVM you get raw concentration without merged entities",
  },
  {
    t: "No X or social data",
    d: "That requires an X API key. Narrative is a keyword classifier and is labelled inferred, never presented as social measurement",
  },
  {
    t: "Tracing stops at seven days",
    d: "A wallet funded months ago says nothing about a launch bundle, so detection only runs while it still means something",
  },
  {
    t: "Exit depth is single-pool",
    d: "Multi-pool routing, CEX depth and MEV are not modelled. The estimate is a floor, not a precise figure",
  },
];

export default function CheckPage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <p className="t-label">checker</p>
      <h1 className="mt-2.5 t-display text-lit-50">Paste a contract address</h1>
      <p className="mt-3 max-w-[52ch] t-body leading-relaxed text-mute-400">
        The chain is detected automatically. Pick one yourself only if you already know it — that
        skips a lookup and shaves a second off the result
      </p>

      <div className="mt-7">
        <SearchBar size="lg" autoFocus />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-ink-800 pt-6 sm:grid-cols-2">
        <div>
          <h2 className="t-label">where to find a ca</h2>
          <p className="mt-2 t-small leading-relaxed text-mute-400">
            On DexScreener it sits under the token name. On Solscan it is the mint address, not
            the pool address. If you only have a ticker, search it first — pasting a ticker here
            will not work
          </p>
        </div>
        <div>
          <h2 className="t-label">what comes back</h2>
          <p className="mt-2 t-small leading-relaxed text-mute-400">
            A verdict, eight checks ordered worst-first, holder distribution, exit depth, and an
            explicit list of every source that answered and every one that did not
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="t-section text-lit-100">Known limits</h2>
        <ul className="mt-4 border-t border-ink-800">
          {LIMITS.map((l, i) => (
            <li key={l.t} className="flex gap-4 border-b border-ink-800 py-3.5">
              <span className="mt-[3px] w-6 shrink-0 font-mono text-[10px] tabular-nums tracking-[0.08em] text-brand-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="t-body-strong text-lit-100">{l.t}</p>
                <p className="mt-1 max-w-[62ch] t-small leading-relaxed text-mute-500">{l.d}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 t-meta text-mute-600">
          Full thresholds per check:{" "}
          <Link
            href="/faq"
            className="text-brand-400 underline decoration-brand-700/60 underline-offset-2 hover:text-brand-300"
          >
            the method page
          </Link>
          
        </p>
      </section>
    </div>
  );
}
