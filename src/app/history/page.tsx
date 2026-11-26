import { HistoryLedger } from "./HistoryLedger";
import { PageHead } from "@/components/Shell";
import { Demo, ProReveal, Tag } from "@/components/ui";
import { ScanMemory } from "@/components/Intelligence3";
import { WalletProRows } from "@/components/ProRows";
import { DEMO_WALLETS, DEMO_TOKENS } from "@/lib/demo";

/* ==================================================================== *
 * HISTORY
 *
 * Every scan, with the delta. The column that makes this page worth opening
 * is "then → now": a product that records its own predictions and shows the
 * result is the only kind that earns a second visit.
 * ==================================================================== */

export const metadata = { title: "Scan History" };

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
        title="Scan History"
        note="Every scan. Did the risk get worse after you aped?"
        right={
          <>
            <Demo />
            <Tag tone="neutral">{SCANNED.length} scans</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <HistoryLedger />

        <ProReveal
          title="Scan memory: who keeps turning up?"
          shown={2}
          rows={[<WalletProRows key="w" addrs={Object.values(DEMO_WALLETS)} />]}
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
      </div>
    </div>
  );
}
