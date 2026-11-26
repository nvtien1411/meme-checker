"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { CHAINS, guessAddressKind, type ChainId } from "@/lib/chains";

const EVM_CHAINS = CHAINS.filter((chain) => chain.addressKind === "evm");

export function CheckForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [network, setNetwork] = useState<ChainId>("ethereum");
  const [pending, startTransition] = useTransition();
  const kind = guessAddressKind(value)?.kind;
  const note = kind === "solana" ? "Solana address detected." : kind === "evm" ? "EVM address detected. Select the network where this token trades." : !value.trim() ? touched ? "Enter a contract address to scan." : "Accepts Solana mint addresses and 0x token contracts." : value.trim().startsWith("0x") ? "Enter 0x followed by exactly 40 hexadecimal characters." : "Enter 32–44 base58 characters for a Solana mint address.";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!kind) { input.current?.focus(); return; }
    startTransition(() => router.push(`/token/${kind === "solana" ? "solana" : network}/${value.trim()}`));
  };

  return (
    <form onSubmit={submit} aria-busy={pending} className="rounded-lg border border-line bg-surf p-3 sm:p-4">
      <label htmlFor="scan-address" className="mb-2 block text-sm font-medium text-fg">Contract address</label>
      <div className="flex min-w-0 gap-1 rounded-md border border-line2 bg-bg p-1 focus-within:border-acid">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setTouched(false);
          }}
          ref={input}
          id="scan-address"
          aria-invalid={(touched && !kind) || undefined}
          aria-describedby="scan-status"
          autoCapitalize="none"
          spellCheck={false}
          autoComplete="off"
          placeholder="Paste token address"
          className="min-h-11 min-w-0 flex-1 px-2 font-mono text-base text-fg placeholder:text-fg3 focus:outline-none sm:px-3 sm:text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 shrink-0 rounded bg-acid px-3 text-sm font-semibold text-[#111509] hover:brightness-110 disabled:opacity-60 sm:px-4"
        >
          {pending ? "Scanning…" : "Scan token"}
        </button>
      </div>
      <p id="scan-status" aria-live="polite" className={`mt-2.5 t-xs ${touched && !kind ? "text-bad" : "text-fg3"}`}>{note}</p>
      {kind === "evm" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="scan-network" className="text-sm text-fg2">Network</label>
          <select id="scan-network" value={network} onChange={(event) => setNetwork(event.target.value as ChainId)} className="min-h-11 max-w-full rounded-md border border-line2 bg-bg px-2 text-sm text-fg">
            {EVM_CHAINS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
      )}
    </form>
  );
}
