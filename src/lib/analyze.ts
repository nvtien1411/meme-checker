import { CHAIN_BY_ID, chainByDexScreenerId, guessAddressKind, isValidForChain, type ChainId } from "./chains";
import {
  dsSearch,
  dsTokenPairs,
  identityFromPair,
  marketFromPair,
  pickBestPair,
  poolsFromPairs,
  projectFromPair,
  type DsPair,
} from "./providers/dexscreener";
import {
  bestGtPool,
  gtPools,
  gtToken,
  gtTrades,
  poolAddress,
  tradesFromGt,
} from "./providers/geckoterminal";
import {
  deployerFromRc,
  holdersFromRc,
  rcReport,
  securityFromRc,
} from "./providers/rugcheck";
import { gpTokenSecurity, holdersFromGp, pickGpToken, securityFromGp } from "./providers/goplus";
import { buildChecks, buildVerdict } from "./analysis/checks";
import { computeExit, computeFlow, computeHolders, emptyClusters } from "./analysis/metrics";
import { buildNarrative } from "./analysis/narrative";
import type {
  AnalysisResult,
  ClusterAnalysis,
  DeployerAnalysis,
  Holder,
  SecurityData,
  SourceStatus,
  TokenIdentity,
} from "./types";

export const DISCLAIMER =
  "Meme Checker is a research aid, not advice. Every number here comes from a public source and can be wrong, late or incomplete. A missing value is shown as unknown and is never counted as a pass.";

export interface AnalyzeOptions {
  address: string;
  chain?: ChainId | null;
  budgetMs?: number;
}

export class AnalysisError extends Error {
  constructor(
    message: string,
    public hint?: string,
  ) {
    super(message);
  }
}

function emptySecurity(): SecurityData {
  return {
    honeypot: null,
    mintable: null,
    freezable: null,
    blacklist: null,
    ownershipRenounced: null,
    openSource: null,
    buyTax: null,
    sellTax: null,
    lpLockedPct: null,
    lpBurned: null,
    ownerPrivileges: [],
    dataAvailable: false,
    source: null,
  };
}

function emptyDeployer(): DeployerAnalysis {
  return {
    address: null,
    balancePct: null,
    priorTokens: [],
    ruggedCount: 0,
    dataAvailable: false,
  };
}

