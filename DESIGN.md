# Design system & handoff

Deliverables from the brief (§10), implemented in code rather than Figma — the
screens, states and components below are live in this repo.

## 1. Visual direction

Dark-first, data-dense, one accent. The reference set (Bubblemaps, DexScreener,
Nero-X, Spectre) all share a trait worth copying and a trait worth rejecting:
they put a lot of numbers on one screen (good), and they decorate those numbers
with gradients and glass (bad). This build keeps the density and drops the
decoration.

Deliberate constraints:

- **No gradients, no glow, no shadows.** Hierarchy comes from type weight, spacing
  and hairlines.
- **One accent colour** (`brand-500`, sky). Red/amber/green carry state only.
- **Tabular numerals everywhere** a number can change. `.tnum`.
- **4px radius**, 1px borders, no cards-in-cards.
- **Uppercase micro-labels** at 9.5–11px for section headers and sources, never for
  body copy.

## 2. Tokens

```
ink-950  #07080a   page background
ink-900  #0a0c0f   panel background
ink-850  #0e1116   inset / hover
ink-800  #131820   skeleton base
ink-700  #1e252f   borders (the only border colour used)
ink-600  #2a323e   control borders

mute-500 #6b7686   tertiary text, sources
mute-400 #8b95a4   secondary text
mute-300 #a8b2c0   body text

brand-500 #0ea5e9  accent, primary action
ok-500    #34d399  pass
warn-500  #fbbf24  watch
bad-500   #fb7185  fail
orange-400 #fb923c high risk (distinct from watch)
```

Type scale: 9.5 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13.5 / 17 / 22 / 34 px.
Body copy never exceeds 62ch.

## 3. Components

**Primitives** — `src/components/ui.tsx`
`Panel` · `Stat` · `Badge` · `Copyable` · `Empty` · `Skeleton` · `Tooltip` ·
`QualityTag`

**Domain** — `src/components/report.tsx`
`VerdictBanner` · `CheckList` · `HolderTable` · `NarrativePanel` · `ProjectPanel` ·
`ExitPanel` · `FlowPanel` · `DeployerPanel` · `ProvenancePanel`

**Input** — `src/components/SearchBar.tsx`

## 4. States implemented

The brief required ten states; these are all present:

| State | Where |
|---|---|
| Default | every screen |
| Hover | rows, tabs, links, table rows |
| Focus | `:focus-visible` ring on all interactive elements |
| Loading | `skeleton.tsx` — result skeleton with pulsing status line |
| Empty | holders with no data, project with no links, narrative with no match |
| Error | invalid CA, wrong chain, API failure, token not found |
| Disabled | submit during request, pricing CTAs for unbuilt tiers |
| Success | verdict banner, copy-to-clipboard confirmation |
| Premium locked | result sidebar note — explicitly *not* implemented |
| Mobile | 390px, single column, compact tables |

Partial-data case (the one the brief called out specifically): a report with
market data but no holders renders the holder panel as an explained empty state,
and the concentration checks show `unknown` — they do not silently pass.

## 5. Data honesty rules (enforced in code)

1. `null` renders as `—` or `unknown`, never `0`.
2. Every check carries `quality`: `observed` / `derived` / `inferred`, rendered as
   a tag next to its source.
3. `unknown` is excluded from the score and demotes the verdict band.
4. Holder labels require a stated basis (`labelBasis`) from the provider; no
   guessed dev/insider/smart-money tags.
5. Narrative is labelled `inferred — not a measurement` with its method named.
6. A 24h change on a token younger than 24h is labelled "since launch".
7. FDV is never presented as market cap; the label follows the number.
8. A failed lookup renders "not a verdict" copy, not an empty report.

## 6. User flow

```
Landing ──paste CA──▶ validate locally ──▶ POST /api/analyze
                          │                      │
                    invalid / wrong chain        │
                          ▼                      ▼
                   inline error        resolve chain → /token/[chain]/[address]
                                                     │
                                            verdict → checks → holders
                                                     │
                                            pricing / login / dashboard
```

Chain resolution order: DexScreener pairs → explicit chain if chosen → search
endpoint → GeckoTerminal pool probe. A chain with no pair returns an explicit
error rather than a fabricated token on that chain.

## 7. Responsive rules

- Breakpoints: 390 (phone) and 1280 (desktop), plus a 640/1024 middle.
- Every grid declares `grid-cols-1` explicitly — a bare `grid` creates an
  auto-sized track that grows to its widest child and breaks the viewport.
- Holder table drops Balance and Tag below `sm` rather than scrolling
  horizontally; comparing a share to an off-screen balance is not usable.
- The verdict tldr takes full width on mobile before the counter chips.

## 8. What the frontend team still needs

| Item | Status |
|---|---|
| API contract | Live — `POST /api/analyze` returns `AnalysisResult` (see `src/lib/types.ts`) |
| Auth | Not built. `/login` validates and says it is not wired |
| Billing | Not built. Pricing is copy only |
| Telegram bot | Separate surface, shares `analyzeToken` |
| Wallet cluster graph | Data shape defined (`ClusterAnalysis`), trace not implemented |
| KOL / social | Needs an X API key; nothing stubbed |

`analyzeToken` in `src/lib/analyze.ts` is the single entry point. The Telegram bot
should import it directly rather than going through HTTP.
