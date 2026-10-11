# Carte scolaire

React 19 + TypeScript + TanStack Start, route unique pré-rendue puis hydratée, Leaflet chargé uniquement dans le navigateur. Interface française minimale pour rechercher une commune et afficher les vrais secteurs des collèges publics. Aucun backend déployé, clé, compte ou stockage de recherche.

## Couverture réelle et limites

Trois sources vérifiées et distinctes : Haute-Garonne, entrée en 6ème uniquement, année non précisée (104 features) ; Paris, année scolaire 2026–2027 (110 features) ; Versailles (INSEE 78646, nom « Versailles » ou code postal 78000), année 2025–2026 uniquement (9 zones, 5 collèges publics). Les 586 communes HG et Paris ont été indexées contre leurs vrais contours officiels. 41 secteurs intersectent/bordent Toulouse, 2 Bessières, 4 Castelnau-d’Estrétefonds, 110 Paris. Versailles utilise les codes commune des zones du producteur NUM_INSEE=78646, pas l’adresse des collèges ni les intersections marginales des communes voisines ; son contour officiel sert au cadrage uniquement. Total : 588 communes indexées, 223 features et 6 chunks. Carte Versailles indicative : seule la délibération départementale est opposable, aucune affectation individuelle ni année 2026–2027 vérifiée. Le contrôle de segments de voirie révèle aussi des discordances : ne pas déduire l’affectation d’un domicile de cette vue générale. Pas de source nationale de polygones établie ; les autres communes affichent « non disponibles », jamais « aucun collège ». Un code postal sélectionne une commune, pas une limite postale. Licences, provenance et checksums : public/data/manifest.json et public/data/LICENSES.md. Pas de licence explicite identifiée pour Yvelines : attribution/non-altération selon les conditions applicables, sans revendication Etalab. Sources et réserves détaillées : docs/POLYGON_RESEARCH.md, docs/DATA_RESEARCH.md et docs/VERSAILLES_DATA.md ; vérification de cette extension : docs/VERSAILLES_IMPLEMENTATION.md.

## Installer, exécuter et tester

Node 22.23.3 et npm 10.9.9 utilisés localement ; Node >=22.12 requis.

    npm ci --no-audit --no-fund
    npm run typecheck
    npm test
    npm run data:validate
    npm run build
    npx playwright install chromium
    npm run test:browser

Tests navigateur sur COPIE du build statique sous /carte-scolaire/ via Python 3, lié à 127.0.0.1:4185 uniquement. Le serveur de test démarre et s’arrête automatiquement. Les secteurs proviennent des téléchargements officiels réels ; les tuiles OSM sont interceptées uniquement pour les tests automatisés (politique OSM), et les tests d’erreur/ambiguïté/courses sont clairement étiquetés fixtures. Les cas réels utilisent l’API communes live sans stub. Pas de promesse de fonctionnement hors ligne de cette API. Les timeouts de transport sont de 15 secondes ; édition/soumission invalide annule et efface l’ancien résultat.

Pour prévisualiser manuellement le build sans serveur Node applicatif :

    node scripts/static-preview.mjs

Ouvrir http://127.0.0.1:4185/carte-scolaire/ ; Ctrl+C arrête le serveur. Dev : npm run dev. Uniquement la racine du site, aucun support de routes imbriquées. Recherche conservée en mémoire seulement ; rechargement revient à l’état initial.

## Actualisation explicite des sources

Ne jamais actualiser implicitement lors du build. Les scripts/data/ingest.py utilisent Shapely 2.2.0 pour l’intersection exacte HG/Paris et génèrent des chunks inférieurs à 5 MB sans modifier les géométries. Les réponses originales sont conservées localement dans research/ (exclu du dépôt public). URLs et noms des quatre inputs HG/Paris sont dans docs/POLYGON_RESEARCH.md ; les trois inputs supplémentaires Versailles sont research/versailles/sectors-2025-2026.geojson, colleges-table55.json et commune-78646.geojson (URLs/hashes dans docs/VERSAILLES_DATA.md et docs/VERSAILLES_IMPLEMENTATION.md). Récupérer les exports, table et contours dans un nouveau dossier, conserver leurs conditions/métadonnées, vérifier année/type/schéma/checksum et revoir les changements avant de changer les hashes autorisés des exports ET des contours/table, ainsi que leurs effectifs attendus et méthodes d’association dans ingest.py/SOURCE_SPECS. Le nouveau chunk Versailles utilise le hash des bytes normalisés pour que tout changement de jointure change son URL immuable. Un nouveau hash échoue fermé. Puis :

    python3 -m venv artifacts/data-env
    artifacts/data-env/bin/pip install Shapely==2.2.0
    artifacts/data-env/bin/python scripts/data/ingest.py --inputs research --output public/data
    artifacts/data-env/bin/python -m unittest discover -s tests/data -v
    npm run data:validate
    npm test
    npm run build
    npm run test:browser

Les tests Python de source nécessitent les réponses sources sauvegardées ; les tests npm et le validateur fonctionnent uniquement avec les snapshots publics distribués. Exports figés au 11 octobre 2026, contour Versailles récupéré le 12 octobre 2026 : les fixtures Python ne sont pas une actualisation à la date d’exécution. Si une validation échoue, ne pas remplacer le manifeste précédent ni réparer silencieusement les limites. Chunks immuables écrits avant remplacement atomique du manifeste. Les sources ne déclarent pas ici de complétude nationale/individuelle.

## GitHub Pages

Site public : https://jtela.github.io/carte-scolaire/
Dépôt public : https://github.com/jtela/carte-scolaire

Publication initiale autorisée et vérifiée le 11 octobre 2026 : déploiement GitHub Actions réussi, recherche par commune/code postal et vrais polygones vérifiés sur le site HTTPS. L’extension Versailles a été revue et sa publication autorisée par le propriétaire le 12 octobre 2026. Sa mise en ligne passe par le workflow manuel ci-dessous et une vérification du site public après déploiement. Les mentions « locale » ou « publication en attente » des rapports préalables décrivent leur état au moment de la revue. Les limites de couverture ci-dessus restent applicables.

Workflow manuel uniquement (.github/workflows/pages.yml), pas de trigger push. Pour republier une version revue, lancer ce workflow depuis GitHub Actions. Dépôt carte-scolaire ; si le slug change, adapter APP_BASE_PATH et retester. Upload : dist/client seulement, jamais dist/server. Actions vérifiées dans leurs sources officielles le 11 octobre 2026 : checkout/setup-node v6, configure-pages v5, upload-pages-artifact/deploy-pages v4.

Pour les mises à jour, conserver une liste positive des fichiers app : src/, public/, scripts/, tests/, configs, package.json/package-lock.json, README et rapports publics pertinents. .gitignore exclut credentials/.env, architecture/, research/, artifacts/, caches, navigateurs et notes internes PM/worker. Aucune dépense ni service payant ajouté. Les artefacts de vérification restent locaux dans artifacts/. docs/IMPLEMENTATION_REPORT.md décrit la validation préalable à la publication ; ses mentions de publication en attente sont historiques.
