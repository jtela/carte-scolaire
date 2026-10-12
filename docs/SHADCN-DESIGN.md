# Carte scolaire — shadcn UI design contract

Design-only handoff, 13 October 2026 (CEST). Architect: `t_0f25c05f`; implementation: `t_814ccd31`. This document is the sole change on this card. It supplements, and does not overwrite, the user-owned `docs/ARCHITECTURE.md`. No application implementation, dependency installation, build verification or deployment is claimed here.

## 1. Inspected baseline and non-negotiables

Inspected `src/routes/index.tsx`, `src/styles/app.css`, `src/routes/__root.tsx`, `src/features/map/SectorMap.tsx`, search state, sector repository/types, package/build/TypeScript/Playwright configs, static-preview script, README, all four browser specs and the reducer unit test. Current app: React 19.3.0, Start 1.168.61, Router 1.170.42, Vite 8.3.4, Leaflet 1.9.4. No Tailwind, shadcn components or aliases exist. The root links application CSS then Leaflet CSS through Vite `?url` imports; Start prerenders `/` to `dist/client/index.html` under `/carte-scolaire/`.

Preserve:
- Every existing French sentence, label, placeholder, action, coverage limitation and provenance value. Add short French section headings only where needed; do not replace accurate copy with marketing claims.
- Search parsing, explicit commune disambiguation, request generations, cancellation on edit/submit, stage-specific retries, finite timeouts and map reset. No autocomplete, new API, persistence, automatic first-sector selection or URL-state feature.
- All real snapshots and manifest/licence/source metadata, including Haute-Garonne's unspecified vintage, Paris 2026–2027 and Versailles 2025–2026. Versailles remains indicative, with its road-discordance warning and absence of an explicit licence; no invented Etalab licence or individual assignment promise.
- Existing Leaflet dynamic import, polygon identities/geometries, text-safe popups, pointer/keyboard selection, fit/pan/zoom, ResizeObserver and disposal. Tile failure must not remove polygons.
- Static/base-path configuration and manual publication controls. No dataset refresh, framework upgrades, remote fonts, analytics, commits, publication or credentials changes.

This design deliberately supersedes only the earlier minimal visual styling recommendation: restrained cards and genuine shadcn primitives are now requested, not a dashboard.

## 2. Layout and visual tokens (project decisions)

Light-only civic information interface: pale slate canvas, white surfaces, blue actions, excellent legibility. No gradients, large hero, fictitious seal/logo, decorative map, navigation, theme switch or drawer.

Desktop, at widths >=1024px:

```text
compact header: Secteurs des collèges publics       Couverture partielle
main (maximum width 1100px, including padding)
  search/commune column (~20rem)  |  larger map workspace
    search Card                  |    map Card: title + native sector select
    persistent status/choice     |    keyboard help + warnings
    commune summary Card         |    real map OR honest state placeholder
                                 |    selected-sector details Card (when selected)
  coverage notice and full source/limitation information, always visible
```

Use one `main[data-state]`; header can be inside it. Keep the exact H1. Use explicit semantic headings for search, chosen commune and map workspace, not an assumption that CardTitle renders a heading. The commune heading must retain accessible text such as `Versailles (78646)`. A summary card contains commune name/code, returned sector count and textual partial-coverage badge; it is not a list of individual school assignments. Show all returned sectors in the existing native select, not 110 repeated cards. The selected-sector card is the result detail: all attached collège names, available UAIs and actual school year/unknown-year fallback.

Below 1024px, use a single flowing column in DOM order: compact header, search/status/choice, commune summary, map/select/details, coverage/sources. At mobile widths <=600px, submit and confirmation buttons are full width. Search stays above the map, but keep coverage/limitation text immediately adjacent to the result, not hidden behind a toggle. No fixed-height app shell, nested scrolling, sticky mobile panels or viewport overlays. Header content wraps naturally rather than forcing one line.

