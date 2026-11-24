"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useViewer } from "@/lib/viewer";
import { PLAN, readScansUsed } from "@/lib/plan";

/* ==================================================================== *
 * SHELL — left rail + top context bar
 *
 * A rail, not a top bar. v3 tried a top bar and it was the wrong call for a
 * product with nine workspaces: nine labels do not fit across a laptop, so
 * they collapse into a menu and every destination costs two clicks.
 *
 * The rail is a single vertical list; every destination is one click and the
 * labels stay readable. It collapses to glyphs on demand and becomes a drawer
 * under 900px.
 *
 * There is no marketing header. The product opens on the scanner, because a
 * tool nobody reads does not need an introduction.
 * ==================================================================== */

type NavItem = { href: string; label: string; glyph: ReactNode; badge?: string; group: string };

function G({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="navi-glyph h-[13px] w-[13px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const NAV: NavItem[] = [
  { group: "Trade", href: "/", label: "Token Scan", glyph: <G d="M2 8h3l2-4 2 8 2-4h3" /> },
  { group: "Trade", href: "/discover", label: "Trending", glyph: <G d="M8 2.5 9.7 6.3 14 7l-3 3 .7 4.2L8 12.4 4.3 14.2 5 10 2 7l4.3-.7z" /> },
  { group: "Trade", href: "/compare", label: "Compare", glyph: <G d="M3 3v10M13 3v10M3 8h10M6.5 5.5 3 8l3.5 2.5M9.5 5.5 13 8l-3.5 2.5" /> },

  { group: "On-chain", href: "/wallets", label: "Wallet Tracker", glyph: <G d="M2.5 4.5h11v8h-11zM2.5 7h11M10.5 9.5h1.5" /> },
  { group: "On-chain", href: "/callers", label: "Alpha Calls", glyph: <G d="M6 7a2.2 2.2 0 1 0 0-4.4A2.2 2.2 0 0 0 6 7zM2 13c0-2 1.8-3.2 4-3.2s4 1.2 4 3.2M11 8.4a1.8 1.8 0 1 0 0-3.6M11.5 13c0-1.6-.6-2.6-1.5-3.2" /> },
  { group: "On-chain", href: "/smart-followers", label: "Smart Money", glyph: <G d="M2.5 12.5c1.5-2.5 3.5-4 5.5-4s4 1.5 5.5 4M8 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />, badge: "VIP" },
  { group: "On-chain", href: "/narratives", label: "Meta Radar", glyph: <G d="M3 3.5h10v7h-5l-3 2.5v-2.5H3z" /> },
  { group: "On-chain", href: "/deployers", label: "Deployers", glyph: <G d="M8 2.5 13 5v3.5c0 2.5-2 4-5 5.5-3-1.5-5-3-5-5.5V5z" /> },
  { group: "On-chain", href: "/investigation", label: "Wallet Intel", glyph: <G d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM10.8 10.8 14 14" />, badge: "VIP" },

  { group: "My desk", href: "/watchlist", label: "Watchlist", glyph: <G d="M8 2.5 9.7 6.3 14 7l-3 3 .7 4.2L8 12.4 4.3 14.2 5 10 2 7l4.3-.7z" /> },
  { group: "My desk", href: "/alerts", label: "Alerts", glyph: <G d="M8 2.5a3.5 3.5 0 0 1 3.5 3.5v3l1 2h-9l1-2v-3A3.5 3.5 0 0 1 8 2.5zM6.5 12.5a1.5 1.5 0 0 0 3 0" />, badge: "3" },
  { group: "My desk", href: "/rugs", label: "Rug Archive", glyph: <G d="M3 3h10v10H3zM3 6.5h10M6.5 6.5V13" /> },
  { group: "My desk", href: "/history", label: "Scan History", glyph: <G d="M8 4v4l2.5 1.5M8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" /> },
];

const GROUPS = ["Trade", "On-chain", "My desk"];

function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-[15px] w-[15px] shrink-0" aria-hidden>
      <path
        d="M10 2.4v3.2M10 14.4v3.2M2.4 10h3.2M14.4 10h3.2"
        stroke="currentColor"
        strokeWidth="1.4"
        className="text-fg3"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="4.1" stroke="currentColor" strokeWidth="1.4" fill="none" className="text-fg2" />
      <circle cx="10" cy="10" r="1.35" className="fill-acid" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Rail
 * ------------------------------------------------------------------ */

function RailBody({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  const active = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <div className={`flex h-12 shrink-0 items-center border-b border-line ${collapsed ? "justify-center px-0" : "px-3"}`}>
        <Link href="/" className="flex items-center gap-2" aria-label="Meme Checker">
          <Mark />
          {!collapsed && (
            <span className="flex min-w-0 flex-col leading-none">
              <span
                className="truncate text-[12.5px] font-semibold tracking-[-0.015em] text-fg"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Meme Checker
              </span>
              <span className="mt-[3px] font-mono text-[8px] uppercase tracking-[0.17em] text-fg4">
                intel terminal
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2">
        {GROUPS.map((g) => (
          <div key={g} className="mb-3 last:mb-0">
            {!collapsed && <div className="px-2 pb-1 t-eyebrow">{g}</div>}
            <ul className="space-y-[1px]">
              {NAV.filter((n) => n.group === g).map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active(n.href) ? "page" : undefined}
                    title={collapsed ? n.label : undefined}
                    className={`navi ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    {n.glyph}
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{n.label}</span>}
                    {!collapsed && n.badge === "VIP" && (
                      <span
                        className="ml-auto flex shrink-0 items-center gap-1 self-center"
                        title="Requires Pro"
                      >
                        <svg viewBox="0 0 10 10" className="h-[7px] w-[7px] text-acid/80" aria-hidden fill="none">
                          <rect x="2" y="4.5" width="6" height="4.5" stroke="currentColor" strokeWidth="1" />
                          <path d="M3.2 4.5V3.2a1.8 1.8 0 0 1 3.6 0v1.3" stroke="currentColor" strokeWidth="1" />
                        </svg>
                        <span className="font-mono text-[8px] uppercase leading-none tracking-[0.07em] text-acid/80">
                          pro
                        </span>
                      </span>
                    )}
                    {!collapsed && n.badge && n.badge !== "VIP" && (
                      <span className="shrink-0 self-center font-mono text-[8.5px] uppercase leading-none tracking-[0.06em] text-fg4">
                        {n.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

function RailFoot({ collapsed }: { collapsed: boolean }) {
  // The rail is navigation. A plan card here competes with the list the reader
  // came for, and a price box in a fixed column is the first thing to become
  // furniture. Membership and the upgrade path live in the global strip, which
  // is reachable from every page without occupying the workspace.
  const { pro, toggle } = useViewer();

  return (
    <div className="shrink-0 border-t border-line p-1.5">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={pro}
        title={pro ? "Pro preview on - click for the free view" : "Preview the paid layer"}
        className={"navi w-full " + (collapsed ? "justify-center px-0" : "")}
      >
        <span aria-hidden className={"h-[5px] w-[5px] shrink-0 " + (pro ? "bg-acid" : "bg-fg4")} />
        {!collapsed && (
          <span className="min-w-0 flex-1 text-left font-mono text-[9.5px] uppercase tracking-[0.06em]">
            {pro ? "pro preview \u00b7 on" : "preview pro"}
          </span>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * TopStrip - the global membership + upgrade entry point.
 *
 * A HUD row, not a banner. It states where you are on the left and what your
 * tier is on the right, and it is the only upgrade control in the chrome.
 * Everything else the product says about Pro is attached to a finding.
 * ------------------------------------------------------------------ */

function TopStrip() {
  const pathname = usePathname() ?? "";
  const { pro } = useViewer();
  const [used, setUsed] = useState<number | null>(null);

  useEffect(() => {
    const read = () => setUsed(readScansUsed());
    read();
    window.addEventListener("mc:quota", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("mc:quota", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const crumb =
    pathname === "/"
      ? "token scan"
      : pathname.replace(/^\//, "").split("/").slice(0, 2).join(" / ");

  const limit = PLAN.free.scansPerDay;
  const left = used === null ? null : Math.max(0, limit - used);
  const spent = used !== null && used >= limit;

  return (
    <div className="sticky top-0 z-20 hidden h-9 items-center gap-3 border-b border-line bg-bg/92 px-4 backdrop-blur-sm lg:flex">
      <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-fg4">
        {crumb}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {pro ? (
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 border border-acid/35 px-2 py-[3px] transition-colors hover:bg-acid/10"
          >
            <span aria-hidden className="h-[4px] w-[4px] bg-acid" />
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-acid">
              pro preview
            </span>
            <span className="font-mono text-[9px] text-acid/60">unlimited</span>
          </Link>
        ) : (
          <>
            <span
              className="flex items-center gap-1"
              title={left === null ? limit + " scans a day on free" : left + " of " + limit + " scans left today"}
            >
              <span className="flex gap-[2px]" aria-hidden>
                {Array.from({ length: limit }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      "h-[3px] w-[5px] " +
                      (left !== null && i < limit - left ? "bg-fg4/35" : spent ? "bg-warn" : "bg-fg3/70")
                    }
                  />
                ))}
              </span>
              <span className="font-mono text-[9px] tabular-nums text-fg4">
                {left === null ? limit + " scans" : spent ? "none left" : left + " left"}
              </span>
            </span>

            <Link
              href="/pricing"
              className="group flex items-center gap-1.5 border border-line px-2 py-[3px] transition-colors hover:border-acid/45 hover:bg-acid/[0.06]"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-fg3 group-hover:text-fg2">
                free
              </span>
              <span aria-hidden className="h-2.5 w-px bg-line" />
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-acid">
                upgrade
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* The only component that reads the route. Suspending it alone keeps page
   content out of the boundary — next.config has cacheComponents on. */
function RailBodyIsland({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname() ?? "";
  return <RailBody pathname={pathname} collapsed={collapsed} />;
}

function RailBodySkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="min-w-0 flex-1" aria-hidden>
      <div className="h-12 border-b border-line" style={{ opacity: 0.4 }} />
      <div className="min-h-0 flex-1" />
      {collapsed ? null : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Mobile drawer
 * ------------------------------------------------------------------ */

function DrawerIsland({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname() ?? "";
  return (
    <div onClick={onNavigate}>
      <RailBody pathname={pathname} collapsed={false} />
    </div>
  );
}

function MobilePlanChip() {
  const { pro } = useViewer();
  return (
    <Link
      href="/pricing"
      className={`ml-auto flex items-center gap-1 border px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.07em] ${
        pro ? "border-acid/40 text-acid" : "border-line text-fg3"
      }`}
    >
      <span aria-hidden className={`h-[4px] w-[4px] ${pro ? "bg-acid" : "bg-fg4"}`} />
      <span className={pro ? "text-acid" : "text-fg4"}>{pro ? "pro" : "free"}</span>
      {!pro && (
        <>
          <span aria-hidden className="text-line2">
            ·
          </span>
          <span className="text-acid">upgrade</span>
        </>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * Shell
 * ------------------------------------------------------------------ */

export function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  return (
    <div className="flex min-h-dvh">
      <aside
        className="rail hidden shrink-0 flex-col lg:flex"
        style={{ width: collapsed ? "var(--rail-collapsed)" : "var(--rail)" }}
      >
        <Suspense fallback={<RailBodySkeleton collapsed={collapsed} />}>
          <RailBodyIsland collapsed={collapsed} />
        </Suspense>
        {/* Outside the boundary on purpose: this subscribes to the viewer
            store, and a store subscriber inside a suspended subtree never
            receives updates after hydration. */}
        <RailFoot collapsed={collapsed} />
      </aside>

      {/* collapse control sits on the rail edge, not in a toolbar */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        className="fixed bottom-3 z-30 hidden h-6 w-6 place-items-center border border-line bg-surf text-fg4 transition-colors hover:border-line2 hover:text-fg lg:grid"
        style={{ left: collapsed ? "calc(var(--rail-collapsed) + 6px)" : "calc(var(--rail) - 30px)" }}
      >
        <span aria-hidden className="font-mono text-[10px]">
          {collapsed ? "›" : "‹"}
        </span>
      </button>

      {/* mobile bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 border-b border-line bg-bg/95 px-3 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open navigation"
          aria-expanded={drawer}
          className="grid h-7 w-7 place-items-center border border-line text-fg3"
        >
          <svg viewBox="0 0 14 14" className="h-3 w-3" aria-hidden>
            <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Mark />
          <span
            className="text-[12.5px] font-semibold tracking-[-0.015em] text-fg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Meme Checker
          </span>
        </Link>
        <MobilePlanChip />
      </div>

      {/* drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
          />
          <div
            ref={drawerRef}
            id="mobile-nav"
            className="absolute inset-y-0 left-0 flex w-[240px] flex-col border-r border-line bg-bg"
          >
            <Suspense fallback={<div className="h-12 border-b border-line" />}>
              <DrawerIsland onNavigate={() => setDrawer(false)} />
            </Suspense>
            <RailFoot collapsed={false} />
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 flex-1 pt-12 lg:pt-0">
        <TopStrip />
        {children}
      </main>
    </div>
  );
}

export function PageHead({
  title,
  note,
  right,
  children,
}: {
  title: string;
  note?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line px-3 py-2.5 sm:px-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="t-section text-fg">{title}</h1>
        {note && <span className="t-xs text-fg4">{note}</span>}
        {right && <div className="ml-auto flex items-center gap-1.5">{right}</div>}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
