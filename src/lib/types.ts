import type { ChainId } from "./chains";

/* ------------------------------------------------------------------ *
 * Data model
 *
 * Every optional field is `null`, never a default value. The UI contract
 * is that null means "we do not know", and the design brief forbids
 * turning that into either a number or a warning.
 * ------------------------------------------------------------------ */

export type DataQuality =
  /** Read directly from a source that reports it. */
  | "observed"
  /** Derived by us from observed values; the formula is shown in the UI. */
  | "derived"
  /** Produced by a model from text; never mixed with the two above. */
  | "inferred";

export interface Sourced<T> {
  value: T | null;
  quality: DataQuality;
  source: string;
  /** ISO timestamp of the snapshot this value describes. */
  asOf: string | null;
  note?: string;
}

export interface SourceStatus {
  source: string;
  ok: boolean;
  ms: number;
  error?: string;
  note?: string;
  degraded?: boolean;
}

export interface TokenIdentity {
  address: string;
  chain: ChainId;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  imageUrl: string | null;
  pairAddress: string | null;
  dexId: string | null;
  explorerUrl: string;
}

export interface MarketData {
  priceUsd: number | null;
  /** Which of the two was actually reported, since they differ for most tokens. */
  capKind: "marketCap" | "fdv" | null;
  marketCap: number | null;
  fdv: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  ageHours: number | null;
  txns24h: { buys: number; sells: number } | null;
  pairCreatedAt: string | null;
  pools: PoolRef[];
}

export interface PoolRef {
  address: string;
  dexId: string;
  liquidityUsd: number | null;
}

export interface ProjectInfo {
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  description: string | null;
  source: string | null;
}

export interface Narrative {
  /** Short theme label, e.g. "animal", "AI agent", "political". */
  theme: string | null;
  summary: string | null;
  keywords: string[];
  quality: DataQuality;
  source: string | null;
  /** Explicit, because the brief requires it be impossible to miss. */
  disclaimer: string;
}

export type HolderLabel =
  | "liquidity-pool"
  | "burn"
  | "bonding-curve"
  | "launchpad-vault"
  | "exchange"
  | "contract"
  | "locked";

export interface Holder {
  rank: number;
  address: string;
  /** Raw token amount, already scaled by decimals when decimals were known. */
  balance: number | null;
  pct: number | null;
  label: HolderLabel | null;
  /** Why this label was applied — the brief forbids unexplained labels. */
  labelBasis: string | null;
}

export interface HolderAnalysis {
  rows: Holder[];
  totalHolders: number | null;
  /** Share of supply held by the top 10 after removing LP/burn/curve. */
  effectiveTop10Pct: number | null;
  /** True when the top-10 reading means anything at all. */
  meaningful: boolean;
  /** Plain-language reason when it does not. */
  note: string | null;
  snapshotAt: string | null;
  /** How pct was computed, shown in the UI as a footnote. */
  method: string;
}

export interface ClusterGroup {
  id: string;
  wallets: number;
  pctOfSupply: number | null;
  /** Funded from one address we could trace, or unknown. */
  sharedFunder: string | null;
  members: string[];
}

export interface ClusterAnalysis {
  groups: ClusterGroup[];
  /** Total supply held by wallets we could link to another wallet. */
  linkedSupplyPct: number | null;
  dataAvailable: boolean;
  note: string | null;
  tracedWallets: number;
  unknownWallets: number;
}

export interface FlowAnalysis {
  buys: number | null;
  sells: number | null;
  buyVolumeUsd: number | null;
  sellVolumeUsd: number | null;
  /** (buy - sell) / (buy + sell) by volume; null when volume was unavailable. */
  imbalance: number | null;
  distinctTraders: number | null;
  windowTrades: number;
  dataAvailable: boolean;
  note: string | null;
}

export interface DeployerAnalysis {
  address: string | null;
  balancePct: number | null;
  priorTokens: { address: string; symbol: string | null; rugged: boolean }[];
  ruggedCount: number;
  dataAvailable: boolean;
}

export interface SecurityData {
  honeypot: boolean | null;
  mintable: boolean | null;
  freezable: boolean | null;
  /** EVM only; Solana has no equivalent and must not report false. */
  blacklist: boolean | null;
  ownershipRenounced: boolean | null;
  openSource: boolean | null;
  buyTax: number | null;
  sellTax: number | null;
  lpLockedPct: number | null;
  lpBurned: boolean | null;
  ownerPrivileges: string[];
  dataAvailable: boolean;
  source: string | null;
}

export interface ExitAnalysis {
  available: boolean;
  /** USD size that can be sold for a given price impact. */
  maxSellUsd: { slip1: number | null; slip5: number | null; slip10: number | null };
  /** Pool liquidity as a percentage of market cap. */
  liquidityCoverage: number | null;
  note: string | null;
}

/* ------------------------------- checks ------------------------------ */

export type CheckState = "pass" | "fail" | "warn" | "unknown";

export interface Check {
  id: string;
  /** Written as a question a trader would actually ask. */
  label: string;
  state: CheckState;
  /** The one number or fact that decided the state. */
  reading: string;
  source: string;
  quality: DataQuality;
  /** Shown on expand; explains what would make it pass. */
  detail: string;
}

export interface Verdict {
  /** 0-100, higher = worse. */
  score: number;
  band: "clean" | "watch" | "risky" | "avoid";
  fails: number;
  warns: number;
  unknowns: number;
  passes: number;
  headline: string;
  /** One sentence a trader can act on. */
  tldr: string;
}

export interface AnalysisResult {
  token: TokenIdentity;
  market: MarketData;
  project: ProjectInfo;
  narrative: Narrative;
  holders: HolderAnalysis;
  clusters: ClusterAnalysis;
  flow: FlowAnalysis;
  deployer: DeployerAnalysis;
  security: SecurityData;
  exit: ExitAnalysis;
  checks: Check[];
  verdict: Verdict;
  provenance: SourceStatus[];
  generatedAt: string;
  cached: boolean;
  disclaimer: string;
}

export interface AnalyzeResponse {
  data?: AnalysisResult;
  error?: string;
  hint?: string;
}
