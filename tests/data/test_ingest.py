import unittest, importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class IngestionTests(unittest.TestCase):
 def test_real_sources_preserve_geometries_and_multiple_colleges(self):
  path=ROOT/'scripts/data/ingest.py'
  self.assertTrue(path.exists(), 'real-source ingestion is missing')
  spec=importlib.util.spec_from_file_location('ingest',path)
  module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
  hg=json.loads((ROOT/'research/pm-haute-garonne-6eme.geojson').read_text())
  paris=json.loads((ROOT/'research/pm-paris-2026-2027.geojson').read_text())
  h=module.normalize(hg,'hg-6eme'); p=module.normalize(paris,'paris-2026')
  self.assertEqual(len(h),104); self.assertEqual(len(p),110)
  self.assertEqual([f['geometry'] for f in h],[f['geometry'] for f in hg['features']])
  self.assertEqual([f['geometry'] for f in p],[f['geometry'] for f in paris['features']])
  self.assertTrue(all(f['properties']['schoolYear']=='2026-2027' for f in p))
  self.assertTrue(all(f['properties']['schoolYear'] is None for f in h))
  self.assertTrue(any(len(f['properties']['colleges'])>1 for f in p))
 def test_versailles_publisher_slice_preserves_all_nine_geometries_and_exact_crosswalk(self):
  spec=importlib.util.spec_from_file_location('ingest',ROOT/'scripts/data/ingest.py')
  module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
  source=json.loads((ROOT/'research/versailles/sectors-2025-2026.geojson').read_text())
  table=json.loads((ROOT/'research/versailles/colleges-table55.json').read_text())
  expected=[f for f in source['features'] if str(f['properties']['NUM_INSEE'])=='78646']
  self.assertEqual(len(expected),9)
  result=module.normalize(source,'versailles-2025',table)
  self.assertEqual([f['geometry'] for f in result],[f['geometry'] for f in expected])
  self.assertEqual({f['properties']['colleges'][0]['uai'] for f in result},{'0781298M','0781106D','0780580G','0780718G','0781107E'})
  for feature in result:
   self.assertEqual(feature['properties']['catchmentCommuneCodes'],['78646'])
   self.assertEqual(feature['properties']['schoolYear'],'2025-2026')
   self.assertTrue(feature['properties']['colleges'][0]['name'].startswith('Collège '))
   self.assertEqual(set(feature['properties']),{'id','datasetId','sourceFeatureId','colleges','catchmentCommuneCodes','schoolYear'})
 def test_versailles_crosswalk_rejects_missing_duplicate_and_private_colleges(self):
  import copy
  spec=importlib.util.spec_from_file_location('ingest',ROOT/'scripts/data/ingest.py')
  module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
  source=json.loads((ROOT/'research/versailles/sectors-2025-2026.geojson').read_text())
  table=json.loads((ROOT/'research/versailles/colleges-table55.json').read_text())
  match=next(row for row in table['features'] if row['attributes']['COL_CODE']=='0781298M')
  missing=copy.deepcopy(table); missing['features']=[row for row in missing['features'] if row['attributes']['COL_CODE']!='0781298M']
  duplicate=copy.deepcopy(table); duplicate['features'].append(copy.deepcopy(match))
  private=copy.deepcopy(table)
  next(row for row in private['features'] if row['attributes']['COL_CODE']=='0781298M')['attributes']['COL_TYPE']='PR'
  for invalid in [missing,duplicate,private]:
   with self.assertRaisesRegex(ValueError,'crosswalk'): module.normalize(source,'versailles-2025',invalid)
  relocated=copy.deepcopy(table)
  for row in relocated['features']: row['attributes']['COL_COMMUN']='NOT VERSAILLES'
  self.assertEqual(len(module.normalize(source,'versailles-2025',relocated)),9,'Do not filter zones by college address commune')
 def test_association_uses_polygon_intersection_not_location_or_bbox(self):
  spec=importlib.util.spec_from_file_location('ingest',ROOT/'scripts/data/ingest.py')
  module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
  self.assertTrue(hasattr(module,'associate'), 'contour association missing')
  def f(code, points): return {'type':'Feature','geometry':{'type':'Polygon','coordinates':[points]},'properties':{'code':code,'id':code}}
  sector=f('s',[[0,0],[2,0],[0,2],[0,0]])
  communes=[f('inside',[[0.1,0.1],[0.2,0.1],[0.1,0.2],[0.1,0.1]]),f('bbox-only',[[1.5,1.5],[1.8,1.5],[1.5,1.8],[1.5,1.5]]),f('touch',[[2,0],[3,0],[2,1],[2,0]])]
  index=module.associate([sector],communes)
  self.assertEqual(index,{'inside':['s'],'bbox-only':[],'touch':['s']})
 def test_assets_include_all_communes_with_bounded_chunks_and_provenance(self):
  import tempfile
  spec=importlib.util.spec_from_file_location('ingest',ROOT/'scripts/data/ingest.py')
  module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
  self.assertTrue(hasattr(module,'build_assets'), 'asset builder missing')
  with tempfile.TemporaryDirectory(dir=ROOT/'artifacts') as tmp:
   manifest=module.build_assets(ROOT/'research',Path(tmp))
   self.assertEqual(len(manifest['communes']),588)
   versailles=manifest['communes']['78646']
   self.assertEqual(len(versailles['featureIds']),9)
   self.assertEqual(versailles['associationMethod'],'publisher-codes')
   dataset=next(d for d in manifest['datasets'] if d['sourceId']=='versailles-2025')
   self.assertEqual(dataset['schoolYear'],'2025-2026')
   self.assertIn('aucune licence explicite',dataset['licenseName'])
   self.assertEqual(dataset['crosswalkSha256'],'1f4b3ac0c26e1a664e8ce958f57f2e1117edd2cedabba4fa48f66c5fbfba4804')
   self.assertTrue(dataset['assetPath'].endswith(dataset['assetSha256'][:12]+'.geojson'),'New multi-input snapshot path must depend on final asset bytes')
   self.assertEqual(len(manifest['communes']['31555']['featureIds']),41)
   self.assertEqual(len(manifest['communes']['31066']['featureIds']),2)
   self.assertEqual(len(manifest['communes']['31118']['featureIds']),4)
   self.assertEqual(len(manifest['communes']['75056']['featureIds']),110)
   for d in manifest['datasets']:
    self.assertTrue(d['licenseUrl'].startswith('https://'))
    self.assertEqual(len(d['sha256']),64)
    self.assertLess((Path(tmp)/d['assetPath']).stat().st_size,5_000_000)
