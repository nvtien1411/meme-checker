"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

/* ==================================================================== *
 * SHELL — TOP NAVIGATION
 *
 * A horizontal bar rather than a rail. The rail was the right call when the
 * product was a dense report reader; it is the wrong call for a tool whose
 * primary action is a single field, because it pushes the content off-centre
 * and eats 216px of horizontal room on every screen.
 *
 * The bar is 56px, one line, one border. Left: reticle + wordmark. Centre-left:
 * four destinations. Right: the two surfaces that are not the product (the
 * bot, the account). Nothing else — a nav that carries a CTA competes with the
 * CTA on the page, and every page here already has one.
 *
 * Active state is a 2px acid underline that sits on the bar's own baseline,
 * so the selected item is marked by the frame rather than by a pill.
 * ==================================================================== */

const NAV = [
  { href: "/check", label: "Check" },
  { href: "/dashboard", label: "History" },
  { href: "/faq", label: "Method" },
  { href: "/pricing", label: "Plans" },
];

function Mark() {
  return (
    <span aria-hidden className="relative grid h-[22px] w-[22px] shrink-0 place-items-center">
      {/* a reticle: concentric rings, four cardinal ticks, one acid quadrant.
          The product is a scanner, so the mark is a scanner. */}
      <svg viewBox="0 0 22 22" className="h-full w-full">
        <circle cx="11" cy="11" r="8.5" className="fill-none stroke-ink-600" strokeWidth="1" />
        <circle cx="11" cy="11" r="4" className="fill-none stroke-ink-500" strokeWidth="1" />
        <path d="M11 0.5v4M11 17.5v4M0.5 11h4M17.5 11h4" className="stroke-ink-500" strokeWidth="1" />
        <path
          d="M11 2.5a8.5 8.5 0 0 1 8.5 8.5"
          className="fill-none stroke-brand-500"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <circle cx="11" cy="11" r="1.3" className="fill-brand-500" />
      </svg>
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/check")
      return pathname === "/" || pathname.startsWith("/check") || pathname.startsWith("/token");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---------------------------------------------------------------- *
       * BAR
       * ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/90 backdrop-blur-md">
        <div className="flex h-14 items-center gap-1 px-4 sm:px-6 lg:px-8">
          {/* identity */}
          <Link
            href="/"
            aria-label="Meme Checker home"
            className="group flex shrink-0 items-center gap-2.5 pr-4"
          >
            <Mark />
            <span className="hidden flex-col leading-none sm:flex">
              <span
                className="text-[12.5px] font-semibold tracking-[-0.02em] text-lit-100"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Meme Checker
              </span>
              <span className="mt-[3px] font-mono text-[8.5px] uppercase tracking-[0.16em] text-mute-500">
                on-chain intel
              </span>
            </span>
          </Link>

          <span aria-hidden className="mr-3 hidden h-5 w-px bg-ink-800 md:block" />

          {/* destinations */}
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-0.5">
              {NAV.map((n) => {
                const active = isActive(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex h-14 items-center px-3 text-[12.5px] font-medium tracking-[-0.008em] transition-colors ${
                        active ? "text-lit-50" : "text-mute-500 hover:text-lit-100"
                      }`}
                    >
                      {n.label}
                      <span
                        aria-hidden
                        className={`absolute inset-x-3 -bottom-px h-[2px] transition-transform duration-200 ${
                          active ? "scale-x-100 bg-brand-500" : "scale-x-0 bg-ink-600"
                        } ${active ? "" : "group-hover:scale-x-100"}`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* surfaces */}
          <div className="ml-auto hidden items-center gap-1 md:flex">
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-1.5 px-3 py-2 text-[12px] text-mute-500 transition-colors hover:text-lit-100"
            >
              Telegram bot
              <span
                aria-hidden
                className="font-mono text-[9px] text-ink-500 transition-colors group-hover:text-brand-500"
              >
                ↗
              </span>
            </a>

            <span aria-hidden className="mx-1 h-5 w-px bg-ink-800" />

            <Link
              href="/login"
              aria-current={isActive("/login") ? "page" : undefined}
              className={`flex items-center gap-2 px-3 py-2 text-[12px] transition-colors ${
                isActive("/login") ? "text-lit-50" : "text-mute-500 hover:text-lit-100"
              }`}
            >
              Account
              <span className="border border-ink-600 px-1 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-500">
                beta
              </span>
            </Link>
          </div>

          {/* mobile trigger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="ml-auto grid h-9 w-9 place-items-center border border-ink-700 text-mute-300 transition hover:border-brand-600 hover:text-brand-400 md:hidden"
          >
            <span aria-hidden className="flex w-4 flex-col gap-[3px]">
              <span
                className={`h-[1.5px] w-full bg-current transition-transform ${open ? "translate-y-[4.5px] rotate-45" : ""}`}
              />
              <span
                className={`h-[1.5px] w-full bg-current transition-opacity ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`h-[1.5px] w-full bg-current transition-transform ${open ? "-translate-y-[4.5px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>

        {/* ---------------------------------------------------------------- *
         * MOBILE SHEET
         * ---------------------------------------------------------------- */}
        {open && (
          <div id="mobile-nav" className="rise border-t border-ink-800 bg-ink-925 px-4 pb-3 md:hidden">
            <ul className="divide-y divide-ink-800">
              {NAV.map((n) => {
                const active = isActive(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className="flex items-center justify-between py-3"
                    >
                      <span
                        className={`text-[13px] ${active ? "text-brand-400" : "text-mute-300"}`}
                      >
                        {n.label}
                      </span>
                      <span
                        aria-hidden
                        className={`font-mono text-[10px] ${active ? "text-brand-500" : "text-ink-500"}`}
                      >
                        {active ? "●" : "→"}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-3 text-[13px] text-mute-300"
                >
                  Telegram bot
                  <span aria-hidden className="font-mono text-[10px] text-ink-500">
                    ↗
                  </span>
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-3 text-[13px] text-mute-300"
                >
                  <span className="flex items-center gap-2">
                    Account
                    <span className="border border-ink-600 px-1 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-500">
                      beta
                    </span>
                  </span>
                  <span aria-hidden className="font-mono text-[10px] text-ink-500">
                    →
                  </span>
                </Link>
              </li>
            </ul>

            <p className="flex items-center gap-2 border-t border-ink-800 pt-3 font-mono text-[8.5px] uppercase tracking-[0.12em] text-mute-600">
              <span aria-hidden className="live-dot h-1 w-1 rounded-full bg-brand-500" />
              free tier · no wallet
            </p>
          </div>
        )}
      </header>

      {/* scrim: the sheet is an overlay, so the page behind it must recede */}
      {open && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-x-0 bottom-0 top-14 z-30 cursor-default bg-ink-950/70 backdrop-blur-[2px] md:hidden"
        />
      )}

      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