- Spacing scale: 4/8/12/16/24/32px. Main padding 24px desktop, 16px mobile; grid gap 24px; card padding 16–20px.
- Body: system sans-serif, 16px/1.5. H1: 24px desktop, 20px mobile, weight 650–700; section headings 18px/1.3, weight 600. Supporting text 14px with readable line height; never shrink labels to fit.
- Surfaces: `--background: #f8fafc`, `--foreground: #0f172a`; card/popover white with foreground matching body. `--muted` and `--secondary: #f1f5f9`; their foregrounds `#475569` and `#0f172a` respectively.
- Accent/actions: `--primary: #1d4ed8`, white primary foreground; hover `#1e40af`; `--accent: #eff6ff`, accent foreground `#1e40af`; `--ring: #1d4ed8`.
- Borders: `--border: #e2e8f0` for surfaces; `--input: #64748b` for discernible controls. `--destructive: #b91c1c`, white destructive foreground where required; error callouts may use a pale red surface with dark red text. Static coverage uses neutral/blue, not emergency red.
- Radius: `--radius: 0.625rem`; small/shallow shadows only. Map framed with rounded corners; attribution and popups remain readable.
- Form/select/button/zoom/close targets: minimum 44px height; map buttons also minimum 44px width. Apply component `className` overrides where default shadcn sizing is smaller. No fixed control height that clips 200% text.
- Map: 100% width, `min-width:0`; retain explicit `height:clamp(320px,65vh,700px)` with the current dvh override. Same minimum-height footprint for non-ready placeholders. All grid tracks/children need `min-width:0`; right track `minmax(0,1fr)`; wrap source URLs/names, do not truncate critical information.
- Keep existing normal/active polygon colours initially: selected stroke weight plus popup/details already distinguish selection beyond hue. Map restyling is optional only if contrast and geometry behaviour remain verified.

Map-first means the map is the largest desktop work surface, not that users must navigate an unexplained map before searching. A stable framed placeholder is preferable to loading tiles or fake boundaries at idle.

## 3. Genuine shadcn/Tailwind integration

Use the existing-project path, not `init -t start` or a new TanStack scaffold. Official installation and TanStack guides distinguish these paths and require Tailwind/aliases first [S1,S2]. Keep the existing package manager and core framework versions.

Decision: Tailwind v4 with its Vite plugin; current manual shadcn `base-nova` family, neutral base, Lucide icons, CSS-variable theming. The manual guide currently uses `base-nova` and the `cn` package [S3]; the separate configuration reference still illustrates `new-york` [S4]. Do not mix legacy Radix/new-york component files with the selected Base family. Record the actual generator version and component provenance in the developer report; no untested package versions are prescribed here.

Implementation sequence:
1. Add `tailwindcss` and `@tailwindcss/vite` as build dependencies [S5]. Extend, never replace, Vite config: `plugins:[tailwindcss(),tanstackStart(existingOptions),react()]`; retain base validation, router basepath, prerender flags and explicit page. Tailwind-before-Start is our integration choice; build verification is mandatory.
2. Configure `@/*` -> `./src/*` in TypeScript `paths`, preserving current compiler options. Resolve `@` in Vite to `fileURLToPath(new URL('./src', import.meta.url))` via `node:url`. Do not blindly add deprecated compiler options from examples; check the installed TypeScript 7 typecheck. No alias plugin is necessary; pure unit tests can retain their relative imports.
3. Create `components.json` using the official manual configuration, adjusted to this project: `style=base-nova`, `rsc=false`, `tsx=true`, `tailwind.config=""`, `tailwind.css="src/styles/app.css"`, `baseColor=neutral`, `cssVariables=true`, empty prefix; aliases `components=@/components`, `ui=@/components/ui`, `utils=@/lib/utils`, `lib=@/lib`, `hooks=@/hooks`; Lucide icon library. Keep its official schema reference. These are generator paths, not network or application routes [S3,S4].
4. Merge official theme/import setup into the existing `app.css`: Tailwind, `tw-animate-css`, and current `shadcn/tailwind.css` imports first; retain the official semantic `@theme inline` mapping and override light root values with section 2 [S3,S6]. Replace old broad input/select/button/form rules with component/layout classes so unlayered legacy CSS does not override utilities or style Leaflet controls accidentally. No Tailwind CDN or parallel v3 config/PostCSS stack.
5. Install current manual dependencies (`shadcn`, `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css`) and dependencies actually requested by the chosen registry components; `shadcn` must remain resolvable for its CSS import. Add `src/lib/utils.ts` re-exporting `cn` as documented [S3]. Do not substitute an incompatible older utility/dependency recipe. Resolve dependencies into `package-lock.json` and verify React 19 compatibility locally.
6. Preview then add only the required official components, in the project directory [S7]:

