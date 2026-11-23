import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { analyzeToken, AnalysisError } from "@/lib/analyze";
import { CHAINS, isValidForChain, type ChainId } from "@/lib/chains";
import {
  CheckLedger,
  ContextSection,
  CreatorSlab,
  HolderSection,
  ProvenanceSlab,
  RoadmapSlab,
  SignalsSection,
  VerdictMasthead,
} from "@/components/report";
import { CallersSection, ForensicsSection, NarrativeIntelSection } from "@/components/forensics";
import { Section, Slab } from "@/components/ui";
import { ReportSkeleton } from "./skeleton";

const VALID = CHAINS.map((c) => c.id);

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chain: string; address: string }>;
}): Promise<Metadata> {
  const { chain, address } = await params;
  return {
    title: `${address.slice(0, 6)}…${address.slice(-4)} on ${chain}`,
    description: "Risk report from Meme Checke",
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
      <div className="mx-auto w-full max-w-[560px] px-6 py-20">
        <p className="t-label text-bad-400">lookup failed</p>
        <h1 className="mt-3 t-display text-lit-50">Could not analyse this token</h1>
        <p className="mt-3 t-body leading-relaxed text-mute-300">{message}</p>
        {hint && <p className="mt-1.5 t-small leading-relaxed text-mute-500">{hint}</p>}
        <p className="rule mt-6 pt-3 t-meta leading-relaxed text-mute-600">
          A failed lookup is not a verdict. Nothing here should be read as evidence that the
          token is safe or unsafee
        </p>
        <div className="mt-5 flex gap-2">
          <Link
            href="/check"
            className="glow-acid bg-brand-500 px-3.5 py-2 text-[12px] font-semibold text-ink-950 transition hover:bg-brand-400"
          >
            Try another address
          </Link>
          <Link
            href="/"
            className="border border-ink-700 px-3.5 py-2 text-[12px] text-mute-300 transition hover:border-ink-600 hover:text-lit-100"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const forensicsReady = data.forensics?.enabled ?? false;
  // Numbering follows what the page can actually answer. While the wallet layer
  // is unbuilt, giving it section 01 put five "not measured" lines where the
  // first piece of evidence should be — the report read as broken at the top.
  // It still appears, and says it was not run; it just stops claiming the lead.
  const n = (i: number) => (forensicsReady ? i : i - 1).toString().padStart(2, "0");

  return (
    <div>
      <VerdictMasthead data={data} />

      <div className="grid grid-cols-1 items-start gap-x-10 gap-y-0 px-4 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        {/* main document column */}
        <div className="min-w-0 pb-14">
          {forensicsReady && (
            <Section
              id="wallets"
              index={n(1)}
              title="Wallet forensics"
              note="who bought the launch, and what they have done since"
              first
            >
              <ForensicsSection data={data.forensics} chain={data.token.chain} />
            </Section>
          )}

          <Section
            id="holders"
            index={n(2)}
            title="Holder distribution"
            note="pools, burns and curves removed"
            first={!forensicsReady}
          >
            <HolderSection data={data} />
          </Section>

          <Section
            id="callers"
            index={n(3)}
            title="Who called it"
            note="what the account did with its own position"
          >
            <CallersSection data={data.callers} />
          </Section>

          <Section id="narrative" index={n(4)} title="Narrative" note="the one section that is not measured">
            <NarrativeIntelSection data={data.narrativeIntel} />
            <div className="mt-5">
              <ContextSection data={data} />
            </div>
          </Section>

          <Section id="signals" index={n(5)} title="Liquidity and flow">
            <SignalsSection data={data} />
          </Section>

          <Section
            id="checks"
            index={n(6)}
            title="Every check"
            note="worst first — open a row for the number behind it"
            right={`${data.checks.length}`}
          >
            <CheckLedger checks={data.checks} />
          </Section>

          {!forensicsReady && (
            <Section
              id="wallets"
              index="—"
              title="Wallet forensics"
              note="listed last because this build does not run it"
            >
              <ForensicsSection data={data.forensics} chain={data.token.chain} />
            </Section>
          )}
        </div>

        {/* dossier column */}
        <aside className="min-w-0 space-y-3 pb-14 lg:sticky lg:top-[72px]">
          <Slab id="creator">
            <CreatorSlab data={data} />
          </Slab>
          <Slab>
            <ProvenanceSlab data={data} />
          </Slab>
          <Slab>
            <RoadmapSlab />
          </Slab>
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
