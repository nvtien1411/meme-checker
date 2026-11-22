import type { Check, CheckState } from "./types";

/* Ordering and counting are pure functions on data, so they live outside the
   client bundle. Putting them in a "use client" module made them callable only
   from the client, which broke the server-rendered sample on the landing page. */

const RANK: Record<CheckState, number> = { fail: 0, warn: 1, unknown: 2, pass: 3 };

export function sortBySeverity(checks: Check[]): Check[] {
  return [...checks].sort((a, b) => RANK[a.state] - RANK[b.state]);
}

export function countStates(checks: Check[]) {
  return {
    fail: checks.filter((c) => c.state === "fail").length,
    warn: checks.filter((c) => c.state === "warn").length,
    unknown: checks.filter((c) => c.state === "unknown").length,
    pass: checks.filter((c) => c.state === "pass").length,
  };
}

export const STATE_META = {
  fail: { word: "fail", color: "#ff2d55", text: "text-bad-400" },
  warn: { word: "watch", color: "#ffb020", text: "text-warn-400" },
  unknown: { word: "unknown", color: "#52525f", text: "text-mute-500" },
  pass: { word: "pass", color: "#1fd1a0", text: "text-ok-400" },
} as const;
