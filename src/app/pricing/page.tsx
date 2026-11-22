import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free checks, and what sits behind premium.",
};

type Tier = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  href: string;
  highlight?: boolean;
  status: "available" | "planned";
  features: { label: string; included: boolean }[];
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "The full rejection standard, no account needed.",
    cta: "Check a token",
    href: "/check",
    status: "available",
    features: [
      { label: "8 checks + verdict", included: true },
      { label: "Top 10 holders with labels", included: true },
      { label: "Market, liquidity, exit depth", included: true },
      { label: "Project links", included: true },
      { label: "Narrative (keyword, marked inferred)", included: true },
      { label: "Data provenance per source", included: true },
      { label: "Saved history", included: false },
      { label: "Wallet cluster map", included: false },
      { label: "Alerts", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "$39",
    cadence: "per month",
    blurb: "Deeper wallet work, for people who size up.",
    cta: "Join the waitlist",
    href: "/login",
    highlight: true,
    status: "planned",
    features: [
      { label: "Everything in Free", included: true },
      { label: "Saved history and re-checks", included: true },
      { label: "Wallet cluster map", included: true },
      { label: "Dev wallet investigation", included: true },
      { label: "Bundle wallet analysis", included: true },
      { label: "KOL intelligence", included: true },
      { label: "Price and wallet alerts", included: true },
      { label: "API access", included: false },
    ],
  },
  {
    id: "group",
    name: "Group",
    price: "from $49",
    cadence: "per month",
    blurb: "For Telegram communities that check constantly.",
    cta: "Join the waitlist",
    href: "/login",
    status: "planned",
    features: [
      { label: "Everything in Premium", included: true },
      { label: "Telegram bot for your group", included: true },
      { label: "Higher usage limits", included: true },
      { label: "Group alerts", included: true },
      { label: "Shared saved tokens", included: true },
      { label: "API access", included: false },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6">
      <h1 className="text-[22px] font-semibold tracking-tight text-slate-50">Pricing</h1>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-mute-400">
        The checks that stop you losing money are free and always will be. Premium
        is for deeper wallet work, not for hiding the basics behind a wall.
      </p>

      <div className="mt-6 border border-warn-600/40 bg-warn-600/8 px-3.5 py-2.5">
        <p className="text-[12px] leading-relaxed text-warn-500">
          <span className="font-semibold">Premium and Group are not built yet.</span>{" "}
          <span className="text-mute-300">
            Prices are proposals and can change before launch. Nothing on this site
            is currently gated — every check you see on a report runs on the free
            tier.
          </span>
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.id}
            className={`flex flex-col border bg-ink-900 ${
              t.highlight ? "border-brand-600/60" : "border-ink-700"
            }`}
          >
            <div className="border-b border-ink-700 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-semibold text-slate-100">{t.name}</h2>
                {t.status === "planned" && (
                  <span className="rounded border border-warn-600/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-warn-500">
                    planned
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-mono text-[24px] font-semibold tabular-nums text-slate-50">
                  {t.price}
                </span>
                <span className="text-[11px] text-mute-500">{t.cadence}</span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-mute-400">{t.blurb}</p>
            </div>

            <ul className="flex-1 space-y-1.5 px-3.5 py-3">
              {t.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2 text-[12px]">
                  <span
                    aria-hidden
                    className={`mt-[2px] text-[10px] ${
                      f.included ? "text-ok-500" : "text-ink-500"
                    }`}
                  >
                    {f.included ? "✓" : "—"}
                  </span>
                  <span className={f.included ? "text-mute-300" : "text-mute-500 line-through decoration-ink-600"}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink-700 px-3.5 py-3">
              <Link
                href={t.href}
                className={`block rounded px-3 py-2 text-center text-[12.5px] font-semibold transition ${
                  t.status === "available"
                    ? "bg-brand-500 text-ink-950 hover:bg-brand-400"
                    : "border border-ink-600 text-mute-300 hover:border-ink-500 hover:text-slate-100"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-9 border-t border-ink-800 pt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute-400">
          Billing questions
        </h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          {[
            {
              q: "Is the free tier rate limited?",
              a: "There is a per-IP limit to keep the free upstream APIs usable, but no account or key is needed. If you hit it, the report says so rather than showing partial data as complete.",
            },
            {
              q: "What happens to my checks if I cancel?",
              a: "Nothing is deleted. Saved history becomes read-only and premium panels fall back to the free view.",
            },
            {
              q: "Can I pay in crypto?",
              a: "Not yet decided. Card via Stripe is the default assumption for launch.",
            },
            {
              q: "Do you offer refunds?",
              a: "Undecided. If you are unsure, stay on free — it covers every check that produces a verdict.",
            },
          ].map((f) => (
            <div key={f.q}>
              <dt className="text-[12.5px] font-medium text-slate-200">{f.q}</dt>
              <dd className="mt-1 text-[11.5px] leading-relaxed text-mute-500">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