export async function analyzeToken(opts: AnalyzeOptions): Promise<AnalysisResult> {
  const address = opts.address.trim();
  const provenance: SourceStatus[] = [];

  // Wall-clock ceiling. Each provider has its own timeout, but their sum is
  // unbounded; without this a slow upstream turns into a platform-level 504
  // with no body instead of a report with honest gaps.
  const deadline = Date.now() + (opts.budgetMs ?? 34_000);
  const remaining = () => deadline - Date.now();
  const outOfTime = () => remaining() < 1_500;

  const guess = guessAddressKind(address);
  if (!guess) {
    throw new AnalysisError(
      "That does not look like a Solana or EVM contract address.",
      "A Solana address is 32-44 base58 characters. An EVM address is 0x followed by 40 hex characters.",
    );
  }

  /* --------------------------- resolve chain --------------------------- */
  let chain: ChainId;
  let pairs: DsPair[] = [];
  let best: DsPair | null = null;

  const pairsRes = await dsTokenPairs(address);
  provenance.push(pairsRes.status);
  const allPairs = pairsRes.data?.pairs ?? [];

  if (opts.chain) {
    chain = opts.chain;
    if (!isValidForChain(address, chain)) {
      throw new AnalysisError(
        `That address is not a valid ${CHAIN_BY_ID[chain].label} address.`,
        guess.kind === "solana"
          ? "This looks like a Solana address — try Auto-detect."
          : "This looks like an EVM address — try Auto-detect or pick the right EVM chain.",
      );
    }
    pairs = allPairs.filter((p) => chainByDexScreenerId(p.chainId) === chain);
    best = pickBestPair(pairs);
  } else if (allPairs.length > 0) {
    best = pickBestPair(allPairs);
    chain = chainByDexScreenerId(best?.chainId) ?? (guess.kind === "solana" ? "solana" : "ethereum");
    pairs = allPairs.filter((p) => chainByDexScreenerId(p.chainId) === chain);
  } else {
    // No pair anywhere. Try the obvious chain, then the search endpoint, so a
    // token that simply is not indexed still gets a clear answer.
    chain = guess.kind === "solana" ? "solana" : "ethereum";
    const search = await dsSearch(address);
    provenance.push(search.status);
    const found = (search.data?.pairs ?? []).filter(
      (p) => p.baseToken?.address?.toLowerCase() === address.toLowerCase(),
    );
    if (found.length > 0) {
      best = pickBestPair(found);
      chain = chainByDexScreenerId(best?.chainId) ?? chain;
      pairs = found.filter((p) => chainByDexScreenerId(p.chainId) === chain);
    }
  }

  /* -------------------------- identity + market ------------------------ */
  const needGtToken = !best;
  const gtTok = needGtToken
    ? await gtToken(chain, address)
    : { ok: true, data: null, status: { source: "geckoterminal:token", ok: true, ms: 0, note: "skipped (dexscreener answered)" } };
  provenance.push(gtTok.status);

  const token: TokenIdentity = best
    ? identityFromPair(best, chain, address)
    : {
        address,
        chain,
        name: gtTok.data?.data?.attributes?.name ?? null,
        symbol: gtTok.data?.data?.attributes?.symbol ?? null,
        decimals: gtTok.data?.data?.attributes?.decimals ?? null,
        imageUrl: gtTok.data?.data?.attributes?.image_url ?? null,
        pairAddress: null,
        dexId: null,
        explorerUrl: CHAIN_BY_ID[chain].explorer(address),
      };

  const market = marketFromPair(best);
  market.pools = poolsFromPairs(pairs);

  if (market.liquidityUsd === null && gtTok.data?.data?.attributes?.total_reserve_in_usd) {
    const v = Number(gtTok.data.data.attributes.total_reserve_in_usd);
    if (Number.isFinite(v)) market.liquidityUsd = v;
  }

  const project = projectFromPair(best);

  /* -------------------------------- pool ------------------------------- */
  let pool = best?.pairAddress ?? null;
  if (!pool && !outOfTime()) {
    const poolsRes = await gtPools(chain, address);
    provenance.push(poolsRes.status);
    const p = bestGtPool(poolsRes.data?.data);
    pool = poolAddress(p);
  }

  /* ------------------------------- trades ------------------------------ */
  let trades: ReturnType<typeof tradesFromGt> = [];
  if (pool && !outOfTime()) {
    const tradesRes = await gtTrades(chain, pool);
    provenance.push(tradesRes.status);
    trades = tradesFromGt(tradesRes.data?.data);
  } else if (pool) {
    provenance.push({ source: "geckoterminal:trades", ok: false, ms: 0, error: "skipped — time budget" });
  }

  const flow = computeFlow(trades, market.txns24h);

  /* ------------------------------ security ----------------------------- */
  let security: SecurityData = emptySecurity();
  let holderRows: Holder[] = [];
  let totalHolders: number | null = null;
  let deployer: DeployerAnalysis = emptyDeployer();

  if (chain === "solana") {
    const rc = await rcReport(address);
    provenance.push(rc.status);
    if (rc.ok && rc.data) {
      const rep = rc.data;
      security = securityFromRc(rep);
      const h = holdersFromRc(rep);
      holderRows = h.rows;
      totalHolders = h.total;

      if (market.liquidityUsd === null && rep.totalMarketLiquidity) {
        market.liquidityUsd = rep.totalMarketLiquidity;
      }

      const supply = rep.token?.supply ?? null;
      deployer = deployerFromRc(rep, supply);
    }
  }

  if (!outOfTime()) {
    const gp = await gpTokenSecurity(chain, address);
    provenance.push(gp.status);
    const gpTok = pickGpToken(gp.data, address);
    if (gpTok) {
      const gpSec = securityFromGp(gpTok);
      security = security.dataAvailable
        ? {
            ...security,
            honeypot: security.honeypot ?? gpSec.honeypot,
            blacklist: security.blacklist ?? gpSec.blacklist,
            buyTax: security.buyTax ?? gpSec.buyTax,
            sellTax: security.sellTax ?? gpSec.sellTax,
            openSource: security.openSource ?? gpSec.openSource,
            ownershipRenounced: security.ownershipRenounced ?? gpSec.ownershipRenounced,
            ownerPrivileges: [...new Set([...security.ownerPrivileges, ...gpSec.ownerPrivileges])],
          }
        : gpSec;
      if (holderRows.length === 0) holderRows = holdersFromGp(gpTok);
      if (totalHolders === null && gpTok.holder_count) {
        const n = Number(gpTok.holder_count);
        if (Number.isFinite(n)) totalHolders = n;
      }
    }
  } else {
    provenance.push({ source: "goplus", ok: false, ms: 0, error: "skipped — time budget" });
  }

  /* ------------------------------ clusters ----------------------------- */
  // Funding tracing is Solana-only and expensive. It answers a launch-time
  // question, so it is skipped on tokens old enough that the answer no longer
  // means anything.
  const ageH = market.ageHours ?? 0;
  const clusters: ClusterAnalysis =
    chain !== "solana"
      ? emptyClusters(
          "Wallet-cluster tracing currently reads Solana transaction history only. On EVM the holder list shows raw concentration without merged entities.",
        )
      : ageH >= 168
        ? emptyClusters(
            `Funding trace skipped: this pair is ${Math.round(ageH / 24)} days old. Shared-funding detection only describes a launch bundle in the first week; wallets funded months ago say nothing about it.`,
          )
        : emptyClusters(
            "Shared-funding trace not run in this pass. Treat wallet relationships as unknown — not as absent.",
          );

  const holders = computeHolders(holderRows, totalHolders, new Map());

  /* -------------------------------- exit ------------------------------- */
  const exit = computeExit(
    market.liquidityUsd,
    market.priceUsd,
    market.priceUsd,
    market.marketCap ?? market.fdv,
  );

  /* ------------------------------ narrative ---------------------------- */
  const narrative = buildNarrative(token, project);

  /* -------------------------------- checks ----------------------------- */
  const checks = buildChecks({
    market,
    security,
    holders,
    clusters,
    flow,
    deployer,
    exit,
    chain,
  });
  const verdict = buildVerdict(checks);

  return {
    token,
    market,
    project,
    narrative,
    holders,
    clusters,
    flow,
    deployer,
    security,
    exit,
    checks,
    verdict,
    provenance,
    generatedAt: new Date().toISOString(),
    cached: false,
    disclaimer: DISCLAIMER,
  };
}
