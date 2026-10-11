# Carte scolaire

React 19 + TypeScript + TanStack Start, route unique pré-rendue puis hydratée, Leaflet chargé uniquement dans le navigateur. Interface française minimale pour rechercher une commune et afficher les vrais secteurs des collèges publics. Aucun backend déployé, clé, compte ou stockage de recherche.

## Couverture réelle et limites

Deux sources vérifiées et distinctes : Haute-Garonne, entrée en 6ème uniquement, année non précisée (104 features) ; Paris, année scolaire 2026–2027 (110 features). Les 586 communes HG et Paris ont été indexées contre leurs vrais contours officiels. 41 secteurs intersectent/bordent Toulouse, 2 Bessières, 4 Castelnau-d’Estrétefonds, 110 Paris. Les intersections marginales ne prouvent jamais une affectation. Pas de source nationale de polygones établie ; les autres communes affichent « non disponibles », jamais « aucun collège ». Un code postal parisien sélectionne toute la commune, pas une limite postale. Licences, provenance et checksums : public/data/manifest.json et public/data/LICENSES.md. Sources et réserves détaillées : docs/POLYGON_RESEARCH.md et docs/DATA_RESEARCH.md.

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

Ne jamais actualiser implicitement lors du build. Les scripts/data/ingest.py utilisent Shapely 2.2.0 pour l’intersection exacte des contours et génèrent des chunks inférieurs à 5 MB sans modifier les géométries. Les réponses originales sont conservées localement dans research/ (exclu du dépôt public). URLs et noms des quatre inputs sont dans docs/POLYGON_RESEARCH.md ; récupérer les deux exports et les deux contours dans un nouveau dossier, conserver leur licence/métadonnées, vérifier année/type/schéma/checksum et revoir les changements avant de changer les hashes autorisés des exports ET des contours, ainsi que leurs effectifs attendus, dans ingest.py. Un nouveau hash échoue fermé. Puis :

    python3 -m venv artifacts/data-env
    artifacts/data-env/bin/pip install Shapely==2.2.0
    artifacts/data-env/bin/python scripts/data/ingest.py --inputs research --output public/data
    artifacts/data-env/bin/python -m unittest discover -s tests/data -v
    npm run data:validate
    npm test
    npm run build
    npm run test:browser

Les tests Python de source nécessitent les réponses sources sauvegardées ; les tests npm et le validateur fonctionnent uniquement avec les snapshots publics distribués. Sources figées au 11 octobre 2026 : les fixtures Python ne sont pas une actualisation à la date d’exécution. Si une validation échoue, ne pas remplacer le manifeste précédent ni réparer silencieusement les limites. Chunks immuables écrits avant remplacement atomique du manifeste. Les sources ne déclarent pas ici de complétude nationale/individuelle.

## GitHub Pages (publication non effectuée)

Workflow manuel uniquement (.github/workflows/pages.yml), pas de trigger push. PM doit revoir puis coordonner le dépôt PUBLIC explicitement autorisé pour ce projet. Dépôt attendu carte-scolaire ; si le slug change, adapter APP_BASE_PATH et retester. Upload : dist/client seulement, jamais dist/server. Actions vérifiées dans leurs sources officielles le 11 octobre 2026 : checkout/setup-node v6, configure-pages v5, upload-pages-artifact/deploy-pages v4. L’exécution GitHub distante n’est pas revendiquée.

Avant publication, utiliser une liste positive des fichiers app : src/, public/, scripts/, tests/, configs, package.json/package-lock.json, README et rapports publics pertinents. .gitignore exclut credentials/.env, architecture/, research/, artifacts/, caches, navigateurs et notes internes PM/worker. Aucune publication, push, création distante ou dépense réalisée. Les artefacts de vérification restent locaux dans artifacts/ et docs/IMPLEMENTATION_REPORT.md.
