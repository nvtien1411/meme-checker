import { fetchJson, bool, num, str } from "../http";
import type { ChainId } from "../chains";
import type { Holder, SecurityData } from "../types";

const BASE = "https://api.gopluslabs.io/api/v1";

const CHAIN_NUM: Partial<Record<ChainId, string>> = {
  ethereum: "1",
  bsc: "56",
  base: "8453",
  robinhood: "4663",
};

export async function gpTokenSecurity(chain: ChainId, address: string) {
  if (chain === "solana") {
    return fetchJson<{ code?: number; result?: Record<string, unknown> }>(
      "goplus",
      `${BASE}/solana/token_security?contract_addresses=${address}`,
      { ttlMs: 90_000, label: "goplus", timeoutMs: 12_000 },
    );
  }
  const id = CHAIN_NUM[chain];
  if (!id) {
    return {
      ok: false,
      data: null,
      status: { source: "goplus", ok: false, ms: 0, error: "unsupported chain" },
    };
  }
  return fetchJson<{ code?: number; result?: Record<string, Record<string, unknown>> }>(
    "goplus",
    `${BASE}/token_security/${id}?contract_addresses=${address}`,
    { ttlMs: 90_000, label: "goplus", timeoutMs: 12_000 },
  );
}

type Gp = Record<string, unknown>;

export function pickGpToken(data: unknown, address: string): Gp | null {
  if (!data || typeof data !== "object") return null;
  const result = (data as { result?: unknown }).result;
  if (!result || typeof result !== "object") return null;
  const rec = result as Record<string, unknown>;
  const direct = rec[address.toLowerCase()] ?? rec[address];
  if (direct && typeof direct === "object") return direct as Gp;
  const first = Object.values(rec)[0];
  return first && typeof first === "object" ? (first as Gp) : null;
}

export function securityFromGp(t: Gp): SecurityData {
  const tax = (v: unknown) => {
    const n = num(v);
    return n === null ? null : n > 1 ? n : n * 100;
  };

  const privileges: string[] = [];
  if (bool(t.is_proxy) === true) privileges.push("proxy");
  if (bool(t.hidden_owner) === true) privileges.push("hidden owner");
  if (bool(t.can_take_back_ownership) === true) privileges.push("reclaimable ownership");
  if (bool(t.selfdestruct) === true) privileges.push("self-destruct");
  if (bool(t.external_call) === true) privileges.push("external call");

  return {
    honeypot: bool(t.is_honeypot),
    mintable: bool(t.is_mintable),
    freezable: bool(t.freezable),
    blacklist: bool(t.is_blacklisted),
    ownershipRenounced: bool(t.owner_address)
      ? false
      : bool(t.can_take_back_ownership) === null
        ? null
        : true,
    openSource: bool(t.is_open_source),
    buyTax: tax(t.buy_tax),
    sellTax: tax(t.sell_tax),
    lpLockedPct: num(t.lp_holder_count) !== null ? null : null,
    lpBurned: null,
    ownerPrivileges: privileges,
    dataAvailable: true,
    source: "goplus",
  };
}

export function holdersFromGp(t: Gp): Holder[] {
  const raw = t.holders;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 10).map((h, i) => {
    const rec = h as Gp;
    const addr = str(rec.address) ?? "";
    const tag = str(rec.tag);
    const isLocked = bool(rec.is_locked) === true;
    const isContract = bool(rec.is_contract) === true;

    let label: Holder["label"] = null;
    let basis: string | null = null;
    if (isLocked) {
      label = "locked";
      basis = "GoPlus marks this position as locked liquidity";
    } else if (tag && /pool|lp/i.test(tag)) {
      label = "liquidity-pool";
      basis = `GoPlus tag: ${tag}`;
    } else if (tag && /burn/i.test(tag)) {
      label = "burn";
      basis = `GoPlus tag: ${tag}`;
    } else if (isContract) {
      label = "contract";
      basis = "GoPlus identifies this address as a contract";
    }

    const pctRaw = num(rec.percent);
    return {
      rank: i + 1,
      address: addr,
      balance: num(rec.amount) ?? num(rec.balance),
      pct: pctRaw === null ? null : pctRaw > 1 ? pctRaw : pctRaw * 100,
      label,
      labelBasis: basis,
    };
  });
}
