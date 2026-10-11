# Versailles public collège sector data — evidence and limitations

Research retrieved 2026-10-11. This documents source discovery only; the application was not changed or published.

## Verified official source and vintage

The Conseil départemental des Yvelines page “Sectorisation des collèges” says the sectorization tool identifies a public collège from a home address and links to its official interactive map. The page was last updated November 2025: https://78-92.fr/annuaire/aides-et-services/detail/sectorisation-des-colleges

The linked official Experience is titled “Sectorisation des collèges 2025-2026”; its explanatory text says information is for school year 2025–2026, the map is indicative, and only the Conseil départemental deliberation is legally opposable: https://experience.arcgis.com/experience/289afd3aa2884a52a61efbf29b548e0d

The ArcGIS Experience configuration identifies web map `c9592ba4d43646c4b84af3384eafb158` and Yvelines SIG services. Layer 63 (`secto_zonage`) is a polygon feature layer keyed/rendered by `RNE`; layer metadata exposes `ID_COMM`, `NOMCOM`, `NUM_INSEE`, `SECTORISATION`, and `RNE`. Its related college table is 55 (one-to-one relationship on RNE). The Experience’s own text is authoritative for the year; do not label these as 2026–2027.

Official layer metadata endpoint: https://sig.yvelines.fr/arcgis/rest/services/INTERNET/web_sectorisation_coll%C3%A8ges/MapServer/63?f=pjson
Feature query used to obtain the full actual polygon feature collection (URL-encode the query parameters):

`https://sig.yvelines.fr/arcgis/rest/services/INTERNET/web_sectorisation_coll%C3%A8ges/MapServer/63/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson`

Downloaded snapshot: `research/versailles/sectors-2025-2026.geojson` (7,360,518 bytes; SHA-256 `4678fdad2144a1cf52fe3b405d455f52ff5e771925aa4a9e47d7aa6fd2535af6`). Its coordinates are requested in EPSG:4326. Raw metadata snapshot: `research/versailles/layer63-metadata.json` (106,665 bytes; SHA-256 `946c3c068075026ef77d8b55ae417a210558e604f6b1274206cc1c52e71b6288`). Reproduce retrieval using curl with the endpoint and parameters above; then run `sha256sum` to compare bytes (source may change over time).

## Versailles features and RNE crosswalk (verified from saved source snapshots)

Versailles is commune code 78646, postcode 78000, department 78 per the official commune endpoint above. The publisher's zone commune field `NUM_INSEE` (not the collège's physical-address commune, and not every sliver touching the commune contour) identifies 9 layer-63 polygon records for Versailles, associated with 5 distinct RNEs. Independently filter the saved GeoJSON on `NUM_INSEE == '78646'` to reproduce; do not use raw geometric intersection alone to assign a sector. These are genuine source polygons, not reconstructed from points or municipal boundaries.

The official related college table snapshot `research/versailles/colleges-table55.json` was retrieved from MapServer layer 55 with `where=1=1`, `outFields=*`, `returnGeometry=false`, `f=json`. Join the nine zone records to the table by exact `RNE` = `COL_CODE`. The five Versailles-sector collège names and UAI/RNE values are: Collège Clagny — 0781298M; Collège Hoche — 0781106D; Collège Pierre de Nolhac — 0780580G; Collège Raymond Poincaré — 0780718G; Collège Jean Philippe Rameau — 0781107E. Do not use or publish unrelated personnel/contact fields present in the source table.

## Geometry semantics and limitations

Do not use layers 51 or 52 as collège sectors; their metadata describes commune boundaries. Layer 63 is configured by the official 2025–2026 Experience as the polygon sector layer keyed/styled by RNE and related to college records, although its REST description repeats a commune-boundary description. This is an internal metadata contradiction. The publisher's `NUM_INSEE` selection provides a reproducible Versailles slice, but the available evidence does not yet independently validate representative street-address assignments against the official address locator or adopted deliberation. Border areas and individual assignment/exemptions require care; the official tool states it is indicative and only the Department's deliberation is opposable.

## Reuse conditions assessment

The ArcGIS item `licenseInfo`/`accessInformation` and layer `copyrightText` are blank, and no specific open-data license was identified on the departmental page or Experience. This does not, by itself, establish that reuse is forbidden. The saved official data.gouv.fr legal guide (`research/versailles/public-data-reuse-guidance.md`, source URL therein) explains that for public administrative documents with no stated reuse conditions, CRPA Article L322-1 applies: attribution of source/date and no alteration of meaning, subject to applicable statutory exceptions and third-party rights. This is not an Etalab license grant. The Department/DSDEN governance and the identifiable school attributes warrant keeping the source attribution and integrity caveat; do not claim an explicit departmental license. The available evidence supports a bounded, attributed factual dataset handoff, while exact legal applicability/third-party rights remain a caveat rather than a blanket prohibition.

## Verified facts, inference, uncertainty

- Verified: official source vintage is school year 2025–2026, indicative only.
- Verified: publisher layer 63 contains real polygons; its configured RNE key relates zones to collège records.
- Verified from local snapshots: 9 zone features selected by `NUM_INSEE=78646`, five unique RNEs, and exact five-name/UAI crosswalk above.
- Verified: data.gouv.fr guidance says absent license conditions for covered public administrative documents is not equivalent to automatic prohibition; attribution/non-alteration rules may apply.
- Inference: the nine records represent the Versailles zone-associated sectors, based on the official app configuration and publisher commune field; this is safer than unqualified boundary intersections but not a tested address locator result.
- Uncertain: exact address-level assignments, applicability of any statutory exclusion or third-party rights, and a newer 2026–2027 dataset. No claim is made that 2025–2026 remains current.

## Sources

1. Conseil départemental des Yvelines, “Sectorisation des collèges,” last updated November 2025 (as stated on page): https://78-92.fr/annuaire/aides-et-services/detail/sectorisation-des-colleges
2. Conseil départemental des Yvelines, official interactive sectorization tool, titled “Sectorisation des collèges 2025-2026”: https://experience.arcgis.com/experience/289afd3aa2884a52a61efbf29b548e0d
3. Yvelines SIG ArcGIS REST layer 63 metadata and query endpoints above.
4. geo.api.gouv.fr commune endpoint for Versailles: https://geo.api.gouv.fr/communes/78646?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour
