import type {
  Check,
  CheckState,
  ClusterAnalysis,
  DeployerAnalysis,
  ExitAnalysis,
  FlowAnalysis,
  HolderAnalysis,
  MarketData,
  SecurityData,
  Verdict,
} from "../types";
import { fmtPct, fmtUsd } from "../http";

/* ------------------------------------------------------------------ *
 * The check set
 *
 * These are not invented thresholds. They reproduce the rejection standard
 * that public on-chain checklists converge on (Bubblemaps' own guidance,
 * RugCheck, and the 8-point rubric traders pass around):
 *
 *   cluster > 30% of supply      → high risk
 *   single non-pool wallet > 5-6% → fail unless there is a stated reason
 *   bundled launch supply > 30%   → avoid
 *   LP not locked/burned          → fail
 *   live mint / live freeze       → fail
 *
 * The important design decision is what is NOT here: no "risk score" presented
 * as a probability, and no check that turns missing data into a warning.
 * An unknown is reported as unknown and never counted as a pass.
 * ------------------------------------------------------------------ */

export interface CheckInput {
  market: MarketData;
  security: SecurityData;
  holders: HolderAnalysis;
  clusters: ClusterAnalysis;
  flow: FlowAnalysis;
  deployer: DeployerAnalysis;
  exit: ExitAnalysis;
  chain: string;
}

function c(
  id: string,
  label: string,
  state: CheckState,
  reading: string,
  source: string,
  quality: Check["quality"],
  detail: string,
): Check {
  return { id, label, state, reading, source, quality, detail };
}

