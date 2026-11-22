import { NextResponse } from "next/server";
import { chainByDexScreenerId, guessAddressKind, type ChainId } from "@/lib/chains";
import { dsTokenPairs, pickBestPair, dsSearch } from "@/lib/providers/dexscreener";

/* ------------------------------------------------------------------ *
 * Chain resolution only
 *
 * The search bar used to POST to /api/analyze just to learn which chain an
 * address belongs to, then navigate — and the result page ran the whole
 * analysis again. That is every upstream API called twice and roughly double
 * the wait, for one string. This endpoint does the minimum: one DexScreener
 * lookup, plus a search fallback when the token is not in the pairs index.
 * ------------------------------------------------------------------ */

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const rec = (body ?? {}) as Record<string, unknown>;
  const address = typeof rec.address === "string" ? rec.address.trim() : "";

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const guess = guessAddressKind(address);
  if (!guess) {
    return NextResponse.json(
      {
        error: "That is not a contract address",
        hint: "Solana addresses are 32–44 characters. EVM addresses start with 0x and are 42 characters.",
      },
      { status: 422 },
    );
  }

  const pairsRes = await dsTokenPairs(address);
  const pairs = pairsRes.data?.pairs ?? [];
  const best = pickBestPair(pairs);

  if (best) {
    const chain = chainByDexScreenerId(best.chainId);
    if (chain) return NextResponse.json({ chain, address });
  }

  const search = await dsSearch(address);
  const found = (search.data?.pairs ?? []).filter(
    (p) => p.baseToken?.address?.toLowerCase() === address.toLowerCase(),
  );
  const bestFound = pickBestPair(found);
  const chain = bestFound ? chainByDexScreenerId(bestFound.chainId) : null;

  if (chain) return NextResponse.json({ chain, address });

  // No pair anywhere. Fall back to the address shape so the result page can
  // show a specific "no trading pair" message on the right chain, rather than
  // failing at resolution with nothing to say.
  const fallback: ChainId = guess.kind === "solana" ? "solana" : "ethereum";
  return NextResponse.json({
    chain: fallback,
    address,
    note: "No trading pair was found. The chain shown is inferred from the address format.",
  });
}
