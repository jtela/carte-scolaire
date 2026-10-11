# Carte scolaire — implementation and verification

Developer task: t_b61ae94d. Persistent workspace: `/home/pi/team-work/projects/carte-scolaire`. Executed 11 October 2026, CEST. Implementation is local and submitted for PM review, not self-approved or published.

## Delivered implementation

React 19, TypeScript, TanStack Start static prerender of one root route, and browser-only Leaflet. This is not a Vite-only replacement or deployed Node application. Start builds an SSR bundle only to prerender `dist/client/index.html`; GitHub Pages receives `dist/client` only.

The French form accepts a commune name or five-digit postcode, preserving leading zeros, accents and punctuation. Government API results are validated and deduplicated without reordering. Ambiguous results require an explicit native select/Choisir action. Unknown coverage is distinguished from empty checked data and from network/schema failures. Requests have a 15-second timeout; editing or resubmitting aborts/invalidate older generations and clears the map, popup and provenance. There is no default simulated map, account, address storage or analytics.

The map retains genuine Polygon/MultiPolygon coordinates, including holes/disconnected parts. It has keyboard pan/zoom, 44px French zoom controls, a native sector selector, text details and a French popup close control. Source text is inserted with textContent, not HTML. Failed tiles keep valid sectors visible; failed map import retains accessible collège details and offers map retry. Map lifecycle removes listeners/layers on disposal and guards late dynamic import.

Important code paths: `src/routes/index.tsx`, `src/features/search/{state,communes}.ts`, `src/features/sectors/{types,repository}.ts`, `src/features/map/SectorMap.tsx`, `scripts/data/{ingest.py,validate.mjs}`. The lockfile pins the architecture's exact tested versions. README documents installation, static preview, refresh, limitations and manual publication.

## Real data and honest coverage

Production data is from the two verified research handoffs, not fixtures:

- Haute-Garonne, public collège recruitment sectors for entry into 6ème: 104 MultiPolygons, school year unknown. Original response SHA-256 `9bd3df54d2ee0b4dfbc0d76d4db71cb0ff8648b537409fc1e13108a1e608ede9`. Licence Ouverte v2.0, publisher Conseil départemental de la Haute-Garonne.
- Paris: 110 MultiPolygons, explicit 2026–2027. Original response SHA-256 `312e4586b5416d5f1465bbcf0db9bdf3493ebe5bff9c2bbf542b56fa55ce3526`. ODbL 1.0, Direction des Affaires Scolaires / Ville de Paris. Source modification 3 March 2026. The normalized Paris database and its index portion remain offered under ODbL, with attribution distinct from HG.

All 586 supplied Haute-Garonne commune contours and Paris are spatially indexed against ALL sector features. No school-location prefilter, centre-only match or bbox-only match is used. Regression counts include sectors whose collège is outside the selected commune: Toulouse 41, Bessières 2, Castelnau-d'Estrétefonds 4, Paris 110. These are intersections/boundary relations, possibly including resolution slivers, never official student assignment or independently proved complete catchments. All entries are labeled partial. A Paris postcode selects the whole Paris commune, not a postal boundary.

Five physical chunks contain 214 sectors, 17,805,677 uncompressed bytes total. Each chunk is below 5,000,000 bytes (largest 4,421,555). The manifest records original and normalized checksums, dates, publisher/license, source URLs, school-year nullability, association method, bounds and caveats. `public/data/LICENSES.md` retains source-specific reuse notices. Geometry is not simplified, clipped, repaired or fabricated. Source validation compares normalized geometry to every original feature, validates topology before writing, and tests multiple-college preservation. The refresh fails closed if pinned original hashes change and replaces the manifest only after validating both sources.

No nationwide polygon source or exhaustive departmental survey was established. Other French communes remain searchable but honestly show unavailable sector boundaries. This is the largest coverage supported by the two verified redistributable downloads provided for this task, not a promise to cover every French city. National DGESCO tabular data is not used to manufacture polygons. Researcher/architect reports and PM correction were preserved unchanged.

## Executed verification and evidence

Runtime observed: Node v22.23.3, npm 10.9.9, Python 3 and Shapely 2.2.0 from the existing research venv. Commands executed in the project workspace; each exited 0:

