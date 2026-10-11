import {readFile,stat} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {validateManifest,validateCollection} from '../../src/features/sectors/repository.ts'
const manifest=validateManifest(JSON.parse(await readFile('public/data/manifest.json','utf8')))
const features=new Map();let totalBytes=0
for(const dataset of manifest.datasets){
 const path='public/data/'+dataset.assetPath;const bytes=await readFile(path)
 if((await stat(path)).size>=5_000_000)throw new Error('Chunk too large')
 if(createHash('sha256').update(bytes).digest('hex')!==dataset.assetSha256)throw new Error('Asset checksum mismatch')
 for(const feature of validateCollection(JSON.parse(bytes),dataset)){
  if(features.has(feature.properties.id))throw new Error('Duplicate id across chunks')
  features.set(feature.properties.id,feature)
 }
 totalBytes+=bytes.length
}
for(const [code,entry] of Object.entries(manifest.communes))for(const id of entry.featureIds){
 if(!features.has(id) || !entry.datasetIds.includes(features.get(id).properties.datasetId))throw new Error('Invalid association '+code)
}
console.log(JSON.stringify({validated:true,datasets:manifest.datasets.length,features:features.size,indexedCommunes:Object.keys(manifest.communes).length,totalBytes,samples:Object.fromEntries(['31555','31066','31118','75056'].map(code=>[code,manifest.communes[code].featureIds.length]))},null,2))