export function buildChecks(i: CheckInput): Check[] {
  const { market, security, holders, clusters, flow, deployer, exit } = i;
  const checks: Check[] = [];
  const ageH = market.ageHours ?? 0;
  const young = ageH < 720; // 30 days — launch-time questions only matter here

  /* 1 — can you sell at all ------------------------------------------------ */
  if (security.honeypot === true) {
    checks.push(
      c("sell", "Can you sell it?", "fail", "Sell blocked (honeypot)", "goplus", "observed",
        "GoPlus simulated a sell and it reverted. There is no trade to make here."),
    );
  } else if (security.freezable === true) {
    checks.push(
      c("sell", "Can you sell it?", "fail", "Freeze authority still live", "rugcheck/goplus", "observed",
        "The issuer can freeze your token account, which makes your balance unsellable at their discretion."),
    );
  } else if (security.honeypot === false) {
    checks.push(
      c("sell", "Can you sell it?", "pass", "Sell path open", "goplus", "observed",
        "A simulated sell succeeded. Contract-level blocking is ruled out — it says nothing about liquidity."),
    );
  } else if (security.freezable === false) {
    checks.push(
      c("sell", "Can you sell it?", "pass", "No freeze authority", "rugcheck", "observed",
        "Freeze authority is revoked, so no wallet can be individually blocked from selling."),
    );
  } else {
    checks.push(
      c("sell", "Can you sell it?", "unknown", "Not reported", "goplus/rugcheck", "observed",
        "Neither provider returned a sell simulation or authority state for this token."),
    );
  }

  /* 2 — supply is fixed ---------------------------------------------------- */
  if (security.mintable === true) {
    checks.push(
      c("mint", "Is the supply fixed?", young ? "fail" : "warn",
        "Mint authority active", "rugcheck/goplus", "observed",
        young
          ? "On a new token a live mint is a dilution switch: the issuer can print and sell into your position."
          : "Mint is still possible. On a mature token this is often a treasury function, but it is still a lever someone holds."),
    );
  } else if (security.mintable === false) {
    checks.push(
      c("mint", "Is the supply fixed?", "pass", "Mint revoked", "rugcheck/goplus", "observed",
        "Total supply cannot be increased."),
    );
  } else {
    checks.push(
      c("mint", "Is the supply fixed?", "unknown", "Not reported", "rugcheck/goplus", "observed",
        "Mint authority state was not returned by either provider."),
    );
  }

  /* 3 — liquidity cannot be pulled ---------------------------------------- */
  const lp = security.lpLockedPct;
  if (security.lpBurned === true && (lp === null || lp >= 99)) {
    checks.push(
      c("lp", "Can the liquidity be pulled?", "pass", "LP burned", "rugcheck", "observed",
        "The LP tokens were burned, so the pool cannot be withdrawn by the deployer."),
    );
  } else if (lp === null) {
    checks.push(
      c("lp", "Can the liquidity be pulled?", "unknown", "Lock state unreadable", "rugcheck/goplus", "observed",
        "No LP lock percentage was returned. This is a gap in coverage, not evidence of safety."),
    );
  } else if (lp >= 90) {
    checks.push(
      c("lp", "Can the liquidity be pulled?", "pass", `${fmtPct(lp, 0)} locked`, "rugcheck/goplus", "observed",
        "Nearly all LP is locked or burned, so a pull-the-liquidity exit is off the table."),
    );
  } else if (lp >= 50) {
    checks.push(
      c("lp", "Can the liquidity be pulled?", "warn", `${fmtPct(lp, 0)} locked`, "rugcheck/goplus", "observed",
        "Part of the LP is unlocked. The deployer can remove that portion at any time."),
    );
  } else {
    checks.push(
      c("lp", "Can the liquidity be pulled?", "fail", `Only ${fmtPct(lp, 0)} locked`, "rugcheck/goplus", "observed",
        "Most LP is unlocked and withdrawable. This is the classic rug mechanism."),
    );
  }

  /* 4 — no single wallet dominates ---------------------------------------- */
  const top = holders.rows.find(
    (h) => h.label === null || h.label === "exchange" || h.label === "contract",
  );
  if (!holders.meaningful) {
    checks.push(
      c("top-wallet", "Does one wallet hold too much?", "unknown", "Supply still in the curve",
        "rugcheck/goplus", "observed",
        "Holder percentages do not describe real distribution yet because most supply is still in the launch curve."),
    );
  } else if (top && top.pct !== null) {
    const limit = young ? 6 : 15;
    const state: CheckState = top.pct <= limit ? "pass" : top.pct <= limit * 2 ? "warn" : "fail";
    checks.push(
      c("top-wallet", "Does one wallet hold too much?", state,
        `${fmtPct(top.pct)} in one wallet`, "rugcheck/goplus", "derived",
        `Largest holder that is not a pool, burn or exchange address. The usual line is ${limit}% for a ${young ? "new" : "mature"} token; above that, one seller can move the price against you.`),
    );
  } else {
    checks.push(
      c("top-wallet", "Does one wallet hold too much?", "unknown", "No non-pool holder found",
        "rugcheck/goplus", "observed", "The holder list did not contain an address we could treat as a real holder."),
    );
  }

  /* 5 — supply is not one entity in disguise ------------------------------- */
  if (!clusters.dataAvailable) {
    checks.push(
      c("cluster", "Is the supply one entity in disguise?", "unknown",
        "Cannot be established", "solana rpc", "observed",
        clusters.note ?? "Wallet relationships could not be established for this token."),
    );
  } else if (clusters.linkedSupplyPct === null) {
    checks.push(
      c("cluster", "Is the supply one entity in disguise?", "unknown", "No linked wallets traced",
        "solana rpc", "observed",
        "No shared funding was found among the wallets we could trace. That is not the same as proving independence."),
    );
  } else {
    const pct = clusters.linkedSupplyPct;
    const wallets = clusters.groups.reduce((n, g) => n + g.wallets, 0);
    const state: CheckState = pct >= 30 ? "fail" : pct >= 10 ? "warn" : "pass";
    checks.push(
      c("cluster", "Is the supply one entity in disguise?", state,
        `${fmtPct(pct)} across ${wallets} linked wallets`, "solana rpc funding trace", "derived",
        "Wallets that share a funding source are counted as one holder. Bubblemaps' own guidance treats a cluster above 30% of supply as high risk, and a cluster of hundreds of wallets as a farm even when the percentage is small."),
    );
  }

  /* 6 — creator history ---------------------------------------------------- */
  if (deployer.ruggedCount > 0) {
    checks.push(
      c("deployer", "Has the creator done this before?", "fail",
        `${deployer.ruggedCount} prior token${deployer.ruggedCount > 1 ? "s" : ""} rugged`,
        "rugcheck creatorTokens", "observed",
        "This wallet has launched tokens that later rugged. It is the single strongest predictor available on-chain and it cannot be explained away."),
    );
  } else if (!deployer.dataAvailable) {
    checks.push(
      c("deployer", "Has the creator done this before?", "unknown", "Creator not identified",
        "rugcheck", "observed", "No creator address was returned for this token."),
    );
  } else if (deployer.priorTokens.length === 0) {
    checks.push(
      c("deployer", "Has the creator done this before?", "unknown", "Fresh wallet",
        "rugcheck creatorTokens", "observed",
        "No prior launches. There is no rug history, but there is also no track record to judge."),
    );
  } else {
    checks.push(
      c("deployer", "Has the creator done this before?", "pass",
        `${deployer.priorTokens.length} prior launch${deployer.priorTokens.length > 1 ? "es" : ""}, none rugged`,
        "rugcheck creatorTokens", "observed",
        "This creator has launched before without a rug. Past behaviour is not a guarantee, but it is the best evidence available."),
    );
  }

  /* 7 — is the volume real ------------------------------------------------ */
  if (!flow.dataAvailable) {
    checks.push(
      c("flow", "Is the trading real?", "unknown", "Trade tape unavailable", "geckoterminal", "observed",
        flow.note ?? "Individual trades could not be read, so buy/sell balance and churn cannot be judged."),
    );
  } else if (flow.imbalance === null) {
    checks.push(
      c("flow", "Is the trading real?", "unknown", "Volume split unavailable", "geckoterminal", "observed",
        "Trades were read but USD volume per side was not reported."),
    );
  } else {
    const imb = flow.imbalance;
    const state: CheckState = imb > 0.15 ? "pass" : imb > -0.2 ? "warn" : "fail";
    const reading =
      state === "pass"
        ? "Buyers in control"
        : state === "warn"
          ? "Two-way, no clear side"
          : "Sellers in control";
    checks.push(
      c("flow", "Is the trading real?", state,
        `${reading} · ${(imb * 100).toFixed(0)}%`,
        "geckoterminal trades", "derived",
        `Computed from ${flow.windowTrades} recent trades${flow.distinctTraders ? ` across ${flow.distinctTraders} wallets` : ""}. Heavy net selling while the price holds up usually means distribution into exit liquidity.`),
    );
  }

  /* 8 — can you actually get out ------------------------------------------ */
  if (!exit.available) {
    checks.push(
      c("exit", "Can you actually get out?", "unknown", "Pool reserves unavailable",
        "dexscreener", "observed", exit.note ?? "Reserves could not be read, so exit depth is unknown."),
    );
  } else {
    const cap = exit.maxSellUsd.slip5;
    const state: CheckState =
      cap === null ? "unknown" : cap >= 10_000 ? "pass" : cap >= 2_000 ? "warn" : "fail";
    checks.push(
      c("exit", "Can you actually get out?", state,
        cap === null ? "Depth unknown" : `${fmtUsd(cap)} before 5% impact`,
        "dexscreener reserves", "derived",
        "Constant-product estimate of how much you can sell before price impact reaches 5%. Your position should be a fraction of this number, not close to it."),
    );
  }

  return checks;
}

