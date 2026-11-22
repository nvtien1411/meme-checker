import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-ink-700">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-[3px] border border-ink-600 font-mono t-label font-semibold text-mute-400"
              >
                MC
              </span>
              <span className="t-body font-semibold text-slate-200">Meme Checker</span>
            </div>
            <p className="mt-2 t-small leading-relaxed text-mute-500">
              A research aid for contract addresses. Not financial advice, not a
              guarantee, and not a substitute for your own judgement. Public data
              can be wrong, late or incomplete.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-1.5 t-small sm:grid-cols-3">
            <Link href="/check" className="text-mute-400 transition hover:text-slate-200">
              Checker
            </Link>
            <Link href="/pricing" className="text-mute-400 transition hover:text-slate-200">
              Pricing
            </Link>
            <Link href="/faq" className="text-mute-400 transition hover:text-slate-200">
              How it works
            </Link>
            <Link href="/dashboard" className="text-mute-400 transition hover:text-slate-200">
              Dashboard
            </Link>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="text-mute-400 transition hover:text-slate-200"
            >
              Telegram
            </a>
            <Link href="/faq#risk" className="text-mute-400 transition hover:text-slate-200">
              Risk disclosure
            </Link>
          </div>
        </div>

        <p className="mt-6 border-t border-ink-800 pt-3 t-meta text-mute-500">
          Data from DexScreener, GeckoTerminal, RugCheck and GoPlus. Free tier,
          no key required. Values are snapshotted at request time and may already
          be stale.
        </p>
      </div>
    </footer>
  );
}
