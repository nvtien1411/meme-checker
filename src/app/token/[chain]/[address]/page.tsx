import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { analyzeToken, AnalysisError } from "@/lib/analyze";
import { CHAINS, isValidForChain, type ChainId } from "@/lib/chains";
import {
  CheckList,
  CreatorPanel,
  ExitPanel,
  FlowPanel,
  HolderPanel,
  NarrativePanel,
  PremiumPreview,
  ProjectPanel,
  ProvenancePanel,
  VerdictHeader,
} from "@/components/report";
import { Panel } from "@/components/ui";
import { SectionNav } from "@/components/SectionNav";
import { ReportSkeleton } from "./skeleton";

const VALID = CHAINS.map((c) => c.id);

// The whole route is the result of a live lookup against four upstream APIs.
// Prerendering would ship an empty shell, so this is explicitly dynamic.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chain: string; address: string }>;
}): Promise<Metadata> {
  const { chain, address } = await params;
  return {
    title: `${address.slice(0, 6)}…${address.slice(-4)} on ${chain}`,
    description: "Risk report from Meme Checker.",
  };
}

async function Report({ chain, address }: { chain: ChainId; address: string }) {
  if (!isValidForChain(address, chain)) notFound();

  let data;
  try {
    data = await analyzeToken({ address, chain });
  } catch (err) {
    const message = err instanceof AnalysisError ? err.message : "Analysis failed.";
    const hint = err instanceof AnalysisError ? err.hint : (err as Error).message;

    return (
      <div className="mx-auto w-full max-w-[640px] px-4 py-16 sm:px-6">
        <div className="panel border-bad-600/40 p-5">
          <h1 className="t-title text-bad-400">Could not analyse this token</h1>
          <p className="mt-2 t-body leading-relaxed text-mute-300">{message}</p>
          {hint && <p className="mt-1.5 t-small leading-relaxed text-mute-400">{hint}</p>}
          <p className="mt-4 border-t border-ink-800 pt-3 t-meta leading-relaxed text-mute-500">
            A failed lookup is not a verdict. Nothing here should be read as
            evidence that the token is safe or unsafe.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/check"
              className="rounded bg-brand-500 px-3 py-1.5 t-small font-semibold text-ink-950 transition hover:bg-brand-400"
            >
              Try another address
            </Link>
            <Link
              href="/"
              className="rounded border border-ink-650 px-3 py-1.5 t-small text-mute-300 transition hover:border-ink-500 hover:text-lit-100"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6">
      <VerdictHeader data={data} />

      <div className="mt-4">
        <SectionNav />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_358px]">
        {/* primary column */}
        <div className="min-w-0 space-y-4">
          <Panel
            id="checks"
            title="Checks"
            subtitle="Worst first. Open any row for the number behind it and what would change the answer."
            right={`${data.checks.length} checks`}
            flush
          >
            <CheckList checks={data.checks} />
          </Panel>

          <Panel
            id="holders"
            title="Holder distribution"
            subtitle="Excludes liquidity pools, burns and launch curves. Linked wallets are merged."
            right={
              data.holders.totalHolders !== null
                ? `of ${data.holders.totalHolders.toLocaleString()}`
                : undefined
            }
            flush
          >
            <HolderPanel data={data} />
          </Panel>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Panel id="exit" title="Exit liquidity" subtitle="Single-pool estimate" flush>
              <ExitPanel data={data} />
            </Panel>
            <Panel id="flow" title="Trading flow" subtitle="Recent trade tape" flush>
              <FlowPanel data={data} />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Panel id="narrative" title="Narrative" subtitle="Model output, not a measurement" flush>
              <NarrativePanel data={data} />
            </Panel>
            <Panel id="project" title="Project" subtitle="Published by the token" flush>
              <ProjectPanel data={data} />
            </Panel>
          </div>
        </div>

        {/* side column */}
        <aside className="min-w-0 space-y-4">
          <Panel id="creator" title="Creator" flush>
            <CreatorPanel data={data} />
          </Panel>

          <PremiumPreview />

          <Panel title="Data provenance" subtitle="Every source, and whether it answered" flush>
            <ProvenancePanel data={data} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}

export default async function TokenPage({
  params,
}: {
  params: Promise<{ chain: string; address: string }>;
}) {
  const { chain: chainRaw, address } = await params;
  if (!VALID.includes(chainRaw as ChainId)) notFound();
  const chain = chainRaw as ChainId;

  return (
    <Suspense fallback={<ReportSkeleton />}>
      <Report chain={chain} address={address} />
    </Suspense>
  );
}
