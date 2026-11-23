"use client";

import type {
  BundleGroup,
  CallerIntel,
  ForensicsWallet,
  NarrativeIntel,
  SniperSet,
  WalletForensics,
} from "@/lib/types";
import { fmtUsd } from "@/lib/http";
import { CHAIN_BY_ID, type ChainId } from "@/lib/chains";
import { Tag } from "./ui";

/* ==================================================================== *
 * FORENSICS
 *
 * Three layers of evidence, in the order a trader actually asks:
 *   bundle  — did someone buy the whole launch before I could see it
 *   sniper  — did bots take the open
 *   insider — was supply handed out instead of bought
 *
 * Each module renders one of exactly three states, and the distinction
 * matters more than the styling:
 *
 *   notBuilt  the pipeline cannot answer this yet. Say so plainly. A blank
 *             space reads as "checked and fine", which is the one thing it
 *             must never imply.
 *   locked    the pipeline answers it, this plan does not show it.
 *   filled    real numbers.
 * ==================================================================== */

type ModuleState = "notBuilt" | "locked" | "filled";

function stateOf(enabled: boolean, revealed: boolean): ModuleState {
  if (!enabled) return "notBuilt";
  return revealed ? "filled" : "locked";
}

/* ------------------------------------------------------------------ *
 * Shell — every module shares this frame, so the three states read as
 * variations of one object rather than three different components.
 * ------------------------------------------------------------------ */

