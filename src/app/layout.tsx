import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { ToastProvider } from "@/components/feedback";

const grotesk = Inter({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
});

/* A geometric grotesque for display only. Its flat terminals and tight
   apertures are what make a 46px headline read as machined rather than
   typeset — the serif this replaces read as a research note. */
const display = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Meme Checker — on-chain risk intelligence",
    template: "%s · Meme Checker",
  },
  description:
    "Paste a contract address and get eight evidence-backed checks in the order that matters: can you sell, is the supply fixed, is one wallet holding the float, has this deployer done it before",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-ink-950 font-sans text-[13.5px] antialiased">
        <ToastProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-brand-500 focus:px-3 focus:py-1.5 focus:text-[12px] focus:font-semibold focus:text-ink-950"
          >
            Skip to content
          </a>
          <Shell>{children}</Shell>
        </ToastProvider>
      </body>
    </html>
  );
}
