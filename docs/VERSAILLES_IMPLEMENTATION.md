# Versailles extension — implementation and verification

Task `t_862e7ecb`, developer. Persistent workspace: `/home/pi/team-work/projects/carte-scolaire`. Executed 12 October 2026, CEST. Local implementation only: no commit, push, workflow dispatch or deployment. Submitted on the same card for PM review; public site still has the previously published coverage.

## Delivered scope

The existing React/TypeScript/TanStack Start single prerendered route and browser-only Leaflet remain unchanged in architecture. Searching the actual commune API by `Versailles` or `78000` resolves commune `78646` and loads nine genuine publisher polygon records associated with five public collèges. Source polygons are neither clipped, simplified, repaired nor fabricated. No commune-as-sector, school-location prefilter, postal outline, household assignment or address-search feature was added.

New distributed snapshot: `public/data/sectors/versailles-2025-1.2804f057dba5.geojson`, 73,056 bytes, SHA-256 `2804f057dba563ec1d8eb8027e8adf4f7c213871794c113b1849e36c7f560b0b`. New manifest entry uses `publisher-codes`; the nine original zone IDs are 290, 291, 292, 269, 313, 314, 315, 316 and 317. Selection normalizes the publisher's numeric `NUM_INSEE` with `str(...) == '78646'` (the research report's string-only comparison is a typo). College labels are derived from `COL_NOM`, joining exact `RNE=COL_CODE`, requiring exactly one public (`COL_TYPE=PU`) match. Only names/UAI and essential normalized provenance fields are distributed, not personnel, contact or unrelated table fields. The five RNEs are 0781298M (Clagny), 0781106D (Hoche), 0780580G (Pierre de Nolhac), 0780718G (Raymond Poincare, source spelling), and 0781107E (Jean Philippe Rameau).

The contour is used only to fit the map, not to invent or filter zones. All nine publisher-associated features are retained regardless of the collège's address commune. Other Yvelines communes remain unsupported: this is a bounded Versailles source slice, not departmental/national coverage.

UI changes are limited to coverage labels and an association-specific result message: HG/Paris still say intersecting/bordering; Versailles says identified by publisher commune codes. A visible source-specific limitation says 2025–2026 only, no verified 2026–2027 vintage, indicative map, only departmental deliberation opposable, conflicting metadata/street zoning and no individual guarantee. Existing school-name/UAI/year popups, native selector, keyboard pan/zoom and map controls work for every retained polygon.

## Source provenance and refresh safety

Research source/vintage/reuse assessment: `docs/VERSAILLES_DATA.md`, preserved unchanged. Official departmental entry page: https://78-92.fr/annuaire/aides-et-services/detail/sectorisation-des-colleges ; linked official Experience: https://experience.arcgis.com/experience/289afd3aa2884a52a61efbf29b548e0d . Only its explicitly titled 2025–2026 vintage is claimed.

Pinned additional input snapshots:

- `research/versailles/sectors-2025-2026.geojson`, full original export, SHA-256 `4678fdad2144a1cf52fe3b405d455f52ff5e771925aa4a9e47d7aa6fd2535af6`, retrieved 11 October. Source: `https://sig.yvelines.fr/arcgis/rest/services/INTERNET/web_sectorisation_coll%C3%A8ges/MapServer/63/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson`.
- `research/versailles/colleges-table55.json`, full source crosswalk, SHA-256 `1f4b3ac0c26e1a664e8ce958f57f2e1117edd2cedabba4fa48f66c5fbfba4804`, retrieved 11 October. MapServer/55/query: `where=1=1`, `outFields=*`, `returnGeometry=false`, `f=json`.
- `research/versailles/commune-78646.geojson`, official contour retrieved 12 October, SHA-256 `e681e828e108cc78617a7e984a2b2bbbae65b9923beffcbdeaa36948dfdad6bd`. Source: `https://geo.api.gouv.fr/communes/78646?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour`.

