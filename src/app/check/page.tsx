import type { Metadata } from "next";
import Link from "next/link";
import { Demo, Panel, Tag } from "@/components/ui";
import { DEMO_TOKENS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";
import { CheckForm } from "./CheckForm";

/* ==================================================================== *
 * SCAN A CONTRACT
 *
 * This route was linked from the failed-lookup screen as "/check" and did not
 * exist — the one path a user takes when their paste was wrong ended in a 404.
 * A dead end reached at the moment of confusion is the worst place to put one.
 *
 * The page is deliberately almost empty: one input, one button, and the last
 * few things this browser scanned. No explanation of what the tool does,
 * because someone who typed a bad address already knows what they wanted.
 * ==================================================================== */

export const metadata: Metadata = {
  title: "Scan a contract — Meme Checker",
  description: "Paste a token contract to get a risk report",
};

export default function CheckPage() {
  return (
    <div className="mx-auto w-full max-w-[620px] px-4 py-10">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="t-section text-fg">Scan a contract</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <Demo />
          <Tag tone="neutral">Solana · EVM</Tag>
        </div>
      </div>

      <p className="mt-1.5 t-xs leading-relaxed text-fg3">
        Paste a token address. The chain is read from the address shape, so there is nothing else
        to pick
      </p>

      {/* The real input lives in the header on every other page. Here it is the
          only thing on screen, which is the point of the route. */}
      <div className="mt-4">
        <Panel flush>
          <CheckForm />
        </Panel>
      </div>

      <Panel title="Or open one already in this dataset" note="so you can see the shape of a report first" flush>
        {DEMO_TOKENS.slice(0, 6).map((t) => (
          <Link
            key={t.mint}
            href={`/token/${t.chain}/${t.mint}`}
            className="drow flex items-baseline gap-2 border-b border-line px-3 py-[7px] last:border-b-0"
          >
            <span className="t-xs font-semibold text-fg">{t.symbol}</span>
            <span className="min-w-0 flex-1 truncate t-xs text-fg4">{t.name}</span>
            <span className="t-mono text-[10px] tabular-nums text-fg3">{fmtUsd(t.mcap)}</span>
            <span
              className={`w-8 text-right t-mono text-[10px] tabular-nums ${
                t.score < 30 ? "text-good" : t.score < 60 ? "text-warn" : "text-bad"
              }`}
            >
              {t.score}
            </span>
          </Link>
        ))}
      </Panel>

      <p className="mt-3 t-xs leading-relaxed text-fg4">
        A failed lookup is not a verdict. If a contract cannot be read, that means nothing about
        whether it is safe — it means the data source did not answer
      </p>
    </div>
  );
}
