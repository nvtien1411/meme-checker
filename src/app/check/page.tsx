import type { Metadata } from "next";
import Link from "next/link";
import { Demo } from "@/components/ui";
import { DEMO_TOKENS } from "@/lib/demo";
import { fmtUsd } from "@/lib/http";
import { CheckForm } from "./CheckForm";

export const metadata: Metadata = {
  title: "Scan a contract",
  description: "Inspect a token's risk evidence, holders and estimated exit depth by contract address.",
};

export default function CheckPage() {
  const [sample, ...examples] = DEMO_TOKENS.slice(0, 6);
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
      <header className="mb-6">
        <p className="t-eyebrow text-fg3">Token scanner</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">Scan a contract</h1>
        <p className="mt-3 max-w-[55ch] t-body text-fg2">See which checks failed, what could not be verified, and how a planned sell compares with estimated pool depth.</p>
      </header>
      <CheckForm />
      {sample && (
        <section aria-labelledby="scan-example" className="mt-8 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="scan-example" className="text-sm font-semibold text-fg">Example report</h2>
            <Demo what="demo preview" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4">
            <dl className="flex flex-wrap gap-x-6 gap-y-2">
              <div><dt className="t-xs text-fg3">Token</dt><dd className="t-mono text-sm text-fg">{sample.symbol}</dd></div>
              <div><dt className="t-xs text-fg3">Risk score</dt><dd className="t-mono text-sm text-fg">{sample.score}/100</dd></div>
              <div><dt className="t-xs text-fg3">Market cap</dt><dd className="t-mono text-sm text-fg">{fmtUsd(sample.mcap)}</dd></div>
            </dl>
            <Link href={`/token/${sample.chain}/${sample.mint}`} prefetch={false} className="inline-flex min-h-11 items-center text-sm font-medium text-acid hover:underline">Open report →</Link>
          </div>
          <details className="mt-1">
            <summary className="min-h-11 cursor-pointer py-3 text-sm text-fg2 hover:text-fg">More example tokens</summary>
            <ul className="divide-y divide-line border-t border-line">
              {examples.map((token) => (
                <li key={token.mint}>
                  <Link href={`/token/${token.chain}/${token.mint}`} prefetch={false} className="drow flex min-h-11 items-center gap-3 px-2 py-2 text-sm">
                    <strong className="text-fg">{token.symbol}</strong>
                    <span className="min-w-0 flex-1 truncate text-fg3">{token.name}</span>
                    <span className="whitespace-nowrap t-mono text-xs text-fg3">{fmtUsd(token.mcap)} · {token.score}/100</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
      <p className="mt-4 t-xs text-fg3">If a lookup fails, risk remains unverified.</p>
    </div>
  );
}
