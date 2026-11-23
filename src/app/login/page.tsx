import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Panel, Split, Tag } from "@/components/ui";

/* ==================================================================== *
 * ACCOUNT
 *
 * No auth exists yet, so this states that plainly rather than showing a form
 * that cannot work. A login screen that fails on submit is worse than saying
 * what is and is not connected.
 * ==================================================================== */

export const metadata = { title: "Account" };

export default function LoginPage() {
  return (
    <div>
      <PageHead title="Account" note="what is connected, and what is not" right={<Tag tone="neutral">beta</Tag>} />

      <div className="mx-auto max-w-[560px] space-y-2.5 p-3 sm:p-4">
        <Panel title="No account system yet" note="stated instead of a broken form">
          <p className="t-xs leading-relaxed text-fg3">
            Scanning works without an account and always will for the free tier. There is no sign-up,
            no email capture, and no wallet connection in this build — so a form here would be a
            button that does nothing
          </p>
          <div className="mt-2 border-t border-line pt-2">
            <Split label="free scans">3 per day, no account</Split>
            <Split label="account">not built</Split>
            <Split label="wallet connect">not built</Split>
            <Split label="payments">not built</Split>
          </div>
        </Panel>

        <Panel title="What will require an account" note="when it exists">
          <ul className="space-y-1">
            {[
              "Watchlist and saved investigations — they need somewhere to live",
              "Alert rules and delivery",
              "Pro and Group billing",
              "History beyond the current session",
            ].map((t) => (
              <li key={t} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-fg4" />
                <span className="t-xs leading-relaxed text-fg3">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Meanwhile" note="everything that works right now">
          <div className="flex flex-wrap gap-1.5">
            <Link
              href="/"
              className="bg-acid px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-bg hover:bg-acid2"
            >
              scan a token
            </Link>
            <Link
              href="/discover"
              className="border border-line px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-fg3 hover:border-line2 hover:text-fg"
            >
              discover
            </Link>
            <Link
              href="/pricing"
              className="border border-line px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-fg3 hover:border-line2 hover:text-fg"
            >
              plans
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
