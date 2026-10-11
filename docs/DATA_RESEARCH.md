# Public collège sector data research

Research checked 10 October 2026. This is an evidence-backed source assessment, not a claim that polygons exist in the national source.

## Recommendation

Use the Ministry of Education national dataset `fr-en-carte-scolaire-colleges-publics` only as a structured, address-range/commune sector lookup, not as a polygon layer. It contains no geometry and no polygon export can be assumed merely because a GeoJSON export endpoint returns HTTP 200. The dataset records postal code, INSEE commune, street/number ranges, parity, establishment UAI and whether the whole commune has a unique sector. It therefore cannot directly power the requested polygon map. Do not draw synthetic boundaries from these records. Either change product scope to explain/address lookup (requires geocoding/address logic and explicit UX approval) or obtain genuine departmental polygon datasets and restrict map availability to verified departments. The current national input alone does not meet the polygon requirement.

## Verified national dataset

Official catalog metadata: https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-carte-scolaire-colleges-publics
Dataset records API: https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-carte-scolaire-colleges-publics/records
CSV export: https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-carte-scolaire-colleges-publics/exports/csv
GeoJSON export route probed: https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-carte-scolaire-colleges-publics/exports/geojson

Actual HTTP checks on 2026-10-10: catalog metadata and records returned successfully; CSV export returned 200, `text/csv`, CORS `Access-Control-Allow-Origin: *`, and a downloaded payload of 58,196,414 bytes (~55.5 MiB), despite a Range request. The GeoJSON export URL returned HTTP 200 and JSON content type, but metadata declares `geometry_types: null`, schema has no geometry field, and records are tabular only. A status code is not evidence of polygons. For a static browser client, the large CSV is a poor choice; query the records API with parameters and implement explicit pagination/filters, subject to rate limits and live availability. CORS on tested endpoints is permissive. Do not rely on the endpoint as a static hosting contract without rechecking.

Metadata observed: 499,680 records; annual update frequency; temporal coverage 2021–2023; complementary observation date 2023; publisher DGESCO; modified 2026-10-09. Metadata description says 2026 data covers 95 of 101 departments, excluding Charente-Maritime (17), Côtes-d’Armor (22), Corse-du-Sud (2A), Guadeloupe (971), Martinique (972), and Mayotte (976). It states the national dataset aggregates departmental files used by DASEN for automated collège assignment. Geographical coverage is France excluding Mayotte. This should be treated as coverage of the source's assignment/address data, not geometry coverage. The record count and 95-department claim were read directly from the live catalog metadata on the date above.

License: Licence Ouverte / Open Licence v2.0 (Etalab), as stated in catalog metadata. Preserve attribution to Direction générale de l'Enseignement scolaire and dataset title/vintage, and link to license. License source: https://www.etalab.gouv.fr/licence-ouverte-open-licence/

Schema (observed): `code_region`, `libelle_region`, `code_academie`, `libelle_academie`, `code_departement`, `libelle_departement`, `code_postal`, `code_insee`, `libelle_commune`, `lieu_dit`, `type_et_libelle`, `n_de_voie_debut`, `indice_de_repetition_debut`, `n_de_voie_fin`, `indice_de_repetition_fin`, `parite` (P/I/PI), `code_rne`, `secteur_unique` (O/N). No geometry, polygon, latitude/longitude, or address point field is present. `secteur_unique=O` means whole commune attached to same college(s), and in that case only commune INSEE code is specified; when N, road and number ranges are specified. A multi-collège sector can be shared.

Verified query examples:
- Records API example: `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-carte-scolaire-colleges-publics/records?limit=2&refine=code_postal%3A01000`. returned two real Ain rows: code postal `01000`, INSEE `01053`, Bourg-en-Bresse, street range records, RNE `0010018P` and `0010823P`, `secteur_unique=N`; full matching count reported 915.
- Querying with `where=libelle_commune like "BOURG-EN-BRESSE"&limit=2` returned records (total_count 728); use the returned rows as records, not geometry.
- `...?limit=2&refine=code_postal%3A75001` returned Paris 1er records; count 339.
- Querying `libelle_commune like "SAINT-DENIS-LÈS-BOURG"` returned an actual row for INSEE 01344, `code_postal=01000`, RNE 0011333U; illustrates postcode-search locality can return its own sector records.

Small probe files (raw real responses, provenance: URLs and retrieval date in this report): `research/01000-records.json`, `research/01000-communes.json`. We did not retain a full export.

## Local-source strategy and gaps

No authoritative nationwide public collège sector polygon source was established in this probe. The national file is address-to-college assignment data and does not encode drawn boundaries. Departments define college sectors (catalog description points to Code de l’éducation L213-1); polygon GIS files, if available, need to be found and validated department by department, with source owner, publication date, CRS, license and actual features verified. Do not conflate collège locations, commune boundaries, school catchments for primary schools, or local maps with sector polygons. A handful of departmental data portals cannot support a national search UX without clearly visible availability flags and a verified index.

## Commune search API verification

Official API base: https://geo.api.gouv.fr/communes
Postal code request actually tested: `https://geo.api.gouv.fr/communes?codePostal=01000&fields=nom%2Ccode%2CcodesPostaux&format=json` returned two communes, Bourg-en-Bresse (01053) and Saint-Denis-lès-Bourg (01344), both associated with 01000. Preserve postal codes as strings (leading zero matters) and always present multiple matches for user selection.

Accented exact commune name was successfully tested via curl `--get --data-urlencode`: `nom=Évry-Courcouronnes` returned Évry-Courcouronnes, INSEE 91228, postal codes 91000 and 91080. Unaccented `Saint-Etienne` was also tried; API returned a ranked fuzzy list including Saint-Étienne (42218), but also many other municipalities. Therefore normalize accents for candidate search if desired, but retain API ranking and require disambiguation rather than assuming a unique fuzzy match. API docs: https://geo.api.gouv.fr/decoupage-administratif/communes

## Implementation constraints / next decisions

1. Do not implement polygon mapping from the national CSV/records. It has no geometries.
2. Ask product owner/PM whether to revise scope to address/commune lookup (not a polygon map), or defer map until real polygon sources are identified. Do not silently substitute.
3. If retaining polygon scope, build a vetted manifest of departments/datasets and only report results for those with actual geometry. Explicitly report unavailable coverage elsewhere.
4. Recheck metadata, records, dataset modified/vintage and rights before refresh. Refresh should be reproducible, pin retrieval date/source URL/checksum, validate geometry and expected feature attributes, and fail closed on schema change/empty feeds. Never keep stale map results after failed refresh.
5. Attribute source agency, dataset title, vintage/retrieval date and Open Licence 2.0 terms wherever applicable. Verify each local department dataset's own license before redistribution in a static GitHub Pages repo.

## Sources

- DGESCO live dataset catalog/API and record/export endpoints above, checked 2026-10-10. Primary source.
- geo.api.gouv.fr commune endpoint and documentation above, checked 2026-10-10. Primary source.
- Code de l’éducation, article L213-1, linked in catalog description: https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031104883 (departmental council role in collège sectoring).
- Licence Ouverte v2.0 official information: https://www.etalab.gouv.fr/licence-ouverte-open-licence/.
