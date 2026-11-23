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

/* ------------------------------- forensics -----------------------------
 * Wallet-behaviour layer. Every field is nullable because the backend
 * ships these incrementally: a module exists on the page from the start
 * and fills in as the pipeline learns to answer it. A null is rendered as
 * unknown — never as zero, never as a pass, never as a warning.
 *
 * `enabled` is the build switch. While the pipeline does not populate this
 * layer, blocks stay `enabled: false` and the UI renders the locked state
 * it would show a free user — a card that names the module and says what
 * it would answer, never invented values.
 * ------------------------------------------------------------------ */

export type ForensicsStatus = "sold" | "transferred" | "holding" | "unknown";

export interface ForensicsWallet {
  address: string;
  /** Wallet that sent this one its opening balance, when traced. */
  funder: string | null;
  /** First activity of this wallet — the age signal. */
  firstSeenAt: string | null;
  /** Share of supply this wallet bought at launch. */
  boughtPct: number | null;
  /** Share of what it bought that it has since sold. */
  soldPct: number | null;
  /** USD price it paid on average, so the reader can see its cost basis. */
  avgEntryPrice: number | null;
  avgSellPrice: number | null;
  /** Seconds from launch to its first sell. */
  firstSellOffsetSec: number | null;
  /** Hours held before that first sell. */
  holdHours: number | null;
  stillHoldsPct: number | null;
  status: ForensicsStatus;
  /** Launches this wallet appeared on before this one. */
  priorLaunches: number | null;
  priorRugs: number | null;
}

export interface BundleGroup {
  id: string;
  wallets: ForensicsWallet[];
  /** Sum of what the group still holds. */
  supplyPct: number | null;
  /** Minutes between the first and last wallet being funded pre-launch. */
  fundedWindowMin: number | null;
  /** Share of wallets that bought near-identical amounts — bot signature. */
  uniformBuyRatio: number | null;
  /** Share of wallets that sold inside the same slot — atomic exit. */
  sellSynchrony: number | null;
  holdTimeMedianHours: number | null;
  /** Whether the group is shown in full or only counted. */
  revealed: boolean;
}

export interface SniperSet {
  count: number | null;
  supplyPct: number | null;
  sold: number | null;
  transferred: number | null;
  holding: number | null;
  /** Median cost basis vs current price, as a multiple. */
  profitMultiple: number | null;
  wallets: ForensicsWallet[];
  revealed: boolean;
}

export interface WalletForensics {
  /** False when no launch-block read was possible at all. */
  available: boolean;
  /** False until the backend populates this layer. Drives the locked card. */
  enabled: boolean;
  bundle: { count: number | null; supplyPct: number | null; groups: BundleGroup[] };
  sniper: SniperSet;
  insider: { walletCount: number | null; supplyPct: number | null };
  fresh: { count: number | null; supplyPct: number | null };
  /** Seconds from the first insider sell to a 50% drawdown. */
  exitWindowSeconds: number | null;
  note: string | null;
  asOf: string | null;
}

/* ------------------------------- callers -----------------------------
 * Who told you about it, and what they did with their own money.
 * ------------------------------------------------------------------ */

export interface CallerPost {
  handle: string;
  displayName: string | null;
  followers: number | null;
  postUrl: string;
  postedAt: string;
  /** Percent the token had already moved in the 3 min before the post. */
  prePostRunUpPct: number | null;
  /** Wallet behind the account, when it could be matched. */
  wallet: string | null;
  /** Seconds from wallet buy to post. Negative means he called before buying. */
  leadSeconds: number | null;
  /** Share of his position sold after posting. */
  postCallSoldPct: number | null;
  /** Average sell price divided by price at post. Above 1 means he sold into followers. */
  exitVsCallPrice: number | null;
}

export interface CallerIntel {
  available: boolean;
  posts: CallerPost[];
  /** Mid-tier accounts calling inside one short window — a coordinated group. */
  cabalScore: number | null;
  cabalWindowMin: number | null;
  cabalHandles: string[];
  /** 0-100, higher means more of the reply volume is automated. */
  botEngagementPct: number | null;
  /** Accounts that renamed themselves shortly before calling. */
  renamedAccounts: number | null;
  note: string | null;
  asOf: string | null;
}

/* ------------------------------ narrative ---------------------------- */

export interface NarrativeInstance {
  address: string;
  symbol: string | null;
  peakMarketCap: number | null;
  hoursToPeak: number | null;
  hoursToMinus90: number | null;
}

export interface NarrativeIntel {
  available: boolean;
  /** How many of this narrative already exist in the window. 1 is the original. */
  copyIndex: number | null;
  firstMover: boolean | null;
  /** Share of mentions that carry no contract address — content, not shilling. */
  organicScore: number | null;
  /** Median lifespan of prior instances, in hours. */
  survivalMedianHours: number | null;
  priorInstances: NarrativeInstance[];
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
  /** Compact one-line summary for dense headers, e.g. "2 failed · 1 watch". */
  failuresLine: string;
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
  /**
   * Optional layers. Absent means the backend has not built them yet, which
   * the UI must show as "not measured" rather than as a clean result.
   */
  forensics?: WalletForensics;
  callers?: CallerIntel;
  narrativeIntel?: NarrativeIntel;
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
