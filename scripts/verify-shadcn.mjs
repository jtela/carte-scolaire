import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const components=['button','input','label','card','badge','alert','separator','skeleton','native-select']
const evidence=[]
for(const name of components){
 const url=`https://ui.shadcn.com/r/styles/base-nova/${name}.json`
 const response=await fetch(url);if(!response.ok)throw new Error(`${url}: ${response.status}`)
 const registry=await response.json()
 const source=registry.files.find(f=>f.path.endsWith(`/${name}.tsx`)).content
 const local=readFileSync(`src/components/ui/${name}.tsx`,'utf8')
 const canonicalSource=source.replace(/^"use client"\s*/, '').replace(/cn-font-heading /g, '')
  .replace('import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"','import { ChevronDownIcon } from "lucide-react"')
  .replace(/<IconPlaceholder\s+lucide="ChevronDownIcon"\s+tabler="IconSelector"\s+hugeicons="UnfoldMoreIcon"\s+phosphor="CaretDownIcon"\s+remixicon="RiArrowDownSLine"/, '<ChevronDownIcon')
 const canonicalLocal=local.replace(/^"use client"\s*/, '')
 if(canonicalSource.replace(/\s+/g,'')!==canonicalLocal.replace(/\s+/g,''))throw new Error(`Registry mismatch beyond documented CLI transforms: ${name}`)
 evidence.push({name,url,registryDependencies:registry.dependencies,sourceMatchExceptCliTransforms:true,cliTransforms:[...(source.startsWith('"use client"')&&!local.startsWith('"use client"')?['removed use client (rsc:false)']:[]),...(source.includes('IconPlaceholder')?['resolved IconPlaceholder to Lucide ChevronDownIcon']:[]),...(source.includes('cn-font-heading ')?['removed registry font-heading placeholder (system font)']:[])],sha256:createHash('sha256').update(local).digest('hex')})
}
writeFileSync('artifacts/shadcn-provenance.json',JSON.stringify({generator:'shadcn@4.21.4',style:'base-nova',checkedAt:new Date().toISOString(),components:evidence},null,2))
console.log(`Verified ${evidence.length} unmodified official component sources`)
function luminance(hex){const rgb=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
for(const [foreground,background] of [['ffffff','1d4ed8'],['475569','f8fafc'],['0f172a','ffffff'],['64748b','ffffff'],['1d4ed8','ffffff'],['b91c1c','ffffff']])console.log(`${foreground}/${background}: ${((Math.max(luminance(foreground),luminance(background))+.05)/(Math.min(luminance(foreground),luminance(background))+.05)).toFixed(2)}:1`)