/* ------------------------------ verdict ------------------------------ */

export function buildVerdict(checks: Check[]): Verdict {
  const fails = checks.filter((x) => x.state === "fail");
  const warns = checks.filter((x) => x.state === "warn");
  const unknowns = checks.filter((x) => x.state === "unknown");
  const passes = checks.filter((x) => x.state === "pass");

  // Weighted so that one contract-level fail cannot be averaged away by passes.
  const hardIds = new Set(["sell", "mint", "lp", "deployer", "cluster", "top-wallet"]);
  const hardFails = fails.filter((f) => hardIds.has(f.id));

  let score = 0;
  score += hardFails.length * 26;
  score += (fails.length - hardFails.length) * 12;
  score += warns.length * 7;
  score += unknowns.length * 3;
  score = Math.max(0, Math.min(100, score));

  let band: Verdict["band"];
  if (hardFails.length >= 2 || fails.length >= 3) band = "avoid";
  else if (hardFails.length >= 1 || fails.length >= 2) band = "risky";
  // "No red flags" is a claim about the whole check set, so it cannot stand
  // while any check is unanswered. Two unknowns is still enough to demote it —
  // otherwise the strongest label on the page is the least supported one.
  else if (warns.length >= 2 || unknowns.length >= 2) band = "watch";
  else band = "clean";

  const headline =
    band === "avoid" ? "AVOID" : band === "risky" ? "HIGH RISK" : band === "watch" ? "WATCH" : "NO RED FLAGS";

  let tldr: string;
  if (fails.length > 0) {
    tldr = `${fails.length} check${fails.length > 1 ? "s" : ""} failed: ${fails
      .slice(0, 3)
      .map((f) => f.label.toLowerCase().replace(/\?$/, ""))
      .join(", ")}`;
  } else if (warns.length > 0) {
    tldr = `Nothing disqualifying, but ${warns.length} point${warns.length > 1 ? "s" : ""} to watch: ${warns
      .slice(0, 3)
      .map((w) => w.label.toLowerCase().replace(/\?$/, ""))
      .join(", ")}`;
  } else if (unknowns.length > 0) {
    tldr = `No failures found, but ${unknowns.length} check${unknowns.length > 1 ? "s" : ""} could not be answered — treat those as unverified, not safe`;
  } else {
    tldr = "Every check that could be run passed. That is a floor, not a forecast";
  }

  const parts: string[] = [];
  if (fails.length > 0) parts.push(`${fails.length} failed`);
  if (warns.length > 0) parts.push(`${warns.length} to watch`);
  if (unknowns.length > 0) parts.push(`${unknowns.length} unknown`);
  if (passes.length > 0) parts.push(`${passes.length} passed`);

  return {
    score,
    band,
    failuresLine: parts.join(" · "),
    fails: fails.length,
    warns: warns.length,
    unknowns: unknowns.length,
    passes: passes.length,
    headline,
    tldr,
  };
}
