"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useViewer } from "@/lib/viewer";
import { PLAN, SCAN_LIMIT, bumpScansUsed, readScansUsed } from "@/lib/plan";
import { guessAddressKind, isValidForChain, type ChainId } from "@/lib/chains";

/** Best-effort chain from the address shape alone. Base58 → Solana, hex → an
 *  EVM chain, which is ambiguous between several, so it returns the most
 *  common one and the chip stays editable. */
function detectChain(raw: string): ChainId | null {
  const guess = guessAddressKind(raw);
  if (!guess) return null;
  return guess.kind === "solana" ? "solana" : "ethereum";
}

/* ==================================================================== *
 * SCAN INPUT
 *
 * The one control the product exists for. Three rules:
 *
 * 1. It never guesses a chain silently. Detection is shown as a chip you can
 *    override, because a wrong chain is a wrong token and the user would never
 *    know why the report looked wrong.
 * 2. Validation happens on paste, not on submit. A typo should not require a
 *    round trip to discover.
 * 3. Nothing is disabled. A disabled Analyse button with no explanation is
 *    the most common way these products lose a first-time user.
 * ==================================================================== */

const EXAMPLES = [
  { label: "RATS", addr: "CwnbD9FpaFSNou634knczXVCRUjTqmzwCrs3AiQvpump", chain: "solana" as const },
  { label: "BONK", addr: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", chain: "solana" as const },
  { label: "CAKE", addr: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", chain: "bsc" as const },
];

export function ScanInput({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { pro } = useViewer();
  const [used, setUsed] = useState<number | null>(null);

  // The rail shows the same counter. Both read one key and listen to one event,
  // so a scan updates the card without either component owning the other.
  useEffect(() => {
    const read = () => setUsed(readScansUsed());
    read();
    window.addEventListener("mc:quota", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("mc:quota", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const trimmed = value.trim();
  const detected = trimmed.length >= 32 ? detectChain(trimmed) : null;
  const effective: ChainId | null = detected;
  const valid = trimmed.length > 0 && effective !== null && isValidForChain(trimmed, effective);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!trimmed) {
      setErr("Paste a contract address to start");
      inputRef.current?.focus();
      return;
    }
    if (!effective) {
      setErr("Could not tell which chain this address belongs to — pick one");
      return;
    }
    if (!isValidForChain(trimmed, effective)) {
      setErr(`That is not a valid ${effective} address`);
      return;
    }
    setErr(null);
    setBusy(true);
    bumpScansUsed();
    router.push(`/token/${effective}/${trimmed}`);
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      setValue(text.trim());
      setErr(null);
      inputRef.current?.focus();
    } catch {
      setErr("Clipboard is blocked — paste with the keyboard instead");
      inputRef.current?.focus();
    }
  }

  const overLimit = !pro && used !== null && used >= SCAN_LIMIT;

  return (
    <form onSubmit={submit} className="w-full">
      {overLimit && (
        <div className="mb-2 border border-warn/30 bg-warn/[0.06]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2.5 py-2">
            <span aria-hidden className="h-[5px] w-[5px] shrink-0 bg-warn" />
            <span className="min-w-0 flex-1 t-xs text-fg2">
              That was scan {SCAN_LIMIT} of {SCAN_LIMIT} today. The limit exists to stop automated
              scraping, not to stop you reading — {PLAN.pro.price ? `$${PLAN.pro.price}/mo` : "Pro"}{" "}
              removes it and opens the wallet layer
            </span>
            {/* No "preview pro" button here. The scan limit is the one wall a
                free user hits by doing the thing the product is for, so it is
                the one place a preview toggle would teach them that the wall is
                optional. Preview lives on content gates, where it shows what a
                paid finding looks like; here it would only undo the pricing. */}
            <a
              href="/pricing"
              className="shrink-0 bg-acid px-2 py-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-bg transition-colors hover:bg-acid2"
            >
              {PLAN.pro.price ? `pro · $${PLAN.pro.price}/mo` : "see plans"}
            </a>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-warn/20 px-2.5 py-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-fg4">
              still free today
            </span>
            <span className="t-xs text-fg3">
              every page, every table, and the full report on any token you already have open
            </span>
          </div>
        </div>
      )}
      <div
        className={`flex flex-col border bg-surf transition-colors sm:flex-row sm:items-stretch ${
          err ? "border-bad/50" : valid ? "border-line2" : "border-line"
        }`}
      >
        {/* chain — an icon, not a field. The address shape decides it, and
            the report offers the other chains when the guess is wrong. Putting
            a labelled select here made the one action look like a form. */}
        {detected && (
          <div
            className="flex items-center border-b border-line px-2.5 py-2 sm:border-b-0 sm:border-r"
            title={`Reading this as ${detected}`}
          >
            <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-fg4">
              {detected === "solana" ? "SOL" : detected === "ethereum" ? "ETH" : detected.toUpperCase()}
            </span>
          </div>
        )}

        {/* input */}
        <div className="flex min-w-0 flex-1 items-center">
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setErr(null);
            }}
            placeholder="Paste a contract address"
            aria-label="Contract address"
            aria-invalid={Boolean(err)}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-[12.5px] text-fg outline-none placeholder:font-sans placeholder:text-[12.5px] placeholder:text-fg4"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setErr(null);
                inputRef.current?.focus();
              }}
              aria-label="Clear"
              className="grid h-6 w-6 shrink-0 place-items-center text-fg4 transition-colors hover:text-fg"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={paste}
            aria-label="Paste from clipboard"
            title="Paste from clipboard"
            className="mr-0.5 grid h-6 w-6 shrink-0 place-items-center text-fg4 transition-colors hover:text-fg"
          >
            <svg viewBox="0 0 12 12" className="h-[11px] w-[11px]" fill="none" aria-hidden>
              <rect x="3.2" y="1.2" width="7.6" height="9.6" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
              <path d="M1.2 3.4v6.2a1.2 1.2 0 0 0 1.2 1.2h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* action — nested inside the field, the only thing that looks like a
            button in this row */}
        <button
          type="submit"
          disabled={busy}
          className="m-[5px] shrink-0 rounded-[2px] bg-acid px-4 py-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-bg transition-colors hover:bg-acid2 disabled:opacity-60"
        >
          {busy ? "reading…" : "analyze"}
        </button>
      </div>

      {err ? (
        <p className="mt-1.5 flex items-center gap-1.5 t-xs text-bad">
          <span aria-hidden>!</span>
          {err}
        </p>
      ) : (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="t-xs text-fg4">
            {trimmed.length === 0
              ? "The contract address, not the ticker — tickers collide constantly"
              : valid
                ? "Ready — this will run every check and show what it could not read"
                : trimmed.length < 32
                  ? "Keep pasting — an address is longer than that"
                  : "Address does not match the selected chain"}
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-line sm:block" />
          <div className="flex flex-wrap items-center gap-1">
            {EXAMPLES.map((e) => (
              <button
                key={e.addr}
                type="button"
                onClick={() => {
                  setValue(e.addr);
                  setErr(null);
                  inputRef.current?.focus();
                }}
                className="border border-line px-1.5 py-[1px] font-mono text-[9.5px] uppercase tracking-[0.05em] text-fg4 transition-colors hover:border-line2 hover:text-fg2"
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
