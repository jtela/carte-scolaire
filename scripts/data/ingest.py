"""Normalize verified source snapshots, never alter polygon coordinates."""
import hashlib, json

# Reviewed source-specific invariants, never inferred from a different adapter.
SOURCE_SPECS={
 'hg-6eme': {'contourHash':'442e14ca70ba52747a0b76d8657c9054fec21e4347f5980bab7b6229bcd13c6b','contourCount':586,'featureCount':104,'contourUrl':'https://geo.api.gouv.fr/departements/31/communes?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour','association':'geometry-intersection'},
 'paris-2026': {'contourHash':'802b9f1917d0aed9e9e4d81ef664fa2aa292fe70078600fe8a1d076892a083ca','contourCount':1,'featureCount':110,'contourUrl':'https://geo.api.gouv.fr/communes/75056?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour','association':'geometry-intersection'},
 'versailles-2025': {'contourHash':'e681e828e108cc78617a7e984a2b2bbbae65b9923beffcbdeaa36948dfdad6bd','contourCount':1,'featureCount':9,'contourUrl':'https://geo.api.gouv.fr/communes/78646?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour','association':'publisher-codes','codes':{'78646'},'crosswalkFile':'versailles/colleges-table55.json','crosswalkHash':'1f4b3ac0c26e1a664e8ce958f57f2e1117edd2cedabba4fa48f66c5fbfba4804'}
}

