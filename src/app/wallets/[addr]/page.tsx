import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, ProReveal, Split, Stat, Tag } from "@/components/ui";
import { DEMO_TOKENS, DEMO_WALLETS, WALLET_ROLE, shortAddr } from "@/lib/demo";
import { fmtPrice } from "@/lib/http";
import { classifyWallet, crossTokenMemory, walletProfile } from "@/lib/intel";
import { ExitOrderTable } from "@/components/Intelligence";
import { WatchToggle } from "@/components/WatchToggle";
import { exitOrdering } from "@/lib/intel";

/* ==================================================================== *
 * WALLET PROFILE
 *
 * A wallet is the unit of evidence in this product. Every module elsewhere
 * links here, and the page has one job: state this address's record so a
 * reader can decide whether its presence on a token means anything.
 *
 * The record is assembled from every token in the dataset that lists it, so
 * the page cannot disagree with the holder table that sent you here.
 * ==================================================================== */

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ addr: string }> }) {
  const { addr } = await params;
  return { title: shortAddr(addr, 6, 4) };
}

export default function WalletPage({ params }: { params: Promise<{ addr: string }> }) {
  return (
    <Suspense
      fallback={
        <div>
          <PageHead title="Wallet record" note="Loading wallet evidence" />
          <div className="p-3 sm:p-4">
            <Panel>
              <p className="t-xs text-fg4">Resolving this wallet’s record…</p>
            </Panel>
          </div>
        </div>
      }
    >
      <WalletPageContent params={params} />
    </Suspense>
  );
}

