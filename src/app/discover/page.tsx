import type { Metadata } from "next";
import { DiscoverClient } from "./DiscoverClient";

export const metadata: Metadata = {
  title: "Discover",
  description: "New pairs, trending tokens and risk-weighted discovery across every tracked chain",
};

export default function DiscoverPage() {
  return <DiscoverClient />;
}
