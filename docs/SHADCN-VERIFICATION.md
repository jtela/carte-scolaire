# shadcn redesign — implementation verification

Task `t_814ccd31`, developer; verified 13 October 2026, CEST. Persistent project: `/home/pi/team-work/projects/carte-scolaire`. Design input: `docs/SHADCN-DESIGN.md`. This report records local implementation and execution, not deployment or PM approval.

## Delivered design

A light, slate/white French civic interface with blue actions, compact header, textual partial-coverage badge and a 1100px maximum content width. Desktop uses a 320px search/commune sidebar and a larger map workspace; below 1024px it stacks in document order. Search and choice buttons are full-width on narrow screens. The real map keeps its existing explicit responsive height. Idle/non-ready states reserve a clearly labelled empty map footprint; skeletons appear only during actual lookup/sector loading.

Nine genuine shadcn primitives are installed and used: Button, Input, Label, Card, Badge, Alert, Separator, Skeleton and NativeSelect/NativeSelectOption. Search, explicit commune selection and native sector keyboard semantics are unchanged. Selected collège names, UAIs and actual school year appear in a detail Card. Coverage warnings and full source/licence information remain visible, never behind a disclosure.

Application typography uses system fonts, not a remote font. Controls grow with text and have minimum 44px targets. Blue 3px offset focus outlines are not clipped by Card overflow. Badge text wraps at narrow/200%-text sizes. Reduced motion disables skeleton animation and transitions.

## Official component provenance and dependencies

Executed in the existing project (no scaffold, no framework upgrade):

```sh
npm install -D tailwindcss @tailwindcss/vite
npm install shadcn class-variance-authority cn lucide-react tw-animate-css
npx shadcn add button input label card badge alert separator skeleton native-select --dry-run
npx shadcn add button input label card badge alert separator skeleton native-select
npm install @base-ui/react
npm install -D shadcn
```

The dry run identified exactly nine new component files. CLI 4.21.4 created them under `src/components/ui/` with `components.json` configured for `base-nova`, neutral, CSS variables, TSX, `rsc:false`, Lucide and `@/*` aliases. CLI's registry dependency metadata listed `cn` but generated Button/Separator/Badge source imports Base UI; the required Base UI package was installed explicitly rather than masking missing imports.

Installed/resolved versions: Tailwind and Vite plugin 4.3.3; shadcn 4.21.4 (development dependency, also required for the build-time CSS import); Base UI React 1.9.0; cn 0.4.0; class-variance-authority 0.7.1; lucide-react 1.55.0; tw-animate-css 1.4.0. Existing pinned React 19.3.0, TanStack, Vite, Leaflet and test framework versions remain unchanged. `package-lock.json` contains the actual dependency resolution. No API keys or extra paid service were used.

Official sources retrieved locally:

- Manual guide: `https://ui.shadcn.com/docs/installation/manual` (saved in `artifacts/shadcn-manual-reference.html`).
- Component registry: `https://ui.shadcn.com/r/styles/base-nova/{name}.json`, for each of the nine names above.
- Parent design provides the official Tailwind, TanStack, theming and Preflight documentation references.

`node scripts/verify-shadcn.mjs` fetches each official component registry and compares the generated local source, with SHA-256 evidence in `artifacts/shadcn-provenance.json`. All nine match after whitespace normalization and only these narrow CLI transformations: Label's `use client` directive removed for `rsc:false`; Card's registry font-heading placeholder removed for the system font; NativeSelect's registry icon placeholder resolved to Lucide ChevronDownIcon. No hand-crafted replacement components, post-generation component-source changes, or legacy Radix/new-york mixture. The script records the actual transformation for each file. Generated files directly import official `cn`; `src/lib/utils.ts` re-exports it for the configured project utility alias.

Customization is at composition and application CSS level: semantic headings inside CardTitle, explicit Alert roles, icon accessibility, minimum/growing target sizes, wrapping, focus, light tokens, hover, surface/spacing/layout and Leaflet-scoped CSS. Tailwind v4 runs through Vite, before the preserved Start plugin. Theme imports include Tailwind, tw-animate-css and shadcn/tailwind.css, with semantic token mapping. Both Vite and TypeScript resolve `@/*`. Existing root stylesheet links still put Leaflet's stylesheet after application CSS.

