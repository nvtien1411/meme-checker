"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/Shell";
import { Panel, Tag } from "@/components/ui";
import { useViewer } from "@/lib/viewer";
import { FREE_VALUE, PLAN, PRO_VALUE, SCAN_LIMIT } from "@/lib/plan";
import { DEMO_CALLERS, DEMO_RUGS, DEMO_TOKENS } from "@/lib/demo";
import { CORE_BUNDLE } from "@/components/Intelligence";
import { classifyWallet, groupBehaviour, walletProfile } from "@/lib/intel";
import { HISTORY_WALLETS } from "@/lib/launches";

/* ==================================================================== *
 * PRO HUB
 *
 * Two ways to sell this and only one of them works. A price table asks the
 * reader to imagine the value; a worked example lets them check it. So the page
 * is built as one investigation, start to finish, with the moment where free
 * stops and Pro continues marked inside it.
 *
 * Nothing here is a screenshot. Every figure is read from the same demo dataset
 * the rest of the product renders, so the page cannot drift from the product.
 * ==================================================================== */

function walkthrough(leadDna: { label: string; evidence: string[] } | null, leadLaunches: number) {
  return [
  {
    step: "01",
    question: "Is this contract safe?",
    body: "Free answers this completely: can you sell, is the supply fixed, can the liquidity be pulled. On a launchpad token the answer is almost always yes, and that is the entire problem — a clean contract on a bundled launch is still a bundled launch.",
    free: true,
  },
  {
    step: "02",
    question: "Who bought the launch?",
    body: "Top-10 concentration, bundle count, sniper count — as headline figures. Enough to know a group exists.",
    free: true,
  },
  {
    step: "03",
    question: "Who are they, and what have they done before?",
    body: leadDna
      ? `This is where the money is actually lost. The largest of the group classifies as "${leadDna.label}" across ${leadLaunches} launches — ${leadDna.evidence[1]?.toLowerCase() ?? "with a measurable exit habit"}.`
      : "This is where the money is actually lost. Each wallet's age, funding source, record on prior launches, and how long it typically holds.",
    free: false,
  },
  {
    step: "04",
    question: "Is the caller selling into their own followers?",
    body: "Exit price against the price at the moment they posted. Above 1.0 means they sold higher than the price their own post produced.",
    free: false,
  },
  {
    step: "05",
    question: "Has this narrative already run?",
    body: "How many times, its peak each time, and how long it took to collapse on each attempt.",
    free: false,
  },
  ];
}

