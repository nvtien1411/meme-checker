import type { ChainId } from "@/lib/chains";
import { CHAIN_BY_ID } from "@/lib/chains";

/* ==================================================================== *
 * CHAIN MARKS
 *
 * Small geometric glyphs for the five chains we read, each drawn in that
 * chain's own colour. These are simplified marks, not the official logos —
 * recognisable at 11px, which is the only size they are ever used at.
 *
 * Every one is a single path or two, in currentColor, so the tint comes from
 * the caller and the mark stays legible on any surface.
 * ==================================================================== */

const GLYPH: Record<ChainId, React.ReactNode> = {
  // three sheared bars, alternating direction — the Solana stack. Drawn as
  // parallelograms rather than lines so the zigzag reads at 11px; three plain
  // bars looked like an equals sign.
  solana: (
    <>
      <path d="M5.4 4.6h12.4l-3.2 2.7H2.2z" />
      <path d="M2.2 8.7h12.4l3.2 2.7H5.4z" opacity="0.78" />
      <path d="M5.4 12.8h12.4l-3.2 2.7H2.2z" opacity="0.52" />
    </>
  ),
  // the BNB rhombus
  bsc: (
    <>
      <path d="M10 2.4 12.4 4.8 10 7.2 7.6 4.8z" />
      <path d="M5.1 7.3 7.5 9.7 5.1 12.1 2.7 9.7z" opacity="0.8" />
      <path d="M14.9 7.3 17.3 9.7 14.9 12.1 12.5 9.7z" opacity="0.8" />
      <path d="M10 12.2 12.4 14.6 10 17 7.6 14.6z" opacity="0.6" />
      <path d="M10 8.6 11.4 10 10 11.4 8.6 10z" opacity="0.9" />
    </>
  ),
  // the Ethereum octahedron, split across two planes
  ethereum: (
    <>
      <path d="M10 2 5.2 10.1 10 13 14.8 10.1z" opacity="0.62" />
      <path d="M10 14.2 5.2 11.3 10 18 14.8 11.3z" />
    </>
  ),
  // Base: a circle cut by a horizontal chord
  base: (
    <>
      <circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M2.8 10h14.4" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </>
  ),
  // Robinhood: the feather, reduced to a quill stroke
  robinhood: (
    <>
      <path d="M10 2.2c3.3 2.3 4.6 5.4 3.7 8.5-.7 2.4-2.5 4.4-3.7 6.3-1.2-1.9-3-3.9-3.7-6.3-.9-3.1.4-6.2 3.7-8.5z" />
      <path d="M10 5.4v9.2" fill="none" stroke="#050507" strokeWidth="1.1" opacity="0.55" />
    </>
  ),
};

export function ChainMark({
  chain,
  size = 12,
  className = "",
}: {
  chain: ChainId;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="currentColor"
      className={`shrink-0 ${className}`}
      style={{ color: CHAIN_BY_ID[chain].tint }}
    >
      {GLYPH[chain]}
    </svg>
  );
}

/* A single chip: mark + label, tinted. Used anywhere a chain is named. */
export function ChainChip({
  chain,
  short = false,
  className = "",
}: {
  chain: ChainId;
  short?: boolean;
  className?: string;
}) {
  const meta = CHAIN_BY_ID[chain];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.1em] ${className}`}
      style={{
        color: meta.tint,
        borderColor: `color-mix(in srgb, ${meta.tint} 34%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${meta.tint} 7%, transparent)`,
      }}
    >
      <ChainMark chain={chain} size={9} />
      {short ? meta.short : meta.label}
    </span>
  );
}
