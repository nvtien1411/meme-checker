import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, ProReveal, Split, Stat, Tag } from "@/components/ui";
import { DEMO_TOKENS, DEMO_WALLETS, WALLET_ROLE, shortAddr } from "@/lib/demo";
import { fmtPrice, fmtUsd } from "@/lib/http";

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

export default async function WalletPage({ params }: { params: Promise<{ addr: string }> }) {
  const { addr } = await params;
  const decoded = decodeURIComponent(addr);

  // assemble every appearance of this address across the dataset
  const appearances = DEMO_TOKENS.map((t) => {
    const w = t.wallets.find((x) => x.addr.toLowerCase() === decoded.toLowerCase());
    return w ? { token: t, wallet: w } : null;
  }).filter((x): x is { token: (typeof DEMO_TOKENS)[number]; wallet: (typeof DEMO_TOKENS)[number]["wallets"][number] } => x !== null);

  if (appearances.length === 0) notFound();

  const first = appearances[0].wallet;
  const role = WALLET_ROLE[decoded] ?? first.tags?.[0] ?? "unclassified";
  const born = first.born;
  const priorLaunches = Math.max(...appearances.map((a) => a.wallet.priorLaunches ?? 0));
  const priorRugs = Math.max(...appearances.map((a) => a.wallet.priorRugs ?? 0));
  const totalPct = appearances.reduce((n, a) => n + (a.wallet.pct ?? 0), 0);
  const funder = first.funder;

  return (
    <div>
      <PageHead
        title={shortAddr(decoded, 8, 6)}
        note={role}
        right={
          <>
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
              sub: funder ? "shared source" : "not traced",
              tone: funder ? "warn" : "default",
            },
          ].map((s) => (
            <div key={s.label} className="panel p-2.5">
              <Stat
                label={s.label}
                value={s.value}
                sub={s.sub}
                size="md"
                mono={s.label !== "wallet age" && s.label !== "funded by"}
                tone={
                  s.tone === "bad" ? "bad" : s.tone === "warn" ? "warn" : s.tone === "good" ? "good" : "default"
                }
              />
            </div>
          ))}
        </div>

        {/* the verdict on this wallet */}
        <Panel title="What this address is" note="read this before acting on its position anywhere">
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
          <Panel title="Behaviour" note="what the record shows, not a label">
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

        <ProReveal
          title="The rest of this wallet&#39;s history"
          shown={1}
          rows={[
            <Panel key="hist" title="Full trade history" note="every entry and exit, newest first">
              <div className="space-y-1">
                {[
                  { t: "2026-11-22 14:00", kind: "buy", token: "RATS", amount: "18.9%", usd: 12400 },
                  { t: "2026-11-18 09:12", kind: "sell", token: "PEACH", amount: "62%", usd: 38800 },
                  { t: "2026-11-15 22:41", kind: "buy", token: "TRIPLET", amount: "9.4%", usd: 9100 },
                  { t: "2026-11-09 17:03", kind: "sell", token: "JELLY", amount: "100%", usd: 22100 },
                ].map((tr) => (
                  <div
                    key={tr.t}
                    className="flex items-baseline gap-2 border-b border-line py-1 last:border-b-0"
                  >
                    <span className="t-mono text-[9.5px] text-fg4">{tr.t}</span>
                    <span
                      className={`font-mono text-[9px] uppercase ${
                        tr.kind === "buy" ? "text-good" : "text-bad"
                      }`}
                    >
                      {tr.kind}
                    </span>
                    <span className="t-xs text-fg2">{tr.token}</span>
                    <span className="ml-auto t-mono text-[10px] text-fg3">{tr.amount}</span>
                    <span className="w-16 text-right t-mono text-[10px] text-fg4">
                      {fmtUsd(tr.usd)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>,
          ]}
          more={[
            "PnL and ROI on every token it has touched, not just the ones in this scan",
            "Every wallet it has ever received from, with the funding trail ranked by size",
            "Other wallets seeded by the same funder, and which tokens they hit together",
            "Whether it exits faster on newer or older tokens",
            "Prior bundles it joined, and how each of those launches ended",
            "Alerts when this address next moves",
          ]}
          note="The last four movements of this address are shown in full. Everything older requires Pro"
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
