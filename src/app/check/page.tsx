import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "Token Checker",
  description: "Paste a contract address and run the eight checks.",
};

const LIMITS = [
  {
    t: "Wallet clusters are Solana-only",
    d: "EVM needs decoded transfer logs, which the free sources do not expose. On EVM you get raw concentration without merged entities.",
  },
  {
    t: "No X or social data",
    d: "That requires an X API key. Narrative is a keyword classifier and is labelled inferred, never presented as social measurement.",
  },
  {
    t: "Trace skipped beyond seven days",
    d: "A wallet funded months ago says nothing about a launch bundle. Detection only runs while it still means something.",
  },
  {
    t: "Exit depth is single-pool",
    d: "Multi-pool routing, CEX depth and MEV are not modelled. The estimate is a floor, not a precise figure.",
  },
];

export default function CheckPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12 sm:px-6">
      <h1 className="t-display text-lit-50">Token Checker</h1>
      <p className="mt-2 max-w-lg t-body leading-relaxed text-mute-400">
        Paste a contract address. The chain is detected automatically — pick one
        yourself only if you already know it, which skips a lookup.
      </p>

      <div className="mt-7">
        <SearchBar size="lg" autoFocus />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="panel p-4">
          <h2 className="t-label">Where to find a CA</h2>
          <p className="mt-2 t-small leading-relaxed text-mute-400">
            On DexScreener it sits under the token name. On Solscan it is the mint
            address, not the pool address. If you only have a ticker, search it
            first — pasting a ticker here will not work.
          </p>
        </div>
        <div className="panel p-4">
          <h2 className="t-label">What comes back</h2>
          <p className="mt-2 t-small leading-relaxed text-mute-400">
            A verdict, eight checks ordered worst-first, market and holder data
            with sources, and an explicit list of what could not be verified.
          </p>
        </div>
      </div>

      <section className="mt-12 border-t border-ink-800 pt-6">
        <h2 className="t-label">Known limits of the free tier</h2>
        <ul className="mt-3 divide-y divide-ink-800 border-y border-ink-800">
          {LIMITS.map((l) => (
            <li key={l.t} className="py-3.5">
              <p className="t-body-strong text-lit-200">{l.t}</p>
              <p className="mt-1 t-small leading-relaxed text-mute-500">{l.d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 t-meta text-mute-600">
          Full thresholds and caveats per check:{" "}
          <Link
            href="/faq"
            className="text-mute-400 underline decoration-ink-600 decoration-dotted underline-offset-2 hover:text-lit-200"
          >
            method page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
