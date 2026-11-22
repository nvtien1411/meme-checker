"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CHAINS, guessAddressKind, isValidForChain, type ChainId } from "@/lib/chains";

/* ==================================================================== *
 * CONTRACT ADDRESS INPUT
 *
 * The single most important control in the product: everything begins here.
 * Three rules shaped it.
 *
 * 1. VALIDATE LOCALLY AND INSTANTLY. Waiting for a round-trip to learn that a
 *    ticker is not an address wastes a request and the user's patience.
 * 2. ONE STATUS LINE. Chain mismatch, malformed input and network failure all
 *    report in the same place, so the eye never has to hunt for the error.
 * 3. NEVER DISABLE THE PRIMARY ACTION SILENTLY. A greyed-out button with no
 *    explanation is the most common cause of "it doesn't work". It stays live
 *    and explains what is wrong on submit.
 * ==================================================================== */

type Phase = "idle" | "submitting";

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
  const chainMismatch =
    trimmed.length > 0 && guess !== null && chain !== "auto" && !isValidForChain(trimmed, chain);

  const big = size === "lg";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setHint(null);

    if (!trimmed || !guess) {
      setError("That is not a contract address.");
      setHint(
        "A Solana address is 32–44 characters. An EVM address starts with 0x and totals 42. A ticker will not work.",
      );
      return;
    }
    if (chainMismatch) {
      setError(`Not a valid ${CHAINS.find((c) => c.id === chain)?.label} address.`);
      setHint("Use auto-detect, or pick the chain this address belongs to.");
      return;
    }

    setPhase("submitting");
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: trimmed, chain: chain === "auto" ? null : chain }),
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

      router.push(`/token/${chain === "auto" ? json.chain : chain}/${trimmed}`);
    } catch {
      setPhase("idle");
      setError("Could not reach the analyser.");
      setHint("Check your connection and try again. Nothing was saved.");
    }
  }

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div
        className={`flex flex-col gap-2 rounded-[4px] border bg-ink-900 p-1.5 transition-colors sm:flex-row sm:items-stretch ${
          error
            ? "border-bad-600/60"
            : "border-ink-650 focus-within:border-brand-600"
        }`}
      >
        {/* field */}
        <div className="relative flex min-w-0 flex-1 items-stretch">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-ink-750 px-3 t-label"
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
            }}
            spellCheck={false}
            autoComplete="off"
            aria-label="Contract address"
            aria-invalid={!!error}
            placeholder={big ? "Paste a contract address" : "Contract address"}
            className={`w-full bg-transparent py-3 pl-[52px] pr-9 font-mono text-mute-300 outline-none placeholder:font-sans placeholder:text-mute-600 ${
              big ? "text-[13px]" : "text-[12.5px]"
            }`}
          />
          {trimmed && (
            <button
              type="button"
              aria-label="Clear input"
              onClick={() => {
                setValue("");
                setError(null);
                setHint(null);
              }}
              className="absolute inset-y-0 right-0 grid w-9 place-items-center text-mute-500 transition hover:text-lit-200"
            >
              ×
            </button>
          )}
        </div>

        {/* chain + action */}
        <div className="flex shrink-0 gap-1.5">
          <select
            value={chain}
            onChange={(e) => {
              setChain(e.target.value as ChainId | "auto");
              setError(null);
            }}
            aria-label="Blockchain"
            className="min-h-[42px] cursor-pointer appearance-none rounded-[3px] border border-transparent bg-transparent px-2.5 t-small text-mute-400 outline-none transition hover:text-lit-200 focus:border-brand-600"
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
            className={`min-h-[42px] flex-1 whitespace-nowrap rounded-[3px] px-5 t-small font-semibold transition sm:flex-none ${
              phase === "submitting"
                ? "cursor-wait bg-ink-700 text-mute-400"
                : "bg-brand-500 text-ink-950 hover:bg-brand-400 active:bg-brand-600"
            }`}
          >
            {phase === "submitting" ? "Resolving…" : "Analyze"}
          </button>
        </div>
      </div>

      {/* one status line for every state */}
      <div className="mt-2 min-h-[18px] px-0.5">
        {error ? (
          <p className="t-meta leading-snug text-bad-400">
            {error}
            {hint && <span className="text-mute-500"> {hint}</span>}
          </p>
        ) : chainMismatch ? (
          <p className="t-meta leading-snug text-warn-400">
            That is not a {CHAINS.find((c) => c.id === chain)?.label} address.{" "}
            <button
              type="button"
              onClick={() => setChain("auto")}
              className="underline decoration-dotted underline-offset-2 hover:text-warn-300"
            >
              Use auto-detect
            </button>
          </p>
        ) : guess ? (
          <p className="t-meta leading-snug text-mute-500">
            Recognised as a{" "}
            <span className="text-mute-300">{guess.kind === "solana" ? "Solana" : "EVM"}</span>{" "}
            address{chain === "auto" ? " · chain will be detected on submit" : ""}.
          </p>
        ) : trimmed ? (
          <p className="t-meta leading-snug text-warn-400">
            Still typing — an address is 32–44 characters (Solana) or 42 (EVM).
          </p>
        ) : (
          <p className="t-meta leading-snug text-mute-600">
            Paste the contract address, not the ticker — tickers collide constantly.
          </p>
        )}
      </div>

      {big && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink-800 pt-3">
          <span className="t-label">try an example</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setValue(ex.address);
                setChain(ex.chain);
                setError(null);
                setHint(null);
              }}
              className="min-h-[32px] rounded-[3px] border border-ink-700 bg-ink-900 px-2.5 py-1.5 font-mono text-[11px] text-mute-300 transition hover:border-brand-600/60 hover:text-brand-400"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
