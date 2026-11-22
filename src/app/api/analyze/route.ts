import { NextResponse } from "next/server";
import { analyzeToken, AnalysisError } from "@/lib/analyze";
import { CHAINS, type ChainId } from "@/lib/chains";

export const maxDuration = 45;

const VALID = CHAINS.map((c) => c.id);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const rec = (body ?? {}) as Record<string, unknown>;
  const address = typeof rec.address === "string" ? rec.address.trim() : "";
  const chainRaw = typeof rec.chain === "string" ? rec.chain.trim() : "";
  const chain = VALID.includes(chainRaw as ChainId) ? (chainRaw as ChainId) : null;

  if (!address) {
    return NextResponse.json(
      { error: "Paste a contract address first." },
      { status: 400 },
    );
  }

  try {
    const data = await analyzeToken({ address, chain });
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AnalysisError) {
      return NextResponse.json({ error: err.message, hint: err.hint }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Analysis failed.",
        hint: message,
      },
      { status: 502 },
    );
  }
}
