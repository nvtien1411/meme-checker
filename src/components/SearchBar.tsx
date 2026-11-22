"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CHAINS, guessAddressKind, isValidForChain, type ChainId } from "@/lib/chains";

type Phase = "idle" | "typing" | "invalid" | "wrong-chain" | "submitting";

const EXAMPLES = [
  { label: "BONK", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", chain: "solana" as ChainId },
  { label: "CAKE", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", chain: "bsc" as ChainId },
  { label: "DEGEN", address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", chain: "base" as ChainId },
];

export function SearchBar({
  size = "lg",
  initialValue = "",
  autoFocus = false,
}: {
  size?: "lg" | "sm";
  initialValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [chain, setChain] = useState<ChainId | "auto">("auto");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const trimmed = value.trim();
  const guess = useMemo(() => guessAddressKind(trimmed), [trimmed]);

  // Validation is instant and local. Making someone wait for a round-trip to
  // learn they pasted a ticker instead of an address is a wasted request.
  const chainMismatch =
    trimmed.length > 0 && guess !== null && chain !== "auto" && !isValidForChain(trimmed, chain);

  const canSubmit = trimmed.length > 0 && guess !== null && !chainMismatch;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      if (trimmed && !guess) {
        setPhase("invalid");
        setError("That is not a contract address.");
        setHint("A Solana address is 32–44 characters. An EVM address starts with 0x and has 40 hex characters. A ticker will not work.");
      }
      return;
    }

    setPhase("submitting");
    setError(null);
    setHint(null);

    try {
      // Resolve the chain only. Running the full analysis here and again on the
      // result page doubled every upstream call and the user's wait for one
      // piece of information.
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });
      const json = (await res.json()) as {
        chain?: string;
        error?: string;
        hint?: string;
      };

      if (!res.ok || !json.chain) {
        setPhase("idle");
        setError(json.error ?? "Could not resolve this address.");
        setHint(json.hint ?? null);
        return;
      }

      // An explicit chain choice from the dropdown wins over detection.
      const target = chain === "auto" ? json.chain : chain;
      router.push(`/token/${target}/${trimmed}`);
    } catch {
      setPhase("idle");
      setError("Could not reach the resolver.");
      setHint("Check your connection and try again. Nothing was saved.");
    }
  }

  const big = size === "lg";

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div
        className={`flex flex-col gap-2 rounded border bg-ink-900 p-1.5 sm:flex-row sm:items-center ${
          error ? "border-bad-600/60" : "border-ink-600 focus-within:border-brand-600/70"
        }`}
      >
        <div className="relative flex min-w-0 flex-1 items-center">
          <span
            aria-hidden
            className="pointer-events-none absolute left-2.5 font-mono t-small text-mute-500"
          >
            CA
          </span>
          <input
            value={value}
            autoFocus={autoFocus}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setHint(null);
              setPhase(e.target.value ? "typing" : "idle");
            }}
            spellCheck={false}
            autoComplete="off"
            aria-label="Contract address"
            aria-invalid={phase === "invalid" || !!error}
            placeholder="Paste a contract address"
            className={`w-full bg-transparent py-2.5 pl-12 pr-2 font-mono text-mute-300 outline-none placeholder:text-mute-500 ${
              big ? "t-body sm:t-body" : "t-body"
            }`}
          />
          {trimmed && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => {
                setValue("");
                setError(null);
                setHint(null);
                setPhase("idle");
              }}
              className="mr-1 rounded px-1.5 py-0.5 t-small text-mute-500 transition hover:text-slate-200"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as ChainId | "auto")}
            aria-label="Blockchain"
            className="min-h-[38px] rounded border border-ink-700 bg-ink-850 px-2 t-small text-mute-300 outline-none transition hover:border-ink-600"
          >
            <option value="auto">Auto-detect</option>
            {CHAINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={phase === "submitting"}
            className={`min-h-[38px] flex-1 whitespace-nowrap rounded px-4 t-body font-semibold transition sm:flex-none ${
              phase === "submitting"
                ? "cursor-wait bg-ink-700 text-mute-400"
                : "bg-brand-500 text-ink-950 hover:bg-brand-400"
            }`}
          >
            {phase === "submitting" ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </div>

      {/* Status line. One place for validation, chain mismatch and failure —
          never three separate red boxes competing for attention. */}
      <div className="mt-1.5 min-h-[18px] px-0.5 t-small leading-snug">
        {error ? (
          <p className="text-bad-500">
            {error}
            {hint && <span className="text-mute-500"> {hint}</span>}
          </p>
        ) : chainMismatch ? (
          <p className="text-warn-500">
            That address is not a valid {CHAINS.find((c) => c.id === chain)?.label} address.
            <button
              type="button"
              onClick={() => setChain("auto")}
              className="ml-1 underline decoration-dotted underline-offset-2 hover:text-warn-500/80"
            >
              Use auto-detect
            </button>
          </p>
        ) : guess ? (
          <p className="text-mute-500">
            Recognised as a{" "}
            <span className="text-mute-300">
              {guess.kind === "solana" ? "Solana" : "EVM"}
            </span>{" "}
            address
            {chain === "auto" ? " · chain will be detected" : ""}.
          </p>
        ) : trimmed ? (
          <p className="text-warn-500">Still typing — an address is 32–44 (Solana) or 42 (EVM) characters.</p>
        ) : (
          <p className="text-mute-500">
            Paste the contract address, not the ticker. Tickers collide constantly.
          </p>
        )}
      </div>

      {size === "lg" && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="t-meta  text-mute-500">
            Example contracts
          </span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setValue(ex.address);
                setChain(ex.chain);
                setError(null);
                setPhase("typing");
              }}
              className="rounded border border-ink-700 px-2 py-0.5 font-mono t-meta text-mute-400 transition hover:border-ink-500 hover:text-slate-200"
            >
              {ex.label}
            </button>
          ))}
          <span className="ml-auto t-meta text-mute-500">no API key · free</span>
        </div>
      )}
    </form>
  );
}
