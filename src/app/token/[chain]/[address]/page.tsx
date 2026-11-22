import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { analyzeToken, AnalysisError } from "@/lib/analyze";
import { CHAINS, isValidForChain, type ChainId } from "@/lib/chains";
import {
  CheckList,
  DeployerPanel,
  ExitPanel,
  FlowPanel,
  HolderTable,
  NarrativePanel,
  ProjectPanel,
  ProvenancePanel,
  VerdictBanner,
} from "@/components/report";
import { Panel } from "@/components/ui";
import { SectionNav } from "@/components/SectionNav";
import { ConcentrationBar } from "@/components/viz";
import { ResultSkeleton } from "./skeleton";

const VALID = CHAINS.map((c) => c.id);

// This route is inherently per-request: the whole page is the result of a live
// lookup against four upstream APIs. Prerendering it would mean shipping an
// empty shell, so it is explicitly a blocking dynamic route.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chain: string; address: string }>;
}): Promise<Metadata> {
  const { chain, address } = await params;
  return {
    title: `${address.slice(0, 6)}… on ${chain}`,
    description: "Token risk report from Meme Checker.",
  };
}

async function Report({ chain, address }: { chain: ChainId; address: string }) {
  if (!isValidForChain(address, chain)) {
    notFound();
  }

  let data;
  try {
    data = await analyzeToken({ address, chain });
  } catch (err) {
    const message = err instanceof AnalysisError ? err.message : "Analysis failed.";
    const hint = err instanceof AnalysisError ? err.hint : (err as Error).message;

    return (
      <div className="mx-auto w-full max-w-[880px] px-4 py-10 sm:px-6">
        <div className="border border-bad-600/50 bg-bad-600/8 px-4 py-3.5">
          <h1 className="t-title text-bad-500">Could not analyse this token</h1>
          <p className="mt-1.5 t-body leading-relaxed text-slate-300">{message}</p>
          {hint && <p className="mt-1 t-small leading-relaxed text-mute-400">{hint}</p>}
          <p className="mt-3 t-small text-mute-500">
            A failed lookup is not a verdict. Nothing here should be read as
            evidence that the token is safe or unsafe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
      <VerdictBanner data={data} />

      <div className="mt-4">
        <SectionNav />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* main column */}
        <div className="min-w-0 space-y-4">
          <Panel
            id="checks"
            title="Checks"
            subtitle="Ordered worst-first. Expand any row for the number behind it and what would flip it."
            right={
              <span className="font-mono t-meta text-mute-500">
                {data.checks.length} total
              </span>
            }
          >
            <div className="-mx-4 -mb-3">
              <CheckList checks={data.checks} />
            </div>
          </Panel>

          <Panel
            id="holders"
            title="Top 10 holders"
            subtitle="Percentages exclude liquidity pools, burns and launch curves."
            right={
              data.holders.totalHolders !== null ? (
                <span className="font-mono t-meta tabular-nums text-mute-500">
                  of {data.holders.totalHolders.toLocaleString()}
                </span>
              ) : undefined
            }
          >
            <div className="-mx-4 -mb-3 min-w-0 overflow-hidden">
              <ConcentrationBar data={data} />
              <div className="border-t border-ink-800">
                <HolderTable data={data} stripFooter />
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Panel id="exit" title="Exit liquidity" subtitle="Single-pool estimate">
              <div className="-mx-4 -mb-3">
                <ExitPanel data={data} />
              </div>
            </Panel>
            <Panel id="flow" title="Flow quality" subtitle="From the recent trade tape">
              <div className="-mx-4 -mb-3">
                <FlowPanel data={data} />
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Panel id="narrative" title="Narrative" subtitle="Model output, not a measurement">
              <div className="-mx-4 -mb-3">
                <NarrativePanel data={data} />
              </div>
            </Panel>
            <Panel title="Project" subtitle="Links published by the token">
              <div className="-mx-4 -mb-3">
                <ProjectPanel data={data} />
              </div>
            </Panel>
          </div>
        </div>

        {/* side column */}
        <aside className="min-w-0 space-y-4">
          <Panel id="creator" title="Creator">
            <div className="-mx-4 -mb-3">
              <DeployerPanel data={data} />
            </div>
          </Panel>

          <Panel title="Data provenance" subtitle="Every source, and whether it answered">
            <div className="-mx-4 -mb-3">
              <ProvenancePanel data={data} />
            </div>
          </Panel>

          <p className="border border-ink-800 px-3 py-2 t-meta leading-relaxed text-mute-500">
            <span className="text-mute-400">Free report.</span> Wallet cluster map,
            dev-wallet investigation, bundle analysis, KOL intelligence and alerts
            are planned and not built. Nothing above is withheld behind them.
          </p>
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
    <Suspense fallback={<ResultSkeleton />}>
      <Report chain={chain} address={address} />
    </Suspense>
  );
}