class RefreshSafetyTests(unittest.TestCase):
 def test_changed_versailles_inputs_preserve_manifest_and_every_asset(self):
  import tempfile, shutil
  spec=importlib.util.spec_from_file_location('ingest',ROOT/'scripts/data/ingest.py')
  module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
  for filename,pattern in [('sectors-2025-2026.geojson','Source hash'),('colleges-table55.json','crosswalk hash'),('commune-78646.geojson','Contour snapshot')]:
   with self.subTest(filename=filename), tempfile.TemporaryDirectory(dir=ROOT/'artifacts') as tmp:
    inputs=Path(tmp)/'inputs'; inputs.mkdir(); output=Path(tmp)/'output'
    for old in ['pm-haute-garonne-6eme.geojson','pm-paris-2026-2027.geojson','pm-communes-31.geojson','pm-commune-paris.geojson']: shutil.copy2(ROOT/'research'/old,inputs/old)
    shutil.copytree(ROOT/'research/versailles',inputs/'versailles')
    shutil.copytree(ROOT/'public/data',output)
    before={str(p.relative_to(output)):p.read_bytes() for p in output.rglob('*') if p.is_file()}
    (inputs/'versailles'/filename).write_text('{}')
    with self.assertRaisesRegex(ValueError,pattern): module.build_assets(inputs,output)
    after={str(p.relative_to(output)):p.read_bytes() for p in output.rglob('*') if p.is_file()}
    self.assertEqual(before,after,'Even a late-source failure must preserve every output byte')
 def test_invalid_contours_preserve_manifest_and_all_assets(self):
  import tempfile, shutil, copy
  spec=importlib.util.spec_from_file_location('ingest',ROOT/'scripts/data/ingest.py')
  module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
  original=json.loads((ROOT/'research/pm-communes-31.geojson').read_text())
  invalid_geometry=copy.deepcopy(original)
  invalid_geometry['features'][0]['geometry']={'type':'Point','coordinates':[1,43]}
  duplicate=copy.deepcopy(original)
  duplicate['features'][1]['properties']['code']=duplicate['features'][0]['properties']['code']
  missing=copy.deepcopy(original); missing['features'].pop()
  cases={'empty':{'type':'FeatureCollection','features':[]}, 'point':invalid_geometry,
         'duplicate':duplicate, 'missing':missing, 'malformed':{'type':'FeatureCollection','features':[{}]}}
  for name,payload in cases.items():
   with self.subTest(name=name), tempfile.TemporaryDirectory(dir=ROOT/'artifacts') as tmp:
    inputs=Path(tmp)/'inputs'; inputs.mkdir(); output=Path(tmp)/'output'
    for filename in ['pm-haute-garonne-6eme.geojson','pm-paris-2026-2027.geojson','pm-communes-31.geojson','pm-commune-paris.geojson']:
     shutil.copy2(ROOT/'research'/filename,inputs/filename)
    shutil.copytree(ROOT/'public/data',output)
    before={str(p.relative_to(output)):p.read_bytes() for p in output.rglob('*') if p.is_file()}
    (inputs/'pm-communes-31.geojson').write_text(json.dumps(payload))
    error=None
    try: module.build_assets(inputs,output)
    except Exception as exc: error=exc
    after={str(p.relative_to(output)):p.read_bytes() for p in output.rglob('*') if p.is_file()}
    self.assertTrue(after==before,'Rejected refresh must not touch any existing output')
    self.assertIsInstance(error,ValueError,'Invalid contours must raise a clear validation error')
    self.assertRegex(str(error),'[Cc]ontour')
if __name__=='__main__': unittest.main()
