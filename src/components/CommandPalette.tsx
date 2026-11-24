"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KIND_LABEL, grouped, search, type SearchResult } from "@/lib/search";

/* ==================================================================== *
 * COMMAND PALETTE
 *
 * ⌘K anywhere. The product had no search at all — the only way to reach a
 * wallet was to already be on a page that linked it, which means the deeper
 * the investigation went, the harder it was to start a new one.
 *
 * Everything here is keyboard-first: type, arrow, enter. The mouse works but
 * is not the expected path.
 * ==================================================================== */

const RECENT_KEY = "mc.recentSearch";

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(term: string) {
  if (!term.trim()) return;
  try {
    const next = [term, ...readRecent().filter((r) => r !== term)].slice(0, 6);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage blocked: recent searches just do not persist
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Opening and closing are the only two verbs here, so both are explicit
  // callbacks rather than a toggle that has to guess which one you meant.
  const openPalette = useCallback(() => {
    setRecent(readRecent());
    setQ("");
    setActive(0);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => setOpen(false), []);

  // ⌘K / Ctrl+K toggles; a bare "/" opens when nothing is focused. Registered
  // once — the listener reads state through a ref instead of being torn down
  // and rebuilt on every keystroke.
  const stateRef = useRef({ open: false, openPalette, closePalette });
  useEffect(() => {
    stateRef.current = { open, openPalette, closePalette };
  }, [open, openPalette, closePalette]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable === true;

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (stateRef.current.open) stateRef.current.closePalette();
        else stateRef.current.openPalette();
        return;
      }
      if (e.key === "/" && !typing && !stateRef.current.open) {
        e.preventDefault();
        stateRef.current.openPalette();
        return;
      }
      if (e.key === "Escape" && stateRef.current.open) {
        e.preventDefault();
        stateRef.current.closePalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // focus after paint, or the browser drops it on the still-hidden node
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo(() => (q.trim() ? search(q) : []), [q]);
  const groups = useMemo(() => grouped(results), [results]);

  // Flat order has to match what the eye sees, or arrow keys jump groups.
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const onChange = (v: string) => {
    setQ(v);
    setActive(0);
  };

  // Keep the highlighted row in view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (r: SearchResult) => {
    pushRecent(q.trim() || r.label);
    closePalette();
    router.push(r.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = flat[active];
      if (pick) go(pick);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search — press Command K"
        className="group flex items-center gap-1.5 border border-line px-2 py-[3px] text-fg4 transition-colors hover:border-fg4 hover:text-fg2"
      >
        <svg viewBox="0 0 16 16" className="h-[11px] w-[11px]" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <circle cx="7" cy="7" r="4.2" />
          <path d="M10.2 10.2 14 14" strokeLinecap="round" />
        </svg>
        <span className="font-mono text-[9px] uppercase tracking-[0.06em]">search</span>
        <kbd className="ml-1 border border-line px-1 font-mono text-[8px] text-fg4/70">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-[2px]"
        onClick={closePalette}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Meme Checker"
        className="fixed left-1/2 top-[12vh] z-50 w-[min(620px,calc(100vw-24px))] -translate-x-1/2 border border-line2 bg-surf shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <svg viewBox="0 0 16 16" className="h-[13px] w-[13px] shrink-0 text-fg4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <circle cx="7" cy="7" r="4.2" />
            <path d="M10.2 10.2 14 14" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="token, contract, wallet, @caller, narrative"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent font-mono text-[12px] text-fg outline-none placeholder:text-fg4/60"
          />
          <kbd className="shrink-0 border border-line px-1 font-mono text-[8px] text-fg4/70">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto bg-surf">
          {!q.trim() && (
            <div className="px-3 py-2.5">
              {recent.length > 0 ? (
                <>
                  <div className="t-eyebrow mb-1.5">recent</div>
                  <div className="flex flex-wrap gap-1">
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onChange(r)}
                        className="border border-line px-1.5 py-[2px] font-mono text-[9px] text-fg3 hover:border-fg4 hover:text-fg2"
                      >
                        {r.length > 22 ? `${r.slice(0, 22)}…` : r}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="t-xs leading-relaxed text-fg4">
                  Paste a contract address, or type a ticker, a wallet, an @handle or a narrative
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                {(["token", "wallet", "caller", "deployer", "narrative"] as const).map((k) => (
                  <span key={k} className="flex items-center gap-1.5 t-xs text-fg4">
                    <span aria-hidden className="h-[4px] w-[4px]" style={{ background: { token: "#c6f24e", wallet: "#38bdf8", caller: "#ffb020", deployer: "#ff2d55", narrative: "#a855f7" }[k] }} />
                    {KIND_LABEL[k]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {q.trim() && flat.length === 0 && (
            <div className="px-3 py-4">
              <p className="t-xs text-fg3">Nothing matches “{q.trim()}”</p>
              <p className="mt-1 t-xs leading-relaxed text-fg4">
                The index covers {search("a").length > 0 ? "tracked tokens, wallets, callers and narratives" : "the tracked set"}.
                A contract that has never been scanned is not in it — paste it on Token Scan instead
              </p>
            </div>
          )}

          {groups.map((g) => (
            <div key={g.kind}>
              <div className="sticky top-0 z-10 flex items-center gap-1.5 border-b border-line bg-surf px-3 py-1">
                <span aria-hidden className="h-[4px] w-[4px]" style={{ background: g.items[0].tone }} />
                <span className="t-eyebrow">{KIND_LABEL[g.kind]}</span>
                <span className="ml-auto font-mono text-[8px] tabular-nums text-fg4">{g.items.length}</span>
              </div>
              {g.items.map((r) => {
                const idx = flat.indexOf(r);
                const on = idx === active;
                return (
                  <button
                    key={r.href + r.label}
                    type="button"
                    data-idx={idx}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(r)}
                    className={`flex w-full items-baseline gap-2 border-b border-line/50 px-3 py-1.5 text-left last:border-b-0 ${
                      on ? "bg-acid/8" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className="mt-[5px] h-[4px] w-[4px] shrink-0"
                      style={{ background: r.tone }}
                    />
                    <span className={`min-w-0 flex-[3] truncate font-mono text-[11px] ${on ? "text-acid" : "text-fg2"}`}>
                      {r.label}
                    </span>
                    <span className="min-w-0 flex-[2] truncate text-right text-[9.5px] text-fg4">
                      {r.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-3 py-1.5">
          <span className="font-mono text-[8px] text-fg4/70">↑↓ move</span>
          <span className="font-mono text-[8px] text-fg4/70">↵ open</span>
          <span className="ml-auto font-mono text-[8px] text-fg4/70">
            index: demo set, not the live chain
          </span>
        </div>
      </div>
    </>
  );
}
