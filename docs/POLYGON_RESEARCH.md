# Public collège polygon sources — verified sample survey

Research and saved-input validation completed 11 October 2026 (CEST). Retrieval time is not a school-year assertion. Two independent authoritative open-data portals provide genuine, redistributable polygon samples: Haute-Garonne (four grade-specific datasets; this retained sample is 6ème only) and Paris (explicit 2026–2027 dataset). These are useful local snapshots, not a national polygon source or proof of completeness beyond the source-specific scope stated below.

## Verified samples and reproducibility

All files listed are actual downloaded responses saved under `research/`; none were synthesized. Snapshot hashes below were computed locally on 2026-10-11. Inspector `research/inspect_polygons.py` was executed successfully with a temporary Shapely 2.2.0 environment (`research/.venv`, not production data). It parsed every feature, checked geometry types and coordinate ranges, checked commune sample codes/postcodes, and used actual polygon intersection tests. The helper's reported Paris postcode line reflects the same Paris-wide geometry for all those postal codes; it is not a postcode-level sector assignment.

| Source / sample | Catalogue / download | Retrieved sample facts | License / semantics / vintage |
|---|---|---|---|
| Conseil départemental de la Haute-Garonne, `sectorisation-colleges-classes-6eme` | Catalogue search `https://data.haute-garonne.fr/api/explore/v2.1/catalog/datasets?where=search%28%22sectorisation%22%29&limit=20`; retained catalog response `research/pm-haute-garonne-catalog.json`. GeoJSON `https://data.haute-garonne.fr/api/explore/v2.1/catalog/datasets/sectorisation-colleges-classes-6eme/exports/geojson` | `research/pm-haute-garonne-6eme.geojson`; 5,919,585 bytes; SHA-256 `9bd3df54d2ee0b4dfbc0d76d4db71cb0ff8648b537409fc1e13108a1e608ede9`; 104/104 MultiPolygon features; coordinate values are longitude/latitude WGS84-like degrees, consistent with GeoJSON RFC 7946; catalog schema includes `uai`, `college`, `adresse`, `nom_officiel_commune`, `cog`, `geo_shape`, `geo_point_2d`, `code_departement` (some grade layers omit fields). | Catalog declares Licence Ouverte v2.0 (Etalab), links official license, publisher Conseil départemental de la Haute-Garonne. Catalog description says public collège recruitment sectorization for 6ème entry and explains assignment depends on residence and level, with shared multi-collège sectors possible; DSDEN performs assignment and derogations. Dataset metadata `modified` 2026-10-11 is retrieval-day metadata, NOT school year. No explicit school year established in the retained metadata: label year unknown, grade explicit 6ème. Address/commune properties describe the collège location and are not catchment commune codes; `cog` observed null in tested features. |
| Ville de Paris, `secteurs-scolaires-colleges` | Catalog `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/secteurs-scolaires-colleges`; year counts query `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/secteurs-scolaires-colleges/records?select=annee_scol%2Ccount%28%2A%29%20as%20n&group_by=annee_scol&limit=20`; GeoJSON export filtered to `annee_scol="2026-2027"`: `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/secteurs-scolaires-colleges/exports/geojson?where=annee_scol%3D%222026-2027%22` (original request used curl `--get --data-urlencode`) | `research/pm-paris-2026-2027.geojson`; 11,971,506 bytes; SHA-256 `312e4586b5416d5f1465bbcf0db9bdf3493ebe5bff9c2bbf542b56fa55ce3526`; 110/110 MultiPolygon features; all `annee_scol=2026-2027`, all `type_etabl=Collège`; schema includes `id_projet`, `libelle`, `annee_scol`, `zone_commune`, `lib_etab_1..4`, `adr_etab_1..4` and geometry/area fields. | Publisher Direction des Affaires Scolaires – Ville de Paris; catalog declares Open Database License (ODbL), links ODbL 1.0. Catalog description identifies areas of distribution into Paris schools and links Paris college information and official sector map. Dataset metadata `modified` 2026-03-03. Save/apply ODbL attribution and share-alike/database obligations separately from other data; retain a separate license/attribution record for Paris. `zone_commune` is integer and must not be assumed to be INSEE commune code. |

License text files retrieved 2026-10-11 from `https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf` and `https://opendatacommons.org/licenses/odbl/1-0/`, saved as `research/pm-licence-ouverte-v2.pdf` (SHA-256 `df600a2fd08b887716612ac57fffbbe10c9e678961064c72214cebb89c90cbb6`) and `research/pm-odbl-1.0.html` (SHA-256 `b8d8aebb21bf405f93f6e21bbf0d8f0a749844f9812ec58692f189add6402b47`). The source catalogs explicitly attach those licenses to the named datasets. Open Licence permits reuse subject to attribution/indication of source and update date. ODbL permits database use but imposes notice and share-alike terms on qualifying derivative databases; retain a separate license/attribution record for Paris. This is source license evidence, not legal advice.