```sh
npx shadcn@latest add button input label card badge alert separator skeleton native-select --dry-run
npx shadcn@latest add button input label card badge alert separator skeleton native-select
```

   Review changes before accepting them; no overwrite/all-component flags. If CLI detection fails, use the official manual component-source workflow with the same family, imports and dependencies, not handmade lookalikes. Save generated local sources in `src/components/ui/`; record generation date/version, official source URLs and deliberate customizations in `docs/SHADCN-VERIFICATION.md`. Only source provenance plus actual use and compiled styles satisfies the shadcn requirement.

Component mapping:

| Component | Use and semantic constraints |
|---|---|
| Button | Submit `Afficher la carte`; confirmation `Choisir`; outline retries. Set `type="submit"` or `type="button"` explicitly; preserve handlers/ref/focus and disabled choice behaviour. |
| Input + Label | Existing text query field, same id/ref/maxLength/placeholder/validation and edit cancellation; never numeric-only mobile input. |
| NativeSelect + NativeSelectOption | Both `Commune trouvée` and `Secteur`; keep actual HTML select/option, ids/values/native onChange, empty option and ordering. This official primitive retains native mobile/keyboard behaviour [S8]. |
| Card and subcomponents | Search surface, commune summary, map frame, selected-sector details and grouped provenance. No new business state. |
| Badge | Textual partial-coverage/count metadata; not clickable, not a substitute for warnings. |
| Alert and subcomponents | Coverage/limitation, errors and tile/map warnings; explicit role semantics, valid block markup and stage-appropriate retry [S9]. |
| Separator | Quiet division before sources; decorative where the heading already conveys structure. |
| Skeleton | Only actual pending lookup/sector content, hidden from accessibility tree and with reduced-motion pulse disabled. Never pretend to load unsupported coverage. |

No Command/Combobox, custom Select, Sheet, toast system, form framework or data table. They add behaviour and accessibility work without meeting an unmet need.

## 4. State, accessibility and data interfaces

Keep SearchPage the state owner. Presentation may stay in the two existing TSX files; extract only small local presentational helpers if repetition warrants it. Data flow remains:

`input -> parseQuery -> searchCommunes -> explicit choice if needed -> forCommune -> SearchState -> visible cards/status/map`.

Do not alter reducer/adapters/types. `SectorMap` retains its public props `{features:SectorFeature[], bounds:[number,number,number,number], commune:string}` and local `selected`, warnings/retry and map refs. Its own selected-sector Card derives from `features.find(...)`; no second selected-id store or lifted-state synchronization. Preserve `key={state.generation}` so new searches dispose old maps.

Keep one stable `#status[role=status][aria-live=polite]` outside any `aria-busy` subtree, retaining every message from the existing `messages` object (including dynamic count/mapping wording). Input continues to reference it. Do not duplicate announcements by nesting status inside an alert. Use Alert appearance with an explicitly named non-live `role="region"` for static coverage/limitations, `role="note"` for the tile warning, and `role="alert"` for the existing map initialization failure. This avoids adding a second `note` that breaks the current tile-warning test. For lookup/sector errors, keep the authoritative message in the polite status, with visually styled non-live error/retry content; avoid a second competing live message. Verify generated Alert role forwarding rather than trusting defaults.

