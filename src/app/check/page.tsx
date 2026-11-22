import type { Metadata } from "next";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "Token Checker",
  description: "Paste a contract address and run the eight checks.",
};

export default function CheckPage() {
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-10 sm:px-6">
      <h1 className="t-display text-slate-50">
        Token Checker
      </h1>
      <p className="mt-1.5 max-w-xl t-body leading-relaxed text-mute-400">
        Paste a contract address. Chain is detected automatically, or pick one if
        you already know it — that skips a lookup and avoids the wrong-chain case
        entirely.
      </p>

      <div className="mt-6">
        <SearchBar size="lg" autoFocus />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="border border-ink-700 bg-ink-900 p-3.5">
          <h2 className="t-label text-mute-400">
            Where to find a CA
          </h2>
          <p className="mt-1.5 t-small leading-relaxed text-mute-300">
            On DexScreener the address is under the token name. On Solscan it is
            the mint address, not the pool address. If you only have a ticker,
            search it first — do not paste it here.
          </p>
        </div>
        <div className="border border-ink-700 bg-ink-900 p-3.5">
          <h2 className="t-label text-mute-400">
            What you get back
          </h2>
          <p className="mt-1.5 t-small leading-relaxed text-mute-300">
            A verdict, eight checks ordered worst-first, market and holder data
            with sources, and an explicit list of what could not be verified.
          </p>
        </div>
      </div>

      <div className="mt-6 border border-ink-700 bg-ink-900 px-3.5 py-3">
        <h2 className="t-label text-mute-400">
          Known limits of the free tier
        </h2>
        <ul className="mt-2 space-y-1.5 t-small leading-relaxed text-mute-500">
          <li>
            <span className="text-mute-300">Wallet cluster tracing is Solana only</span>{" "}
            — EVM needs decoded transfer logs, which the free sources do not give us.
          </li>
          <li>
            <span className="text-mute-300">No social or KOL data</span> — that needs
            an X API key. Narrative is a keyword classifier, clearly marked as
            inferred.
          </li>
          <li>
            <span className="text-mute-300">Trace skipped on tokens older than 7 days</span>{" "}
            — a wallet funded months ago says nothing about a launch bundle.
          </li>
          <li>
            <span className="text-mute-300">Exit math is single-pool</span> — multi-pool
            routing and CEX depth are not included.
          </li>
        </ul>
      </div>
    </div>
  );
}