There is no explicit Yvelines license identified; no Etalab/ODbL grant is invented. UI/manifest/LICENSES retain attributed-reuse caveats and link the actual official guide: https://guides.data.gouv.fr/guides/guide-juridique/reutilisateurs-de-donnees/respecter-les-conditions-de-reutilisation . This records the upstream public-information assessment, not a new legal assurance; statutory exclusions/third-party rights remain a caveat. HG/Paris licenses remain distinct and unchanged.

`ingest.py` minimally adds reviewed `SOURCE_SPECS` for source-specific contour hashes/counts, normalized feature counts and association methods. It no longer infers every new source is Paris or hardcodes 587 as the only possible count. Expected total is the sum of vetted source contour counts, and overlapping commune codes fail rather than silently overwrite an entry. Original source hashes, table hash, valid/nonempty topology, unique IDs, exact crosswalk, contour hash/count/identities, index coverage/references and all diagnostics are checked before any output write. All changes require explicit source/schema/vintage/reuse review before adjusting pins. The new multi-input snapshot URL uses final normalized asset bytes, so a later table-only label change also changes its immutable URL. Manifest replacement remains atomic; build never downloads or refreshes sources.

Current totals: 6 chunks, 223 features, 588 indexed communes, 17,878,733 asset bytes. All five existing HG/Paris assets and dataset metadata are exactly unchanged; all original 587 commune entries are value-identical to Git HEAD. Independent canonical geometry checksums compare every final feature with its publisher original: 104 HG, 110 Paris, 9 Versailles, all unchanged. Evidence: `artifacts/versailles/geometry-checksums.json` and executable check `verify_geometry.py`.

## Official street cross-check — matches AND discrepancies

New evidence requested by PM, retrieved 12 October: official MapServer/57 `voirie_info_simple`, query `INSEECOM_G='78646'`, `returnGeometry=true`, `outSR=4326`, `f=geojson`, selected fields `OBJECTID,NOM_VOIE_G,NOM_VOIE_D,INSEECOM_G,INSEECOM_D,BORNEDEB_G,BORNEFIN_G,BORNEDEB_D,BORNEFIN_D,COLLEGE_G,COLLEGE_D`. The exact endpoint/query/checksum and all observed conflicts are in `artifacts/versailles/street-crosscheck.json`; original response is `research/versailles/streets57-versailles.geojson`. Metadata and Experience config retrieved alongside it remain local research files. Initial OR-filter request was HTTP 403; a simple quoted equality filter worked. No fabricated response substituted.

The response returned 2,501 street segments. 2,206 segments with the same retained college on both sides were checked at the actual line's normalized midpoint. 2,073 matched exactly one polygon with that RNE; 133 did not: 14 outside all retained polygons, 119 inside another college's zone or overlap. These are exploratory segment comparisons, not household/address-level truth or a completeness claim for the street response.

Representative matching source segment IDs, street labels and containing original zones:

- 183058, VLA CHAMP LAGARDE → 0781107E, zone 314.
- 181294, R ALEXIS DE TOCQUEVILLE → 0780718G, zone 313 (left number range 4–2).
- 152330, BD SAINT-ANTOINE → 0781106D, zone 292.
- 152247, AV DES ETATS UNIS → 0781298M, zone 290.
- 152360, PL HOCHE → 0780580G, zone 269.

Counterexample: AV CLEMENT ADER segment 152600 has 0780580G on both street sides, but midpoint `[2.1183975454204766,48.79258238911751]` is in polygon 313/0780718G. Similar conflicts are retained, not hidden. This reinforces that source layer 63 is a coarse indicative overview (official metadata makes it visible below the 1:40000 scale threshold), not an address assignment engine. No polygon was altered to match streets. Individual addresses, street sides, exceptions and adopted deliberation are not verified. PM must assess the published caveats/reuse scope; do not market this as current/opposable assignment data.

## TDD and executed verification

Evidence lives in `artifacts/versailles/` (not the public repository). RED checkpoints preceded production changes:

