"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/* One input, one decision. The chain is inferred from the address shape and
 * shown before submit, so the user can catch a wrong guess before spending a
 * scan — which is the only failure this form can produce. */

const SOLANA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM = /^0x[a-fA-F0-9]{40}$/;

function detect(raw: string): { chain: string; valid: boolean; note: string } {
  const v = raw.trim();
  if (!v) return { chain: "", valid: false, note: "" };
  if (EVM.test(v)) return { chain: "ethereum", valid: true, note: "EVM address — scanning as Ethereum" };
  if (SOLANA.test(v)) return { chain: "solana", valid: true, note: "Solana address" };
  if (v.startsWith("0x"))
    return { chain: "", valid: false, note: `EVM addresses are 42 characters; this is ${v.length}` };
  return {
    chain: "",
    valid: false,
    note: `Not a valid address — Solana is 32–44 base58 characters, this is ${v.length}`,
  };
}

export function CheckForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const d = detect(value);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!d.valid) return;
    router.push(`/token/${d.chain}/${value.trim()}`);
  };

  return (
    <form onSubmit={submit} className="p-3">
      <div className="flex items-stretch gap-1.5">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setTouched(false);
          }}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          aria-label="Token contract address"
          placeholder="paste CA — CwnbD9FpaFSNou634knczXVCRUjTqmzwCrs3AiQvpump"
          className="min-w-0 flex-1 border border-line bg-bg px-2.5 py-2 font-mono text-[12px] text-fg placeholder:text-fg4 focus:border-acid/50 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 border border-acid/50 bg-acid/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-acid hover:bg-acid/15"
        >
          scan
        </button>
      </div>

      <p
        aria-live="polite"
        className={`mt-2 t-xs leading-relaxed ${
          value === "" ? "text-fg4" : d.valid ? "text-acid/80" : touched ? "text-bad" : "text-warn"
        }`}
      >
        {value === ""
          ? "Solana addresses are 32–44 base58 characters. EVM addresses start 0x and are 42 characters"
          : d.note}
      </p>
    </form>
  );
}
