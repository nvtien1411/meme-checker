# Design system & handoff

Deliverables from the brief (§10), implemented in code rather than Figma — the
screens, states and components below are live in this repo.

## 1. Visual direction

Dark-first, data-dense, one accent. The reference set (Bubblemaps, Arkham,
DexScreener, Nansen) shares a trait worth copying and a trait worth rejecting:
they put a lot of numbers on one screen (good), and they decorate those numbers
with gradients and glass (bad). This build keeps the density and drops the
decoration.

Deliberate constraints:

- **No gradients, no glow, no shadows.** Hierarchy comes from type weight, spacing
  and hairlines.
- **Ink, not black.** Surfaces are blue-tinted `#07080a`–`#1a1f28`, so a dark UI
  reads as material rather than as a terminal demo.
- **One accent colour** (`brand-500`, sky). Red/amber/green carry state only and
  never appear on anything clickable — that separation is what keeps a dense
  screen scannable.
- **Tabular numerals everywhere** a number can change (`.tnum`).
- **4px radius**, 1px borders, no cards-in-cards.
- **Uppercase micro-labels** for section headers and sources, never for body copy.

## 2. Tokens

```
ink-950  #08090c   page background
ink-900  #0b0d11   panel background
ink-850  #0f1217   inset / hover
ink-800  #14181f   skeleton base
ink-750  #191e27   panel dividers
ink-700  #1f2530   borders (the only border colour used)
ink-650  #262e3a   control borders
ink-600  #2f3846   quiet marks
ink-500  #3d4757   inert / disabled

mute-600 #7d8794   sources, captions, column heads
mute-500 #98a2b0   tertiary text
mute-400 #b6bfcb   secondary text
mute-300 #cdd5e0   body text

lit-50   #f8fafc   headings
lit-100  #f1f5f9   primary text
lit-200  #e2e8f0   primary text on panels

brand-300 #7dd3fc  accent, on-accent text
brand-400 #38bdf8  accent hover
brand-500 #0ea5e9  accent, primary action
brand-600 #0284c7  accent border
brand-700 #0369a1  accent border, quiet

ok-400    #34d399  pass text
ok-500    #10b981  pass mark
ok-600    #059669  pass border
warn-400  #fbbf24  caution text
warn-500  #f59e0b  caution mark
warn-600  #d97706  caution border
risk-400  #fb923c  high-risk text
risk-500  #f97316  high-risk mark
risk-600  #ea580c  high-risk border
bad-400   #fb7185  fail text
bad-500   #f43f5e  fail mark
bad-600   #e11d48  fail border
```

Four text tiers, not one: `lit` is primary, `mute` is secondary, and the state
ramps carry status. Every colour used anywhere in the app is declared in
`@theme` — an earlier build mixed Tailwind's default `slate-*` and `orange-400`
with these tokens, which is how a palette drifts one component at a time.

Contrast is measured, not eyeballed. The lowest ratio anywhere on a rendered
report is **5.47:1** (`mute-600` on `ink-950`), and every tier clears 4.5:1 on
all four surfaces. The first version of this ramp bottomed out at 3.06:1, which
is below AA — and it was the tier carrying sources and provenance, the thing
this product claims to be careful about.

Type scale is six steps, each at least 1px apart:

```
t-hero        30 / 1.06 / 600   once per page
t-display     21 / 1.15 / 600   page title
t-title       15 / 1.35 / 600   section or card title
t-body        13 / 1.55 / 400   body copy
t-body-strong 13 / 1.45 / 500   emphasised body
t-small       12 / 1.50 / 400   secondary
t-meta        11 / 1.40 / 400   sources, units, captions
t-label       10 / 1.30 / 500   uppercase eyebrows and column heads only
```

Twenty-two font-size/weight combinations were in the first build, six of them
differing by half a pixel — invisible, and it read as sloppy rather than dense.
Weight is capped at 600 because bold at 11px on dark smears. Body copy never
exceeds 62ch.

## 3. Components

**Primitives** — `src/components/ui.tsx`
`Panel` · `Metric` · `QualityDot` · `Tag` · `Tip`

**Visualisation** — `src/components/viz.tsx`
`RiskRing` · `CheckStrip` · `ConcentrationBar` · `CoverageMeter` · `ExitLadder` ·
`FlowBalance` · `HolderBars` · `sortBySeverity` · `STATE_TEXT`

**Report** — `src/components/report.tsx`
`VerdictHeader` · `CheckList` · `HolderPanel` · `ExitPanel` · `FlowPanel` ·
`NarrativePanel` · `ProjectPanel` · `CreatorPanel` · `ProvenancePanel` ·
`PremiumPreview`

**Chrome** — `SearchBar` · `SectionNav` · `SiteHeader` · `SiteFooter` ·
`HeroReport` (live sample on the landing page) · `feedback.tsx`
(`ToastProvider`, `useToast`, `CopyButton`, `ConfirmButton`, `Empty`)

## 4. States implemented

The brief required ten states; these are all present:

- **Default** — every screen
- **Hover** — rows, tabs, links, table rows
- **Focus** — `:focus-visible` ring on all interactive elements
- **Loading** — `skeleton.tsx` is layout-matched to the real report; the landing
  page streams its sample card behind its own `HeroReportSkeleton`