1. `browser-red.log`/`browser-red.json` and `Versailles-before.png`/`78000-before.png`: actual commune API searches on the previously built static production app both reached `unavailable`, not `ready`. Initial browser launch lacked the default Playwright executable; reused the already installed project browser directory, without installation or changing system configuration.
2. `adapter-red.log`: expected missing three-argument source/crosswalk adapter API (TypeError); `adapter-green.log`: real-source coordinate/crosswalk slice test passes after adapter implementation.
3. `assets-red.log`: expected missing 588th commune; `assets-green.log`: asset/index integration passes.
4. `immutable-red.log`: expected final-byte-addressed new snapshot assertion failure; final Python suite verifies its fix.
5. `limitation-red.log`: expected missing visible street-discordance caveat; final real browser tests verify the new warning.

Additional characterization tests exercise missing/duplicate/private crosswalk records, school-address relocation without zone loss, and late-source hash faults. No further production changes were needed for these existing safeguards. The old contour byte-preservation regression is retained exactly in behavior, and three new changed-input subcases (sector/table/contour) compare EVERY output byte. A browser test expansion initially reselected an already-selected polygon after Escape (native select emitted no change); resetting the selector before iterating fixed the test setup, not production code.

Fresh final commands all exited 0:

- `research/.venv/bin/python -m unittest discover -s tests/data -v`: 7 tests pass, including original five contour-fault subcases and three new late-source byte-preservation subcases; `data-tests.log`.
- `research/.venv/bin/python scripts/data/ingest.py --inputs research --output public/data`: real pinned ingestion succeeds; `ingestion.log`.
- `python3 artifacts/versailles/verify_geometry.py`: 223 geometry checksum matches, old assets/metadata/587 entries unchanged; `geometry-verification.log`.
- `npm run typecheck`: no diagnostics; `typecheck.log`.
- `npm test`: 26 unit tests pass; `unit.log`.
- `npm run data:validate`: 6 chunks/223 features/588 communes and checksums valid; `validation.log`.
- `npm run build`: client and build-time SSR bundles succeed, one `/` page prerendered; `build.log`.
- `PLAYWRIGHT_BROWSERS_PATH=/home/pi/team-work/projects/carte-scolaire/architecture/probe/.browsers npm run test:browser`: 14 pass, zero skipped/unexpected/flaky; `browser-full.log`, `browser-results.json` and `results-summary.log`.
- `git diff --check`: clean. Test server stopped; no 4185 listener observed. Existing unrelated listeners were not changed.

Browser suite is served by the existing Python loopback static-copy preview under `/carte-scolaire/`, not a Node app server. Both Versailles cases use actual live commune requests and real distributed polygons. ONLY basemap tiles are intercepted in successful real-data tests; neutral backgrounds in screenshots are intentional, not verified real OSM rendering. Each case asserts nine SVG polygon paths, five collège labels, every polygon's meaningful name/UAI/year popup, an actual mouse click on a visible boundary, keyboard pan, zoom, explicit vintage/conditions and no page errors. Postcode case is mobile 375px with no horizontal overflow. Existing Paris/HG availability, unsupported coverage, ambiguity, errors/retry, cancellation/races, invalid geometry, malicious labels, tile/import failures, reload/subpath and mobile/320px/text-zoom checks all pass.

Final visual evidence: `Versailles-result.png`, `Versailles-popup.png`, `Versailles-map.png`, `78000-result.png`, `78000-popup.png`, `78000-map.png`; browser request logs `Versailles-browser.json`, `78000-browser.json`. Desktop/mobile screenshots were inspected; polygons, explicit source year/caveats and meaningful popup are visible. No claim of native browser UI zoom, screen-reader audit, live basemap verification or individual address assignment is made.

## Review/publication handoff

Changed app/data paths: `scripts/data/ingest.py`, `src/routes/index.tsx`, `public/data/manifest.json`, the new Versailles chunk, `public/data/LICENSES.md`, `tests/data/test_ingest.py`, `tests/unit/repository.test.ts`, `tests/browser/versailles.spec.ts`, `README.md` and this report. Pre-existing untracked research/user/architecture files were preserved; research outputs stay excluded from public staging. No overlapping sibling changes were observed and no dependency/package/workflow changes were made.

Request review on this same card with reviewer `default`. PM independently verifies data/reuse/discordance caveats and coordinates any publication authorization. Do not publish the entire workspace or internal artifacts; no deployment has been performed by this task.
