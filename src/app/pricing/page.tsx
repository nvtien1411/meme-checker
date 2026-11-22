import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free checks, and what sits behind premium",
};

type Feat = { label: string; state: "in" | "out" | "later" };

type Tier = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  href: string;
  primary?: boolean;
  planned?: boolean;
  features: Feat[];
  note?: string;
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Every check that produces a verdict. No account",
    cta: "Check a token",
    href: "/check",
    primary: true,
    features: [
      { label: "8 checks + verdict", state: "in" },
      { label: "Top 10 holders with labels", state: "in" },
      { label: "Market, liquidity, exit depth", state: "in" },
      { label: "Project links", state: "in" },
      { label: "Narrative, marked inferred", state: "in" },
      { label: "Data provenance per source", state: "in" },
      { label: "Saved check history", state: "out" },
      { label: "Wallet cluster map", state: "out" },
      { label: "Alerts", state: "out" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "$39",
    cadence: "per month",
    blurb: "Deeper wallet work, for people who size up",
    cta: "Notify me when Premium ships",
    href: "/login",
    planned: true,
    features: [
      { label: "Everything in Free", state: "in" },
      { label: "Saved check history", state: "in" },
      { label: "Wallet cluster map", state: "in" },
      { label: "Dev wallet investigation", state: "in" },
      { label: "Bundle wallet analysis", state: "in" },
      { label: "KOL intelligence", state: "in" },
      { label: "Price and wallet alerts", state: "in" },
      { label: "API access", state: "later" },
    ],
    note: "Price is a proposal. It can change before launch",
  },
  {
    id: "group",
    name: "Group",
    price: "from $49",
    cadence: "per month",
    blurb: "For Telegram communities that check constantly",
    cta: "Notify me about Group",
    href: "/login",
    planned: true,
    features: [
      { label: "Everything in Premium", state: "in" },
      { label: "Bot for your Telegram group", state: "in" },
      { label: "Higher usage limits", state: "in" },
      { label: "Group alerts", state: "in" },
      { label: "Shared saved tokens", state: "in" },
    ],
    note: "Price is a proposal. It can change before launch",
  },
];

const MARK: Record<Feat["state"], { glyph: string; cls: string; text: string }> = {
  in: { glyph: "✓", cls: "text-ok-400", text: "text-mute-300" },
  out: { glyph: "—", cls: "text-ink-600", text: "text-mute-600" },
  later: { glyph: "→", cls: "text-brand-500", text: "text-mute-400" },
};

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[1060px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <p className="t-label">plans</p>
      <h1 className="mt-2.5 t-display text-lit-50">Pricing</h1>
      <p className="mt-3 max-w-[56ch] t-body leading-relaxed text-mute-400">
        The verdict checks are free forever. Premium adds deeper research — wallet investigation,
        saved history, alerts — not a different verdict
      </p>

      <div className="mt-5 flex items-start gap-2.5 border border-ink-800 px-3.5 py-2.5">
        <span aria-hidden className="mt-[6px] h-1 w-1 shrink-0 bg-warn-500" />
        <p className="t-small leading-relaxed text-mute-300">
          <span className="font-semibold text-warn-400">Premium and Group are not built yet</span>{" "}
          Their prices are proposals and there is no checkout. No built feature is gated — the
          eight checks and the verdict always run on the free tier
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-px border border-ink-800 bg-ink-800 lg:grid-cols-3">
        {TIERS.map((t) => (
          <div key={t.id} className="flex flex-col bg-ink-950">
            <div className="border-b border-ink-800 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <h2 className="t-title text-lit-100">{t.name}</h2>
                {t.primary && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ok-400">
                    available
                  </span>
                )}
                {t.planned && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute-600">
                    not built
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-mono text-[26px] leading-none tabular-nums tracking-[-0.03em] text-lit-50">
                  {t.price}
                </span>
                <span className="t-meta text-mute-600">{t.cadence}</span>
              </div>
              <p className="mt-1.5 t-small leading-relaxed text-mute-400">{t.blurb}</p>
            </div>

            <ul className="flex-1 space-y-2 px-4 py-3.5">
              {t.features.map((f) => {
                const m = MARK[f.state];
                return (
                  <li key={f.label} className="flex items-start gap-2 t-small">
                    <span aria-hidden className={`mt-[1px] w-2 shrink-0 font-mono text-[10px] ${m.cls}`}>
                      {m.glyph}
                    </span>
                    <span className={`min-w-0 ${m.text}`}>{f.label}</span>
                    {f.state === "later" && (
                      <span className="ml-auto shrink-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-600">
                        planned
                      </span>
                    )}
                    {f.state === "out" && <span className="sr-only">not included</span>}
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-ink-800 px-4 py-3">
              <Link
                href={t.href}
                className={`block px-3 py-2 text-center text-[12px] font-semibold transition ${
                  t.primary
                    ? "glow-acid bg-brand-500 text-ink-950 hover:bg-brand-400"
                    : "border border-ink-700 text-mute-300 hover:border-ink-600 hover:text-lit-100"
                }`}
              >
                {t.cta}
              </Link>
              {t.note && <p className="mt-2 t-meta leading-relaxed text-mute-600">{t.note}</p>}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10 border-t border-ink-800 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t-section text-lit-100">Billing questions</h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute-600">
            planned policy — nothing is chargeable today
          </span>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2">
          {[
            {
              q: "Is the free tier rate limited?",
              a: "There is a per-IP limit so the free upstream APIs stay usable for everyone. No account or key is needed. If you hit it, the report says so instead of presenting partial data as complete",
            },
            {
              q: "What happens to my history if I cancel?",
              a: "Nothing is deleted. Saved checks become read-only and the premium panels fall back to the free view. Reading what you already paid to save stays possible",
            },
            {
              q: "Why isn't saved history included in Free?",
              a: "History is a Premium feature from the start — a free check is stateless and stores nothing. The read-only case only applies to someone who had Premium and cancelled",
            },
            {
              q: "Can I pay in crypto?",
              a: "Not decided. Card is the default assumption for launch, and nothing is being charged today so there is no payment method to pick",
            },
          ].map((f) => (
            <div key={f.q}>
              <dt className="t-body-strong text-lit-100">{f.q}</dt>
              <dd className="mt-1 t-small leading-relaxed text-mute-500">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
