import type { ClusterAnalysis, ExitAnalysis, FlowAnalysis, HolderAnalysis, Holder } from "../types";
import type { Trade } from "../providers/geckoterminal";

const SKIP_LABELS = new Set(["liquidity-pool", "burn", "bonding-curve", "launchpad-vault"]);

export function computeHolders(
  rows: Holder[],
  totalHolders: number | null,
  linked: Map<string, string>,
): HolderAnalysis {
  const clean = rows.filter((r) => r.label === null || !SKIP_LABELS.has(r.label));
  const allInCurve =
    rows.length > 0 && rows.slice(0, 3).some((r) => r.label === "bonding-curve");

  // Merge wallets that share a funder into a single entity before summing, so
  // ten wallets from one source count once. This is the whole point of the
  // metric; without it the number just restates the holder list.
  const merged = new Map<string, number>();
  for (const r of clean) {
    if (r.pct === null) continue;
    const key = linked.get(r.address.toLowerCase()) ?? r.address.toLowerCase();
    merged.set(key, (merged.get(key) ?? 0) + r.pct);
  }
  const top = [...merged.values()].sort((a, b) => b - a).slice(0, 10);
  const effectiveTop10Pct = top.length >= 2 ? top.reduce((a, b) => a + b, 0) : null;

  const meaningful = !allInCurve && effectiveTop10Pct !== null && clean.length >= 2;

  return {
    rows: rows.slice(0, 10),
    totalHolders,
    effectiveTop10Pct: meaningful ? effectiveTop10Pct : null,
    meaningful,
    note: allInCurve
      ? "Most supply is still in the launch curve, so holder percentages do not describe real distribution yet."
      : effectiveTop10Pct === null
        ? "Fewer than two real holders could be measured, so concentration cannot be computed."
        : null,
    snapshotAt: new Date().toISOString(),
    method:
      "Top 10 after removing liquidity pools, burn addresses and launch curves, with wallets that share a funding source merged into one entity.",
  };
}

export function computeFlow(trades: Trade[], fallbackTxns: { buys: number; sells: number } | null): FlowAnalysis {
  if (trades.length === 0) {
    return {
      buys: fallbackTxns?.buys ?? null,
      sells: fallbackTxns?.sells ?? null,
      buyVolumeUsd: null,
      sellVolumeUsd: null,
      imbalance: null,
      distinctTraders: null,
      windowTrades: 0,
      dataAvailable: false,
      note: fallbackTxns
        ? "Trade tape unavailable — buy/sell counts come from the pair summary (24h), not from individual trades. Volume split, churn and same-block detection need the tape."
        : "Trade tape unavailable and no pair summary was returned.",
    };
  }

  let buyVol = 0;
  let sellVol = 0;
  let buys = 0;
  let sells = 0;
  const wallets = new Set<string>();
  let haveVolume = false;

  for (const t of trades) {
    if (t.side === "buy") buys++;
    else sells++;
    if (t.wallet) wallets.add(t.wallet.toLowerCase());
    if (t.volumeUsd !== null) {
      haveVolume = true;
      if (t.side === "buy") buyVol += t.volumeUsd;
      else sellVol += t.volumeUsd;
    }
  }

  const total = buyVol + sellVol;
  return {
    buys,
    sells,
    buyVolumeUsd: haveVolume ? buyVol : null,
    sellVolumeUsd: haveVolume ? sellVol : null,
    imbalance: haveVolume && total > 0 ? (buyVol - sellVol) / total : null,
    distinctTraders: wallets.size || null,
    windowTrades: trades.length,
    dataAvailable: true,
    note: haveVolume ? null : "Trades were read but USD volume per side was not reported.",
  };
}

export function computeExit(
  liquidityUsd: number | null,
  priceUsd: number | null,
  quotePriceUsd: number | null,
  marketCap: number | null,
): ExitAnalysis {
  const note =
    "Single-pool constant-product estimate. Multi-pool routing, CEX depth and MEV are not included.";

  if (liquidityUsd === null || liquidityUsd <= 0 || priceUsd === null || quotePriceUsd === null) {
    return {
      available: false,
      maxSellUsd: { slip1: null, slip5: null, slip10: null },
      liquidityCoverage: null,
      note: "Pool reserves or price could not be read, so exit depth cannot be computed.",
    };
  }

  // For constant product, selling S into a pool of quote reserve R moves price
  // by roughly S/R. Solving for the slippage target gives S = R * slip/(1-slip).
  const quoteReserve = liquidityUsd / 2;
  const sellFor = (slip: number) => (quoteReserve * slip) / (1 - slip);

  return {
    available: true,
    maxSellUsd: {
      slip1: sellFor(0.01),
      slip5: sellFor(0.05),
      slip10: sellFor(0.1),
    },
    liquidityCoverage:
      marketCap !== null && marketCap > 0 ? (liquidityUsd / marketCap) * 100 : null,
    note,
  };
}

export function emptyClusters(note: string): ClusterAnalysis {
  return {
    groups: [],
    linkedSupplyPct: null,
    dataAvailable: false,
    note,
    tracedWallets: 0,
    unknownWallets: 0,
  };
}