function Module({
  title,
  question,
  state,
  summary,
  children,
}: {
  title: string;
  /** What the module answers, in the user's words. Shown when not built. */
  question: string;
  state: ModuleState;
  summary?: string;
  children?: React.ReactNode;
}) {
  const muted = state !== "filled";

  return (
    <div className="border-t border-ink-850 first:border-t-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3">
        <h3 className={`t-body-strong ${muted ? "text-mute-300" : "text-lit-100"}`}>{title}</h3>

        {state === "notBuilt" && (
          <span className="border border-ink-700 px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-500">
            not measured
          </span>
        )}
        {state === "locked" && (
          <span className="border border-brand-500/40 px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-brand-500">
            pro
          </span>
        )}

        {summary && state === "filled" && (
          <span className="ml-auto font-mono text-[11px] tabular-nums text-mute-300">{summary}</span>
        )}
      </div>

      {state === "notBuilt" && (
        <p className="mb-3.5 max-w-[62ch] t-small leading-relaxed text-mute-500">
          {question} This build does not read it yet — which is not the same as finding
          nothing
        </p>
      )}

      {state === "filled" && children && <div className="pb-4">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * A wallet row — the atom of bundle and sniper detail. Reads as a
 * sentence, because the reader is reconstructing a story, not scanning a
 * table: what it bought, what it did, when.
 * ------------------------------------------------------------------ */

function WalletRow({ w, explorer }: { w: ForensicsWallet; explorer: (a: string) => string }) {
  const sold = w.soldPct ?? null;
  const tone =
    w.status === "sold"
      ? "text-bad-400"
      : w.status === "transferred"
        ? "text-risk-400"
        : w.status === "holding"
          ? "text-warn-400"
          : "text-mute-500";

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-t border-ink-850 py-1.5 first:border-t-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <a
            href={explorer(w.address)}
            target="_blank"
            rel="noreferrer"
            title={w.address}
            className="font-mono text-[11px] text-mute-300 underline decoration-ink-700 underline-offset-2 transition-colors hover:text-lit-100"
          >
            {w.address.slice(0, 6)}…{w.address.slice(-4)}
          </a>
          <span className={`font-mono text-[9.5px] uppercase tracking-[0.06em] ${tone}`}>
            {w.status}
          </span>
          {w.priorRugs !== null && w.priorRugs > 0 && (
            <Tag tone="bad">
              {w.priorRugs} prior {w.priorRugs === 1 ? "rug" : "rugs"}
            </Tag>
          )}
        </div>

        <p className="mt-0.5 t-meta leading-relaxed text-mute-500">
          {w.boughtPct !== null && <>bought {w.boughtPct.toFixed(2)}%</>}
          {sold !== null && <> · sold {sold.toFixed(0)}%</>}
          {w.stillHoldsPct !== null && <> · holds {w.stillHoldsPct.toFixed(2)}%</>}
          {w.holdHours !== null && <> · held {w.holdHours.toFixed(1)}h</>}
          {w.funder && (
            <>
              {" · funded by "}
              <span className="font-mono text-mute-400">
                {w.funder.slice(0, 4)}…{w.funder.slice(-4)}
              </span>
            </>
          )}
        </p>
      </div>

      <span className="font-mono text-[10px] tabular-nums text-mute-500">
        {w.avgEntryPrice !== null && w.avgSellPrice !== null && w.avgEntryPrice > 0
          ? `${(w.avgSellPrice / w.avgEntryPrice).toFixed(1)}×`
          : ""}
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * A bundle group — a cluster that moved as one, described by the
 * properties that predict a coordinated exit.
 * ------------------------------------------------------------------ */

function BundleCard({ g, explorer }: { g: BundleGroup; explorer: (a: string) => string }) {
  return (
    <div className="border border-ink-800">
      <div className="flex flex-wrap items-baseline gap-x-3 border-b border-ink-800 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-500">
          {g.wallets.length} wallets
        </span>
        {g.supplyPct !== null && (
          <span className="font-mono text-[12px] tabular-nums text-bad-400">
            {g.supplyPct.toFixed(2)}% supply
          </span>
        )}
        {g.sellSynchrony !== null && (
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.06em] text-mute-500">
            {Math.round(g.sellSynchrony * 100)}% sold in one slot
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-3 py-2 sm:grid-cols-3">
        {g.holdTimeMedianHours !== null && (
          <Figure label="held before selling" value={`${g.holdTimeMedianHours.toFixed(1)}h`} />
        )}
        {g.fundedWindowMin !== null && (
          <Figure label="funded within" value={`${g.fundedWindowMin.toFixed(0)}m of launch`} />
        )}
        {g.uniformBuyRatio !== null && (
          <Figure label="near-identical buys" value={`${Math.round(g.uniformBuyRatio * 100)}%`} />
        )}
      </div>

      <ul className="border-t border-ink-850 px-3 py-1">
        {g.wallets.slice(0, 8).map((w) => (
          <WalletRow key={w.address} w={w} explorer={explorer} />
        ))}
      </ul>

      {g.wallets.length > 8 && (
        <p className="border-t border-ink-850 px-3 py-1.5 t-meta text-mute-500">
          {g.wallets.length - 8} more not listed
        </p>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-600">{label}</div>
      <div className="font-mono text-[11.5px] tabular-nums text-lit-200">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Section entry point.
 * ------------------------------------------------------------------ */

export function ForensicsSection({
  data,
  chain,
}: {
  data?: WalletForensics;
  /** Chain id, not a function — a server component cannot pass a callback
   *  across the client boundary, and the explorer is derivable from the id. */
  chain: ChainId;
}) {
  const enabled = data?.enabled ?? false;
  const snipers = data?.sniper;
  const explorer = CHAIN_BY_ID[chain].explorer;

  /**
   * While the whole layer is unbuilt, five separate cards each repeating
   * "not measured on this build" pushed the first real evidence below the
   * fold and made the report look empty at the top. One block that names all
   * five modules says the same thing without five identical paragraphs — and
   * still says it, because silence would read as "checked, nothing found".
   */
  if (!enabled) {
    return (
      <div className="border-t border-ink-800 pt-3.5">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="border border-ink-700 px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-500">
            not measured
          </span>
          <span className="font-mono text-[10px] text-mute-600">
            this build does not read the launch block yet
          </span>
        </div>

        <ul className="mt-3 space-y-1.5">
          {[
            ["Launch bundle", "did one group buy the whole launch before anyone could see it"],
            ["Snipers", "did bots take the open, and are they still holding"],
            ["Insider supply", "was supply handed out rather than bought"],
            ["Fresh wallets", "were the early buyers created in the week before launch"],
            ["Exit window", "how long you would have to react once selling starts"],
          ].map(([name, question]) => (
            <li key={name} className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-mute-500">
                {name}
              </span>
              <span className="t-meta text-mute-600">{question}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 max-w-[64ch] t-small leading-relaxed text-mute-400">
          None of these were read. A module that was never run is not a module that came back
          clean — the difference is the whole point of this section
        </p>
      </div>
    );
  }

  return (
    <div>
      <Module
        title="Launch bundle"
        question="Did one group buy the whole launch before anyone could see it."
        state={stateOf(enabled, (data?.bundle.groups.length ?? 0) > 0)}
        summary={
          data?.bundle.count !== null && data?.bundle.count !== undefined
            ? `${data.bundle.count} groups · ${data.bundle.supplyPct?.toFixed(2) ?? "?"}%`
            : undefined
        }
      >
        <div className="space-y-2">
          {data?.bundle.groups.map((g) => (
            <BundleCard key={g.id} g={g} explorer={explorer} />
          ))}
        </div>
      </Module>

      <Module
        title="Snipers"
        question="Did bots take the open and are they still holding."
        state={stateOf(enabled, snipers?.revealed ?? false)}
        summary={
          snipers?.count !== null && snipers?.count !== undefined
            ? `${snipers.count} wallets · ${snipers.supplyPct?.toFixed(1) ?? "?"}%`
            : undefined
        }
      >
        {snipers && <SniperBody s={snipers} explorer={explorer} />}
      </Module>

      <Module
        title="Insider supply"
        question="Was supply handed out rather than bought."
        state={stateOf(enabled, (data?.insider.walletCount ?? 0) > 0)}
        summary={
          data?.insider.walletCount !== null && data?.insider.walletCount !== undefined
            ? `${data.insider.walletCount} wallets · ${data.insider.supplyPct?.toFixed(2) ?? "?"}%`
            : undefined
        }
      />

      <Module
        title="Fresh wallets"
        question="Were the early buyers created in the week before launch."
        state={stateOf(enabled, (data?.fresh.count ?? 0) > 0)}
        summary={
          data?.fresh.count !== null && data?.fresh.count !== undefined
            ? `${data.fresh.count} wallets · ${data.fresh.supplyPct?.toFixed(2) ?? "?"}%`
            : undefined
        }
      />

      <Module
        title="Exit window"
        question="How long you would have to react once they start selling."
        state={stateOf(enabled, data?.exitWindowSeconds !== null && data?.exitWindowSeconds !== undefined)}
        summary={
          data?.exitWindowSeconds !== null && data?.exitWindowSeconds !== undefined
            ? `${data.exitWindowSeconds}s from first sell to −50%`
            : undefined
        }
      />
    </div>
  );
}

function SniperBody({ s, explorer }: { s: SniperSet; explorer: (a: string) => string }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pb-2 sm:grid-cols-4">
        <Figure label="sold" value={s.sold !== null ? `${s.sold}` : "—"} />
        <Figure label="transferred" value={s.transferred !== null ? `${s.transferred}` : "—"} />
        <Figure label="still holding" value={s.holding !== null ? `${s.holding}` : "—"} />
        <Figure
          label="their profit"
          value={s.profitMultiple !== null ? `${s.profitMultiple.toFixed(1)}×` : "—"}
        />
      </div>
      <ul>
        {s.wallets.slice(0, 10).map((w) => (
          <WalletRow key={w.address} w={w} explorer={explorer} />
        ))}
      </ul>
    </div>
  );
}

/* ==================================================================== *
 * CALLERS
 *
 * Who told you about it. The reason this section exists: retail gets
 * dumped by mid-tier callers within five to ten minutes, and the only
 * defence is knowing what that account did with its own money last time.
 * ==================================================================== */

export function CallersSection({ data }: { data?: CallerIntel }) {
  const enabled = data?.available ?? false;
  const posts = data?.posts ?? [];

  return (
    <div>
      {!enabled && (
        <div className="border-t border-ink-850 pt-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="t-body-strong text-mute-300">Who called it</h3>
            <span className="border border-ink-700 px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-500">
              not measured
            </span>
          </div>
          <p className="mt-1.5 max-w-[62ch] t-small leading-relaxed text-mute-500">
            Which accounts posted this contract, and what each of them did with their own
            position afterwards. Not read on this build
          </p>
        </div>
      )}

      {enabled && (
        <>
          {/* cabal first: a coordinated group is a different risk from one bad caller */}
          {data?.cabalScore !== null && data?.cabalScore !== undefined && data.cabalScore >= 50 && (
            <div className="mb-3 border border-bad-600/40 bg-bad-950/30 px-3 py-2.5">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-bad-400">
                  coordinated call
                </span>
                <span className="font-mono text-[12px] tabular-nums text-bad-300">
                  {data.cabalScore}/100
                </span>
                {data.cabalWindowMin !== null && (
                  <span className="font-mono text-[10px] text-mute-400">
                    {data.cabalHandles.length} accounts inside {data.cabalWindowMin}m
                  </span>
                )}
              </div>
              <p className="mt-1 t-meta leading-relaxed text-mute-300">
                Several mid-size accounts posted this contract in the same short window. That
                pattern looks like organic hype and behaves like a placement
              </p>
            </div>
          )}

          <div className="border-t border-ink-850">
            {posts.map((p) => (
              <CallerRow key={`${p.handle}-${p.postedAt}`} p={p} />
            ))}
          </div>

          {(data?.botEngagementPct !== null || data?.renamedAccounts !== null) && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-ink-850 pt-2.5">
              {data?.botEngagementPct !== null && data?.botEngagementPct !== undefined && (
                <Figure label="reply volume automated" value={`${data.botEngagementPct.toFixed(0)}%`} />
              )}
              {data?.renamedAccounts !== null && data?.renamedAccounts !== undefined && (
                <Figure
                  label="accounts renamed recently"
                  value={`${data.renamedAccounts}`}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CallerRow({ p }: { p: CallerIntel["posts"][number] }) {
  const negative = p.leadSeconds !== null && p.leadSeconds < 0;
  const soldIntoFollowers = p.exitVsCallPrice !== null && p.exitVsCallPrice > 1;

  return (
    <div className="border-b border-ink-850 py-2.5 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <a
          href={p.postUrl}
          target="_blank"
          rel="noreferrer"
          className="t-body-strong text-lit-100 underline decoration-ink-700 underline-offset-2 transition-colors hover:text-brand-400"
        >
          @{p.handle}
        </a>
        {p.followers !== null && (
          <span className="font-mono text-[10px] tabular-nums text-mute-500">
            {fmtCount(p.followers)} followers
          </span>
        )}
        {soldIntoFollowers && <Tag tone="bad">sold above call price</Tag>}
        {negative && <Tag tone="warn">called before buying</Tag>}
      </div>

      {/* the timeline is the argument — three timestamps, no interpretation */}
      {(p.leadSeconds !== null || p.postCallSoldPct !== null) && (
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 font-mono text-[10px] tabular-nums text-mute-500">
          {p.leadSeconds !== null && (
            <span>
              bought {p.leadSeconds < 0 ? `${Math.abs(p.leadSeconds)}s before` : `${p.leadSeconds}s after`}{" "}
              posting
            </span>
          )}
          {p.postCallSoldPct !== null && (
            <span className={p.postCallSoldPct > 30 ? "text-bad-400" : ""}>
              sold {p.postCallSoldPct.toFixed(0)}% after
            </span>
          )}
          {p.exitVsCallPrice !== null && (
            <span className={soldIntoFollowers ? "text-bad-400" : ""}>
              at {p.exitVsCallPrice.toFixed(2)}× call price
            </span>
          )}
          {p.prePostRunUpPct !== null && p.prePostRunUpPct > 5 && (
            <span className="text-warn-400">
              already +{p.prePostRunUpPct.toFixed(0)}% before the post
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

/* ==================================================================== *
 * NARRATIVE
 *
 * The question is not "what is the story" — that is a free tier answer.
 * It is "how many times has this story already been tried, and how did
 * the last ones end".
 * ==================================================================== */

export function NarrativeIntelSection({ data }: { data?: NarrativeIntel }) {
  if (!data?.available) {
    return (
      <div className="border-t border-ink-850 pt-3">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 className="t-body-strong text-mute-300">Narrative history</h3>
          <span className="border border-ink-700 px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-mute-500">
            not measured
          </span>
        </div>
        <p className="mt-1.5 max-w-[62ch] t-small leading-relaxed text-mute-500">
          How many tokens already ran this idea, what they peaked at and how long they lasted.
          Not read on this build
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-ink-850 pt-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {data.copyIndex !== null && (
          <Figure
            label="copies in 7d"
            value={data.copyIndex === 1 ? "original" : `#${data.copyIndex}`}
          />
        )}
        {data.organicScore !== null && (
          <Figure label="organic" value={`${data.organicScore}/100`} />
        )}
        {data.survivalMedianHours !== null && (
          <Figure label="usual lifespan" value={fmtHours(data.survivalMedianHours)} />
        )}
        {data.priorInstances.length > 0 && (
          <Figure label="prior attempts" value={`${data.priorInstances.length}`} />
        )}
      </div>

      {data.priorInstances.length > 0 && (
        <ul className="mt-3 border-t border-ink-850">
          {data.priorInstances.slice(0, 5).map((i) => (
            <li
              key={i.address}
              className="flex flex-wrap items-baseline gap-x-3 border-b border-ink-850 py-1.5 last:border-b-0"
            >
              <span className="font-mono text-[11px] text-mute-300">
                {i.symbol ?? `${i.address.slice(0, 6)}…`}
              </span>
              {i.peakMarketCap !== null && (
                <span className="font-mono text-[10px] tabular-nums text-mute-500">
                  peak {fmtUsd(i.peakMarketCap)}
                </span>
              )}
              {i.hoursToPeak !== null && (
                <span className="font-mono text-[10px] tabular-nums text-mute-500">
                  after {fmtHours(i.hoursToPeak)}
                </span>
              )}
              {i.hoursToMinus90 !== null && (
                <span className="ml-auto font-mono text-[10px] tabular-nums text-bad-400">
                  −90% in {fmtHours(i.hoursToMinus90)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 t-meta leading-relaxed text-mute-600">
        Lifespan is the median of what these instances did, not a forecast for this one
      </p>
    </div>
  );
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(0)}h`;
  return `${(h / 24).toFixed(0)}d`;
}