## Verified execution

Final source/build gates executed on this machine:

| Command | Actual result |
| --- | --- |
| `node scripts/verify-shadcn.mjs` | Exit 0; 9 component provenance comparisons passed; contrast ratios printed. |
| `npm run test` | Exit 0; 4 files, 26 tests passed. |
| `npm run typecheck` | Exit 0; repeated after final browser-test changes. |
| `npm run data:validate` | Exit 0; 6 chunks/datasets, 223 features, 588 indexed communes; 17,878,733 data bytes. |
| `npm run build` | Exit 0; client and SSR compilation, then one statically prerendered `/` page. |
| `PLAYWRIGHT_BROWSERS_PATH=/home/pi/team-work/projects/carte-scolaire/architecture/probe/.browsers npm run test:browser` | Exit 0; R1 final 20 tests passed, 1.5 minutes, one worker. |
| `git diff --check` | Exit 0. |
| `npm audit --omit=dev` | Exit 0; zero vulnerabilities. |

Browser executable came from the existing project Playwright cache documented by the PM; no new browser/system installation, global configuration change or fabricated system-Chromium path. The test server copied the real `dist/client` build and served it on loopback at `/carte-scolaire/` (port 4185), with automatic shutdown. A separate local preview was also health-checked through HTTP and exercised with Playwright while diagnosing overflow; that process was stopped.

Evidence: `artifacts/shadcn-browser.log`, `artifacts/browser-results.json`, `artifacts/shadcn-provenance.json`, `artifacts/shadcn-provenance.log`, `artifacts/shadcn-leaflet-1280.json`, `artifacts/shadcn-leaflet-390.json`, plus original real-data test JSON under `artifacts/` and `artifacts/versailles/`.

### Browser coverage

All 14 existing functional tests retained, plus six design tests in `tests/browser/design.spec.ts`:

- Desktop (1280x800) actual styled component hooks/computed blue primary background, white text, radius, white Card, visible input border, >=44px target; right map wider than sidebar; labels, unique H1/status, invalid focus forwarding and 3px focus outline.
- Real Versailles searches at 1280x800 and 390x844, genuine commune API and unchanged polygon snapshots, native sector primitive, selected details/UAI/year, road-discordance warning and exact licence caveat; mobile stacked geometry and no horizontal overflow.
- 390px lookup pending, native choices, disabled confirmation, error/retry/no-match and reduced-motion skeleton checks; live status is outside the busy subtree and static coverage does not introduce competing alerts.
- 390px sector loading, skeleton/busy semantics, stage-correct sector retry (no additional commune lookup), selected detail, edit cancellation and cleared provenance.
- 320x812 loaded Bessières at `html {font-size:200%}`: all three header/summary/count badges have no vertical/horizontal content overflow; every text rectangle is inside its visible badge box. The summary coverage warning must actually wrap. Deterministic commune API fixture, unchanged real local sector snapshot, blank intercepted tiles; this added regression does not replace any real-API gates.

Existing regressions continue to test real Toulouse name/31000 (41 paths), Paris 75001 (110 paths, 2026–2027/ODbL), Bessières name/31660 (2 paths), leading-zero 01000 explicit choice, Versailles name/78000 (9 paths, 10 select options including empty, 5 distinct collège labels, UAIs and 2025–2026). They exercise actual visible polygon clicks, popup/close/Escape, native keyboard selection, pan/zoom, 44px map controls, tile failure preserving polygons, failed Leaflet import preserving college-list/details and retry, malicious labels rendered as text, absent/corrupt manifest, bad geometry, distinct empty/unavailable/no-match, lookup timeout/offline retry and late lookup/sector races.

The original 320px/200%-text and desktop 200%-zoom assertions still run unchanged. First redesign run failed the mobile 200%-text page-width overflow gate (13/14); the initial wrapping/shrinking fix passed that gate but did not detect vertical badge text clipping, as PM review R1 subsequently demonstrated. The R1 correction and direct regression below close that gap without loosening assertions. The one pre-existing broad `h2` assertion was narrowed to the exact Saint-Denis-lès-Bourg commune heading because new semantic section headings now exist; the original commune identity assertion is preserved.

