import type { Manifest, Dataset, SectorFeature, SectorResponse } from './types'
import type { Commune } from '../search/communes'
export async function forCommune(commune:Commune,signal:AbortSignal,base=import.meta.env.BASE_URL,fetcher:typeof fetch=fetch,timeoutMs=15000):Promise<SectorResponse> {
 const operationSignal=AbortSignal.any([signal,AbortSignal.timeout(timeoutMs)])
 const read=async (path:string):Promise<unknown>=>{
  const response=await fetcher(`${base}data/${path}`,{signal:operationSignal})
  if(!response.ok) fail(`HTTP ${response.status}`)
  return response.json()
 }
 const manifest=validateManifest(await read('manifest.json'))
 operationSignal.throwIfAborted()
 const entry=manifest.communes[commune.code]
 if(!entry) return {result:{kind:'unavailable',reason:'not-catalogued'},datasets:[],entry:null}
 const datasets=manifest.datasets.filter(d=>entry.datasetIds.includes(d.id))
 if(!entry.featureIds.length) return {result:{kind:'empty',datasetIds:entry.datasetIds,coverage:entry.coverage},datasets,entry}
 const chunks=await Promise.all(datasets.map(async d=>validateCollection(await read(d.assetPath),d)))
 operationSignal.throwIfAborted()
 const ids=new Set(entry.featureIds)
 const features=chunks.flat().filter(f=>ids.has(f.properties.id))
 if(features.length!==ids.size) fail('Index secteurs incohérent')
 return {result:{kind:'ready',features,datasetIds:entry.datasetIds,coverage:entry.coverage},datasets,entry}
}
function polygon(value:unknown):boolean {
 if(!Array.isArray(value) || !value.length) return false
 return value.every(ring=>Array.isArray(ring) && ring.length>=4 && ring.every(point=>Array.isArray(point) && point.length>=2 && point.every(n=>typeof n==='number' && Number.isFinite(n)) && Math.abs(point[0])<=180 && Math.abs(point[1])<=90) && JSON.stringify(ring[0])===JSON.stringify(ring[ring.length-1]))
}
export function validateCollection(value:unknown,dataset:Dataset):SectorFeature[] {
 const c=record(value)
 if(c.type!=='FeatureCollection' || !Array.isArray(c.features) || c.features.length!==dataset.featureCount) fail('Données secteurs invalides')
 const ids=new Set<string>()
 for(const raw of c.features){
  const f=record(raw);const p=record(f.properties);const g=record(f.geometry)
  if(f.type!=='Feature' || !text(p.id) || ids.has(p.id) || p.datasetId!==dataset.id || !text(p.sourceFeatureId) || p.id!==dataset.id+':'+p.sourceFeatureId || p.schoolYear!==dataset.schoolYear || !(p.catchmentCommuneCodes===null || strings(p.catchmentCommuneCodes)) || !Array.isArray(p.colleges) || !p.colleges.length || p.colleges.some(raw=>{const college=record(raw);return !text(college.name) || !(college.uai===null || text(college.uai))}) || !(g.type==='Polygon'?polygon(g.coordinates):g.type==='MultiPolygon' && Array.isArray(g.coordinates) && g.coordinates.length>0 && g.coordinates.every(polygon))) fail('Données secteurs invalides')
  ids.add(p.id)
 }
 return c.features as SectorFeature[]
}
function fail(message:string):never { throw new Error(message) }
function record(value:unknown):Record<string,unknown> {
 if(!value || typeof value!=='object' || Array.isArray(value)) fail('Données manifest/secteurs invalides')
 return value as Record<string,unknown>
}
function text(value:unknown):value is string { return typeof value==='string' && value.trim().length>0 }
function strings(value:unknown):value is string[] { return Array.isArray(value) && value.every(text) }
function https(value:unknown):boolean { if(!text(value)) return false; try { const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password } catch {return false} }
export function validateManifest(value:unknown):Manifest {
 const m=record(value)
 if(m.schemaVersion!==1 || !text(m.generatedAt) || !Number.isFinite(Date.parse(m.generatedAt)) || !Array.isArray(m.datasets)) fail('Données manifest invalides')
 const ids=new Set<string>()
 for(const raw of m.datasets){
  const d=record(raw)
  if(!text(d.id) || ids.has(d.id) || !text(d.sourceId) || !text(d.title) || !text(d.publisher) || !text(d.licenseName) || !text(d.coverageNote) || !https(d.catalogUrl) || !https(d.downloadUrl) || !https(d.licenseUrl) || !text(d.assetPath) || !/^sectors\/[a-zA-Z0-9._-]+\.geojson$/.test(d.assetPath) || !text(d.sha256) || !/^[a-f0-9]{64}$/.test(d.sha256) || !text(d.assetSha256) || !/^[a-f0-9]{64}$/.test(d.assetSha256) || d.crs!=='EPSG:4326' || !Number.isInteger(d.featureCount) || Number(d.featureCount)<1 || !text(d.retrievedAt) || !Number.isFinite(Date.parse(d.retrievedAt)) || !(d.schoolYear===null || (text(d.schoolYear) && /^[0-9]{4}-[0-9]{4}$/.test(d.schoolYear))) || !(d.sourceModifiedAt===null || (text(d.sourceModifiedAt) && Number.isFinite(Date.parse(d.sourceModifiedAt))))) fail('Données manifest invalides')
  ids.add(d.id)
 }
 for(const [code,raw] of Object.entries(record(m.communes))){
  const e=record(raw)
  if(!/^[0-9A-Z]{5}$/.test(code) || !strings(e.datasetIds) || e.datasetIds.some(id=>!ids.has(id)) || !Array.isArray(e.featureIds) || !e.featureIds.every(text) || new Set(e.featureIds).size!==e.featureIds.length || !['complete','partial','unknown'].includes(String(e.coverage)) || !['publisher-codes','geometry-intersection'].includes(String(e.associationMethod)) || !text(e.limitation) || !Array.isArray(e.bounds) || e.bounds.length!==4 || !e.bounds.every(x=>typeof x==='number' && Number.isFinite(x)) || e.bounds[0]>e.bounds[2] || e.bounds[1]>e.bounds[3]) fail('Données manifest invalides')
 }
 return value as Manifest
}