| Command | Actual result | Evidence |
| --- | --- | --- |
| `npm ci --no-audit --no-fund` | 140 packages installed | `artifacts/install.log` |
| `npm run typecheck` | no diagnostics | `artifacts/typecheck.log` |
| `npm test` | 4 files / 26 tests passed | `artifacts/unit-tests.log` |
| `research/.venv/bin/python -m unittest discover -s tests/data -v` | 3 real-source ingestion tests passed | `artifacts/data-tests.log` |
| `npm run data:validate` | 5 chunks, 214 features, 587 indexed communes, checksums/IDs valid | `artifacts/data-validation.log` |
| `npm run build` | client + build-time SSR + one successfully prerendered `/` page | `artifacts/build.log` |
| `PLAYWRIGHT_BROWSERS_PATH=.../architecture/probe/.browsers npm run test:browser` | 12 passed, zero unexpected/skipped tests | `artifacts/browser-tests.log`, `artifacts/browser-results.json` |

TDD checkpoint: the initial implementation attempt added pure/data/browser tests and exercised missing implementations. On recovery, existing source and tests were preserved, not represented as newly test-first code. The popup-control regression was added before this run's production fix and failed because the French close control was absent (`artifacts/popup-red.log`). It also exposed a selected-sector race: choosing before dynamic Leaflet initialization populated layers did not open the popup. Applying selection after map initialization and fixing the French 44px close target made that same regression pass (`artifacts/popup-green.log`); the entire suite was then rerun successfully. No passing result is substituted for a blocked command. Early arbitrary `python -c` / execute_code discovery attempts were blocked by unattended approval policy; ordinary read/search tools and permitted scripts resolved that without changing agent configuration.

### Static-only browser verification

`playwright.config.ts` invokes `scripts/static-preview.mjs`. The helper COPIES `dist/client` to `static-host/carte-scolaire` and starts Python `http.server` bound to **127.0.0.1:4185 only**. This is not Vite preview, a Start server, or a live Node backend. Tested URL: `http://127.0.0.1:4185/carte-scolaire/` and unknown query/reload. HTML, JS, CSS, manifest and sector chunks returned 200 under that subpath; a missing nested route returned 404. Computed CSS max-width was 1100px. Before-navigation pageerror/console-error listeners found no errors in the real main acceptance flow. Real request URLs, response statuses/content types, source metadata and the empty error list are in `artifacts/real-browser-evidence.json`. No local backend requests were needed. Test server stopped automatically; `artifacts/listening-ports-after-tests.log` verifies no listener on 4185. No persistent project preview is left running; README gives its foreground restart command.

### Real-data map checks (not stubbed)

- Live commune name Toulouse and postcode 31000 each rendered 41 genuine SVG sector paths.
- Live Paris postcode 75001 rendered 110 paths, publisher/license and 2026–2027 visible. An actual mouse click on a visible SVG boundary opened a meaningful French school-year/college popup; no zero-coordinate synthetic click is used for this final evidence.
- Live small-town name Bessières and postcode 31660 each rendered 2 paths, unknown vintage/6ème limitation and named collège/UAI popup. Native sector selection, keyboard popup close, zoom and keyboard pan were exercised.
- Live postcode 01000 retained its leading zero and required selection between Bourg-en-Bresse and Saint-Denis-lès-Bourg; unsupported polygon coverage then displayed honestly.

Screenshots: `artifacts/toulouse-desktop.png`, `artifacts/paris-desktop.png`, `artifacts/bessieres-desktop.png`, `artifacts/bessieres-mobile.png`, `artifacts/mobile-320-text-200.png`, `artifacts/desktop-css-zoom-200.png`. Their map background is intentionally neutral: automated tests intercept ONLY OSM tiles to avoid prohibited automated tile traffic. The real API and actual downloaded sector snapshots remain unmocked in successful real-data cases. These images do not claim a verified live basemap.

### Explicit fixtures and accessibility checks

Separate labeled tests exercise blank/invalid input, no matches, ambiguous results, unsupported coverage, 429/offline/timeout, retry, missing/corrupt manifest, invalid geometry, valid empty selection, failed tiles, failed Leaflet import, malicious collège labels, delayed lookup rejection and obsolete delayed sector response after invalid resubmission. No stale popup, map, title or attribution is restored. Unit tests cover parser/URL encoding/runtime validation, leading zero, partial coverage, unsafe URLs, geometry/identity, cancellation and generation guards.