| State | Visible contract |
|---|---|
| idle | Search + current French instruction; framed `Aucun secteur affiché.` placeholder. No map instance or network data work at boot. |
| invalid | Existing validation text, invalid input border/text association, input focused by existing ref. No stale commune/map/source. |
| searching / loading-sectors | Existing French loading status, small skeleton within reserved result area, `aria-busy` on that area. Search/edit/submit stay usable; no fake percentage. |
| choose-commune | Existing explanation/cap notice + native commune control; Choisir disabled until selected. No premature map or auto-selection. |
| no-match / unavailable / empty | Distinct exact existing messages and no-map placeholder. Never equate missing polygons with no collège; preserve source/limitation data when available. |
| ready | Commune heading/count, real polygons, native sector chooser, keyboard help, relevant limitation/coverage, full provenance. Detail card only on explicit selection. |
| error | Existing stage-specific failure and optional timeout text; explicit Réessayer runs current retry logic. No stale result. |
| tile warning / map error | Tile warning leaves map/polygons usable. Map error retains the select and collège detail access plus Réessayer la carte. |

Every field has a visible associated label. One H1, meaningful heading hierarchy, French document language and keyboard order. Decorative icons `aria-hidden`; text actions remain visible. Aim for >=4.5:1 normal-text contrast and >=3:1 visible control/focus contrast; validate actual colours rather than treating a theme as an accessibility certificate. Use a distinct 2–3px focus indicator plus offset; do not clip it in card wrappers. Honour reduced motion, page zoom and text scaling. No forced focus/scroll after successful search, no placeholder-only labels and no data inserted via HTML strings.

Provenance stays deduplicated by `sourceId` exactly as today. Show publisher/title, school year or fallback, modified date or fallback, retrieved date, licence text/link and existing limitation; all links retain safe new-tab attributes. Keep `.provenance`, `.limitation`, `.details`, `.map`, `#map-help`, field ids and `main[data-state]` hooks where practical to preserve regression assertions.

## 5. CSS/Leaflet and static build pitfalls

Preflight resets typography/borders and constrains images; third-party map styling requires deliberate integration [S10]. Leaflet 1.9.4 already includes pane/tile image and SVG safeguards [S11]. Keep its stylesheet linked separately in the root after application CSS; keep application Leaflet-specific overrides scoped and unlayered so control targets still win. Do not assume link order alone defeats specificity or cascade layers.

Check computed styles of `.leaflet-tile`, overlay SVG, popup, zoom/close controls and attribution after the production build. Tiles must retain their assigned dimensions/position, image max-width must not shrink tiles, overlay geometry must not be constrained by generic `svg` dimensions. If necessary, add narrowly scoped `.leaflet-container .leaflet-tile` and pane image/SVG corrections (not global `img/svg` resets); no Tailwind width/height classes on Leaflet-generated nodes. Preserve current 44px zoom/close rules and popup padding/wrapping. Round/clip only the actual map viewport, not the complete card containing form controls/help; retain map `isolation:isolate` and its real dimensions.

Keep `__root.tsx` application and Leaflet `?url` stylesheet links. Do not paste a Next.js root layout, add duplicate CSS injection, import Leaflet at module evaluation, or change prerender to SPA/SSR deployment. Generated components must render deterministic idle markup and not read window/storage while rendering.

Vite's base and `${import.meta.env.BASE_URL}data/...` stay intact. No new root-relative assets, font fetches or local API routes. Only `dist/client` is the static application output; redesign does not authorize upload or workflow dispatch. The existing preview copies into `static-host/carte-scolaire` without removing old assets: fresh built HTML/CSS and network observations, not stale files or historic screenshots, are the evidence.

## 6. Implementation and review acceptance

Order: integrate dependencies/aliases/theme -> build/typecheck a real Button -> compose layout/components without changing behaviour -> check Leaflet CSS -> extend browser assertions -> run the full checks and inspect screenshots. Record command outputs and caveats in `docs/SHADCN-VERIFICATION.md`; no claim of implementation based only on this design.

Required commands in project root:

```sh
npm run test
npm run typecheck
npm run data:validate
npm run build
npm run test:browser
```

Playwright config currently has no system-Chromium executable setting. Discover the existing project browser cache/system executable before running; do not invent one, install system packages or modify owner configuration. Use an already available browser through the project's supported test setup; if a local test-only executable override is needed, record it. Tests serve a copy of `dist/client` on loopback, not the Start runtime.