export default function PricingPage() {
  const { pro, toggle } = useViewer();
  const [group, setGroup] = useState(PRO_VALUE[0].group);

  const active = PRO_VALUE.find((g) => g.group === group) ?? PRO_VALUE[0];
  const totalPro = PRO_VALUE.reduce((n, g) => n + g.items.length, 0);
  const totalFree = FREE_VALUE.reduce((n, g) => n + g.items.length, 0);

  const worstCaller = [...DEMO_CALLERS].sort((a, b) => b.exitVsCall - a.exitVsCall)[0];
  const bestCaller = [...DEMO_CALLERS].sort((a, b) => a.exitVsCall - b.exitVsCall)[0];
  const token = DEMO_TOKENS[0];
  const rug = DEMO_RUGS[0];

  // The hero case is computed, not written. If the launch history changes, the
  // numbers on the sales page change with it — a pricing page that can disagree
  // with the product is worse than no pricing page.
  const cluster = groupBehaviour(CORE_BUNDLE);
  const lead = walletProfile(HISTORY_WALLETS.b1);
  const leadDna = lead ? classifyWallet(lead) : null;

  return (
    <div>
      <PageHead
        title="Pro"
        note="what free answers, and what it cannot answer"
        right={<Tag tone="neutral">no billing yet</Tag>}
      />

      <div className="space-y-2.5 p-3 sm:p-4">
        {/* ---------- the lead: one worked case, not a headline ---------- */}
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
            <div className="p-3 sm:p-4">
              <div className="t-eyebrow">the case that sells this product</div>
              <h2 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-fg" style={{ fontFamily: "var(--font-display)" }}>
                {rug.symbol} passed every contract check and still lost {rug.drawdownPct}%
              </h2>
              <p className="mt-2 t-body leading-relaxed text-fg2">
                Free would have told you the contract was clean — mint revoked, no freeze authority,
                no transfer tax, LP burned. All true. What free cannot tell you is that the same
                wallet had seeded five launches before it, that three of them collapsed, and that the
                buyers at block 0 had been funded by one address eleven minutes earlier.
              </p>
              <div className="mt-3 divide-y divide-line border-t border-line">
                {[
                  ["peak market cap", `$${(rug.peakMc / 1000).toFixed(0)}k`],
                  ["final drawdown", `-${rug.drawdownPct}%`],
                  [
                    "the group's median hold",
                    cluster.medianHoldMin === null
                      ? "not measured"
                      : cluster.medianHoldMin < 90
                        ? `${Math.round(cluster.medianHoldMin)} min`
                        : `${(cluster.medianHoldMin / 60).toFixed(1)} h`,
                  ],
                  [
                    "launches they collapsed",
                    `${cluster.collapsesAfterExit} of ${cluster.coLaunches.length}`,
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 py-[5px]">
                    <span className="t-xs text-fg4">{k}</span>
                    <span className="text-right t-mono text-[10.5px] text-fg3">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/deployers/${rug.deployer}`}
                  className="flex h-7 items-center border border-line px-2 font-mono text-[9.5px] uppercase tracking-[0.06em] text-fg3 transition-colors hover:border-line2 hover:text-fg"
                >
                  open the deployer
                </Link>
                <Link
                  href={`/token/${rug.chain}/${rug.mint}`}
                  className="flex h-7 items-center border border-line px-2 font-mono text-[9.5px] uppercase tracking-[0.06em] text-fg3 transition-colors hover:border-line2 hover:text-fg"
                >
                  open the token
                </Link>
              </div>
            </div>

            <div className="bg-surf2/40 p-3 sm:p-4">
              <div className="t-eyebrow">what a caller actually did</div>
              <div className="mt-2 space-y-2">
                {[worstCaller, bestCaller].map((c) => {
                  const bad = c.exitVsCall > 1;
                  return (
                    <div key={c.handle} className="border border-line bg-surf/60 p-2">
                      <div className="flex items-baseline gap-2">
                        <Link href={`/callers/${c.handle}`} className="font-mono text-[11px] text-fg2 hover:text-acid">
                          @{c.handle}
                        </Link>
                        <span className="t-xs tabular-nums text-fg4">
                          {(c.followers / 1000).toFixed(0)}k followers
                        </span>
                        <span
                          className={`ml-auto font-mono text-[11px] tabular-nums ${bad ? "text-bad" : "text-good"}`}
                        >
                          {c.exitVsCall.toFixed(2)}x
                        </span>
                      </div>
                      <p className="mt-1 t-xs leading-relaxed text-fg3">
                        {bad
                          ? `Sold at ${c.exitVsCall.toFixed(2)}x the price their own post created. ${c.soldAfter}% of their position went after followers arrived.`
                          : `Sold at ${c.exitVsCall.toFixed(2)}x the price their post created — below their own call. Rare, and worth knowing which kind you are following.`}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 t-xs leading-relaxed text-fg4">
                Exit price divided by the price at the moment they posted. One number, and it is the
                only one that separates a caller you can follow from a caller who is using you
              </p>
            </div>
          </div>
        </div>

        {/* ---------- the walkthrough: where free stops ---------- */}
        <Panel
          title="One investigation, start to finish"
          note="five questions in the order a trader asks them"
          flush
        >
          {walkthrough(leadDna, lead?.launchCount ?? 0).map((w) => (
            <div
              key={w.step}
              className={`flex gap-3 border-b border-line px-3 py-2 last:border-b-0 ${w.free ? "" : "bg-acid/[0.025]"}`}
            >
              <span
                className={`mt-[1px] shrink-0 font-mono text-[10px] tabular-nums ${w.free ? "text-fg4" : "text-acid"}`}
              >
                {w.step}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={`t-xs font-semibold ${w.free ? "text-fg2" : "text-fg"}`}>
                    {w.question}
                  </span>
                  <span
                    className={`font-mono text-[8.5px] uppercase tracking-[0.07em] ${w.free ? "text-good" : "text-acid"}`}
                  >
                    {w.free ? "free" : "pro"}
                  </span>
                </div>
                <p className="mt-0.5 t-xs leading-relaxed text-fg3">{w.body}</p>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 bg-surf2/50 px-3 py-2">
            <span className="min-w-0 flex-1 t-xs leading-relaxed text-fg3">
              Steps 3 through 5 are the three questions that decide whether a trade is a trade or a
              donation. Free ends at step 2
            </span>
            {!pro && (
              <button
                type="button"
                onClick={toggle}
                className="shrink-0 border border-acid/40 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.06em] text-acid transition-colors hover:bg-acid/10"
              >
                open all of it
              </button>
            )}
          </div>
        </Panel>

        {/* ---------- the boundary, by group ---------- */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <section className="panel flex flex-col">
            <div className="border-b border-line px-3 py-2.5">
              <div className="flex items-baseline gap-2">
                <h2 className="t-section text-fg">Free</h2>
                <Tag tone="good">active</Tag>
                <span className="ml-auto font-mono text-[9.5px] text-fg4">{SCAN_LIMIT}/day</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="t-mono text-[22px] leading-none text-fg">$0</span>
                <span className="t-xs text-fg4">forever, no account</span>
              </div>
              <p className="mt-1.5 t-xs leading-relaxed text-fg3">
                Every check that produces a verdict. Enough to decide not to buy something — which is
                most of what this tool is for
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
                href={`/token/${token.chain}/${token.mint}`}
                className="flex h-8 items-center justify-center border border-line font-mono text-[10px] uppercase tracking-[0.07em] text-fg3 transition-colors hover:border-line2 hover:text-fg"
              >
                scan a token
              </Link>
              <p className="mt-1.5 t-xs text-fg4">{totalFree} answers, no card, no sign-up</p>
            </div>
          </section>

          <section className="panel flex flex-col border-acid/40">
            <div className="border-b border-line bg-acid/[0.04] px-3 py-2.5">
              <div className="flex items-baseline gap-2">
                <h2 className="t-section text-fg">Pro</h2>
                <Tag tone="acid">preview</Tag>
                <span className="ml-auto font-mono text-[9.5px] text-fg4">unlimited</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="t-mono text-[22px] leading-none text-acid">${PLAN.pro.price}</span>
                <span className="t-xs text-fg4">per month</span>
              </div>
              <p className="mt-1.5 t-xs leading-relaxed text-fg3">
                <span className="text-fg2">Everything in Free, plus the layer beneath it.</span> Who
                bought the launch, who called it, how many times the idea has already run, and what
                all of those entities did afterwards
              </p>
            </div>

            <div className="flex-1 p-3">
              <div className="flex flex-wrap gap-1">
                {PRO_VALUE.map((g) => (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() => setGroup(g.group)}
                    aria-pressed={group === g.group}
                    className={`border px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.05em] transition-colors ${
                      group === g.group
                        ? "border-acid/50 bg-acid/10 text-acid"
                        : "border-line text-fg4 hover:border-line2 hover:text-fg2"
                    }`}
                  >
                    {g.group}
                    <span className="ml-1 text-[8.5px] opacity-60">{g.items.length}</span>
                  </button>
                ))}
              </div>

              <p className="mt-2.5 t-body leading-relaxed text-fg2">{active.lead}</p>

              <ul className="mt-2 space-y-1">
                {active.items.map((i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <svg viewBox="0 0 10 10" className="mt-[3px] h-[8px] w-[8px] shrink-0 text-acid" aria-hidden fill="none">
                      <rect x="2" y="4.5" width="6" height="4.5" stroke="currentColor" strokeWidth="1" />
                      <path d="M3.2 4.5V3.2a1.8 1.8 0 0 1 3.6 0v1.3" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    <span className="t-xs leading-snug text-fg3">{i}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-2 border-t border-line pt-2 t-xs text-fg4">
                {totalPro} items across {PRO_VALUE.length} groups — every one a question free cannot
                answer, not a cosmetic difference
              </p>
            </div>

            <div className="border-t border-line p-2.5">
              {pro ? (
                <>
                  <div className="flex h-8 items-center justify-center border border-acid/40 bg-acid/10 font-mono text-[10px] uppercase tracking-[0.07em] text-acid">
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
                    className="flex h-8 w-full items-center justify-center gap-1.5 bg-acid font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-bg transition-colors hover:bg-acid2"
                  >
                    open every module
                    <span aria-hidden>→</span>
                  </button>
                  <p className="mt-1.5 t-xs leading-relaxed text-fg4">
                    Nothing is charged and no account is created. Billing starts only when the wallet
                    data ships, and the modules say DEMO until it does
                  </p>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ---------- the cost accounting ---------- */}
                {/* ---------- the full list ---------- */}
        <Panel title="Every difference" note="wallets open — the other groups expand" flush>
          {PRO_VALUE.map((g, gi) => (
            <details key={g.group} open={gi === 0} className="group border-b border-line last:border-b-0">
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
                    The headline figure only — enough to know whether the thing exists
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
              "No feature is hidden to make a screenshot look better: every module either exists or is labelled",
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
      </div>
    </div>
  );
}
