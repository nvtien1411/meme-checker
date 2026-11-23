import { ScanProgress } from "@/components/ScanProgress";

/* The route is a server component that fetches from four public APIs. This is
   what Next renders while that request is open — the eight checks in pipeline
   order, advancing only for as long as the server is actually working. */

export default function Loading() {
  return <ScanProgress />;
}
