import { expect, it } from 'vitest'
import * as adapter from '../../src/features/search/communes'
it('encodes name and postcode correctly and preserves ranked ambiguous results', async () => {
 expect('searchCommunes' in adapter).toBe(true)
 const calls:string[]=[]
 const rows=[{code:'01053',nom:'Bourg-en-Bresse',codesPostaux:['01000'],codeDepartement:'01'},{code:'01344',nom:'Saint-Denis-lès-Bourg',codesPostaux:['01000'],codeDepartement:'01'}]
 const fetcher:typeof fetch=async url=>{calls.push(String(url));return new Response(JSON.stringify([...rows,rows[0]]))}
 const signal=new AbortController().signal
 expect(await adapter.searchCommunes({kind:'postcode',value:'01000'},signal,fetcher)).toEqual(rows)
 expect(new URL(calls[0]).searchParams.get('codePostal')).toBe('01000')
 await adapter.searchCommunes({kind:'name',value:'Évry & Paris'},signal,fetcher)
 expect(new URL(calls[1]).searchParams.get('nom')).toBe('Évry & Paris')
 expect(new URL(calls[1]).searchParams.get('limit')).toBe('20')
})
it.each([404,429,500])('treats HTTP %s as lookup failure, never empty',async status=>{
 const fetcher:typeof fetch=async()=>new Response('[]',{status})
 await expect(adapter.searchCommunes({kind:'name',value:'Paris'},new AbortController().signal,fetcher)).rejects.toThrow(`HTTP ${status}`)
})
it.each([null,{},[{code:12}], [{code:'75056',nom:'Paris',codesPostaux:[75001],codeDepartement:'75'}]])('rejects invalid commune schema %j',async data=>{
 const fetcher:typeof fetch=async()=>new Response(JSON.stringify(data))
 await expect(adapter.searchCommunes({kind:'name',value:'Paris'},new AbortController().signal,fetcher)).rejects.toThrow('communes')
})
it('passes cancellation and times out a stuck network fetch',async()=>{
 const controller=new AbortController()
 const fetcher:typeof fetch=(_url,options)=>new Promise((_,reject)=>options!.signal!.addEventListener('abort',()=>reject(options!.signal!.reason),{once:true}))
 await expect(adapter.searchCommunes({kind:'name',value:'Paris'},controller.signal,fetcher,5)).rejects.toMatchObject({name:'TimeoutError'})
 const request=adapter.searchCommunes({kind:'name',value:'Paris'},controller.signal,fetcher)
 controller.abort()
 await expect(request).rejects.toMatchObject({name:'AbortError'})
})
