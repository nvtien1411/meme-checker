import { fetchJson, num, str } from "../http";
import { CHAIN_BY_ID, type ChainId } from "../chains";

const BASE = "https://api.geckoterminal.com/api/v2";

export interface GtToken {
  id?: string;
  attributes?: {
    address?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    image_url?: string | null;
    total_supply?: string | null;
    normalized_total_supply?: string | null;
    price_usd?: string | null;
    fdv_usd?: string | null;
    market_cap_usd?: string | null;
    total_reserve_in_usd?: string | null;
    volume_usd?: { h24?: string | null };
  };
}

export interface GtPool {
  id?: string;
  attributes?: {
    address?: string;
    name?: string;
    reserve_in_usd?: string | null;
    volume_usd?: { h24?: string | null };
    transactions?: { h24?: { buys?: number; sells?: number } };
    price_change_percentage?: { h24?: string | null };
  };
  relationships?: { dex?: { data?: { id?: string } } };
}

export interface GtTrade {
  attributes?: {
    block_timestamp?: string;
    tx_hash?: string;
    kind?: string;
    volume_in_usd?: string | null;
    from_token_amount?: string | null;
    to_token_amount?: string | null;
    price_from_in_usd?: string | null;
    price_to_in_usd?: string | null;
    from_address?: string;
    to_address?: string;
  };
}

export function gtNetwork(chain: ChainId): string {
  return CHAIN_BY_ID[chain].gecko;
}

export async function gtToken(chain: ChainId, address: string) {
  return fetchJson<{ data?: GtToken }>(
    "geckoterminal",
    `${BASE}/networks/${gtNetwork(chain)}/tokens/${address}`,
    { ttlMs: 60_000, label: "geckoterminal:token", timeoutMs: 10_000 },
  );
}

export async function gtPools(chain: ChainId, address: string) {
  return fetchJson<{ data?: GtPool[] }>(
    "geckoterminal",
    `${BASE}/networks/${gtNetwork(chain)}/tokens/${address}/pools?page=1`,
    { ttlMs: 60_000, label: "geckoterminal:pools", timeoutMs: 10_000 },
  );
}

export async function gtSearchPools(chain: ChainId, query: string) {
  return fetchJson<{ data?: GtPool[] }>(
    "geckoterminal",
    `${BASE}/search/pools?query=${encodeURIComponent(query)}&network=${gtNetwork(chain)}`,
    { ttlMs: 60_000, label: "geckoterminal:search", timeoutMs: 10_000 },
  );
}

export async function gtTrades(chain: ChainId, pool: string) {
  return fetchJson<{ data?: GtTrade[] }>(
    "geckoterminal",
    `${BASE}/networks/${gtNetwork(chain)}/pools/${pool}/trades`,
    { ttlMs: 20_000, label: "geckoterminal:trades", timeoutMs: 12_000 },
  );
}

export function bestGtPool(pools: GtPool[] | null | undefined): GtPool | null {
  if (!pools || pools.length === 0) return null;
  return [...pools].sort(
    (a, b) => num(b.attributes?.reserve_in_usd) ?? 0 - (num(a.attributes?.reserve_in_usd) ?? 0),
  )[0];
}

export function poolAddress(pool: GtPool | null): string | null {
  const raw = pool?.attributes?.address ?? pool?.id?.split("_").slice(1).join("_") ?? null;
  return str(raw);
}

export interface Trade {
  side: "buy" | "sell";
  volumeUsd: number | null;
  wallet: string | null;
  at: string | null;
}

export function tradesFromGt(raw: GtTrade[] | undefined): Trade[] {
  if (!raw) return [];
  const out: Trade[] = [];
  for (const t of raw) {
    const a = t.attributes;
    if (!a) continue;
    const kind = (a.kind ?? "").toLowerCase();
    const side: "buy" | "sell" | null =
      kind === "buy" ? "buy" : kind === "sell" ? "sell" : null;
    if (!side) continue;
    out.push({
      side,
      volumeUsd: num(a.volume_in_usd),
      wallet: str(a.to_address) ?? str(a.from_address),
      at: str(a.block_timestamp),
    });
  }
  return out;
}
