"use client";

import Link from "next/link";
import { useState } from "react";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && password.length >= 8;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    // Accounts are not wired. Saying so is better than a fake success.
    setTimeout(() => setStatus("sent"), 500);
  }

  return (
    <div className="mx-auto w-full max-w-[392px] px-4 py-14 sm:px-6">
      <h1 className="t-display text-slate-50">
        {mode === "login" ? "Log in" : "Create an account"}
      </h1>
      <p className="mt-1.5 t-small leading-relaxed text-mute-400">
        Accounts exist to save your check history. Every check runs without one.
      </p>

      <div className="mt-5 flex gap-px rounded-[4px] border border-ink-700 bg-ink-800 p-0.5">
        {(["login", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setStatus("idle");
            }}
            className={`flex-1 rounded-[3px] px-2 py-1.5 t-small font-medium transition ${
              mode === m ? "bg-ink-750 text-slate-100" : "text-mute-500 hover:text-slate-200"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
        <div>
          <label htmlFor="email" className="block t-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus("idle");
            }}
            autoComplete="email"
            placeholder="you@domain.com"
            className="mt-1.5 w-full rounded-[3px] border border-ink-700 bg-ink-900 px-3 py-2 t-small text-slate-200 outline-none transition placeholder:text-mute-600 focus:border-brand-600"
          />
          {email && !emailValid && (
            <p className="mt-1 t-meta text-bad-400">That does not look like an email address.</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block t-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setStatus("idle");
            }}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="At least 8 characters"
            className="mt-1.5 w-full rounded-[3px] border border-ink-700 bg-ink-900 px-3 py-2 t-small text-slate-200 outline-none transition placeholder:text-mute-600 focus:border-brand-600"
          />
          {password.length > 0 && password.length < 8 && (
            <p className="mt-1 t-meta text-mute-500">
              {8 - password.length} more character{8 - password.length === 1 ? "" : "s"} needed.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit || status === "submitting"}
          className={`w-full rounded-[3px] px-3 py-2 t-small font-semibold transition ${
            canSubmit && status !== "submitting"
              ? "bg-brand-500 text-ink-950 hover:bg-brand-400"
              : "cursor-not-allowed bg-ink-800 text-mute-600"
          }`}
        >
          {status === "submitting"
            ? "Working…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      {status === "sent" && (
        <div className="fade-up mt-3 rounded-[3px] border border-warn-600/45 bg-warn-600/[0.07] px-3 py-2.5">
          <p className="t-meta leading-relaxed text-warn-400">
            Accounts are not live yet — this form does not create anything or
            store your input. Nothing was submitted.
          </p>
        </div>
      )}

      <p className="mt-5 border-t border-ink-800 pt-3.5 t-meta leading-relaxed text-mute-600">
        Wallet login is planned and not implemented. We will never ask for a seed
        phrase or private key — anyone who does is not us.
      </p>

      <p className="mt-3 t-small text-mute-500">
        Just want to check a token?{" "}
        <Link
          href="/check"
          className="text-brand-400 underline decoration-brand-700 decoration-dotted underline-offset-2 hover:text-brand-300"
        >
          Skip the account
        </Link>
      </p>
    </div>
  );
}
