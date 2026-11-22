export type ChainId = "solana" | "bsc" | "ethereum" | "base" | "robinhood";

export interface ChainMeta {
  id: ChainId;
  label: string;
  short: string;
  /** DexScreener chainId values that map to this chain. */
  dexscreener: string[];
  /** GeckoTerminal network id. */
  gecko: string;
  explorer: (addr: string) => string;
  /** Native quote symbol, used when converting reserves. */
  native: string;
  addressKind: "solana" | "evm";
}

export const CHAINS: ChainMeta[] = [
  {
    id: "solana",
    label: "Solana",
    short: "SOL",
    dexscreener: ["solana"],
    gecko: "solana",
    explorer: (a) => `https://solscan.io/token/${a}`,
    native: "SOL",
    addressKind: "solana",
  },
  {
    id: "bsc",
    label: "BNB Chain",
    short: "BSC",
    dexscreener: ["bsc"],
    gecko: "bsc",
    explorer: (a) => `https://bscscan.com/token/${a}`,
    native: "BNB",
    addressKind: "evm",
  },
  {
    id: "ethereum",
    label: "Ethereum",
    short: "ETH",
    dexscreener: ["ethereum"],
    gecko: "eth",
    explorer: (a) => `https://etherscan.io/token/${a}`,
    native: "ETH",
    addressKind: "evm",
  },
  {
    id: "base",
    label: "Base",
    short: "BASE",
    dexscreener: ["base"],
    gecko: "base",
    explorer: (a) => `https://basescan.org/token/${a}`,
    native: "ETH",
    addressKind: "evm",
  },
  {
    id: "robinhood",
    label: "Robinhood Chain",
    short: "RH",
    dexscreener: [],
    gecko: "robinhood",
    explorer: (a) => `https://robinhoodchain.blockscout.com/token/${a}`,
    native: "ETH",
    addressKind: "evm",
  },
];

export const CHAIN_BY_ID = Object.fromEntries(CHAINS.map((c) => [c.id, c])) as Record<
  ChainId,
  ChainMeta
>;

export function chainByDexScreenerId(id: string | undefined): ChainId | null {
  if (!id) return null;
  const found = CHAINS.find((c) => c.dexscreener.includes(id.toLowerCase()));
  return found?.id ?? null;
}

const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_RE = /^0x[a-fA-F0-9]{40}$/;

export type AddressGuess = { kind: "solana" | "evm" } | null;

export function guessAddressKind(raw: string): AddressGuess {
  const a = raw.trim();
  if (EVM_RE.test(a)) return { kind: "evm" };
  if (SOL_RE.test(a)) return { kind: "solana" };
  return null;
}

export function isValidForChain(address: string, chain: ChainId): boolean {
  const guess = guessAddressKind(address);
  if (!guess) return false;
  return guess.kind === CHAIN_BY_ID[chain].addressKind;
}