The two catalogs, year aggregation, and saved exports are the basis for the counts and descriptions above. Fresh source-body downloads were performed by PM using foreground curl on 2026-10-11 around 09:03 CEST; exact files/hashes above were rechecked by this worker. Earlier attempt history in the comments documents the worker's blocked HTTP path; that was resolved by PM-provided downloaded inputs.

## PM verification correction — school-address prefilter

Independent PM execution after this handoff found that `research/inspect_polygons.py` lines 64–65 filters by the school's `nom_officiel_commune` before testing intersection. Therefore the original reported 25/1/1 Haute-Garonne counts below are **same-school-commune subsets, not total geometric matches**. Do not reuse that prefilter for production indexing or test expectations.

PM inspected and executed `research/.venv/bin/python research/pm_verify_polygon_handoff.py`, testing every downloaded sector against each selected contour without school-location filtering. It returned Toulouse **41**, Bessières **2**, and Castelnau-d'Estrétefonds **4** intersections; the same-school-commune subsets reproduce the original 25/1/1. Every returned intersection had positive coordinate area, but small contour-resolution overlaps may still be present. These are spatial-relation counts only, not official student assignments or independently verified complete catchments. Retain the architecture's uncertainty/coverage labeling and test that school location is never used as a catchment-membership filter. The original helper remains preserved as handoff evidence; use the independent script to reproduce corrected all-sector counts.

## Exact commune, postcode and small-town evidence

Official commune API contours are saved separately as association boundaries only (never school-sector boundaries):

- `research/pm-communes-31.geojson`, from `https://geo.api.gouv.fr/departements/31/communes?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour`: 586 actual Polygon communes, 3,830,081 bytes, SHA-256 `442e14ca70ba52747a0b76d8657c9054fec21e4347f5980bab7b6229bcd13c6b`.
- `research/pm-commune-paris.geojson`, from `https://geo.api.gouv.fr/communes/75056?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour`: one Polygon feature, Paris INSEE 75056, 11,381 bytes, SHA-256 `802b9f1917d0aed9e9d4e81ef664fa2aa292fe70078600fe8a1d076892a083ca`.

Reproducible check: `research/.venv/bin/python research/inspect_polygons.py` exited 0. It verified Toulouse / INSEE `31555` / postcode `31000`; Bessières / `31066` / `31660`; Castelnau-d'Estrétefonds / `31118` / `31620`; Paris / `75056` / postal codes `75001`–`75020` and `75116`. Actual Shapely intersections of the saved Haute-Garonne 6ème MultiPolygons with official commune contours found 25 sectors intersecting Toulouse and one each for Bessières and Castelnau-d'Estrétefonds. In each sample, the intersecting sector's source school-location label happens to match that commune. The intersection test—not that label—establishes the spatial association. Paris's saved 2026–2027 source features all intersect the official Paris contour (110); a Paris postcode maps to the whole commune contour, not a separate postal boundary or unique collège assignment. Sector/commune intersection can include boundary touches and is a visual availability relation, not an authoritative student allocation or exact-address assignment.

The reproduction helper validates all input geometries as polygonal, but its WGS84 check is coordinate-range and longitude/latitude-value based; no formal `crs` member is supplied. GeoJSON coordinate convention is WGS84 longitude/latitude; confirm and retain `crs: EPSG:4326` during downstream normalization. Original sources are MultiPolygon, so preserve disconnected pieces and any rings/holes.

## Coverage, quality and product cautions

- Haute-Garonne data is an official departmental dataset family with four separate grade-level layers (6ème, 5ème, 4ème, 3ème). The catalog search returned all four as distinct datasets; never flatten them into one yearless generic sector layer. This retained and tested snapshot is 6ème only; other grades require their own exports, validation and appropriate year semantics. Dataset existence does not prove the snapshot corresponds to 2026–2027.
- Paris offers a verified explicit 2026–2027 snapshot of 110 public-collège features. It is not evidence that every Parisian sector or every student situation is exhaustively represented beyond the source claim; no independent completeness assertion was found in the saved metadata.
- The Haute-Garonne source has per-feature school-location fields (`nom_officiel_commune`, `cog`, address), not catchment commune identifiers. Use genuine intersection with official commune contours to build a partial spatial index; never mistake a location field for sector membership. The intersection can associate a sector touching only a boundary, so label it “intersecting or bordering” unless an area threshold is adopted and justified.
- Paris's 2026–2027 response includes the school year and multiple college label fields; preserve sectors with several associated colleges. `zone_commune` is not a verified INSEE key. Paris city postcode codes cannot be treated as independent catchment polygons.
- Keep coverage `partial` or `unknown` as warranted. These two local sources do not establish nationwide polygon availability. National DGESCO data remains the separately documented tabular address/commune assignment source, not geometry. Do not infer the remaining France from it.
- Do not claim current official enrollment or assignment: Haute-Garonne itself warns that DSDEN makes assignments and decides derogations; these contours depict recruitment zones, not guaranteed individual placements.

## Broader source survey and negative candidates

