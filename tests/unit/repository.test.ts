import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import * as repo from '../../src/features/sectors/repository'
import type { Commune } from '../../src/features/search/communes'
const town:Commune={code:'31066',nom:'Bessières',codesPostaux:['31660'],codeDepartement:'31'}
const fromDisk:typeof fetch=async url=>new Response(readFileSync('public/'+String(url).replace('/carte-scolaire/',''),'utf8'))
it('loads only applicable chunks under repository subpath and returns full intersections',async()=>{
 expect('forCommune' in repo).toBe(true)
 const urls:string[]=[]
 const fetcher:typeof fetch=async (url,options)=>{urls.push(String(url));return fromDisk(url,options)}
 const response=await repo.forCommune(town,new AbortController().signal,'/carte-scolaire/',fetcher)
 expect(response.result.kind).toBe('ready')
 if(response.result.kind==='ready'){
  expect(response.result.features).toHaveLength(2)
  expect(response.result.coverage).toBe('partial')
 }
 expect(urls.every(url=>url.startsWith('/carte-scolaire/data/'))).toBe(true)
 expect(urls.some(url=>url.includes('paris'))).toBe(false)
})
it('distinguishes missing coverage and verified empty selection from HTTP or schema errors',async()=>{
 expect('forCommune' in repo).toBe(true)
 const signal=new AbortController().signal
 expect((await repo.forCommune({...town,code:'01053'},signal,'/carte-scolaire/',fromDisk)).result.kind).toBe('unavailable')
 const empty=structuredClone(manifest);empty.communes['31066'].featureIds=[]
 const emptyFetch:typeof fetch=async()=>new Response(JSON.stringify(empty))
 expect((await repo.forCommune(town,signal,'/carte-scolaire/',emptyFetch)).result.kind).toBe('empty')
 for(const fetcher of [async()=>new Response('{}',{status:404}),async()=>new Response('broken'),async()=>new Response('{}')]){
  await expect(repo.forCommune(town,signal,'/carte-scolaire/',fetcher)).rejects.toThrow()
 }
})
const manifest=JSON.parse(readFileSync('public/data/manifest.json','utf8'))
it('validates real source provenance and rejects unsafe asset and source URLs',()=>{
 expect('validateManifest' in repo).toBe(true)
 expect(repo.validateManifest(manifest).datasets).toHaveLength(5)
 for(const path of ['../secret','/outside','https://evil.invalid/file','sectors/../../secret','sectors\\evil','sectors/%2e%2e/a']){
  const m=structuredClone(manifest);m.datasets[0].assetPath=path
  expect(()=>repo.validateManifest(m)).toThrow('manifest')
 }
 for(const url of ['javascript:alert(1)','http://evil.invalid']){
  const m=structuredClone(manifest);m.datasets[0].licenseUrl=url
  expect(()=>repo.validateManifest(m)).toThrow('manifest')
 }
})
it('validates every real polygon without changing holes or coordinates',()=>{
 expect('validateCollection' in repo).toBe(true)
 for(const d of manifest.datasets){
  const data=JSON.parse(readFileSync('public/data/'+d.assetPath,'utf8'))
  expect(repo.validateCollection(data,d)).toEqual(data.features)
  for(const geometry of [null,{type:'Point',coordinates:[1,2]},{type:'Polygon',coordinates:[[[0,0],[1,0],[0,1]]]},{type:'Polygon',coordinates:[[[0,0],[181,0],[0,1],[0,0]]]}]){
   const bad=structuredClone(data);bad.features[0].geometry=geometry
   expect(()=>repo.validateCollection(bad,d)).toThrow('secteurs')
  }
  const bad=structuredClone(data);bad.features[0].properties.colleges=[]
  expect(()=>repo.validateCollection(bad,d)).toThrow('secteurs')
  const duplicate=structuredClone(data);duplicate.features[1]=duplicate.features[0]
  expect(()=>repo.validateCollection(duplicate,d)).toThrow('secteurs')
 }
})
