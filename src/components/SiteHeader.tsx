"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/check", label: "Checker" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "Method" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-750 bg-ink-950/92 backdrop-blur-md">
      <div className="mx-auto flex h-[53px] w-full max-w-[1320px] items-center gap-1 px-4 sm:px-6">
        {/* wordmark: a mark that reads at 20px, not a placeholder square */}
        <Link href="/" className="mr-3 flex items-center gap-2.5" aria-label="Meme Checker home">
          <span aria-hidden className="relative grid h-[22px] w-[22px] place-items-center">
            <svg viewBox="0 0 22 22" className="h-full w-full">
              <circle cx="11" cy="11" r="9.5" className="fill-none stroke-ink-600" strokeWidth="1.5" />
              <path
                d="M11 4.5 L15.2 8.7 A6 6 0 0 1 11 17.5"
                className="fill-none stroke-brand-500"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-lit-100">
            Meme Checker
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative rounded-[3px] px-2.5 py-1.5 t-small transition ${
                  active
                    ? "bg-ink-800 text-lit-100"
                    : "text-mute-500 hover:bg-ink-850 hover:text-lit-200"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-[3px] px-2.5 py-1.5 t-small text-mute-500 transition hover:text-lit-200 sm:block"
          >
            Telegram
          </a>
          <Link
            href="/login"
            className="hidden rounded-[3px] border border-ink-650 px-2.5 py-1.5 t-small text-mute-300 transition hover:border-ink-500 hover:text-lit-100 sm:block"
          >
            Log in
          </Link>
          <Link
            href="/check"
            className="rounded-[3px] bg-brand-500 px-3 py-1.5 t-small font-semibold text-ink-950 transition hover:bg-brand-400"
          >
            Check a token
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="ml-0.5 grid h-9 w-9 place-items-center rounded-[3px] border border-ink-700 text-mute-300 md:hidden"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              {open ? (
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink-750 bg-ink-900 px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 t-body text-mute-300"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block py-2.5 t-body text-mute-300"
          >
            Log in
          </Link>
        </nav>
      )}
    </header>
  );
}
