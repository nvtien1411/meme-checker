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

      <div className="mx-auto max-w-5xl space-y-4 p-3 sm:p-4">
        <Panel title="No account system yet" note="stated instead of a broken form" className="mx-auto max-w-2xl">
          <p className="text-sm leading-relaxed text-fg3">
            Scanning works without an account and always will for the free tier. There is no sign-up,
            no email capture, and no wallet connection in this build — so a form here would be a
            button that does nothing
          </p>
          <div className="mt-3 border-t border-line pt-2 sm:grid sm:grid-cols-2 sm:gap-x-5">
            <Split label="free scans" mono={false}>3 per day, no account</Split>
            <Split label="account" mono={false}>not built</Split>
            <Split label="wallet connect" mono={false}>not built</Split>
            <Split label="payments" mono={false}>not built</Split>
          </div>
        </Panel>

        <div className="grid gap-3 md:grid-cols-2">
        <Panel title="What will require an account" note="when it exists" className="h-full">
          <ul className="space-y-2">
            {[
              "Watchlist and saved investigations — they need somewhere to live",
              "Alert rules and delivery",
              "Pro and Group billing",
              "History beyond the current session",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span aria-hidden className="mt-[7px] h-[4px] w-[4px] shrink-0 bg-fg4" />
                <span className="text-sm leading-relaxed text-fg3">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Meanwhile" note="everything that works right now" className="h-full">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center bg-acid px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-bg transition-colors hover:bg-acid2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
            >
              scan a token
            </Link>
            <Link
              href="/discover"
              className="inline-flex min-h-11 items-center justify-center border border-line px-3 font-mono text-[10px] uppercase tracking-[0.06em] text-fg3 transition-colors hover:border-line2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
            >
              discover
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-11 items-center justify-center border border-line px-3 font-mono text-[10px] uppercase tracking-[0.06em] text-fg3 transition-colors hover:border-line2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
            >
              plans
            </Link>
          </div>
        </Panel>
        </div>
      </div>
    </div>
  );
}
