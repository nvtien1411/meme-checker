/* ==================================================================== *
 * LAUNCH HISTORY
 *
 * The demo dataset the rest of the product renders from, extended with the
 * thing every paid intelligence feature actually needs: what these wallets did
 * on launches other than this one.
 *
 * This exists as data rather than as pre-written sentences on purpose. A page
 * that says "median holding time: 37 minutes" is a claim. A page that computes
 * it from rows the reader can inspect is evidence, and the two must not be
 * confused. Every figure the VIP layer shows is derived from these rows by
 * src/lib/intel.ts — none of it is typed in by hand.
 *
 * All figures are demo data. They are internally consistent so that the
 * derivations are correct; they are not readings from a chain.
 * ==================================================================== */

export interface LaunchWallet {
  addr: string;
  /** Share of supply bought at launch. */
  bought: number;
  /** Share of its own position sold. */
  sold: number;
  /** Minutes held before the first sell. null = never sold. */
  holdMin: number | null;
  /** Seconds after the open at which it first bought. */
  entrySec: number;
  /** Share of the token's peak at which it exited, 0-1. */
  exitAtPeakFrac: number | null;
}

export interface LaunchRecord {
  symbol: string;
  mint: string;
  /** ISO date. */
  at: string;
  /** Market cap at launch, USD. */
  startMc: number;
  peakMc: number;
  endMc: number;
  /** Did liquidity leave / supply get dumped into nothing. */
  rugged: boolean;
  /** Bundle share of supply at the creation block. */
  bundlePct: number;
  wallets: LaunchWallet[];
}

const H = {
  dev: "3cJu879xPq7vXNbE2mKfTdRsWy4aHnLz8QpVd6Rdvyw",
  funder: "9xQeWvG816bUx9EPfMWuQrM7BUqgHQ1Kz3mRZpVnT4Ks",
  b1: "BBPzEyKTdRm3wXqNa4vJhSc8LkPyU2gFtZoQx6RRbMNk",
  b2: "7gi5osq2KxPa9VuLd3nRtYbXm8QcWj4HsSpEz1K96us9",
  b3: "D32Zb9mZQvNk8RtXyLp5HcJfW2sGdA7UeMi6YqXBeA6h",
  b4: "2Zk8QpLmN4vRtXbYc5HjDfW7sGaE9UeMi3YqXdA6hBnP",
  b5: "Qv7LmNpK4xRtYb2WcHf5JdG8sEaZ9UiM3YqXe6AhBd1S",
  sn1: "E6vTbPELq9Ks3UxZcR7nYpWmB4hJfD8gTaV2sLkQJwdxR6",
  sn2: "H2rqFDGpX8vNbLc5TmYwK3sJqRd9UgZfA6EoPx4AVvuUE",
  ins1: "4TwCBYCKdNvQ7LmXpRs2JfH8bYgWzU5EaTk3Cn9nMbAAy",
  sm1: "8XB23iRpLdQ6TnYc4KsWmZ9VfHj2UbXa7EgP5Rt6b6bBTu",
  sm2: "Fq7YbN4xLdRp2KsWmZ8TnVcHj5UfXa3EgP9RtQb6LMd2A",
  fl1: "5Kd9WmRxTnQ2YbLc8VfHj4UsZa7EgP3RtQb6LdNxM1KpQ",
  fl2: "7TnQbLcVfHj4UsZa9EgP2Rt6LdNxM3KpQ8WmRdYb5XcZv",
};