async function WalletPageContent({ params }: { params: Promise<{ addr: string }> }) {
  const { addr } = await params;
  await connection();
  const decoded = decodeURIComponent(addr);

  // assemble every appearance of this address across the dataset
  const appearances = DEMO_TOKENS.map((t) => {
    const w = t.wallets.find((x) => x.addr.toLowerCase() === decoded.toLowerCase());
    return w ? { token: t, wallet: w } : null;
  }).filter((x): x is { token: (typeof DEMO_TOKENS)[number]; wallet: (typeof DEMO_TOKENS)[number]["wallets"][number] } => x !== null);

  if (appearances.length === 0) notFound();

  // The launch history is the real evidence; the per-token rows above only say
  // where the address turned up.
  const profile = walletProfile(decoded);
  const dna = profile ? classifyWallet(profile) : null;
  const memory = crossTokenMemory(decoded);
  const exits = exitOrdering().filter(
    (r) => r.addr.toLowerCase() === decoded.toLowerCase(),
  );

  const first = appearances[0].wallet;
  const role = WALLET_ROLE[decoded] ?? first.tags?.[0] ?? "unclassified";
  const born = first.born;

  // One source of truth for the record. `profile` is derived from the launch
  // rows; the per-token `priorLaunches` figures in demo.ts are a second, older
  // source, and reading both is how the same page said 4/7 here and 4/5 there.
  const priorLaunches = profile ? profile.launchCount : 0;
  const priorRugs = profile ? profile.rugCount : 0;
  const totalPct = appearances.reduce((n, a) => n + (a.wallet.pct ?? 0), 0);
  const funder = first.funder;

  return (
    <div>
      <PageHead
        title={shortAddr(decoded, 8, 6)}
        note={`Wallet receipts · ${role} · demo data`}
        right={
          <>
            <WatchToggle
              kind="wallet"
              id={decoded}
              label={shortAddr(decoded, 6, 4)}
              href={`/wallets/${decoded}`}
            />
            <Demo />
            <Tag tone={priorRugs >= 3 ? "bad" : priorRugs > 0 ? "warn" : "neutral"}>
              {priorRugs > 0 ? `${priorRugs} prior rugs` : "no rug history"}
            </Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* the record, first */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "appears on", value: `${appearances.length}`, sub: "tokens in this scan" },
            { label: "holds", value: `${totalPct.toFixed(2)}%`, sub: "combined supply" },
            { label: "prior launches", value: `${priorLaunches}`, sub: "seen before these" },
            {
              label: "prior rugs",
              value: `${priorRugs}`,
              sub: priorLaunches > 0 ? `${Math.round((priorRugs / priorLaunches) * 100)}% of launches` : "no history",
              tone: priorRugs >= 3 ? "bad" : priorRugs > 0 ? "warn" : "good",
            },
            { label: "wallet age", value: walletAge(born), sub: born ?? "unknown" },
            {
              label: "funded by",
              value: funder ? shortAddr(funder, 4, 4) : "—",
              sub: funder ? "shared source → open it" : "not traced",
              tone: funder ? "warn" : "default",
              href: funder ? `/wallets/${funder}` : undefined,
            },
          ].map((s) => {
            const tone =
              s.tone === "bad" ? "bad" : s.tone === "warn" ? "warn" : s.tone === "good" ? "good" : "default";
            const body = (
              <Stat
                label={s.label}
                value={s.value}
                sub={s.sub}
                size="md"
                mono={s.label !== "wallet age" && s.label !== "funded by"}
                tone={tone}
              />
            );
            return s.href ? (
              <Link
                key={s.label}
                href={s.href}
                className="panel p-2.5 transition-colors hover:border-fg4/60"
              >
                {body}
              </Link>
            ) : (
              <div key={s.label} className="panel p-2.5">
                {body}
              </div>
            );
          })}
        </div>

        {/* the verdict on this wallet */}
        <Panel title="The wallet’s track record" note="Check the launches and exits before you follow this address.">
          <p className="t-xs leading-relaxed text-fg3">{describeWallet(role, priorLaunches, priorRugs, appearances.length)}</p>

          {priorLaunches > 0 && (
            <div className="mt-2.5 border-t border-line pt-2">
              <div className="flex items-baseline justify-between">
                <span className="t-xs text-fg4">share of prior launches that collapsed</span>
                <span className="t-mono text-[10.5px] text-bad">
                  {priorRugs}/{priorLaunches}
                </span>
              </div>
              <div className="mt-1">
                <Gauge pct={(priorRugs / priorLaunches) * 100} tone="bad" height={4} />
              </div>
            </div>
          )}
        </Panel>

        {/* the behaviour, measured rather than tagged */}
        {profile && dna && (
          <Panel
            title="Receipts across launches"
                        note={`${profile.launchCount} launches · ${profile.rugCount} collapsed · every label links back to its evidence`}
            flush
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-3 py-2">
              <span className="font-mono text-[13px] text-fg">{dna.label}</span>
              <Tag tone={dna.confidence >= 0.7 ? "bad" : "warn"}>
                confidence {(dna.confidence * 100).toFixed(0)}%
              </Tag>
              {dna.confidence < 0.4 && (
                <span className="t-xs text-warn">
                  treat as a guess — the sample is too small to call it a pattern
                </span>
              )}
            </div>

            <ul className="space-y-1 px-3 py-2">
              {dna.evidence.map((e) => (
                <li key={e} className="flex items-start gap-1.5">
                  <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
                  <span className="t-xs leading-snug text-fg3">{e}</span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 divide-x divide-line border-t border-line sm:grid-cols-4">
              {[
                {
                  k: "launches recorded",
                  v: String(profile.launchCount),
                  s: `${profile.rugCount} collapsed`,
                },
                {
                  k: "median hold",
                  v:
                    profile.medianHoldMin === null
                      ? "never sold"
                      : profile.medianHoldMin < 90
                        ? `${Math.round(profile.medianHoldMin)}m`
                        : `${(profile.medianHoldMin / 60).toFixed(1)}h`,
                  s: "before first sell",
                },
                {
                  k: "typical exit",
                  v:
                    profile.medianExitAtPeak === null
                      ? "—"
                      : `${(profile.medianExitAtPeak * 100).toFixed(0)}%`,
                  s: "of the peak",
                },
                {
                  k: "launch entries",
                  v: `${profile.bundleCount}/${profile.launchCount}`,
                  s: "bought in the creation block",
                },
              ].map((c) => (
                <div key={c.k} className="p-2.5">
                  <div className="t-eyebrow">{c.k}</div>
                  <div className="mt-0.5 font-mono text-[15px] leading-none tabular-nums text-fg">
                    {c.v}
                  </div>
                  <div className="mt-1 t-xs text-fg4">{c.s}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-line px-3 py-1.5">
              <p className="t-xs leading-relaxed text-fg4">
                Every figure is computed from the launch rows on this page. A label is only shown when
                the rows support it, and the confidence falls when they do not
              </p>
            </div>
          </Panel>
        )}

        {/* cross-token memory */}
        {memory && memory.launches.length > 1 && (
          <Panel
            title="Where else it appears"
            note={`${memory.launches.length} recorded launches — ${memory.extra} of them not reachable from this token alone`}
            flush
          >
            <div className="grid grid-cols-[minmax(0,1fr)_72px_52px_52px_60px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1">
              <span className="t-eyebrow">launch</span>
              <span className="t-eyebrow text-right">date</span>
              <span className="t-eyebrow text-right">bought</span>
              <span className="t-eyebrow text-right">sold</span>
              <span className="t-eyebrow text-right">outcome</span>
            </div>
            {memory.launches.map((l) => (
              <div
                key={l.symbol + l.at}
                className="grid grid-cols-[minmax(0,1fr)_72px_52px_52px_60px] items-baseline gap-x-2 border-b border-line px-3 py-[5px] last:border-b-0"
              >
                <span className="truncate t-xs font-semibold text-fg2">{l.symbol}</span>
                <span className="text-right font-mono text-[9.5px] text-fg4">{l.at.slice(5)}</span>
                <span className="text-right font-mono text-[10px] tabular-nums text-fg3">
                  {l.bought > 0 ? `${l.bought.toFixed(1)}%` : "—"}
                </span>
                <span className="text-right font-mono text-[10px] tabular-nums text-fg4">
                  {l.sold > 0 ? `${l.sold}%` : "—"}
                </span>
                <span
                  className={`text-right font-mono text-[9px] uppercase tracking-[0.05em] ${
                    l.rugged ? "text-bad" : "text-good"
                  }`}
                >
                  {l.rugged ? "collapsed" : "survived"}
                </span>
              </div>
            ))}
            <div className="border-t border-line px-3 py-1.5">
              <p className="t-xs leading-relaxed text-fg4">
                This is the memory the product builds as you scan. An address seen once is a data point;
                seen on repeat launches it is a participant, and the record above is the evidence
              </p>
            </div>
          </Panel>
        )}

        {/* where it appears */}
        <Panel title="Appearances" note="every token in this scan that lists this address" flush>
          <div className="grid grid-cols-[minmax(0,1fr)_64px_56px_56px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-3 py-1">
            <span className="t-eyebrow">token</span>
            <span className="t-eyebrow text-right">holds</span>
            <span className="t-eyebrow text-right">bought</span>
            <span className="t-eyebrow text-right">sold</span>
          </div>
          {appearances.map(({ token, wallet }) => (
            <Link
              key={token.mint}
              href={`/token/${token.chain}/${token.mint}`}
              className="drow grid grid-cols-[minmax(0,1fr)_64px_56px_56px] items-center gap-x-2 border-b border-line px-3 py-2 last:border-b-0"
            >
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate t-xs font-semibold text-fg">{token.symbol}</span>
                <span className="t-xs text-fg4">{token.chain}</span>
                <span className={`shrink-0 font-mono text-[8.5px] uppercase tracking-[0.05em] ${
                  wallet.status === "holding" ? "text-warn" : "text-fg4"
                }`}>
                  {wallet.status}
                </span>
              </div>
              <span className={`text-right t-mono text-[11px] tabular-nums ${(wallet.pct ?? 0) > 10 ? "text-bad" : "text-fg2"}`}>
                {wallet.pct?.toFixed(2) ?? "—"}%
              </span>
              <span className="text-right t-mono text-[10.5px] tabular-nums text-fg4">
                {wallet.bought !== undefined && wallet.bought > 0 ? `${wallet.bought.toFixed(2)}%` : "—"}
              </span>
              <span className={`text-right t-mono text-[10.5px] tabular-nums ${(wallet.sold ?? 0) > 0 ? "text-hot" : "text-fg4"}`}>
                {(wallet.sold ?? 0) > 0 ? `${wallet.sold}%` : "—"}
              </span>
            </Link>
          ))}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Behaviour on this token" note="the row for this token only — the record above covers all five launches">
            <div className="space-y-0">
              <Split label="first sell after launch" tone="warn">
                {first.firstSell !== undefined && first.firstSell > 0 ? `${formatSecs(first.firstSell)}` : "never sold"}
              </Split>
              <Split label="holding time">
                {first.held !== undefined && first.held > 0 ? `${first.held}h` : "still open"}
              </Split>
              <Split label="entry price">
                {first.avgEntry !== undefined ? fmtPrice(first.avgEntry) : "received, not bought"}
              </Split>
              <Split label="exit behaviour">
                {(first.sold ?? 0) > 50 ? "sold the majority" : (first.sold ?? 0) > 0 ? "taking profit gradually" : "holding"}
              </Split>
              <Split label="tags">{first.tags?.join(" · ") ?? "none"}</Split>
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg4">
              Nothing here is a motive. A wallet that sells quickly after launch is what a bot does
              and also what a profitable human does — the record says which, and when
            </p>
          </Panel>

          <Panel title="Its track record" note="across every launch this scan has seen it in">
            <div className="space-y-1.5">
              {appearances.map(({ token, wallet }) => (
                <div key={token.mint} className="border-b border-line pb-1.5 last:border-b-0">
                  <div className="flex items-baseline gap-2">
                    <span className="t-xs font-semibold text-fg">{token.symbol}</span>
                    <span className="t-xs text-fg4">{wallet.status}</span>
                    <span className="ml-auto t-mono text-[10px] text-fg3">
                      {wallet.pct?.toFixed(2) ?? "—"}%
                    </span>
                  </div>
                  <div className="mt-0.5 t-xs text-fg4">
                    {token.bundlePct > 15 ? "bought a launch bundle" : "bought after launch"}
                    {wallet.priorRugs ? ` · ${wallet.priorRugs} prior rugs` : ""}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {exits.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-baseline gap-2">
              <h2 className="t-section text-fg">Its exits, in order</h2>
              <span className="t-xs text-fg4">
                whether it leaves before or after everyone else in the same launch
              </span>
            </div>
            <ExitOrderTable rows={exits} />
          </div>
        )}

        <ProReveal
          title="Every move this wallet made, per launch"
          shown={4}
          rows={[
            <div
              key="hdr"
              className="grid grid-cols-[minmax(0,1fr)_54px_48px_50px] items-baseline gap-x-2 border-b border-line bg-surf2/40 px-2.5 py-1.5 sm:grid-cols-[minmax(0,1fr)_58px_54px_58px_52px]"
            >
              <span className="t-eyebrow">token</span>
              <span className="t-eyebrow text-right" title="share of supply bought">bought</span>
              <span className="t-eyebrow text-right" title="seconds after the open it first bought">entry</span>
              <span className="hidden t-eyebrow text-right sm:block" title="minutes held before its first sell">held</span>
              <span className="t-eyebrow text-right" title="exit as a share of that token's peak">exit</span>
            </div>,
            ...[...(profile?.appearances ?? [])]
            .sort((a, b) => b.launch.at.localeCompare(a.launch.at))
            .map(({ launch, row, atLaunch }) => (
              <div
                key={`${launch.mint}-${launch.at}`}
                className="grid grid-cols-[minmax(0,1fr)_54px_48px_50px] items-baseline gap-x-2 border-b border-line px-2.5 py-[5px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_58px_54px_58px_52px]"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate t-xs font-semibold text-fg">{launch.symbol}</span>
                    {atLaunch && <Tag tone="bad">block 0</Tag>}
                    {row.sold === 0 && <Tag tone="neutral">never sold</Tag>}
                  </div>
                  <div className="mt-0.5 t-mono text-[9px] text-fg4">{launch.at}</div>
                </div>
                <span className="text-right t-mono text-[10px] tabular-nums text-fg3">
                  {row.bought.toFixed(1)}%
                </span>
                <span className="text-right t-mono text-[10px] tabular-nums text-fg4">
                  {row.entrySec < 60 ? `${row.entrySec}s` : `${Math.round(row.entrySec / 60)}m`}
                </span>
                <span className="hidden text-right t-mono text-[10px] tabular-nums text-fg3 sm:block">
                  {row.holdMin === null
                    ? "—"
                    : row.holdMin < 60
                      ? `${row.holdMin}m`
                      : `${(row.holdMin / 60).toFixed(1)}h`}
                </span>
                <span
                  className={`text-right t-mono text-[10px] tabular-nums ${
                    row.exitAtPeakFrac === null
                      ? "text-fg4"
                      : row.exitAtPeakFrac < 0.4
                        ? "text-bad"
                        : row.exitAtPeakFrac < 0.7
                          ? "text-warn"
                          : "text-good"
                  }`}
                >
                  {row.exitAtPeakFrac === null ? "still in" : `${Math.round(row.exitAtPeakFrac * 100)}%`}
                </span>
              </div>
            ))]}
          more={[
            "PnL and ROI on every token it has touched, not just the ones in this scan",
            "Every wallet it has ever received from, with the funding trail ranked by size",
            "Other wallets seeded by the same funder, and which tokens they hit together",
            "Whether it exits faster on newer or older tokens",
            "Prior bundles it joined, and how each of those launches ended",
            "Alerts when this address next moves",
          ]}
          note="Every row is this wallet's own entry and exit on a recorded launch. What sits below the clip is the same table — the paywall is depth of history, not a different read"
        />

        <Panel title="Related wallets" note="same funder, same behaviour" flush>
          <div>
            {[DEMO_WALLETS.bundle2, DEMO_WALLETS.bundle3, DEMO_WALLETS.dev]
              .filter((a) => a !== decoded)
              .map((a) => (
                <Link
                  key={a}
                  href={`/wallets/${a}`}
                  className="drow flex items-baseline gap-2 border-b border-line px-3 py-1.5 last:border-b-0"
                >
                  <span className="font-mono text-[10.5px] text-fg2">{shortAddr(a, 6, 4)}</span>
                  <Tag tone={WALLET_ROLE[a] === "deployer" ? "bad" : "warn"}>
                    {WALLET_ROLE[a] ?? "linked"}
                  </Tag>
                  <span className="ml-auto t-xs text-fg4">
                    {a === DEMO_WALLETS.dev ? "received funds from same source" : "funded by the same wallet"}
                  </span>
                </Link>
              ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function walletAge(born?: string): string {
  if (!born) return "unknown";
  const d = new Date(born);
  if (Number.isNaN(d.getTime())) return "unknown";
  const days = Math.max(0, Math.round((Date.now() - d.getTime()) / 86_400_000));
  if (days < 1) return "same day";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

function formatSecs(s: number): string {
  if (s < 60) return `${s}s after launch`;
  if (s < 3600) return `${Math.round(s / 60)}m after launch`;
  return `${(s / 3600).toFixed(1)}h after launch`;
}

function describeWallet(role: string, launches: number, rugs: number, appearances: number): string {
  if (rugs >= 3)
    return `This address has appeared on ${launches} prior launches and ${rugs} of them lost their liquidity. That is a record of behaviour, and it is the only evidence available about what happens next. Appearing on ${appearances} token${appearances === 1 ? "" : "s"} in this scan means it is not a one-off.`;
  if (role === "smart money")
    return `A wallet with a profitable history across ${launches} launches and only ${rugs} collapses. Its presence on a token is a point in that token's favour — but experienced wallets trade rugs deliberately, they simply leave first.`;
  if (role === "deployer")
    return `The wallet that created ${appearances === 1 ? "this token" : "these tokens"}. Its holdings matter less than its history: ${launches} launches, ${rugs} collapsed.`;
  if (appearances > 1)
    return `This address holds positions across ${appearances} tokens in this scan. Cross-token presence is how a single operator spread across many wallets becomes visible.`;
  return `A single appearance in this scan with ${launches} prior launches on record. Not enough history to call it either way — which is a finding in itself.`;
}