Desktop 1280x800, mobile 375x812 and 320px layouts had no horizontal overflow. Keyboard/native form and sector controls, map pan/zoom, Escape, French close-button Enter and target size were asserted. The extra 200% checks are explicitly HTML-root text resize at 320px and CSS zoom=2 at desktop, not a claim that native Chromium UI zoom or a full screen-reader/automated WCAG audit was performed. Focus styling is visible in screenshots; no custom combobox or pinch-zoom disabling was added.

## Safe local delivery / publication status

Manual `.github/workflows/pages.yml` uses workflow_dispatch only, npm clean install/typecheck/test/data validation/build, `APP_BASE_PATH=/carte-scolaire/`, upload of `dist/client` only and a separate Pages deployment job. Exact configured action references were successfully fetched from official GitHub raw sources into `artifacts/{checkout-v6,setup-node-v6,configure-pages-v5,upload-pages-artifact-v4,deploy-pages-v4}.yml`. No workflow was dispatched, remote created, push performed, external deployment made or paid service used.

`.gitignore` excludes env/credentials/local config, research/venv, architecture/probe/browsers, artifacts, build/test caches, Python caches and internal worker/PM notes. No pre-existing Git repository was modified or invented commit claimed. Public upload must still be PM-reviewed and explicitly public as authorized for this project only. Source archive uses a positive file list, not the entire workspace; colleague research inputs and unrelated local files are not included.

The deliverable archive is `artifacts/carte-scolaire-source.tar.gz` (checksum in `artifacts/source-archive.sha256`, member list in `artifacts/source-archive-files.txt`). It was extracted into the assigned workspace's `artifacts/release-check`, then clean npm install, typecheck, all 26 unit tests, public-data validation, build and all 12 static browser tests ran successfully AGAIN from that extracted source, without the excluded architecture/research source files. The browser executable was reused explicitly from the installed local browser directory, not bundled. Exact execution is in `artifacts/release-check.log`. Python ingestion tests need the separately documented original source downloads; they were run in the full workspace, not falsely claimed as runnable without those inputs. The archive report was subsequently updated only to record these results; application code is the exercised code.

## PM review R1 — refresh preservation fix (11 October 2026)

The PM found that an empty Haute-Garonne contour response replaced the manifest before a diagnostic raised KeyError. Added the regression BEFORE modifying ingestion: `artifacts/refresh-red.log` records five expected assertion failures for empty, Point, duplicate-code, missing-commune and malformed contour inputs. Tests work in disposable copies, compare EVERY output file byte-for-byte (including manifest, chunks and license notice), and require a clear contour ValueError. Production snapshots were not refreshed or modified by these fault injections.

`ingest.py` now pins both official contour snapshot checksums, validates expected counts (586 HG / 1 Paris), unique string identities and nonempty valid polygon topology, checks the resulting index keys/references and 587-commune total, and serializes the candidate manifest and sample diagnostics before any output write. Diagnostics are printed before publication too, so a failed diagnostic cannot report failure after replacing the manifest. Changing contour provenance now requires explicit review, just as changing sector exports does. README documents reviewing hashes and expected counts for all four inputs. Existing application behavior and source geometries are unchanged; colleague reports and PM evidence are preserved.

Rerun results (all exit 0): clean `npm ci`, typecheck, 26 unit tests, data validation (5 chunks / 214 sectors / 587 communes), Start build with one prerendered page, and all 12 static-subpath browser tests including live API searches and actual sector snapshots. Four Python ingestion tests pass, including all five fault subcases (`artifacts/refresh-green.log`). Current npm/build/browser execution logs have the `artifacts/r1-` prefix; current browser JSON/screenshots were regenerated by those tests. Test preview is loopback-only and stops automatically. Coverage/vintage, basemap and accessibility limitations above remain unchanged.

The release archive is regenerated from the same positive public-safe file list, with a new checksum/member list and audit. A fresh extraction in `artifacts/r1-release-check` is used for the clean-source npm/typecheck/unit/data/build/browser verification; `artifacts/r1-release-check.log` and `artifacts/release-audit.json` are the authoritative machine-readable results. Internal review notes, research downloads, dependencies, credentials and this release-check tooling are not included. Final PM approval and publication remain pending.

Remaining limitations: only two verified regional sources; HG year unknown and grade-specific; contour intersections do not prove assignments; online commune API dependence; live basemap not part of automated success evidence; no remote Pages execution; CSS/text zoom emulation rather than native browser UI zoom; PM independent approval still required. No architecture divergence requiring another design decision was introduced.