export const DEMO_LAUNCHES: LaunchRecord[] = [
  {
    symbol: "PEACH",
    mint: "61yuZf1JyTKqoCfS784SusFGVekA6YUsGTfDg3o6pump",
    at: "2026-11-23",
    startMc: 4200,
    peakMc: 612900,
    endMc: 1400,
    rugged: true,
    bundlePct: 41,
    wallets: [
      { addr: H.b1, bought: 21.4, sold: 100, holdMin: 96, entrySec: 0, exitAtPeakFrac: 0.42 },
      { addr: H.b2, bought: 9.8, sold: 100, holdMin: 88, entrySec: 0, exitAtPeakFrac: 0.44 },
      { addr: H.b3, bought: 7.2, sold: 100, holdMin: 102, entrySec: 1, exitAtPeakFrac: 0.39 },
      { addr: H.b4, bought: 2.6, sold: 100, holdMin: 118, entrySec: 1, exitAtPeakFrac: 0.35 },
      { addr: H.sn1, bought: 3.1, sold: 100, holdMin: 34, entrySec: 3, exitAtPeakFrac: 0.31 },
      { addr: H.sn2, bought: 2.2, sold: 100, holdMin: 41, entrySec: 4, exitAtPeakFrac: 0.29 },
      { addr: H.ins1, bought: 0, sold: 100, holdMin: 74, entrySec: 0, exitAtPeakFrac: 0.46 },
      { addr: H.sm1, bought: 0.6, sold: 100, holdMin: 22, entrySec: 8, exitAtPeakFrac: 0.71 },
      { addr: H.fl1, bought: 0.4, sold: 0, holdMin: null, entrySec: 640, exitAtPeakFrac: null },
    ],
  },
  {
    symbol: "JELLY",
    mint: "H2rqFDGpX8vNbLc5TmYwK3sJqRd9UgZfA6EoPx4AVvuUE2",
    at: "2026-11-09",
    startMc: 5100,
    peakMc: 420000,
    endMc: 3800,
    rugged: true,
    bundlePct: 33,
    wallets: [
      { addr: H.b1, bought: 16.9, sold: 100, holdMin: 61, entrySec: 0, exitAtPeakFrac: 0.61 },
      { addr: H.b2, bought: 7.4, sold: 100, holdMin: 58, entrySec: 0, exitAtPeakFrac: 0.63 },
      { addr: H.b4, bought: 4.1, sold: 100, holdMin: 66, entrySec: 1, exitAtPeakFrac: 0.58 },
      { addr: H.b5, bought: 2.8, sold: 100, holdMin: 71, entrySec: 2, exitAtPeakFrac: 0.55 },
      { addr: H.sn1, bought: 2.6, sold: 100, holdMin: 27, entrySec: 2, exitAtPeakFrac: 0.34 },
      { addr: H.ins1, bought: 0, sold: 100, holdMin: 52, entrySec: 0, exitAtPeakFrac: 0.64 },
      { addr: H.sm2, bought: 0.9, sold: 100, holdMin: 19, entrySec: 6, exitAtPeakFrac: 0.78 },
    ],
  },
  {
    symbol: "MOGX",
    mint: "9mXq3BgT7rLpNv2KcWfHj5UsZa8EgP4RtQb6LdNxM1Kq",
    at: "2026-11-18",
    startMc: 6200,
    peakMc: 340000,
    endMc: 52000,
    rugged: true,
    bundlePct: 24,
    wallets: [
      { addr: H.b1, bought: 11.2, sold: 100, holdMin: 142, entrySec: 0, exitAtPeakFrac: 0.38 },
      { addr: H.b3, bought: 5.6, sold: 100, holdMin: 151, entrySec: 1, exitAtPeakFrac: 0.36 },
      { addr: H.b5, bought: 3.4, sold: 100, holdMin: 168, entrySec: 1, exitAtPeakFrac: 0.33 },
      { addr: H.sn2, bought: 1.9, sold: 100, holdMin: 44, entrySec: 3, exitAtPeakFrac: 0.28 },
      { addr: H.ins1, bought: 0, sold: 88, holdMin: 96, entrySec: 0, exitAtPeakFrac: 0.41 },
      { addr: H.sm1, bought: 0.7, sold: 0, holdMin: null, entrySec: 9, exitAtPeakFrac: null },
    ],
  },
  {
    symbol: "TRIPLET",
    mint: "4kPxcrQ7vNbLc3TmYwK8sJqRd9UgZfA2EoPx6AVvuUE1",
    at: "2026-11-15",
    startMc: 7800,
    peakMc: 1240000,
    endMc: 109000,
    rugged: true,
    bundlePct: 29,
    wallets: [
      { addr: H.b1, bought: 13.8, sold: 100, holdMin: 210, entrySec: 0, exitAtPeakFrac: 0.52 },
      { addr: H.b2, bought: 6.1, sold: 100, holdMin: 198, entrySec: 0, exitAtPeakFrac: 0.54 },
      { addr: H.b3, bought: 4.4, sold: 100, holdMin: 221, entrySec: 1, exitAtPeakFrac: 0.49 },
      { addr: H.sn1, bought: 2.4, sold: 100, holdMin: 58, entrySec: 2, exitAtPeakFrac: 0.4 },
      { addr: H.sm2, bought: 1.2, sold: 62, holdMin: 340, entrySec: 7, exitAtPeakFrac: 0.66 },
      { addr: H.fl2, bought: 0.3, sold: 0, holdMin: null, entrySec: 720, exitAtPeakFrac: null },
    ],
  },
  {
    symbol: "NMRD",
    mint: "7Hq4LmNpK2xRtYb9WcHf5JdG8sEaZ3UiM6YqXe1AhBd4S",
    at: "2026-10-28",
    startMc: 9100,
    peakMc: 268000,
    endMc: 41000,
    rugged: false,
    bundlePct: 12,
    wallets: [
      { addr: H.b4, bought: 4.2, sold: 45, holdMin: 620, entrySec: 0, exitAtPeakFrac: 0.31 },
      { addr: H.b5, bought: 3.1, sold: 30, holdMin: 740, entrySec: 1, exitAtPeakFrac: 0.28 },
      { addr: H.sm1, bought: 1.8, sold: 40, holdMin: 1180, entrySec: 5, exitAtPeakFrac: 0.44 },
      { addr: H.sm2, bought: 1.1, sold: 20, holdMin: 1420, entrySec: 8, exitAtPeakFrac: 0.51 },
      { addr: H.fl2, bought: 0.5, sold: 0, holdMin: null, entrySec: 410, exitAtPeakFrac: null },
    ],
  },
  {
    symbol: "RATS",
    mint: "CwnbD9FpaFSNou634knczXVCRUjTqmzwCrs3AiQvpump",
    at: "2026-11-19",
    startMc: 11000,
    peakMc: 89000,
    endMc: 43823,
    rugged: false,
    bundlePct: 22.4,
    wallets: [
      { addr: H.b1, bought: 18.9, sold: 0, holdMin: null, entrySec: 0, exitAtPeakFrac: null },
      { addr: H.b2, bought: 2.5, sold: 4, holdMin: 880, entrySec: 0, exitAtPeakFrac: null },
      { addr: H.b3, bought: 1.4, sold: 21, holdMin: 1920, entrySec: 1, exitAtPeakFrac: null },
      { addr: H.sn1, bought: 1.2, sold: 25, holdMin: 340, entrySec: 2, exitAtPeakFrac: null },
      { addr: H.sn2, bought: 1.0, sold: 30, holdMin: 620, entrySec: 3, exitAtPeakFrac: null },
      { addr: H.ins1, bought: 0, sold: 0, holdMin: null, entrySec: 0, exitAtPeakFrac: null },
      { addr: H.sm1, bought: 1.1, sold: 0, holdMin: null, entrySec: 6, exitAtPeakFrac: null },
      { addr: H.fl1, bought: 0.4, sold: 0, holdMin: null, entrySec: 540, exitAtPeakFrac: null },
    ],
  },
];

/** The wallet set that keeps reappearing, keyed by address. */
export const HISTORY_WALLETS = H;
