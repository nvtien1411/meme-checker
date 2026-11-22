import Link from "next/link";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/check", label: "Checker" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/faq", label: "Method & limits" },
      { href: "/faq#risk", label: "Risk disclosure" },
      { href: "/login", label: "Account" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { href: "https://t.me/", label: "Telegram bot", external: true },
      { href: "https://x.com/", label: "X / Twitter", external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-ink-750">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="grid h-[18px] w-[18px] place-items-center">
                <svg viewBox="0 0 22 22" className="h-full w-full">
                  <circle cx="11" cy="11" r="9.5" className="fill-none stroke-ink-600" strokeWidth="1.6" />
                  <path
                    d="M11 4.5 L15.2 8.7 A6 6 0 0 1 11 17.5"
                    className="fill-none stroke-brand-500"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-[12.5px] font-semibold text-lit-200">Meme Checker</span>
            </div>
            <p className="mt-2.5 t-meta leading-relaxed text-mute-600">
              A research aid for contract addresses. Not financial advice, not a
              guarantee, and not a substitute for your own judgement. Public data
              can be wrong, late or incomplete.
            </p>
            <p className="mt-2 t-meta leading-relaxed text-mute-600">
              Every threshold and every blind spot is documented on the{" "}
              <Link
                href="/faq"
                className="text-mute-400 underline decoration-ink-600 decoration-dotted underline-offset-2 hover:text-lit-200"
              >
                method page
              </Link>
              .
            </p>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <h2 className="t-label">{c.title}</h2>
              <ul className="mt-2.5 space-y-1.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"external" in l && l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="t-small text-mute-500 transition hover:text-lit-200"
                      >
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="t-small text-mute-500 transition hover:text-lit-200"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-800 pt-4">
          <span className="t-meta text-mute-600">
            Data from DexScreener, GeckoTerminal, RugCheck, GoPlus and Solana RPC.
          </span>
          <span className="ml-auto t-meta text-mute-600">
            Snapshotted at request time.
          </span>
        </div>
      </div>
    </footer>
  );
}
