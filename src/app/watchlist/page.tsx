import type { Metadata } from "next";
import { WatchlistClient } from "./WatchlistClient";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Tokens, wallets and deployers saved in this browser",
};

export default function WatchlistPage() {
  return <WatchlistClient />;
}
