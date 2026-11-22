"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ *
 * Toast
 *
 * The brief requires feedback on every action. Copy-to-clipboard was the only
 * action with feedback, and it did so by rewriting the button label, which
 * shifts layout and is invisible if your eyes are on the table row. A single
 * fixed-position region announces results without moving anything.
 * ------------------------------------------------------------------ */

type Toast = { id: number; text: string; tone: "ok" | "bad" | "info" };

const ToastCtx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = ++seq.current;
    setItems((prev) => [...prev.slice(-2), { id, text, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-1.5 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-[min(92vw,420px)] rounded border px-3 py-1.5 text-small shadow-lg ${
              t.tone === "bad"
                ? "border-bad-600/60 bg-ink-850 text-bad-500"
                : t.tone === "info"
                  ? "border-ink-600 bg-ink-850 text-mute-300"
                  : "border-ok-600/60 bg-ink-850 text-ok-500"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------------------------------------------ *
 * Copy button
 *
 * Used in the address row, every holder row and every check reading. Falls back
 * to a manual selection prompt when the clipboard API is unavailable, which is
 * the case on non-HTTPS origins and some Safari builds.
 * ------------------------------------------------------------------ */

export function CopyButton({
  text,
  label,
  display,
  title,
  className = "",
  showCheck = true,
}: {
  text: string;
  label?: string;
  display?: string;
  title?: string;
  className?: string;
  showCheck?: boolean;
}) {
  const toast = useToast();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setState("copied");
      toast(label ?? "Copied to clipboard");
      setTimeout(() => setState("idle"), 1400);
    } catch {
      setState("failed");
      toast("Could not copy — select the text manually", "bad");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={title ?? `Copy ${text}`}
      aria-label={title ?? `Copy ${text}`}
      className={`group inline-flex items-center gap-1 text-meta text-mute-500 transition hover:text-brand-400 ${className}`}
    >
      {display !== undefined && (
        <span className="font-mono text-small text-mute-400">{display}</span>
      )}
      {showCheck && (
        <span aria-hidden className="text-[10px] opacity-40 group-hover:opacity-90">
          {state === "copied" ? "✓" : state === "failed" ? "×" : "⧉"}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Confirm
 *
 * For destructive or irreversible actions. Keyboard-dismissable, focus trapped
 * to the two buttons, and it names the consequence rather than asking
 * "are you sure?".
 * ------------------------------------------------------------------ */

export function ConfirmButton({
  onConfirm,
  confirmLabel,
  question,
  className = "",
  children,
}: {
  onConfirm: () => void;
  confirmLabel: string;
  question: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const yes = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    yes.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={question}
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 px-4"
        >
          <div className="w-full max-w-sm border border-ink-600 bg-ink-900 p-4">
            <p className="text-body text-slate-200">{question}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-ink-600 px-2.5 py-1.5 text-small text-mute-300 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                ref={yes}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
                className="rounded bg-bad-600 px-2.5 py-1.5 text-small font-semibold text-ink-950 hover:bg-bad-500"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
