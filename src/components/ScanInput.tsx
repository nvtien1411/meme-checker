"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useViewer } from "@/lib/viewer";
import { SCAN_LIMIT, bumpScansUsed, readScansUsed } from "@/lib/plan";
import { CHAINS, guessAddressKind, isValidForChain, type ChainId } from "@/lib/chains";

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
  const [chain, setChain] = useState<ChainId | "auto">("auto");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { pro, toggle } = useViewer();
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
  const effective: ChainId | null = chain === "auto" ? detected : chain;
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
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 border border-warn/30 bg-warn/[0.06] px-2.5 py-2">
          <span className="min-w-0 flex-1 t-xs text-fg2">
            You have used today&apos;s {SCAN_LIMIT} free scans. Pro removes the limit — and opens the
            wallet layer the free tier cannot see
          </span>
          <button
            type="button"
            onClick={toggle}
            className="shrink-0 border border-acid/40 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.06em] text-acid transition-colors hover:bg-acid/10"
          >
            preview pro
          </button>
          <a
            href="/pricing"
            className="shrink-0 bg-acid px-2 py-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-bg transition-colors hover:bg-acid2"
          >
            plans
          </a>
        </div>
      )}
      <div
        className={`flex flex-col border bg-surf transition-colors sm:flex-row sm:items-stretch ${
          err ? "border-bad/50" : valid ? "border-line2" : "border-line"
        }`}
      >
        {/* chain — on auto this reads as a finding, but stays one control so
            overriding it is a real action rather than a decorative label */}
        <div className="flex items-center border-b border-line px-2.5 py-2 sm:border-b-0 sm:border-r">
          <label htmlFor="chain" className="sr-only">
            Chain — detected from the address, change it if wrong
          </label>
          <select
            id="chain"
            value={chain}
            onChange={(e) => {
              setChain(e.target.value as ChainId | "auto");
              setErr(null);
            }}
            title={
              chain === "auto"
                ? "Read from the address shape. Pick a chain manually if this is wrong"
                : "Overridden manually"
            }
            className={`cursor-pointer appearance-none bg-transparent font-mono text-[10.5px] uppercase tracking-[0.06em] outline-none ${
              chain === "auto" ? "text-fg3" : "text-warn"
            }`}
          >
            <option value="auto" className="bg-surf text-fg">
              {chain === "auto" ? (detected ? `on ${detected}` : "auto") : "auto"}
            </option>
            {CHAINS.map((c) => (
              <option key={c.id} value={c.id} className="bg-surf text-fg">
                {c.label}
              </option>
            ))}
          </select>
        </div>

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
            className="mr-1 shrink-0 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-fg4 transition-colors hover:text-fg2"
          >
            paste
          </button>
        </div>

        {/* action */}
        <button
          type="submit"
          disabled={busy}
          className="m-1 shrink-0 bg-acid px-4 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-bg transition-colors hover:bg-acid2 disabled:opacity-60"
        >
          {busy ? "analyzing…" : "analyze"}
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
                  setChain(e.chain);
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
