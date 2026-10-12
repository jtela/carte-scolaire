import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useReducer, useRef, useState } from 'react'
import { parseQuery, reducer } from '../features/search/state'
import { searchCommunes, type Commune } from '../features/search/communes'
import { forCommune } from '../features/sectors/repository'
import { SectorMap } from '../features/map/SectorMap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { MapPin, Search, Info } from 'lucide-react'
export const Route=createFileRoute('/')({component:SearchPage})
function SearchPage(){
 const [input,setInput]=useState('');const [choice,setChoice]=useState('')
 const [state,dispatch]=useReducer(reducer,{kind:'idle',generation:0})
 const generation=useRef(0);const controller=useRef<AbortController|null>(null);const field=useRef<HTMLInputElement>(null)
 useEffect(()=>()=>{++generation.current;controller.current?.abort()},[])
 const begin=(kind:typeof state.kind)=>{
  controller.current?.abort();controller.current=new AbortController()
  const id=++generation.current;setChoice('');dispatch({type:'reset',generation:id,kind})
  return {id,signal:controller.current.signal}
 }
 const load=async(commune:Commune,id:number,signal:AbortSignal)=>{
  if(id!==generation.current)return
  dispatch({type:'update',generation:id,patch:{kind:'loading-sectors',commune}})
  try{
   const sectors=await forCommune(commune,signal)
   if(id!==generation.current || signal.aborted)return
   dispatch({type:'update',generation:id,patch:{kind:sectors.result.kind,commune,sectors}})
  }catch(error){
   if(id!==generation.current || signal.aborted)return
   dispatch({type:'update',generation:id,patch:{kind:'error',stage:'sectors',commune,message:error instanceof Error && error.name==='TimeoutError'?'Délai dépassé.':''}})
  }
 }
 const search=async()=>{
  const query=parseQuery(input);const {id,signal}=begin(query?'searching':'invalid')
  if(!query){field.current?.focus();return}
  try{
   const candidates=await searchCommunes(query,signal)
   if(id!==generation.current || signal.aborted)return
   if(candidates.length===1)await load(candidates[0],id,signal)
   else dispatch({type:'update',generation:id,patch:{kind:candidates.length?'choose-commune':'no-match',candidates}})
  }catch(error){
   if(id!==generation.current || signal.aborted)return
   dispatch({type:'update',generation:id,patch:{kind:'error',stage:'lookup',message:error instanceof Error && error.name==='TimeoutError'?'Délai dépassé.':''}})
  }
 }
 const choose=()=>{
  const commune=state.candidates?.find(c=>c.code===choice)
  if(!commune || state.generation!==generation.current)return
  const {id,signal}=begin('loading-sectors');void load(commune,id,signal)
 }
 const retry=()=>{
  if(state.stage==='sectors' && state.commune){const {id,signal}=begin('loading-sectors');void load(state.commune,id,signal)}
  else void search()
 }
 const messages={idle:'Recherchez une commune pour afficher ses secteurs.',invalid:'Saisissez un code postal à 5 chiffres ou un nom de commune.',searching:'Recherche des communes…','no-match':'Aucune commune trouvée.','choose-commune':'Plusieurs communes correspondent. Choisissez une commune.','loading-sectors':'Chargement des secteurs…',unavailable:'Limites des secteurs non disponibles dans les sources vérifiées pour cette commune.',empty:'Aucun polygone trouvé dans les données consultées.',ready:state.sectors?.result.kind==='ready'?`${state.sectors.result.features.length} secteurs ${state.sectors.entry?.associationMethod==='publisher-codes'?'identifiés par les codes commune du producteur':'intersectant ou bordant la commune'}. Couverture partielle.`:'',error:state.stage==='sectors'?'Impossible de charger les secteurs.':'Recherche indisponible.'}
 const sources=state.sectors?.datasets.filter((d,i,all)=>all.findIndex(other=>other.sourceId===d.sourceId)===i)||[]
 const pending=state.kind==='searching'||state.kind==='loading-sectors'
 return <main data-state={state.kind}>
  <header className="page-header"><h1>Secteurs des collèges publics</h1><Badge variant="secondary">Couverture partielle</Badge></header>
  <div className="workspace">
   <aside className="sidebar" aria-label="Recherche de commune">
    <Card><CardHeader><CardTitle><h2>Rechercher une commune</h2></CardTitle></CardHeader><CardContent>
     <form className="search-form" onSubmit={event=>{event.preventDefault();void search()}} noValidate>
      <div className="field"><Label htmlFor="query">Code postal ou commune</Label><Input id="query" ref={field} value={input} maxLength={120} autoComplete="off" placeholder="01000 ou Saint-Étienne" aria-invalid={state.kind==='invalid'} aria-describedby="status" onChange={event=>{setInput(event.target.value);begin('idle')}}/></div>
      <Button className="primary-action" type="submit"><Search aria-hidden="true"/>Afficher la carte</Button>
     </form>
     <p id="status" role="status" aria-live="polite" className={state.kind==='error'||state.kind==='invalid'?'error-status':undefined}>{messages[state.kind]} {state.message}</p>
     {state.kind==='error' && <Button className="retry" variant="outline" type="button" onClick={retry}>Réessayer</Button>}
     {state.kind==='choose-commune' && <div className="choices mt-4">
      {state.candidates!.length>=20 && <p>Affinez le nom de la commune : la liste est limitée à 20 résultats.</p>}
      <div><Label htmlFor="commune">Commune trouvée</Label><NativeSelect id="commune" value={choice} onChange={event=>setChoice(event.target.value)}><NativeSelectOption value="">Choisissez une commune</NativeSelectOption>{state.candidates!.map(c=><NativeSelectOption key={c.code} value={c.code}>{c.nom} ({c.codeDepartement}) — {c.codesPostaux.join(', ')}</NativeSelectOption>)}</NativeSelect></div><Button type="button" onClick={choose} disabled={!choice}>Choisir</Button>
     </div>}
    </CardContent></Card>
    {state.commune && <Card><CardHeader><CardTitle><h2>{state.commune.nom} <small>({state.commune.code})</small></h2></CardTitle></CardHeader><CardContent><div className="commune-meta"><Badge variant="secondary">Couverture partielle</Badge>{state.sectors?.result.kind==='ready'&&<Badge variant="outline">{state.sectors.result.features.length} secteurs</Badge>}</div></CardContent></Card>}
   </aside>
   {state.kind==='ready' && state.sectors?.result.kind==='ready' ? <SectorMap key={state.generation} commune={state.commune!.nom} features={state.sectors.result.features} bounds={state.sectors.entry!.bounds}/> :
    <Card className="map-card"><CardHeader><CardTitle><h2>Carte des secteurs</h2></CardTitle></CardHeader><CardContent aria-busy={pending}><div className="placeholder"><MapPin className="size-8" aria-hidden="true"/><p>Aucun secteur affiché.</p>{pending && <div aria-hidden="true" className="w-full max-w-56 space-y-3"><Skeleton className="h-3 w-full"/><Skeleton className="h-3 w-2/3 mx-auto"/></div>}</div></CardContent></Card>}
  </div>
  <Alert role="region" aria-label="Couverture et limites" className="coverage-panel"><Info aria-hidden="true"/><AlertTitle>À savoir avant de consulter la carte</AlertTitle><AlertDescription><p className="coverage">Sources vérifiées : Haute-Garonne (entrée en 6ème, année non précisée), Paris (2026–2027) et Versailles (2025–2026, carte indicative). Couverture partielle, pas de garantie d’affectation.</p>{state.sectors?.entry && <p className="limitation">{state.sectors.entry.limitation}</p>}</AlertDescription></Alert>
  {sources.length>0&&<section className="sources" aria-label="Sources des données"><Separator className="mb-6"/><Card><CardHeader><CardTitle><h2>Sources des données</h2></CardTitle></CardHeader><CardContent>{sources.map(d=><p className="provenance" key={d.sourceId}><a href={d.catalogUrl} target="_blank" rel="noreferrer">{d.title}</a> — {d.publisher}. Année scolaire : {d.schoolYear||'non précisée'}. Source modifiée : {d.sourceModifiedAt||'non précisée'}. Téléchargé le {d.retrievedAt}. <a href={d.licenseUrl} target="_blank" rel="noreferrer">{d.licenseName}</a>.</p>)}</CardContent></Card></section>}
 </main>
}