Acceptance gates:
1. Genuine local shadcn source/config/utility + lockfile provenance; all chosen primitives actually used. Assert a generated component's DOM hook and computed primary colour, border/radius and >=44px target, so unstyled imported components cannot pass.
2. At 1280x800: compact title/search, wider map workspace, restrained surfaces and full readable notices. At 390x844 and existing 375px cases: stacked controls/cards, useful map, visible source details, no clipped labels or horizontal overflow. Retain 320px, 200% text and desktop zoom checks; verify width while waiting, showing choices, selected detail and errors, not only idle.
3. Real Versailles by name and 78000: same nine polygon paths, five distinct collège labels across nine sector options, publisher-code wording, 2025–2026, UAIs, indicative/road warnings and exact licence caveat. Existing Toulouse, Paris, Bessières and leading-zero/disambiguation cases still pass. Do not edit snapshots or substitute fixture sectors.
4. Pointer popup, native keyboard selection, pan/zoom, Escape/close, 44px map targets and selected detail all work. Tile failures preserve boundaries; failed Leaflet load preserves usable collège list/details and retry. Inspect tiles/overlay styles and ensure attribution is not hidden by a badge/card.
5. Test every state in section 4 with existing explicit fixture patterns, including delayed lookup/sector results and late errors after an edit, invalid submission or new request. Keep no-match/empty/unavailable distinct; retry remains stage-correct. Test labels, focus/ref forwarding, live status, busy region and reduced motion.
6. Static repo-path build loads compiled CSS/JS/data without 404, root-relative leaks, page/console errors or hydration mismatch. Reload returns idle; missing nested route remains 404. No external OSM tile traffic during automated tests: retain tile interception/aborts, with real polygons and real-data cases otherwise untouched. Label tile-intercepted screenshots honestly.
7. Save and visually inspect `docs/screenshots/shadcn-idle-desktop.png`, `shadcn-versailles-desktop.png`, `shadcn-versailles-mobile.png`. Capture the actual built app, not a mockup; developer report names viewport/query, data/tiles conditions and assertions. If live commune API is unavailable, report the real-data gate as blocked, never fabricate success.

Existing test coupling: retain the 1100px main-width assertion and functional hooks where possible. New semantic section headings may require replacing broad `locator('h2')` checks with a specifically named commune-heading assertion; preserve what is tested rather than weakening it. Leaflet download-failure test targets the current chunk basename: if bundling renames it, identify the actual Leaflet chunk and continue testing failed import. Review both updated tests and unchanged dataset/source hashes.

Developer requests same-card PM review (`reviewer=default`) after verification, per child card. This architect parent completes to release that child; it does not duplicate the review lane. Preserve user files `BRIEF.md`, `docs/ARCHITECTURE.md`, `headers.txt`, `meta.json`, `tiny.csv`; no cleanup of unrelated data.

## 7. Official documentation checked on 13 October 2026

These are implementation references, not proof that new dependencies have been exercised locally. Source URLs are retained as code for portable handoff.

- [S1] shadcn installation, existing-project vs scaffold: `https://ui.shadcn.com/docs/installation`
- [S2] shadcn TanStack Start, Existing Project: `https://ui.shadcn.com/docs/installation/tanstack`
- [S3] shadcn manual setup, current family/dependencies/CSS/helper: `https://ui.shadcn.com/docs/installation/manual`
- [S4] shadcn configuration, CSS path/variables/aliases/RSC: `https://ui.shadcn.com/docs/components-json`
- [S5] Tailwind Vite integration: `https://tailwindcss.com/docs/installation/using-vite`
- [S6] shadcn semantic theme variables: `https://ui.shadcn.com/docs/theming`
- [S7] shadcn CLI add and dry-run: `https://ui.shadcn.com/docs/cli`
- [S8] shadcn Native Select, Base variant: `https://ui.shadcn.com/docs/components/base/native-select`
- [S9] shadcn Alert composition: `https://ui.shadcn.com/docs/components/base/alert`
- [S10] Tailwind Preflight and third-party/reset considerations: `https://tailwindcss.com/docs/preflight`
- [S11] Version-specific Leaflet stylesheet: `https://raw.githubusercontent.com/Leaflet/Leaflet/v1.9.4/dist/leaflet.css`
