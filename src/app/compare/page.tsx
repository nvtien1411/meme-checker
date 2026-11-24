import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareClient } from "./CompareClient";

export const metadata: Metadata = {
  title: "Compare",
  description: "Any three tokens, the same questions side by side",
};

export default function ComparePage() {
  // useSearchParams needs a Suspense boundary or the whole route opts out of
  // static rendering; the fallback is the same shape as the real header.
  return (
    <Suspense
      fallback={
        <div className="border-b border-line px-3 py-2.5 sm:px-4">
          <h1 className="t-section text-fg">Compare</h1>
          <span className="t-xs text-fg4">loading selectors…</span>
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
