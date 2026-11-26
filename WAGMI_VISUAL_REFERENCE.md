# WAGMI visual reference → Meme Checker mapping

- **Observed:** 26 November 2026, live browser inspection at `https://wagmi.trade/` and `/app`
- **Viewports:** homepage and app desktop at 1440×900; app mobile at 390×844
- **Purpose:** measured reference for visual craft, not a layout or brand to copy

## What was actually inspected

The homepage is a marketing surface with a deep red hero, large editorial headline, restrained yellow CTA, radial lighting and a grain texture. Its measured hero headline uses the system display stack at 108px / 102.6px, weight 700, tracking −5.616px. Body text is 17px / 24.99px with −0.374px tracking. The “Open the app” CTA measured 172×44px, yellow fill, dark text, pill radius, and a restrained shadow.[1]

The product surface is `/app`, a read-only Solana wallet-analysis onboarding screen—not a populated analytics dashboard. At desktop it uses a 228px sidebar and 56px top bar; the centered onboarding composition measured about 560×587px. Its headline is 44px / 46.2px, weight 600, tracking −1.54px. The app canvas is `#F5F5F7`; the central composition is mostly unboxed space rather than a grid of cards.[2]

On mobile at 390×844, `/app` stayed within the viewport and placed seven destinations in a bottom navigation, each about 55×50px. The headline reduced to 32px; the address input and primary action remained 44px high.[2] This is a responsive observation, not a recommendation to copy WAGMI’s navigation model.

## Measured visual specification

### Color

- Canvas: homepage `#FFFFFF`; app `#F5F5F7`.[1][2]
- Ink: `#1D1D1F`; secondary `#6E6E73`; tertiary `#86868B`.[1][2]
- Dividers: `#D2D2D7` and `#E8E8ED`.[1][2]
- Brand/action colors: yellow `#FFC72C`, brighter yellow `#FFD24D`, darker yellow `#F2B200`; red `#DA291C`, brighter red `#E8402F`, darker red `#B71C10`.[1][2]
- The homepage red treatment uses a red gradient, radial highlight and grain. That treatment belongs to WAGMI’s marketing surface; it is not a token to transplant into Meme Checker.[1]

### Typography and hierarchy

- Observed stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Helvetica Neue", Arial, sans-serif`; display adds `"SF Pro Display"` before Inter.[1][2]
- Marketing headline: 108px / 102.6px, 700 weight, strongly negative tracking; product headline: 44px / 46.2px, 600 weight, −1.54px tracking.[1][2]
- App body: 17px; app navigation: 15px, weight 500. The scale separates headline, explanatory copy, and navigation instead of making every label equally prominent.[2]
- Do not infer typography from a loaded font name alone: the computed stack is measured, while the exact locally rendered face can vary by platform.

### Spacing, layout, and radii

- App frame: 228px sidebar, 56px top bar; main content section padding measured at `32px 22px`.[2]
- Sidebar rows: about 40px high at desktop, 10px radius, 12px horizontal inset and 12px icon-to-label gap. Icons measured 20×20px.[2]
- The address group is a single nested control, not two adjacent boxes: 56px outer height, 6px inset, 8px gap, 44px input/action, 99px radius. The app’s centered onboarding content leaves substantial negative space around this action.[2]
- The app’s subtle card shadow is `0 1px 2px rgba(0,0,0,.05), 0 0 0 .5px rgba(0,0,0,.03)`; the main onboarding composition itself has no card fill or border.[2]
- Responsive navigation differs by breakpoint: desktop rail, seven-item mobile bottom navigation. The app remains within 390px at the inspected mobile viewport.[2]

### Controls, icons, and motion

- Homepage primary: 44px high, yellow pill, dark label and restrained shadow. App primary: 44px high, red fill, paired inside the address group. The outer address group uses a subtle inset divider/shadow instead of a heavy visible border.[1][2]
- Sidebar iconography is a consistent, small, 20px line-icon family; navigation rows use a 10px radius and a 150ms background/color transition.[2]
- The app address group declares a 200ms box-shadow transition. The homepage headline uses an opacity/transform reveal (0.8s opacity and 1.05s transform).[1][2]
- Hover transition declarations were inspected, but the actual forced-hover rendering was not captured. Treat timings as measured CSS behavior; do not claim a specific hover color or movement as verified.[1][2]
- WAGMI’s art asset is brand-specific and intentionally excluded from this adaptation.[2]

## Translation into Meme Checker

Meme Checker is a data-dense command/inspect product. Keep its existing route structure and dark terminal identity; borrow WAGMI’s discipline—clear type ladder, measured whitespace, integrated controls, consistent radii, restrained dividers and quiet motion—not its red/yellow palette, logo, artwork, or exact page composition.

| Area | Meme Checker direction |
|---|---|
| Canvas and accent | Keep the existing near-black `#0A0C0F` canvas, four dark surface steps, acid lime `#C6FF43` for interaction, and the existing risk ramp. Use lime as a signal, not decoration. |
| Type | Keep the project’s Inter UI, Space Grotesk display, and JetBrains Mono for addresses/numeric data. Use a clear 40–44px page-title ceiling, readable 14px body text, 12px supporting text, and monospace only for data/technical labels. |
| Spacing | Preserve the 228px desktop rail and 56px desktop top bar already present. Use a consistent 8/12/16/24/32px rhythm; keep panel/table density where it supports comparison. |
| Surfaces | Keep flat terminal surfaces and hairline separators. Standardize general panel/navigation corners around 8–10px; avoid adding card gradients, glass effects, or decorative shadows. |
| Controls | Keep the scanner as one nested action. Give the address group a deliberate 8–10px radius, a 44px action target, a visible keyboard focus state, and adequate mobile hit areas. Keep compact inline table actions compact on desktop. |
| Icons | Retain the existing thin-line icon family and increase only where needed for legibility/tap targets; do not add decorative icon tiles. |
| Motion | Keep existing state-based transitions and reduced-motion behavior. Do not touch Wallet Network graph positioning, simulation, particle timing, or hover rendering. |
| Responsive shell | Preserve the grouped navigation and drawer (the product has more destinations than WAGMI’s seven tabs). Make the mobile header 56px and the menu control at least 44px; verify no document overflow at 390px. |
| Content/data | Preserve labels, route behavior, API contracts, and demo/unknown-data distinctions. This pass is presentation-only. |

## Baseline audit notes

- The project already has a shared dark design system, a 228px rail, 56px desktop header, shared `Panel`/`Button`/`Tag` primitives, and route-level `PageHead` styling. Twenty-one existing routes were opened before editing, including token, wallet, caller, deployer, narrative, watchlist, alerts, history, pricing, FAQ, and login surfaces.
- Baseline mobile homepage at 390×844 had no horizontal overflow. Its menu control measured 28×28px; the small 28px target and the form/panel radius mismatch are the clearest shared presentation refinements.
- Baseline token report and representative wallet/narrative pages rendered at desktop without horizontal overflow. A pre-existing Next.js dev warning was emitted for the token route about `Date.now()` during prerender; it is outside this visual pass and is recorded rather than changed here.

## Sources

[1] https://wagmi.trade — WAGMI homepage, observed live in browser
[2] https://wagmi.trade/app — WAGMI app, observed live in browser
