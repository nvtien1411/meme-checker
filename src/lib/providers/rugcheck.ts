import { fetchJson, bool, num, str } from "../http";
import type { Holder, SecurityData, DeployerAnalysis } from "../types";

const BASE = "https://api.rugcheck.xyz/v1";

export interface RcHolder {
  address?: string;
  amount?: number | string;
  pct?: number | string;
  uiAmount?: number;
  insider?: boolean;
}

export interface RcCreatorToken {
  mint?: string;
  tokenName?: string;
  tokenSymbol?: string;
  rugged?: boolean;
}

export interface RcReport {
  token?: { mint?: string; name?: string; symbol?: string; decimals?: number; supply?: number };
  totalHolders?: number;
  totalMarketLiquidity?: number;
  creator?: string;
  creatorBalance?: number;
  creatorTokens?: RcCreatorToken[];
  topHolders?: RcHolder[];
  markets?: {
    pubkey?: string;
    marketType?: string;
    mintLP?: { mint?: string };
    lp?: { lpLockedPct?: number; lpLocked?: number; lpUnlocked?: number; holders?: { pct?: number }[] };
  }[];
  knownAccounts?: Record<string, { name?: string; type?: string }>;
  risks?: { name?: string; description?: string; level?: string; score?: number; value?: string }[];
  score?: number;
  score_normalised?: number;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  transferFee?: { pct?: number };
}

export async function rcReport(mint: string) {
  return fetchJson<RcReport>(
    "rugcheck",
    `${BASE}/tokens/${mint}/report`,
    { ttlMs: 90_000, label: "rugcheck", timeoutMs: 14_000 },
  );
}

export function holdersFromRc(rep: RcReport): { rows: Holder[]; total: number | null } {
  const raw = rep.topHolders ?? [];
  const known = rep.knownAccounts ?? {};

  const rows: Holder[] = raw.map((h, i) => {
    const addr = str(h.address) ?? "";
    const pct = num(h.pct) ?? num(h.uiAmount);
    const meta = known[addr];
    const type = (meta?.type ?? "").toLowerCase();
    const name = (meta?.name ?? "").toLowerCase();

    let label: Holder["label"] = null;
    let basis: string | null = null;
    if (type.includes("pool") || name.includes("pool") || name.includes("lp")) {
      label = "liquidity-pool";
      basis = type.includes("pool")
        ? `RugCheck tags this address as a ${meta?.type}`
        : "Address name contains a liquidity-pool marker";
    } else if (type.includes("burn") || addr === "1nc1nerator11111111111111111111111111111111") {
      label = "burn";
      basis = "Known burn address";
    } else if (type.includes("exchange")) {
      label = "exchange";
      basis = "RugCheck exchange list";
    } else if (type.includes("contract") || type.includes("program")) {
      label = "contract";
      basis = "RugCheck contract registry";
    } else if (name.includes("bonding") || name.includes("curve")) {
      label = "bonding-curve";
      basis = "Address name indicates a launch curve";
    }

    return {
      rank: i + 1,
      address: addr,
      balance: num(h.amount) ?? num(h.uiAmount),
      pct,
      label,
      labelBasis: basis,
    };
  });

  return { rows, total: num(rep.totalHolders) };
}

export function securityFromRc(rep: RcReport): SecurityData {
  const markets = rep.markets ?? [];
  const lockedPcts = markets
    .map((m) => num(m.lp?.lpLockedPct))
    .filter((n): n is number => n !== null);
  const lpLockedPct = lockedPcts.length ? Math.max(...lockedPcts) : null;

  return {
    // Solana has no honeypot mechanism; only a freeze authority can block a sell.
    honeypot: null,
    mintable: rep.mintAuthority ? true : rep.mintAuthority === null ? false : false,
    freezable: rep.freezeAuthority ? true : rep.freezeAuthority === null ? false : false,
    blacklist: null,
    ownershipRenounced: null,
    openSource: null,
    buyTax: null,
    sellTax: null,
    lpLockedPct,
    lpBurned: lpLockedPct !== null && lpLockedPct >= 99.5,
    ownerPrivileges: [],
    dataAvailable: true,
    source: "rugcheck",
  };
}

export function deployerFromRc(rep: RcReport, supply: number | null): DeployerAnalysis {
  const creator = str(rep.creator);
  const bal = num(rep.creatorBalance);
  const prior = (rep.creatorTokens ?? []).map((t) => ({
    address: str(t.mint) ?? "",
    symbol: str(t.tokenSymbol),
    rugged: bool(t.rugged) ?? false,
  })).filter((t) => t.address);

  return {
    address: creator,
    balancePct:
      bal !== null && supply !== null && supply > 0 ? (bal / supply) * 100 : null,
    priorTokens: prior,
    ruggedCount: prior.filter((t) => t.rugged).length,
    dataAvailable: true,
  };
}
