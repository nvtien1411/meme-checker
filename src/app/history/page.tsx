import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Demo, Panel, ProReveal, RiskDot, Tag } from "@/components/ui";
import { ScanMemory } from "@/components/Intelligence3";
import { DEMO_TOKENS } from "@/lib/demo";

/* ==================================================================== *
 * HISTORY
 *
 * Every scan, with the delta. The column that makes this page worth opening
 * is "then → now": a product that records its own predictions and shows the
 * result is the only kind that earns a second visit.
 * ==================================================================== */

export const metadata = { title: "History" };

const SF = DEMO_TOKENS[0];

const SCANNED = [
  { mint: SF.mint, chain: "solana", symbol: "RATS", name: SF.name, at: "2h ago", scoreThen: 51, scoreNow: 71, mcapThen: 51200, mcapNow: SF.mcap, risk: SF.risk },
  { mint: DEMO_TOKENS[2].mint, chain: "solana", symbol: "CATWIF", name: DEMO_TOKENS[2].name, at: "5h ago", scoreThen: 41, scoreNow: 88, mcapThen: 340000, mcapNow: DEMO_TOKENS[2].mcap, risk: "critical" },
  { mint: DEMO_TOKENS[1].mint, chain: "solana", symbol: "BONK", name: "Bonk", at: "1d ago", scoreThen: 20, scoreNow: 34, mcapThen: 1580000, mcapNow: DEMO_TOKENS[1].mcap, risk: "moderate" },
  { mint: DEMO_TOKENS[3].mint, chain: "solana", symbol: "PNUT", name: "Peanut the Squirrel", at: "2d ago", scoreThen: 38, scoreNow: 41, mcapThen: 3300000, mcapNow: DEMO_TOKENS[3].mcap, risk: "moderate" },
  { mint: DEMO_TOKENS[4].mint, chain: "bsc", symbol: "CAKE", name: "PancakeSwap", at: "3d ago", scoreThen: 12, scoreNow: 12, mcapThen: 739000000, mcapNow: DEMO_TOKENS[4].mcap, risk: "low" },
];

export default function HistoryPage() {
  return (
    <div>
      <PageHead
        title="History"
        note="every scan, and what the score did afterwards"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{SCANNED.length} scans</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <ProReveal
          title="What every scan you have run has in common"
          shown={0}
          rows={[]}
          more={[
            "Every address that appeared in more than one of your scans",
            "Which of those wallets are still holding, and which have left",
            "The deployers you have crossed more than once, with their record",
            "Whether the score on a past scan was right — the delta, kept forever",
            "Tokens you scanned that later collapsed, and the signal that was present then",
          ]}
          note="Free keeps the last few scans. This is the memory that turns a scan history into a picture of who keeps turning up in what you look at"
        >
          <ScanMemory />
        </ProReveal>

        <Panel title="Why this page exists" note="the product grading itself">
          <p className="t-xs leading-relaxed text-fg3">
            A scan is a claim about the future. Recording the claim and showing what happened is the
            cheapest way to find out whether the claim is any good — and the only way a reader can
            judge the tool instead of trusting it. A score that rose from 51 to 71 in two hours is
            also a warning that the token is moving
          </p>
        </Panel>

        <Panel flush>
          <div className="grid grid-cols-[minmax(0,1fr)_56px_56px_60px] items-baseline gap-x-2.5 border-b border-line bg-surf2/40 px-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_60px_64px_64px_72px]">
            <span className="t-eyebrow">token</span>
            <span className="t-eyebrow text-right">score</span>
            <span className="hidden t-eyebrow text-right sm:block">mcap</span>
            <span className="t-eyebrow text-right">then → now</span>
          </div>

          {SCANNED.map((s) => {
            const scoreDelta = s.scoreNow - s.scoreThen;
            const mcapDelta = ((s.mcapNow - s.mcapThen) / s.mcapThen) * 100;
            return (
              <Link
                key={s.mint}
                href={`/token/${s.chain}/${s.mint}`}
                className="drow grid grid-cols-[minmax(0,1fr)_56px_56px_60px] items-center gap-x-2.5 border-b border-line px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_60px_64px_64px_72px]"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <RiskDot risk={s.risk} />
                    <span className="truncate t-xs font-semibold text-fg">{s.symbol}</span>
                    <span className="shrink-0 t-mono text-[9.5px] text-fg4">{s.at}</span>
                  </div>
                  <div className="mt-0.5 truncate t-xs text-fg4">{s.name}</div>
                </div>
                <span
                  className={`text-right t-mono text-[11px] ${
                    scoreDelta > 10 ? "text-bad" : scoreDelta < -10 ? "text-good" : "text-fg3"
                  }`}
                >
                  {scoreDelta > 0 ? "+" : ""}
                  {scoreDelta}
                </span>
                <span
                  className={`hidden text-right t-mono text-[10.5px] sm:block ${
                    mcapDelta < -15 ? "text-bad" : mcapDelta > 15 ? "text-good" : "text-fg4"
                  }`}
                >
                  {mcapDelta > 0 ? "+" : ""}
                  {mcapDelta.toFixed(1)}%
                </span>
                <span className="text-right t-mono text-[10px] text-fg4">
                  {s.scoreThen} → <span className="text-fg2">{s.scoreNow}</span>
                </span>
              </Link>
            );
          })}
        </Panel>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Score movement" note="which scans got worse, and by how much">
            <div className="space-y-2">
              {SCANNED.filter((s) => s.scoreNow !== s.scoreThen).map((s) => (
                <div key={s.mint}>
                  <div className="flex items-baseline justify-between">
                    <span className="t-xs text-fg3">{s.symbol}</span>
                    <span className="t-mono text-[10.5px] text-bad">
                      {s.scoreThen} → {s.scoreNow}
                    </span>
                  </div>
                  <div className="mt-1 flex h-[4px] w-full overflow-hidden bg-surf3">
                    <div className="bg-fg4" style={{ width: `${s.scoreThen}%` }} />
                    <div className="bg-bad" style={{ width: `${s.scoreNow - s.scoreThen}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg4">
              Grey is the score at scan time, red is what it added since. CATWIF gained 47 points in
              five hours — the holder set changed, not the contract
            </p>
          </Panel>

          <Panel title="Recent activity" note="entities you opened, newest first" flush>
            {[
              { kind: "token", label: "RATS", at: "2h ago" },
              { kind: "caller", label: "@cryptocole", at: "2h ago" },
              { kind: "token", label: "CATWIF", at: "5h ago" },
              { kind: "wallet", label: "BBPzEy…RRbMNk", at: "5h ago" },
              { kind: "deployer", label: "3cJu879…Rdvyw", at: "8h ago" },
              { kind: "token", label: "BONK", at: "1d ago" },
            ].map((a) => (
              <div
                key={`${a.kind}-${a.label}`}
                className="flex items-baseline gap-2 border-b border-line px-3 py-1.5 last:border-b-0"
              >
                <span className="font-mono text-[8.5px] uppercase tracking-[0.06em] text-fg4">
                  {a.kind}
                </span>
                <span className="min-w-0 flex-1 truncate t-xs text-fg3">{a.label}</span>
                <span className="t-mono text-[9.5px] text-fg4">{a.at}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
