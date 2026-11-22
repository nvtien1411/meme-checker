import { fetchJson, num, str } from "../http";
import type { MarketData, PoolRef, ProjectInfo, TokenIdentity } from "../types";
import { CHAIN_BY_ID, type ChainId } from "../chains";

const BASE = "https://api.dexscreener.com";

interface DsPair {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; symbol?: string };
  priceUsd?: string;
  priceNative?: string;
  txns?: { h24?: { buys?: number; sells?: number } };
  volume?: { h24?: number };
  priceChange?: { h24?: number; h6?: number; h1?: number };
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: { url?: string; label?: string }[];
    socials?: { type?: string; url?: string; platform?: string }[];
  };
}

export async function dsTokenPairs(address: string) {
  return fetchJson<{ pairs?: DsPair[] | null }>(
    "dexscreener",
    `${BASE}/latest/dex/tokens/${address}`,
    { ttlMs: 45_000, label: "dexscreener:pairs", timeoutMs: 9000 },
  );
}

export async function dsSearch(query: string) {
  return fetchJson<{ pairs?: DsPair[] | null }>(
    "dexscreener",
    `${BASE}/latest/dex/search?q=${encodeURIComponent(query)}`,
    { ttlMs: 60_000, label: "dexscreener:search", timeoutMs: 9000 },
  );
}

export type { DsPair };

/** Most liquid pair wins; a token can have a dozen pools across chains. */
export function pickBestPair(pairs: DsPair[] | null | undefined): DsPair | null {
  if (!pairs || pairs.length === 0) return null;
  return [...pairs].sort(
    (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
  )[0];
}

export function identityFromPair(
  pair: DsPair,
  chain: ChainId,
  address: string,
): TokenIdentity {
  return {
    address,
    chain,
    name: str(pair.baseToken?.name),
    symbol: str(pair.baseToken?.symbol),
    decimals: null,
    imageUrl: str(pair.info?.imageUrl),
    pairAddress: str(pair.pairAddress),
    dexId: str(pair.dexId),
    explorerUrl: CHAIN_BY_ID[chain].explorer(address),
  };
}

export function marketFromPair(pair: DsPair | null): MarketData {
  if (!pair) {
    return {
      priceUsd: null,
      capKind: null,
      marketCap: null,
      fdv: null,
      liquidityUsd: null,
      volume24h: null,
      priceChange24h: null,
      ageHours: null,
      txns24h: null,
      pairCreatedAt: null,
      pools: [],
    };
  }

  const created = num(pair.pairCreatedAt);
  const marketCap = num(pair.marketCap);
  const fdv = num(pair.fdv);

  return {
    priceUsd: num(pair.priceUsd),
    // Never silently present FDV as market cap; the label has to match the number.
    capKind: marketCap !== null ? "marketCap" : fdv !== null ? "fdv" : null,
    marketCap,
    fdv,
    liquidityUsd: num(pair.liquidity?.usd),
    volume24h: num(pair.volume?.h24),
    priceChange24h: num(pair.priceChange?.h24),
    ageHours: created !== null ? (Date.now() - created) / 3_600_000 : null,
    txns24h:
      pair.txns?.h24?.buys !== undefined && pair.txns?.h24?.sells !== undefined
        ? { buys: pair.txns.h24.buys, sells: pair.txns.h24.sells }
        : null,
    pairCreatedAt: created !== null ? new Date(created).toISOString() : null,
    pools: [],
  };
}

export function projectFromPair(pair: DsPair | null): ProjectInfo {
  if (!pair?.info) {
    return { website: null, twitter: null, telegram: null, description: null, source: null };
  }
  const websites = pair.info.websites ?? [];
  const socials = pair.info.socials ?? [];

  const pick = (needle: string) =>
    socials.find((s) => (s.type ?? s.platform ?? "").toLowerCase().includes(needle))?.url ?? null;

  const site =
    websites.find((w) => (w.label ?? "").toLowerCase() !== "dexscreener")?.url ??
    websites[0]?.url ??
    null;

  const twitter = pick("twitter") ?? pick("x");
  const telegram = pick("telegram");
  const any = site ?? twitter ?? telegram;

  return {
    website: str(site),
    twitter: str(twitter),
    telegram: str(telegram),
    description: null,
    source: any ? "dexscreener" : null,
  };
}

export function poolsFromPairs(pairs: DsPair[] | null | undefined): PoolRef[] {
  if (!pairs) return [];
  return pairs
    .map((p) => ({
      address: str(p.pairAddress) ?? "",
      dexId: str(p.dexId) ?? "",
      liquidityUsd: num(p.liquidity?.usd),
    }))
    .filter((p) => p.address)
    .sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))
    .slice(0, 8);
}