The evidence now spans two distinct public authorities/portals (Conseil départemental de la Haute-Garonne and Ville de Paris), with actual downloaded polygon files, source metadata, licenses, and mapping samples. This is broader than a single-city demonstration but still intentionally bounded; no exhaustive per-department catalog audit was performed.

- National DGESCO `fr-en-carte-scolaire-colleges-publics` was previously inspected in `docs/DATA_RESEARCH.md`: its schema is tabular address/commune-to-college records with no geometry field; its GeoJSON export HTTP 200 is not a polygon dataset. Not suitable for drawing sector polygons.
- Gironde ArcGIS layer “Secteurs scolaires des collèges publics girondins 2023” was found in prior bounded survey; metadata reports polygon geometry/EPSG:2154, but actual feature query could not be retrieved/inspected in the unattended attempt and license/redistribution rights were not verified. It is therefore excluded as a usable/redistributable input. Do not supplement coverage with it until separately verified.
- The Haute-Garonne portal catalogue also returned a collège POINT dataset and an unrelated solidarity-services sector dataset. Both are excluded; neither substitutes for the actual grade-specific public-collège polygon layers.
- No nationwide polygon source or complete department-by-department availability inventory is established here.

## Provenance inventory and source schema

| Saved file | Meaning |
|---|---|
| `research/pm-haute-garonne-catalog.json` | Actual Explore API catalog search response: four grade-specific collège-sector datasets, schema, publisher, description, license, metadata timestamps. |
| `research/pm-haute-garonne-6eme.geojson` | Actual 6ème sector GeoJSON export, 104 MultiPolygons. |
| `research/pm-paris-metadata.json` | Actual Paris catalog metadata, fields, title/publisher/license/description and metadata modification time. |
| `research/pm-paris-years.json` | Actual grouped record counts: seven school years 2020–2021 through 2026–2027, 110 records each at retrieval. |
| `research/pm-paris-2026-2027.geojson` | Actual year-filtered Paris GeoJSON, 110 MultiPolygons; explicit 2026–2027. |
| `research/pm-communes-31.geojson`, `research/pm-commune-paris.geojson` | Official commune contour responses for spatial association only; must not be used as sector geometries. |
| `research/pm-licence-ouverte-v2.pdf`, `research/pm-odbl-1.0.html` | Actual official license texts linked by source catalogs. |
| `research/inspect_polygons.py` | Reproducible parser, geometry, sample-property and Shapely intersection checks. |

All downloaded sector sample files and commune contours are compact enough for researcher inspection but are not application-normalized snapshots. Developer should preserve source IDs/properties, source-specific license attribution, explicit school-year nullability, checksum and retrieval timestamp; normalize to WGS84 GeoJSON and include source/publisher/coverage metadata in a manifest. Do not include temporary `research/.venv` in public data/repository output.

## Sources (primary, endpoint and date)

All endpoints below were actually retrieved in the PM recovery on 2026-10-11 around 09:03–09:06 CEST and saved as cited files; geometry, counts, sample mappings, and checksums were then verified locally on 2026-10-11. The URLs are included verbatim for repeatable refresh.

1. Haute-Garonne official open-data catalog search: `https://data.haute-garonne.fr/api/explore/v2.1/catalog/datasets?where=search%28%22sectorisation%22%29&limit=20`.
2. Haute-Garonne 6ème sector GeoJSON export: `https://data.haute-garonne.fr/api/explore/v2.1/catalog/datasets/sectorisation-colleges-classes-6eme/exports/geojson`.
3. Paris official dataset catalog: `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/secteurs-scolaires-colleges`.
4. Paris year-group counts: `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/secteurs-scolaires-colleges/records?select=annee_scol%2Ccount%28%2A%29%20as%20n&group_by=annee_scol&limit=20`.
5. Paris 2026–2027 export: `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/secteurs-scolaires-colleges/exports/geojson?where=annee_scol%3D%222026-2027%22`.
6. Official commune API department 31 contour response and Paris commune 75056 contour response, verbatim URLs above; official API docs: `https://geo.api.gouv.fr/decoupage-administratif/communes`.
7. Etalab Open Licence v2.0 PDF: `https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf`.
8. Open Data Commons ODbL 1.0 legal text: `https://opendatacommons.org/licenses/odbl/1-0/`.
9. Prior national DGESCO catalog and Gironde GIS source details are documented in `docs/DATA_RESEARCH.md` and the earlier escalation text/history of this task; Gironde was not counted as a verified downloadable/licensed sample.

## Decision for downstream implementation

Actual usable redistributable polygon data is now demonstrated for Paris 2026–2027 and Haute-Garonne 6ème (with grade/year caveats). Real city/postcode and small-town contour associations were exercised for Toulouse / 31000, Bessières / 31660, and Castelnau-d'Estrétefonds / 31620. Keep distinct source manifests/licenses and explicit partial coverage; do not claim national completeness, mix grades, or derive individual assignment. This completes the polygon-evidence prerequisite; downstream implementation may start with these real samples and preserve all limitations.
