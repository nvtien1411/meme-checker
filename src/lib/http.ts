/* ------------------------------------------------------------------ *
 * Formatting
 *
 * Every helper returns "—" for null rather than inventing a value. The
 * brief's rule 9 is that missing data must never look like data, so a
 * formatter that quietly prints 0 is a bug.
 * ------------------------------------------------------------------ */

export const DASH = "—";

export function fmtUsd(v: number | null | undefined, opts?: { compact?: boolean }): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return DASH;
  const abs = Math.abs(v);
  const compact = opts?.compact ?? abs >= 100_000;
  if (compact && abs >= 1_000_000) {
    const n = v / 1_000_000;
    return `$${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  }
  if (compact && abs >= 1_000) {
    const n = v / 1_000;
    return `$${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(abs >= 10_000 ? 0 : 1)}K`;
  }
  if (abs >= 1_000) return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (abs >= 1) return `$${v.toFixed(2)}`;
  if (abs === 0) return "$0";
  return `$${v.toPrecision(3)}`;
}

/** Sub-cent prices need mantissa notation or they render as 0.000000. */
export function fmtPrice(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return DASH;
  if (v === 0) return "$0";

  const a = Math.abs(v);

  // Whole-dollar tokens: two decimals, because four is noise at that scale.
  if (a >= 1) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Cents to dollars: four decimals, trailing zeros trimmed, never fewer than two.
  if (a >= 0.01) {
    const [h, t] = v.toFixed(4).split(".");
    const trimmed = t.replace(/0+$/, "").padEnd(2, "0");
    return `$${h}.${trimmed}`;
  }

  // Sub-cent: print the decimal with four significant digits. Memecoin prices
  // are the most-read number in the product, and "3.993e-5" is not a price a
  // person can compare to another price.
  const decimals = Math.min(12, Math.max(2, 3 - Math.floor(Math.log10(a))));
  let fixed = v.toFixed(decimals);
  const [head, tail] = fixed.split(".");
  const trimmed = tail.replace(/0+$/, "");
  if (trimmed.length >= 2) fixed = `${head}.${trimmed}`;

  // A token priced below 1e-12 would round to zero at the cap; fall back to
  // scientific notation rather than print a misleading $0.000000000000.
  if (/^0\.0*$/.test(fixed)) {
    const exp = Math.floor(Math.log10(a));
    return `$${(v / Math.pow(10, exp)).toFixed(3)}e${exp}`;
  }
  return `$${fixed}`;
}

export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return DASH;
  return `${v.toFixed(digits)}%`;
}

export function fmtSignedPct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return DASH;
  const s = v > 0 ? "+" : "";
  return `${s}${v.toFixed(digits)}%`;
}

export function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return DASH;
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Coarse by design: "3h" is honest, "3h 14m 22s" implies precision we lack. */
export function fmtAge(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || !Number.isFinite(hours)) return DASH;
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  if (hours < 24 * 60) return `${Math.round(hours / 24)}d`;
  return `${(hours / 24 / 30).toFixed(1)}mo`;
}

/**
 * A 24h change on a token younger than 24h is a change since launch. Saying
 * "24h" there is the single most common lie in these dashboards.
 */
export function fmtChange(
  pct: number | null | undefined,
  ageHours: number | null | undefined,
): { text: string; label: string } {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) {
    return { text: DASH, label: "" };
  }
  const young = ageHours !== null && ageHours !== undefined && ageHours < 24;
  return {
    text: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`,
    label: young ? "since launch" : "24h",
  };
}

export function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return DASH;
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function shortAddr(a: string | null | undefined, n = 4): string {
  if (!a) return DASH;
  return a.length > n * 2 + 2 ? `${a.slice(0, n + 2)}…${a.slice(-n)}` : a;
}

/* ---------------------------- rate limiting --------------------------- */

export function cacheGet<T>(key: string): T | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (e.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return e.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

const cache = new Map<string, { value: unknown; expires: number }>();

class Limiter {
  private tokens: number;
  private last = Date.now();
  constructor(
    private capacity: number,
    private refillPerSec: number,
  ) {
    this.tokens = capacity;
  }
  async take(): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.tokens = Math.min(
        this.capacity,
        this.tokens + ((now - this.last) / 1000) * this.refillPerSec,
      );
      this.last = now;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitMs = Math.ceil(((1 - this.tokens) / this.refillPerSec) * 1000);
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 1000)));
    }
  }
}

const limiters: Record<string, Limiter> = {
  dexscreener: new Limiter(8, 5),
  // ~30 rpm documented; one analysis needs 3-4 calls, so pace it slowly.
  geckoterminal: new Limiter(2, 0.32),
  rugcheck: new Limiter(3, 1),
  goplus: new Limiter(2, 0.45),
  solana: new Limiter(4, 2),
};

const breakers = new Map<string, number>();

function breakerOpen(source: string) {
  const until = breakers.get(source);
  if (!until) return false;
  if (until < Date.now()) {
    breakers.delete(source);
    return false;
  }
  return true;
}

function tripBreaker(source: string, ms: number) {
  breakers.set(source, Date.now() + ms);
}

export interface FetchResult<T> {
  ok: boolean;
  data: T | null;
  status: import("./types").SourceStatus;
}

/**
 * Fetch with timeout, one retry, per-provider pacing and a circuit breaker.
 * A provider that just rate-limited us is skipped instead of retried: retrying
 * into a 429 is what turns one slow upstream into a 40-second page load.
 */
export async function fetchJson<T>(
  source: keyof typeof limiters | string,
  url: string,
  opts: {
    timeoutMs?: number;
    retries?: number;
    headers?: Record<string, string>;
    ttlMs?: number;
    label?: string;
  } = {},
): Promise<FetchResult<T>> {
  const { timeoutMs = 8000, retries = 1, headers = {}, ttlMs = 30_000 } = opts;
  const label = opts.label ?? source;
  const key = `GET:${url}`;

  const cached = cacheGet<T>(key);
  if (cached !== undefined) {
    return {
      ok: true,
      data: cached,
      status: { source: label, ok: true, ms: 0, note: "cached" },
    };
  }

  const started = Date.now();

  if (breakerOpen(source)) {
    return {
      ok: false,
      data: null,
      status: {
        source: label,
        ok: false,
        ms: 0,
        error: "rate limited — skipped",
        degraded: true,
      },
    };
  }

  const limiter = limiters[source];
  let lastError = "";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (limiter) await limiter.take();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json", ...headers },
        cache: "no-store",
      });
      clearTimeout(timer);

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        if (res.status === 429) {
          tripBreaker(source, 45_000);
          return {
            ok: false,
            data: null,
            status: {
              source: label,
              ok: false,
              ms: Date.now() - started,
              error: "HTTP 429 (rate limited)",
              degraded: true,
            },
          };
        }
        if (res.status >= 500 && attempt < retries) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
          continue;
        }
        return {
          ok: false,
          data: null,
          status: { source: label, ok: false, ms: Date.now() - started, error: lastError },
        };
      }

      const data = (await res.json()) as T;
      cacheSet(key, data, ttlMs);
      breakers.delete(source);
      return {
        ok: true,
        data,
        status: { source: label, ok: true, ms: Date.now() - started },
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < retries) await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }

  return {
    ok: false,
    data: null,
    status: { source: label, ok: false, ms: Date.now() - started, error: lastError },
  };
}

export function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1 || v === "1") return true;
  if (v === "false" || v === 0 || v === "0") return false;
  return null;
}
