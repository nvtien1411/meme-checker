"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/check", label: "Checker" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "How it works" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/92 backdrop-blur-sm">
      <div className="mx-auto flex h-13 w-full max-w-[1240px] items-center gap-1 px-4 sm:px-6">
        <Link href="/" className="mr-2 flex items-center gap-2 py-3" aria-label="Meme Checker home">
          <span
            aria-hidden
            className="grid h-6 w-6 place-items-center rounded-[3px] border border-brand-600/60 bg-brand-600/15 font-mono t-meta font-semibold text-brand-400"
          >
            MC
          </span>
          <span className="t-body font-semibold tracking-tight text-slate-100">
            Meme<span className="text-mute-400"> Checker</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 sm:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded px-2.5 py-1.5 t-body transition ${
                  active
                    ? "bg-ink-800 font-medium text-slate-100"
                    : "text-mute-400 hover:bg-ink-850 hover:text-slate-200"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="rounded px-2.5 py-1.5 t-body text-mute-400 transition hover:bg-ink-850 hover:text-slate-200"
          >
            Telegram bot
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded border border-ink-600 px-2.5 py-1.5 t-body text-mute-300 transition hover:border-ink-500 hover:text-slate-100 sm:block"
          >
            Log in
          </Link>
          <Link
            href="/check"
            className="rounded bg-brand-500 px-3 py-1.5 t-body font-semibold text-ink-950 transition hover:bg-brand-400"
          >
            Check token
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded border border-ink-700 text-mute-300 sm:hidden"
          >
            <span aria-hidden className="t-title leading-none">
              {open ? "×" : "≡"}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink-700 bg-ink-900 px-4 py-2 sm:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block py-2 t-body text-mute-300"
            >
              {n.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} className="block py-2 t-body text-mute-300">
            Log in
          </Link>
        </nav>
      )}
    </header>
  );
}