def normalize(collection, dataset_id, college_table=None):
 if collection.get('type')!='FeatureCollection' or not collection.get('features'):
  raise ValueError('Expected nonempty FeatureCollection')
 result=[]
 for f in collection['features']:
  p=f['properties']; geometry=f['geometry']
  if dataset_id=='versailles-2025' and str(p.get('NUM_INSEE'))!='78646': continue
  if geometry['type'] not in ('Polygon','MultiPolygon'):
   raise ValueError('Not a school-sector polygon')
  source_id=str(f.get('id') or hashlib.sha256(json.dumps(f,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:20])
  if dataset_id=='hg-6eme':
   name=p['college']
   if name.strip()=='Collège': name+=' — '+p['nom_officiel_commune']
   colleges=[{'name':name,'uai':p['uai']}]; year=None
  elif dataset_id=='paris-2026':
   if p['type_etabl']!='Collège' or p['annee_scol']!='2026-2027': raise ValueError('Unexpected Paris type/year')
   colleges=[{'name':p[f'lib_etab_{i}'],'uai':None} for i in range(1,5) if p.get(f'lib_etab_{i}')]
   year=p['annee_scol']
  elif dataset_id=='versailles-2025':
   if not college_table: raise ValueError('Missing official college crosswalk')
   matches=[row['attributes'] for row in college_table['features'] if row['attributes']['COL_CODE']==p['RNE']]
   if len(matches)!=1 or matches[0]['COL_TYPE']!='PU': raise ValueError('Invalid public college crosswalk')
   colleges=[{'name':'Collège '+matches[0]['COL_NOM'].title(),'uai':p['RNE']}]; year='2025-2026'
  else: raise ValueError('Unknown adapter')
  if not colleges or any(not c['name'].strip() for c in colleges): raise ValueError('Missing college name')
  result.append({'type':'Feature','geometry':geometry,'properties':{'id':dataset_id+':'+source_id,'datasetId':dataset_id,'sourceFeatureId':source_id,'colleges':colleges,'catchmentCommuneCodes':['78646'] if dataset_id=='versailles-2025' else None,'schoolYear':year}})
 if len({f['properties']['id'] for f in result})!=len(result): raise ValueError('Duplicate identity')
 return result

def associate(sectors, communes):
 from shapely.geometry import shape
 from shapely.strtree import STRtree
 geometries=[shape(f['geometry']) for f in sectors]
 tree=STRtree(geometries)
 return {f['properties']['code']:[sectors[int(i)]['properties']['id'] for i in sorted(tree.query(shape(f['geometry']),predicate='intersects'))] for f in communes}

def build_assets(inputs, output):
 from pathlib import Path
 from shapely.geometry import shape
 inputs=Path(inputs); output=Path(output)
 sources=[
  ('hg-6eme','pm-haute-garonne-6eme.geojson','9bd3df54d2ee0b4dfbc0d76d4db71cb0ff8648b537409fc1e13108a1e608ede9','pm-communes-31.geojson','Secteurs des collèges publics — entrée en 6ème','Conseil départemental de la Haute-Garonne','https://data.haute-garonne.fr/explore/dataset/sectorisation-colleges-classes-6eme/','https://data.haute-garonne.fr/api/explore/v2.1/catalog/datasets/sectorisation-colleges-classes-6eme/exports/geojson','Licence Ouverte v2.0','https://www.etalab.gouv.fr/licence-ouverte-open-licence/',None,None),
  ('paris-2026','pm-paris-2026-2027.geojson','312e4586b5416d5f1465bbcf0db9bdf3493ebe5bff9c2bbf542b56fa55ce3526','pm-commune-paris.geojson','Secteurs des collèges publics — Paris 2026–2027','Direction des Affaires Scolaires — Ville de Paris','https://opendata.paris.fr/explore/dataset/secteurs-scolaires-colleges/','https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/secteurs-scolaires-colleges/exports/geojson?where=annee_scol%3D%222026-2027%22','ODbL 1.0','https://opendatacommons.org/licenses/odbl/1-0/','2026-03-03','2026-2027')]
 from datetime import datetime, timezone
 sources.append(('versailles-2025','versailles/sectors-2025-2026.geojson','4678fdad2144a1cf52fe3b405d455f52ff5e771925aa4a9e47d7aa6fd2535af6','versailles/commune-78646.geojson','Secteurs des collèges publics — Versailles 2025–2026','Conseil départemental des Yvelines','https://78-92.fr/annuaire/aides-et-services/detail/sectorisation-des-colleges','https://sig.yvelines.fr/arcgis/rest/services/INTERNET/web_sectorisation_coll%C3%A8ges/MapServer/63/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson','Réutilisation attribuée ; aucune licence explicite identifiée (pas une Licence Ouverte)','https://guides.data.gouv.fr/guides/guide-juridique/reutilisateurs-de-donnees/respecter-les-conditions-de-reutilisation',None,'2025-2026'))
 manifest={'schemaVersion':1,'generatedAt':datetime.now(timezone.utc).isoformat(),'datasets':[],'communes':{},'contours':[]}
 pending={}
 for dataset_id,filename,expected,contourfile,title,publisher,catalog,download,license_name,license_url,modified,year in sources:
  spec=SOURCE_SPECS[dataset_id]
  raw=(inputs/filename).read_bytes()
  digest=hashlib.sha256(raw).hexdigest()
  if digest!=expected: raise ValueError('Source hash changed: review source/schema/license first')
  table=None
  if 'crosswalkFile' in spec:
   table_raw=(inputs/spec['crosswalkFile']).read_bytes()
   if hashlib.sha256(table_raw).hexdigest()!=spec['crosswalkHash']: raise ValueError('College crosswalk hash changed; review first')
   table=json.loads(table_raw)
  features=normalize(json.loads(raw),dataset_id,table)
  if len(features)!=spec['featureCount']: raise ValueError('Unexpected source feature count')
  for f in features:
   polygon=shape(f['geometry'])
   if polygon.is_empty or not polygon.is_valid: raise ValueError('Invalid topology; do not silently repair')
  # These contours are frozen provenance inputs just like the sector exports.
  # A refresh must explicitly review both snapshots, never silently lose coverage.
  contour_hash,contour_count=spec['contourHash'],spec['contourCount']
  contour_raw=(inputs/contourfile).read_bytes()
  if hashlib.sha256(contour_raw).hexdigest()!=contour_hash:
   raise ValueError(f'Contour snapshot changed: {contourfile}; review provenance/schema/coverage first')
  try:
   contour_json=json.loads(contour_raw)
   contours=contour_json['features'] if contour_json['type']=='FeatureCollection' else [contour_json]
   if not isinstance(contours,list) or len(contours)!=contour_count:
    raise ValueError('Unexpected contour count')
   codes=set()
   for contour in contours:
    code=contour['properties']['code']; geometry=contour['geometry']
    if contour['type']!='Feature' or not isinstance(code,str) or len(code)!=5 or code in codes:
     raise ValueError('Invalid or duplicate contour identity')
    polygon=shape(geometry)
    if geometry['type'] not in ('Polygon','MultiPolygon') or polygon.is_empty or not polygon.is_valid:
     raise ValueError('Invalid contour polygon')
    codes.add(code)
  except (KeyError,TypeError,ValueError) as exc:
   raise ValueError(f'Invalid contours: {contourfile}: {exc}') from exc
  if 'codes' in spec and codes!=spec['codes']: raise ValueError('Unexpected source commune codes')
  if spec['association']=='publisher-codes':
   index={code:[f['properties']['id'] for f in features if code in f['properties']['catchmentCommuneCodes']] for code in codes}
  else: index=associate(features,contours)
  if set(index)!=codes:
   raise ValueError(f'Incomplete contour index: {contourfile}')
  manifest['contours'].append({'filename':contourfile,'sha256':hashlib.sha256(contour_raw).hexdigest(),'sourceUrl':spec['contourUrl'],'retrievedAt':'2026-10-12' if dataset_id=='versailles-2025' else '2026-10-11','licenseName':'Licence Ouverte v2.0'})
  note='Couverture partielle : secteurs intersectant ou bordant la commune ; aucune garantie d’affectation individuelle. Les contours peuvent créer des intersections marginales.'
  if dataset_id=='hg-6eme': note+=' Entrée en 6ème uniquement ; année scolaire non précisée par la source.'
  if dataset_id=='versailles-2025': note='Couverture partielle : 9 zones identifiées par les codes commune du producteur NUM_INSEE=78646, 5 collèges publics. Année scolaire 2025–2026 uniquement, pas de millésime 2026–2027 vérifié. Carte indicative : seule la délibération du Département est opposable ; vérifier l’adresse et les dérogations avec le Département. Métadonnées de couche contradictoires et discordances entre zonage et voirie ; affectations individuelles non garanties. Consulter l’outil officiel pour une adresse.'
  chunks=[[]]; size=0
  for feature in features:
   length=len(json.dumps(feature,ensure_ascii=False,separators=(',',':')).encode())+1
   if length>=4_500_000: raise ValueError('One feature exceeds chunk budget')
   if size+length>4_500_000: chunks.append([]); size=0
   chunks[-1].append(feature); size+=length
  identities={}; chunk_for={}
  for number,chunk in enumerate(chunks,1):
   chunk_id=f'{dataset_id}-{number}'
   for feature in chunk:
    props=feature['properties']; original=props['id']
    props['datasetId']=chunk_id; props['id']=chunk_id+':'+props['sourceFeatureId']
    identities[original]=props['id']; chunk_for[props['id']]=chunk_id
   asset=f'sectors/{chunk_id}.{digest[:12]}.geojson'
   content=json.dumps({'type':'FeatureCollection','features':chunk},ensure_ascii=False,separators=(',',':')).encode()
   # Multi-input adapters must change asset URL when names/crosswalk change too.
   if table is not None: asset=f'sectors/{chunk_id}.{hashlib.sha256(content).hexdigest()[:12]}.geojson'
   pending[asset]=content
   manifest['datasets'].append({'id':chunk_id,'sourceId':dataset_id,'title':title,'publisher':publisher,'catalogUrl':catalog,'downloadUrl':download,'licenseName':license_name,'licenseUrl':license_url,'sourceModifiedAt':modified,'schoolYear':year,'retrievedAt':'2026-10-11','sha256':digest,'assetSha256':hashlib.sha256(content).hexdigest(),'assetPath':asset,'crs':'EPSG:4326','featureCount':len(chunk),'coverageNote':note})
   if table is not None:
    manifest['datasets'][-1].update({'crosswalkSha256':spec['crosswalkHash'],'crosswalkUrl':'https://sig.yvelines.fr/arcgis/rest/services/INTERNET/web_sectorisation_coll%C3%A8ges/MapServer/55/query?where=1%3D1&outFields=*&returnGeometry=false&f=json','officialMapUrl':'https://experience.arcgis.com/experience/289afd3aa2884a52a61efbf29b548e0d'})
  for f in contours:
   code=f['properties']['code']; bounds=shape(f['geometry']).bounds
   ids=[identities[i] for i in index[code]]
   if code in manifest['communes']: raise ValueError('Overlapping source commune: explicit merge review required')
   manifest['communes'][code]={'datasetIds':sorted({chunk_for[i] for i in ids}) or [f'{dataset_id}-1'],'featureIds':ids,'coverage':'partial','associationMethod':spec['association'],'limitation':note,'bounds':list(bounds)}
 # Validate the complete candidate and serialize all fallible diagnostics before publication.
 expected_communes=sum(SOURCE_SPECS[source[0]]['contourCount'] for source in sources)
 if len(manifest['communes'])!=expected_communes:
  raise ValueError(f'Incomplete contour index: expected {expected_communes} verified communes')
 known_ids={f['properties']['id'] for content in pending.values() for f in json.loads(content)['features']}
 for entry in manifest['communes'].values():
  if not set(entry['featureIds']).issubset(known_ids):
   raise ValueError('Invalid contour index references')
 summary=json.dumps({'features':sum(d['featureCount'] for d in manifest['datasets']),'indexedCommunes':len(manifest['communes']),'nonemptyCommunes':sum(bool(e['featureIds']) for e in manifest['communes'].values()),'bytes':{a:len(b) for a,b in pending.items()},'samples':{c:len(manifest['communes'][c]['featureIds']) for c in ['31555','31066','31118','75056']}})
 manifest_content=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
 print(summary)
 # No files are touched until every source, contour and candidate index has been checked.
 for asset,content in pending.items():
  target=output/asset; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(content)
 output.mkdir(parents=True,exist_ok=True)
 temporary=output/'manifest.pending.json'; temporary.write_text(manifest_content)
 temporary.replace(output/'manifest.json')
 return manifest

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser(); parser.add_argument('--inputs',default='research'); parser.add_argument('--output',default='public/data')
 args=parser.parse_args(); build_assets(args.inputs,args.output)
