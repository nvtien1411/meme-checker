import type { Metadata } from "next";
import { CallersClient } from "./CallersClient";

export const metadata: Metadata = {
  title: "Alpha Calls — Meme Checker",
  description:
    "Who is calling tokens, what happened after, and whether the caller made money from their own audience",
};

export default function CallersPage() {
  return <CallersClient />;
}