### R1 correction and fail-before/pass-after evidence

PM review and independent original evidence remain untouched at `docs/SHADCN-PM-REVIEW.md` and `artifacts/shadcn-pm-*`. Only application CSS changed for R1: `[data-slot=badge]` now has `height:auto;min-height:1.25rem`, retaining wrapping, font size, padding, overflow behaviour and all official generated component sources. Intrinsic height now grows with the text rather than forcing it into shadcn's default `h-5` box; no warnings hidden, reduced, or replaced.

Added the direct regression first and ran it against the original production build:

```sh
PLAYWRIGHT_BROWSERS_PATH=/home/pi/team-work/projects/carte-scolaire/architecture/probe/.browsers npm run test:browser -- --grep '320px 200% text shows'
```

Before: exit 1 (`artifacts/shadcn-r1-red.log`). Actual summary badge box was 40px high, `scrollHeight:55 > clientHeight:38`, with text starting 10px above and ending 10px below its box. Header also failed the strict content overflow check (39 > 38). Raw captured metrics preserved in `artifacts/shadcn-r1-before.json`.

After CSS fix and `npm run build`: the same unmodified test passes, exit 0 (`artifacts/shadcn-r1-green.log`). In the final full run the summary badge grows to 74px, `scrollHeight:72 == clientHeight:72`; both wrapped text lines fit with 7px vertical inset. Header/count badges grow to 42px, their content heights are 40px with no overflow. Every text rectangle fits both axes, page-width gate still passes. Final raw metrics: `artifacts/shadcn-badge-text-200.json`. Screenshot: `docs/screenshots/shadcn-bessieres-320-text-200.png` (320x812 viewport, full page). Loaded and inspected the entire image plus original-resolution summary crop; both words and sector count are fully visible.

Reran all gates on 13 October 2026 after R1: 26 unit tests; typecheck; data validation (6 datasets, 223 features, 588 communes); production client/SSR/static build; full 20 browser tests (1.5m); all 9 official source comparisons; `git diff --check`; preservation diff and all five user-file hashes; production audit (0 vulnerabilities). Logs: `artifacts/shadcn-r1-unit.log`, `shadcn-r1-typecheck.log`, `shadcn-r1-data.log`, `shadcn-r1-build.log`, `shadcn-browser.log`, `shadcn-provenance.log`, `shadcn-r1-production-audit.json`. Refreshed and visually inspected all three original desktop/real-Versailles screenshots as well. This is developer verification, not PM approval or deployment.

### Leaflet and static-path checks

Production computed styles prove loaded tiles are 256x256px, absolutely positioned, with `max-width:none`; overlay SVG retains its real width (>250px in both tested viewports), and attribution is visible. Existing map controls/popups and boundary behaviour pass. Narrow tile-specific max-size protection is scoped to `.leaflet-container`; no global image/SVG dimension overrides. Leaflet imports dynamically as before; map generation/disposal, polygon styles and interactions are unchanged.

Static tests observed actual compiled CSS/JS and data requests under `/carte-scolaire/`, with successful local asset responses and no page/console/hydration errors. Reload returns idle; nonexistent nested route stays 404. No router/basepath or prerender settings changed. New components do not fetch fonts, analytics or data at boot.

Theme contrast calculated by the verification script: primary white/blue 6.70:1; muted slate/canvas 7.24:1; foreground/white 17.85:1; input slate/white 4.76:1; blue focus/white 6.70:1; destructive/white 6.47:1. This is focused theme/focus validation, not a claim of complete accessibility certification.

## Real screenshots and visual inspection

Captured by `design.spec.ts` from the actual production static build, then loaded and visually inspected:

