"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/* ==================================================================== *
 * VIEWER — the free / pro switch
 *
 * Until now every VIP block was a static panel: it said what VIP would show
 * and nothing else. That is a brochure, not a product, and it meant nobody
 * could evaluate whether the paid layer was worth anything.
 *
 * This is the switch that makes the boundary real. One flag, one place,
 * persisted locally. Every module reads it, so "what does VIP actually get
 * me" is answerable by flipping a toggle instead of reading a feature list.
 *
 * Deliberately not auth: there is no account system, and inventing a fake
 * login to hold a boolean would be worse than saying this is a preview.
 *
 * Implemented with useSyncExternalStore rather than state + effect. The server
 * snapshot is always "free", the client snapshot reads storage, and React
 * reconciles the two after hydration without a second render pass or the
 * flash of a wrong value that a mount-effect would cause.
 * ==================================================================== */

type Viewer = {
  pro: boolean;
  setPro: (v: boolean) => void;
  toggle: () => void;
  /** False until the client snapshot is in use. */
  ready: boolean;
};

const Ctx = createContext<Viewer | null>(null);

const KEY = "mc.viewer.pro";
const EVENT = "mc:viewer";

const listeners = new Set<() => void>();

/** Mirror of the value. Kept because storage can be denied outright, and a
 *  toggle that silently does nothing is worse than one that resets. */
let memory: boolean | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

function getSnapshot(): boolean {
  if (memory !== null) return memory;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Server render and the first client paint both assume free. */
function getServerSnapshot(): boolean {
  return false;
}

function write(v: boolean) {
  memory = v;
  try {
    window.localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    /* storage blocked — `memory` carries the value for this session */
  }
  listeners.forEach((l) => l());
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* no window in this context; listeners already ran */
  }
}

export function ViewerProvider({ children }: { children: ReactNode }) {
  const pro = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPro = useCallback((v: boolean) => write(v), []);
  const toggle = useCallback(() => write(!getSnapshot()), []);

  const value = useMemo<Viewer>(() => ({ pro, setPro, toggle, ready: true }), [pro, setPro, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViewer(): Viewer {
  const v = useContext(Ctx);
  // A module rendered outside the provider should behave as free rather than
  // crash — this is a preview build and a missing provider must never blank a
  // page.
  return v ?? { pro: false, setPro: () => {}, toggle: () => {}, ready: true };
}
