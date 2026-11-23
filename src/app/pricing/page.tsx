"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/Shell";
import { Panel, Tag } from "@/components/ui";
import { useViewer } from "@/lib/viewer";
import { FREE_VALUE, PLAN, PRO_VALUE, SCAN_LIMIT } from "@/lib/plan";

/* ==================================================================== *
 * PLANS
 *
 * The page exists to answer one question: what can I not see right now. So it
 * is built as a difference, not as a price table. Each group leads with the
 * sentence that names the gap, then lists what closes it.
 *
 * The switch at the top is the same store the rest of the product reads, so a
 * reader can turn Pro on and go straight back to the page they were on — the
 * value is demonstrated, not described.
 * ==================================================================== */

const GROUPS = ["Wallets", "Callers", "Narrative", "Investigation"] as const;

export default function PlansPage() {
  const { pro, toggle } = useViewer();
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("Wallets");

  const active = PRO_VALUE.find((g) => g.group === group) ?? PRO_VALUE[0];
  const totalPro = PRO_VALUE.reduce((n, g) => n + g.items.length, 0);
  const totalFree = FREE_VALUE.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      <PageHead
        title="Plans"
        note="what free answers, and what it cannot answer"
        right={<Tag tone="neutral">prices are proposals</Tag>}
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* ---------- the two tiers, side by side ---------- */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {/* free */}
          <section className="panel flex flex-col">
            <div className="border-b border-line px-3 py-2.5">
              <div className="flex items-baseline gap-2">
                <h2 className="t-section text-fg">Free</h2>
                <Tag tone="good">active</Tag>
                <span className="ml-auto font-mono text-[9.5px] text-fg4">
                  {SCAN_LIMIT} scans a day
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="t-mono text-[24px] leading-none text-fg">$0</span>
                <span className="t-xs text-fg4">forever, no account</span>
              </div>
              <p className="mt-1.5 t-xs leading-relaxed text-fg3">
                Every check that produces a verdict. Enough to decide not to buy something — which
                is most of what this tool is for.
              </p>
            </div>

            <div className="flex-1 divide-y divide-line">
              {FREE_VALUE.map((g) => (
                <div key={g.group} className="px-3 py-2">
                  <div className="t-eyebrow">{g.group}</div>
                  <ul className="mt-1 space-y-1">
                    {g.items.map((i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-good" />
                        <span className="t-xs leading-snug text-fg3">{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-line p-2.5">
              <Link
                href="/"
                className="flex h-8 items-center justify-center border border-line font-mono text-[10.5px] uppercase tracking-[0.07em] text-fg3 transition-colors hover:border-line2 hover:text-fg"
              >
                scan a token
              </Link>
              <p className="mt-1.5 t-xs text-fg4">{totalFree} answers, no card, no sign-up</p>
            </div>
          </section>

          {/* pro */}
          <section className="panel flex flex-col border-acid/40">
            <div className="border-b border-line bg-acid/[0.04] px-3 py-2.5">
              <div className="flex items-baseline gap-2">
                <h2 className="t-section text-fg">Pro</h2>
                <Tag tone="acid">preview</Tag>
                <span className="ml-auto font-mono text-[9.5px] text-fg4">unlimited</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="t-mono text-[24px] leading-none text-acid">${PLAN.pro.price}</span>
                <span className="t-xs text-fg4">per month</span>
              </div>
              <p className="mt-1.5 t-xs leading-relaxed text-fg3">
                <span className="text-fg2">Everything in Free, plus the layer beneath it.</span> Who
                bought the launch, who called it, how many times the idea has already run, and what
                all of those entities did afterwards.
              </p>
            </div>

            <div className="flex-1 p-3">
              {/* the difference, group by group, chosen not listed */}
              <div className="flex flex-wrap gap-1">
                {GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroup(g)}
                    aria-pressed={group === g}
                    className={`border px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.05em] transition-colors ${
                      group === g
                        ? "border-acid/50 bg-acid/10 text-acid"
                        : "border-line text-fg4 hover:border-line2 hover:text-fg2"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <p className="mt-2.5 t-body leading-relaxed text-fg2">{active.lead}</p>

              <ul className="mt-2 space-y-1">
                {active.items.slice(0, 3).map((i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <svg
                      viewBox="0 0 10 10"
                      className="mt-[3px] h-[8px] w-[8px] shrink-0 text-acid"
                      aria-hidden
                      fill="none"
                    >
                      <rect x="2" y="4.5" width="6" height="4.5" stroke="currentColor" strokeWidth="1" />
                      <path d="M3.2 4.5V3.2a1.8 1.8 0 0 1 3.6 0v1.3" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    <span className="t-xs leading-snug text-fg3">{i}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-2 border-t border-line pt-2 t-xs text-fg4">
                {active.items.length - 3 > 0 && (
                  <>
                    +{active.items.length - 3} more in this group.{" "}
                  </>
                )}
                {totalPro} items across {PRO_VALUE.length} groups — every one a question free cannot
                answer, not a cosmetic difference
              </p>
            </div>

            <div className="border-t border-line p-2.5">
              {pro ? (
                <>
                  <div className="flex h-8 items-center justify-center border border-acid/40 bg-acid/10 font-mono text-[10.5px] uppercase tracking-[0.07em] text-acid">
                    preview active
                  </div>
                  <button
                    type="button"
                    onClick={toggle}
                    className="mt-1.5 flex h-7 w-full items-center justify-center border border-line font-mono text-[9.5px] uppercase tracking-[0.06em] text-fg4 transition-colors hover:border-line2 hover:text-fg2"
                  >
                    back to the free view
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggle}
                    className="flex h-8 w-full items-center justify-center gap-1.5 bg-acid font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-bg transition-colors hover:bg-acid2"
                  >
                    Preview the paid layer
                    <span aria-hidden>→</span>
                  </button>
                  <p className="mt-1.5 t-xs leading-relaxed text-fg4">
                    Nothing is charged and no account is created. The switch opens every module so
                    you can judge it, then turns off again — billing starts only when the wallet
                    data ships, and the modules say DEMO until it does
                  </p>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ---------- the accounting ---------- */}
        <Panel title="Why the wallet layer costs money" note="the honest reason, not a paywall">
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <p className="t-xs leading-relaxed text-fg3">
              A contract check is one request to a public API. It is cheap, cacheable, and it can be
              free forever. Reading a launch block, tracing funding two hops back and classifying a
              wallet&apos;s entire trade history is a thousand RPC calls per token. The subscription
              pays for that, not for a gate in front of information that already existed.
            </p>
            <div className="mt-2 sm:mt-0">
              <div className="space-y-0">
                {[
                  ["free scan", "~5 API calls"],
                  ["pro scan", "~1,400 RPC calls"],
                  ["bundle trace", "launch block, every tx, every funder"],
                  ["wallet classification", "full history per wallet"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-3 border-b border-line py-[5px] last:border-b-0"
                  >
                    <span className="shrink-0 t-xs text-fg4">{k}</span>
                    <span className="text-right t-mono text-[10.5px] text-fg3">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {/* ---------- the full comparison ---------- */}
        <Panel title="Every difference" note="wallets is open — the other groups expand" flush>
          {PRO_VALUE.map((g, gi) => (
            <details
              key={g.group}
              open={gi === 0}
              className="group border-b border-line last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-baseline gap-2 px-3 py-2 hover:bg-surf2/60">
                <span aria-hidden className="t-mono text-[9px] text-acid transition-transform group-open:rotate-90">
                  ›
                </span>
                <span className="t-xs font-semibold text-fg">{g.group}</span>
                <span className="min-w-0 flex-1 truncate t-xs text-fg4">{g.lead}</span>
                <span className="shrink-0 t-mono text-[9.5px] text-acid">{g.items.length} pro</span>
              </summary>
              <div className="grid grid-cols-1 divide-y divide-line border-t border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-3">
                  <div className="t-eyebrow">free</div>
                  <p className="mt-1 t-xs leading-relaxed text-fg4">
                    The headline figure only — enough to know whether the thing exists.
                  </p>
                </div>
                <div className="p-3">
                  <div className="t-eyebrow">pro</div>
                  <ul className="mt-1 space-y-1">
                    {g.items.map((i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
                        <span className="t-xs leading-snug text-fg3">{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          ))}
        </Panel>

        <Panel title="What is never for sale" note="stated so nobody has to wonder">
          <ul className="space-y-1">
            {[
              "Who called a token, with a link to the post — discovery is always free",
              "The risk verdict and every contract check that produced it",
              "No feature is hidden to make a screenshot look better: every module either exists or is labelled not built",
              "No fake scarcity, no countdown, no trial that silently charges",
              "No ranking of tokens by how much they paid",
              "Nothing on any report is advice",
            ].map((t) => (
              <li key={t} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-acid" />
                <span className="t-xs leading-relaxed text-fg3">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Group" note="for Telegram communities that check constantly">
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="t-mono text-[20px] text-fg">$79</span>
                <span className="t-xs text-fg4">per month</span>
                <Tag tone="neutral">not built</Tag>
              </div>
              <p className="mt-1 t-xs leading-relaxed text-fg3">
                Everything in Pro for every member, plus the bot answering any contract pasted in
                the group, alerts posted into the group when a tracked wallet moves, and a
                leaderboard of who called what and how each call ended.
              </p>
            </div>
            <div className="mt-2 sm:mt-0">
              <Link
                href="/login"
                className="flex h-8 items-center justify-center border border-line px-3 font-mono text-[10px] uppercase tracking-[0.06em] text-fg3 transition-colors hover:border-line2 hover:text-fg"
              >
                join waitlist
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
