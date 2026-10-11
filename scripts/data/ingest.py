"""Normalize verified source snapshots, never alter polygon coordinates."""
import hashlib, json

def normalize(collection, dataset_id):
 if collection.get('type')!='FeatureCollection' or not collection.get('features'):
  raise ValueError('Expected nonempty FeatureCollection')
 result=[]
 for f in collection['features']:
  p=f['properties']; geometry=f['geometry']
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
  else: raise ValueError('Unknown adapter')
  if not colleges or any(not c['name'].strip() for c in colleges): raise ValueError('Missing college name')
  result.append({'type':'Feature','geometry':geometry,'properties':{'id':dataset_id+':'+source_id,'datasetId':dataset_id,'sourceFeatureId':source_id,'colleges':colleges,'catchmentCommuneCodes':None,'schoolYear':year}})
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
 manifest={'schemaVersion':1,'generatedAt':datetime.now(timezone.utc).isoformat(),'datasets':[],'communes':{},'contours':[]}
 pending={}
 for dataset_id,filename,expected,contourfile,title,publisher,catalog,download,license_name,license_url,modified,year in sources:
  raw=(inputs/filename).read_bytes()
  digest=hashlib.sha256(raw).hexdigest()
  if digest!=expected: raise ValueError('Source hash changed: review source/schema/license first')
  features=normalize(json.loads(raw),dataset_id)
  for f in features:
   if not shape(f['geometry']).is_valid: raise ValueError('Invalid topology; do not silently repair')
  # These contours are frozen provenance inputs just like the sector exports.
  # A refresh must explicitly review both snapshots, never silently lose coverage.
  contour_hash,contour_count=('442e14ca70ba52747a0b76d8657c9054fec21e4347f5980bab7b6229bcd13c6b',586) if dataset_id=='hg-6eme' else ('802b9f1917d0aed9e9e4d81ef664fa2aa292fe70078600fe8a1d076892a083ca',1)
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
  index=associate(features,contours)
  if set(index)!=codes:
   raise ValueError(f'Incomplete contour index: {contourfile}')
  manifest['contours'].append({'filename':contourfile,'sha256':hashlib.sha256(contour_raw).hexdigest(),'sourceUrl':'https://geo.api.gouv.fr/departements/31/communes?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour' if dataset_id=='hg-6eme' else 'https://geo.api.gouv.fr/communes/75056?fields=nom,code,codesPostaux,codeDepartement&format=geojson&geometry=contour','retrievedAt':'2026-10-11','licenseName':'Licence Ouverte v2.0'})
  note='Couverture partielle : secteurs intersectant ou bordant la commune ; aucune garantie d’affectation individuelle. Les contours peuvent créer des intersections marginales.'
  if dataset_id=='hg-6eme': note+=' Entrée en 6ème uniquement ; année scolaire non précisée par la source.'
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
   pending[asset]=content
   manifest['datasets'].append({'id':chunk_id,'sourceId':dataset_id,'title':title,'publisher':publisher,'catalogUrl':catalog,'downloadUrl':download,'licenseName':license_name,'licenseUrl':license_url,'sourceModifiedAt':modified,'schoolYear':year,'retrievedAt':'2026-10-11','sha256':digest,'assetSha256':hashlib.sha256(content).hexdigest(),'assetPath':asset,'crs':'EPSG:4326','featureCount':len(chunk),'coverageNote':note})
  for f in contours:
   code=f['properties']['code']; bounds=shape(f['geometry']).bounds
   ids=[identities[i] for i in index[code]]
   manifest['communes'][code]={'datasetIds':sorted({chunk_for[i] for i in ids}) or [f'{dataset_id}-1'],'featureIds':ids,'coverage':'partial','associationMethod':'geometry-intersection','limitation':note,'bounds':list(bounds)}
 # Validate the complete candidate and serialize all fallible diagnostics before publication.
 if len(manifest['communes'])!=587:
  raise ValueError('Incomplete contour index: expected 587 verified communes')
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
