# Attribution et licences des données

Données distinctes, non fusionnées en une base nationale :

- hg-6eme-*.geojson : Conseil départemental de la Haute-Garonne, Secteurs de recrutement des collèges publics pour l’entrée en 6ème. Licence Ouverte / Open Licence v2.0, https://www.etalab.gouv.fr/licence-ouverte-open-licence/. Téléchargement : 11 octobre 2026. Année scolaire non précisée. Métadonnées de modification liées au jour de collecte non utilisées comme millésime.
- paris-2026-*.geojson : Direction des Affaires Scolaires — Ville de Paris, Secteurs scolaires des collèges, année 2026–2027. Open Database License (ODbL) v1.0 : https://opendatacommons.org/licenses/odbl/1-0/. Cette base dérivée Paris est mise à disposition sous ODbL v1.0, avec ses géométries inchangées et propriétés normalisées. Modification source : 3 mars 2026 ; téléchargement : 11 octobre 2026. Conserver l’attribution et les obligations ODbL pour la redistribution de cette base.
- Index de relations géométriques commune/secteur : contours officiels geo.api.gouv.fr, Licence Ouverte v2.0. Association par intersection réelle (y compris touches et possibles intersections marginales), pas une règle d’affectation. La portion de l’index relative à Paris est distribuée sous ODbL avec la base Paris ; autres données sous leurs licences distinctes.

manifest.json expose URLs catalogues, téléchargements et licences, sommes SHA-256 des réponses sources et des assets, date de récupération, année nullable et limites. Les identifiants de features sans id éditeur utilisent le SHA-256 du feature source canonique tronqué à 20 caractères, namespacé par chunk. Ce sont des identifiants techniques, pas des codes administratifs inventés.

Aucune simplification, réparation, découpe géométrique, dérivation depuis l’adresse du collège ou polygone simulé. Les sources nationales DGESCO tabulaires ne sont pas utilisées pour dessiner des limites. La présence dans l’index signifie uniquement que les contours se croisent ou se touchent.