- **Empty** — holders with no data, project with no links, narrative with no match
- **Error** — invalid CA, wrong chain, upstream failure, token not found
- **Disabled** — submit during request, login before the form validates
- **Success** — copy-to-clipboard confirmation toast, verdict band
- **Unbuilt-feature** — pricing tiers and premium panels say `not built`; they do
  not show a padlock, because a padlock claims something exists to be withheld
- **Mobile** — 390px, single column, compact tables

Partial-data case (the one the brief called out specifically): a report with
market data but no holders renders the holder panel as an explained empty state,
and the concentration checks show `unknown` — they do not silently pass.

## 5. Data honesty rules (enforced in code)

1. `null` renders as `—` or `unknown`, never `0`.
2. Every check carries `quality`: `observed` / `derived` / `inferred`, rendered as
   a tag next to its source.
3. `unknown` is excluded from the score and demotes the verdict band. It is never
   counted as a pass.
4. `failuresLine` always accounts for all eight checks — the passed count is
   included, so the header cannot disagree with the strip below it.
5. Holder labels require a stated basis from the provider; no guessed
   dev/insider/smart-money tags.
6. Narrative is labelled `inferred — not a measurement` with its method named.
7. A 24h change on a token younger than 24h is labelled "since launch".
8. FDV is never presented as market cap; the label follows the number.
9. A failed lookup renders "not a verdict" copy, not an empty report.
10. The landing page's sample card runs the real pipeline. If a source fails it
    says so — a hard-coded screenshot would be the one element on the page that
    could not be trusted, on a product whose premise is not making things up.

## 6. Scoring model

Six checks are gates: `sell`, `mint`, `lp`, `top-wallet`, `cluster`, `deployer`.
Two are signals: `flow`, `exit`.

- gate failure +26, signal failure +12, caution +7, unknown +3, clamped to 100
- two gate failures, or any three failures → worst band
- one gate failure, or any two failures → high risk
- two cautions or two unknowns → watch (so the strongest label cannot stand on
  the least evidence)
- otherwise → no red flags

`exit` is deliberately a signal rather than a gate: thin liquidity is a market
condition, not a contract defect, and a token can be hard to exit without anyone
having done anything wrong.

Correlated checks are collapsed rather than counted separately. `liq`, `liq_cov`
and `exit` all answer "can you get out?"; scoring them individually triple-counts
one root cause. Top-10 bands are age-dependent (`young = ageH < 720`) because
applying launch-day thresholds to a four-year-old token produces confident
nonsense.

## 7. User flow

```
Landing ──paste CA──▶ validate locally ──▶ resolve chain ──▶ /token/[chain]/[address]
                          │                                        │
                    invalid / wrong chain                    verdict → checks
                          ▼                                        → holders
                   inline error                                    → exit / flow
                                                                   → narrative
                                                                   → project
                                                                   → creator
```

Chain resolution order: DexScreener pairs → explicit chain if chosen → search
endpoint → GeckoTerminal pool probe. A chain with no pair returns an explicit
error rather than a fabricated token on that chain.

## 8. Responsive rules

- Breakpoints: 390 (phone), 640, 1024, 1280 (desktop).
- Every grid declares `grid-cols-1` explicitly — a bare `grid` creates an
  auto-sized track that grows to its widest child and breaks the viewport.
- Two-column layouts use `lg:grid-cols-[minmax(0,1fr)_340px]` so the content
  column can shrink.
- Holder table drops Balance and Tag below `sm` rather than scrolling
  horizontally; comparing a share to an off-screen balance is not usable.
- The verdict tldr takes full width on mobile before the counter chips — as a
  flex sibling of four chips it wrapped one word per line.
- Check rows in the landing sample stack label over reading below `sm`; side by
  side, the longest label truncated to `Is the supply one entity in disg…`.
- Interactive targets are at least 32px tall (example chips, menu button).

Verified: 7 routes × 3 widths (1440 / 1024 / 390) = 21/21 overflow-free.

## 9. What is not built

| Item | Status |
|---|---|
| API contract | Live — `POST /api/analyze` returns `AnalysisResult` (`src/lib/types.ts`) |
| Auth | Not built. `/login` validates input and says it is not wired |
| Billing | Not built. Pricing is copy only, no checkout |
| Telegram bot | Separate surface, shares `analyzeToken` |
| Wallet cluster graph | Data shape defined (`ClusterAnalysis`); visual map not implemented |
| KOL / social | Needs an X API key; nothing stubbed |
| Dashboard history | Layout only, labelled `preview layout` |

`analyzeToken` in `src/lib/analyze.ts` is the single entry point. The Telegram bot
should import it directly rather than going through HTTP.

## 10. Deviation from the brief

The brief ordered the report as Token Overview → Risk Assessment → Holder
Analysis → Project Intelligence → Premium. This build leads with the verdict and
the eight checks, and treats overview data (price, market cap, links) as
supporting evidence in the header and a later section.

The reason: overview-first is DexScreener plus a text box, and nobody opens a
second tab for that. The question a person actually has when pasting a contract
address is "what would cost me money if I buy this", and answering it first is
the only thing that distinguishes this product from the sites it references.