- `docs/screenshots/shadcn-idle-desktop.png`: viewport 1280x800, full page, genuine idle app; compact header/search, clear no-sector placeholder, coverage warning. No fake sectors.
- `docs/screenshots/shadcn-versailles-desktop.png`: viewport 1280x800, query Versailles, real commune API/snapshot; first sector explicitly selected, popup closed, details retained. Clear sidebar/workspace hierarchy, all boundaries, unclipped select, readable details and full limitations/licence.
- `docs/screenshots/shadcn-versailles-mobile.png`: viewport 390x844, query Versailles, real commune API/snapshot; default fitted overview before sector selection/popup auto-pan. R1 refreshed full-page 390x2087 capture; stacked cards, visible nine-sector overview, labelled native chooser, unclipped attribution and all source/coverage text. Mobile selection/details are additionally asserted after the screenshot.
- `docs/screenshots/shadcn-bessieres-320-text-200.png`: added R1 evidence described above, 320px/200% text with deterministic commune lookup and real local polygons; readable header and wrapped commune warning/count. Not represented as a live commune API screenshot.

All automated screenshot/test basemaps use deliberately blank intercepted 256px SVG tiles to avoid automated OSM traffic. The grey basemap is a test condition, not an invented real-world street map or a claim that OSM was verified live. Real app code still requests OSM tiles; its failure note/polygon fallback is tested. The two Versailles screenshots use real API search results and unchanged sector geometry; the added Bessières text-clipping screenshot uses the explicitly labelled deterministic commune lookup fixture and unchanged sector geometry. Initial selected mobile screenshot showed popup auto-pan clipping part of the overview; the final screenshot documents the actual initial fitted state instead. Pointer selection and pan/zoom remain independently tested, not disabled for aesthetics.

## Preservation and caveats

`git diff --exit-code -- public/data src/features/search src/features/sectors src/routes/__root.tsx src/router.tsx` returned 0. No dataset, reducer, repository, timeout/cancellation, source metadata, route/basepath or map-effect logic edits. All original five user-file git object hashes are unchanged:

```text
BRIEF.md              77b54ddd0f29881dc57a51e1e19671b479501074
docs/ARCHITECTURE.md   2bd0f4b871bcf3c05c5d7c0b26a55d74bd2a3a2f
headers.txt           abbb648ebf97c1f54fabba492db6accc9b10d644
meta.json             883d0c31f95ee646dee4a8ef5402bc7d1ebf4864
tiny.csv              f4bce5d29f79e7b698dd6c31cb16769ad617588f
```

Full `npm audit` reports seven high development-tool findings in shadcn's transitive glob/brace chain (`artifacts/shadcn-audit.json`). Production-only audit is clean. Queried current registry versions for braces (3.0.3) and micromatch (4.0.8); no available direct patched braces release was returned. Did not run forced audit fixes, downgrade to an obsolete CLI, or change unrelated framework versions. PM should retain awareness of this build-tool risk and avoid feeding untrusted patterns to CLI tooling; it is not browser-runtime code. Real commune tests require network availability. Coverage/source/assignment limitations remain as stated by the existing app, including no explicit Versailles licence and no verified Versailles 2026–2027 vintage.

No commits, pushes, publication, deployment, external messages or system administration performed. The owner's later deployment authorization is explicitly gated on PM validation; developer is handing this same card to `default` for review, not deploying.

## Handoff paths

Working project source and build remain in the persistent project; compiled static output is `dist/client/`. Source deliverable archive `artifacts/shadcn-source.tar.gz` includes application source/config/lockfile, tests/scripts and unchanged public snapshots; excludes node_modules, research, credentials, user notes, .git and caches. It is a local source artifact, not a deployed release. To reproduce: extract in a separate directory, `npm ci`, then run the commands above; configure an available Playwright browser cache for browser tests. Python raw-source ingestion tests require separately retained upstream research inputs as described in README and were not part of this design-only verification.

Changed/new implementation paths: `components.json`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `src/lib/utils.ts`, `src/components/ui/*.tsx`, `src/styles/app.css`, `src/routes/index.tsx`, `src/features/map/SectorMap.tsx`, `tests/browser/design.spec.ts`, `tests/browser/resilience.spec.ts`, `scripts/verify-shadcn.mjs`, this report and the four named screenshots. R1 incremental application/test changes are confined to `src/styles/app.css` and `tests/browser/design.spec.ts`, with refreshed report/evidence/archive. The architect design document and PM review/probe are preserved as input/evidence, not rewritten.
