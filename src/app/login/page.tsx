"use client";

import Link from "next/link";
import { useState } from "react";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "sent">("idle");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && password.length >= 8;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    // Accounts are not wired yet. Saying so is better than a fake success.
    setTimeout(() => setStatus("sent"), 600);
  }

  return (
    <div className="mx-auto w-full max-w-[400px] px-4 py-12 sm:px-6">
      <h1 className="t-display text-slate-50">
        {mode === "login" ? "Log in" : "Create an account"}
      </h1>
      <p className="mt-1.5 t-body leading-relaxed text-mute-400">
        Accounts exist to save your check history. Every check runs without one.
      </p>

      <div className="mt-5 flex border border-ink-700 p-0.5">
        {(["login", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setStatus("idle");
            }}
            className={`flex-1 rounded px-2 py-1.5 t-small font-medium transition ${
              mode === m ? "bg-ink-800 text-slate-100" : "text-mute-400 hover:text-slate-200"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <div>
          <label htmlFor="email" className="block t-meta  text-mute-500">
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
            className="mt-1 w-full rounded border border-ink-700 bg-ink-900 px-2.5 py-2 t-body text-slate-200 outline-none transition placeholder:text-mute-500 focus:border-brand-600/70"
          />
          {email && !emailValid && (
            <p className="mt-1 t-meta text-bad-500">That does not look like an email address.</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block t-meta  text-mute-500">
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
            className="mt-1 w-full rounded border border-ink-700 bg-ink-900 px-2.5 py-2 t-body text-slate-200 outline-none transition placeholder:text-mute-500 focus:border-brand-600/70"
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
          className={`w-full rounded px-3 py-2 t-body font-semibold transition ${
            canSubmit && status !== "submitting"
              ? "bg-brand-500 text-ink-950 hover:bg-brand-400"
              : "cursor-not-allowed bg-ink-800 text-mute-500"
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
        <div className="mt-3 rounded border border-warn-600/50 bg-warn-600/8 px-2.5 py-2">
          <p className="t-small leading-relaxed text-warn-500">
            Accounts are not live yet — this form does not create anything or store
            your input. You have been added to the launch waitlist in the UI only.
          </p>
        </div>
      )}

      <p className="mt-4 border-t border-ink-800 pt-3 t-meta leading-relaxed text-mute-500">
        Wallet login is planned for a later version and is not implemented. We will
        never ask for a seed phrase or a private key — anyone who does is not us.
      </p>

      <p className="mt-3 t-small text-mute-400">
        Just want to check a token?{" "}
        <Link href="/check" className="text-brand-400 underline decoration-dotted underline-offset-2">
          Skip the account
        </Link>
      </p>
    </div>
  );
}
