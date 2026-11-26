import { AlertsInbox } from "./AlertsInbox";
import { PageHead } from "@/components/Shell";
import { Demo, Gauge, Panel, ProReveal, Split, Tag } from "@/components/ui";
import { AlertRuleExamples } from "@/components/Intelligence4";
import { CallerProTable } from "@/components/ProRows";
import { DEMO_TOKENS } from "@/lib/demo";

/* ==================================================================== *
 * ALERTS
 *
 * Alerts on wallet behaviour, not on price. A price alert is TradingView's
 * job; what nobody else has is "the wallet holding 18.7% just moved half of
 * it" — which is the only alert worth interrupting someone for.
 * ==================================================================== */

export const metadata = { title: "Alerts" };

type Sev = "critical" | "high" | "medium";

const ALERTS: {
  id: string;
  cat: string;
  sev: Sev;
  token: string;
  mint: string;
  chain: string;
  at: string;
  headline: string;
  detail: string;
  unread: boolean;
}[] = [
  {
    id: "a1",
    cat: "wallet movement",
    sev: "critical",
    token: "RATS",
    mint: DEMO_TOKENS[0].mint,
    chain: "solana",
    at: "4m ago",
    headline: "Bundle wallet moved 8.2% of supply",
    detail:
      "BBPzEy…RRbMNk, which holds 18.7% and had never sold, transferred 8.2% to a wallet created today. A transfer is not a sale — but it moves supply out of a wallet you were watching",
    unread: true,
  },
  {
    id: "a2",
    cat: "caller activity",
    sev: "high",
    token: "CATWIF",
    mint: DEMO_TOKENS[2].mint,
    chain: "solana",
    at: "22m ago",
    headline: "@cryptocole posted a token on your watchlist",
    detail:
      "Posted at mcap $780k, 34% above the price 3 minutes earlier. This account's average exit has landed above its post price on 6 of the last 10 calls",
    unread: true,
  },
  {
    id: "a3",
    cat: "risk change",
    sev: "high",
    token: "CATWIF",
    mint: DEMO_TOKENS[2].mint,
    chain: "solana",
    at: "2h ago",
    headline: "Risk score moved 41 → 88",
    detail:
      "The change came from holder concentration: two wallets that were not in the top ten an hour ago now hold 31% between them",
    unread: true,
  },
  {
    id: "a4",
    cat: "liquidity",
    sev: "medium",
    token: "PNUT",
    mint: DEMO_TOKENS[3].mint,
    chain: "solana",
    at: "5h ago",
    headline: "Liquidity removed: $402k → $311k",
    detail:
      "One pool lost 22% of its reserves without a matching drop in price. That is a removal, not a sale",
    unread: false,
  },
  {
    id: "a5",
    cat: "deployer",
    sev: "high",
    token: "PEACH",
    mint: "61yuZf1JyTKqoCfS784SusFGVekA6YUsGTfDg3o6pump",
    chain: "solana",
    at: "8h ago",
    headline: "A deployer you track launched a new token",
    detail:
      "3cJu879x…Rdvyw has now launched four tokens. Three of the prior three collapsed within 48 hours of their peak",
    unread: false,
  },
  {
    id: "a6",
    cat: "smart money",
    sev: "medium",
    token: "PNUT",
    mint: DEMO_TOKENS[3].mint,
    chain: "solana",
    at: "1d ago",
    headline: "Two tracked smart wallets bought",
    detail:
      "8XB23i…b6bBTu and Fq7YbN…LMd2A bought within 40 seconds of each other. Both have more than 40 prior launches and fewer than 5 rugs",
    unread: false,
  },
];

export default function AlertsPage() {
  const unread = ALERTS.filter((a) => a.unread).length;

  return (
    <div>
      <PageHead
        title="Alerts"
        note="Demo feed. Read the wallet move before the candle."
        right={
          <>
            <Demo />
            <Tag tone="bad">{unread} new in demo</Tag>
          </>
        }
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        <Panel title="What fires (and what doesn't)" note="no price pings, only wallet behaviour">
          <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-acid">fires on</div>
              <ul className="mt-1 space-y-1">
                {[
                  "A bundle or dev wallet moving supply",
                  "Liquidity leaving a pool",
                  "A caller you track posting",
                  "A deployer you track launching again",
                  "A tracked smart wallet buying or selling",
                  "A holder set changing enough to move the score",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
                    <span className="t-xs leading-snug text-fg3">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-fg4">
                does not fire on
              </div>
              <ul className="mt-1 space-y-1">
                {[
                  "Price crossing a level — a charting tool does that better",
                  "Volume spikes on their own, with no wallet behind them",
                  "Social mentions without an account that can be matched to a wallet",
                  "Anything you have not asked to watch",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-line2" />
                    <span className="t-xs leading-snug text-fg4">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <AlertsInbox alerts={ALERTS} />

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel title="Delivery preview" note="not connected in this build">
            <div className="space-y-1">
              <Split label="in-app">preview only</Split>
              <Split label="telegram">not connected</Split>
              <Split label="email digest">not configured</Split>
              <Split label="quiet hours">not configured</Split>
            </div>
            <p className="mt-2 t-xs leading-relaxed text-fg4">
              Delivery settings are examples only. No notification service is active here
            </p>
          </Panel>

          <Panel title="Threshold preview" note="examples only · changes are not saved">
            <div className="space-y-2">
              {[
                { label: "wallet moves % of supply", value: 2, max: 20 },
                { label: "liquidity removed %", value: 10, max: 60 },
                { label: "score change", value: 15, max: 100 },
                { label: "smart wallet buy size (usd)", value: 5000, max: 50000 },
              ].map((t) => (
                <div key={t.label}>
                  <div className="flex items-baseline justify-between">
                    <span className="t-xs text-fg4">{t.label}</span>
                    <span className="t-mono text-[10.5px] text-fg2">
                      {t.label.includes("usd") ? `$${t.value.toLocaleString("en-US")}` : t.value}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Gauge pct={(t.value / t.max) * 100} tone="acid" height={3} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 t-xs text-fg4">threshold controls are illustrative in this build</p>
          </Panel>
        </div>

        <ProReveal
          title="Rules, not a single threshold"
          shown={3}
          rows={[<CallerProTable key="cp" />]}
          more={[
            "Compound rules: fire only when a bundle wallet sells and the price is above its entry",
            "Per-entity thresholds: a different number for each wallet you track",
            "Cluster rules: alert when any two wallets in a group act inside the same minute",
            "Deployer rules: alert the moment a tracked deployer's new token takes its first bundle buy",
            "Caller rules: alert when a tracked caller posts and a known cluster buys within five minutes",
            "Delivery into a Telegram group, not a personal inbox",
          ]}
          note="Preview only. No live rules or delivery channels are active in this build"
        >
          <AlertRuleExamples />
        </ProReveal>
      </div>
    </div>
  );
}
