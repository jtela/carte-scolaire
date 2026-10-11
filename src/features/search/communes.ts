import type { SearchQuery } from './state'
export type Commune={code:string;nom:string;codesPostaux:string[];codeDepartement:string}
export async function searchCommunes(query:SearchQuery,signal:AbortSignal,fetcher:typeof fetch=fetch,timeoutMs=15000):Promise<Commune[]> {
 const url=new URL('https://geo.api.gouv.fr/communes')
 url.searchParams.set(query.kind==='postcode'?'codePostal':'nom',query.value)
 url.searchParams.set('fields','nom,code,codesPostaux,codeDepartement')
 url.searchParams.set('format','json')
 if(query.kind==='name') url.searchParams.set('limit','20')
 const response=await fetcher(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(timeoutMs)])})
 if(!response.ok) throw new Error(`HTTP ${response.status}`)
 const rows:unknown=await response.json()
 if(!Array.isArray(rows) || rows.some(row=>!row || typeof row.code!=='string' || !/^[0-9A-Z]{5}$/.test(row.code) || typeof row.nom!=='string' || !row.nom.trim() || typeof row.codeDepartement!=='string' || !Array.isArray(row.codesPostaux) || row.codesPostaux.some((code:unknown)=>typeof code!=='string' || !/^[0-9]{5}$/.test(code)))) throw new Error('Réponse communes invalide')
 return (rows as Commune[]).filter((row,i)=>rows.findIndex(r=>r.code===row.code)===i)
}
