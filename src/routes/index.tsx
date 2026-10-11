import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useReducer, useRef, useState } from 'react'
import { parseQuery, reducer } from '../features/search/state'
import { searchCommunes, type Commune } from '../features/search/communes'
import { forCommune } from '../features/sectors/repository'
import { SectorMap } from '../features/map/SectorMap'
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
 const messages={idle:'Recherchez une commune pour afficher ses secteurs.',invalid:'Saisissez un code postal à 5 chiffres ou un nom de commune.',searching:'Recherche des communes…','no-match':'Aucune commune trouvée.','choose-commune':'Plusieurs communes correspondent. Choisissez une commune.','loading-sectors':'Chargement des secteurs…',unavailable:'Limites des secteurs non disponibles dans les sources vérifiées pour cette commune.',empty:'Aucun polygone trouvé dans les données consultées.',ready:state.sectors?.result.kind==='ready'?`${state.sectors.result.features.length} secteurs intersectant ou bordant la commune. Couverture partielle.`:'',error:state.stage==='sectors'?'Impossible de charger les secteurs.':'Recherche indisponible.'}
 const sources=state.sectors?.datasets.filter((d,i,all)=>all.findIndex(other=>other.sourceId===d.sourceId)===i)||[]
 return <main data-state={state.kind}>
  <h1>Secteurs des collèges publics</h1>
  <form onSubmit={event=>{event.preventDefault();void search()}} noValidate>
   <div className="field"><label htmlFor="query">Code postal ou commune</label><input id="query" ref={field} value={input} maxLength={120} autoComplete="off" placeholder="01000 ou Saint-Étienne" aria-invalid={state.kind==='invalid'} aria-describedby="status" onChange={event=>{setInput(event.target.value);begin('idle')}}/></div>
   <button type="submit">Afficher la carte</button>
  </form>
  <p id="status" role="status" aria-live="polite">{messages[state.kind]} {state.message}</p>
  {state.kind==='error' && <button onClick={retry}>Réessayer</button>}
  {state.kind==='choose-commune' && <div className="choices">
   {state.candidates!.length>=20 && <p>Affinez le nom de la commune : la liste est limitée à 20 résultats.</p>}
   <label htmlFor="commune">Commune trouvée</label><select id="commune" value={choice} onChange={event=>setChoice(event.target.value)}><option value="">Choisissez une commune</option>{state.candidates!.map(c=><option key={c.code} value={c.code}>{c.nom} ({c.codeDepartement}) — {c.codesPostaux.join(', ')}</option>)}</select><button onClick={choose} disabled={!choice}>Choisir</button>
  </div>}
  <p className="coverage">Sources vérifiées : Haute-Garonne (entrée en 6ème, année non précisée) et Paris (2026–2027). Couverture partielle, pas de garantie d’affectation.</p>
  {state.commune && <h2>{state.commune.nom} <small>({state.commune.code})</small></h2>}
  {state.sectors?.entry && <p className="limitation">{state.sectors.entry.limitation}</p>}
  {state.kind==='ready' && state.sectors?.result.kind==='ready' && <SectorMap key={state.generation} commune={state.commune!.nom} features={state.sectors.result.features} bounds={state.sectors.entry!.bounds}/>}
  {state.kind!=='ready' && <div className="placeholder">Aucun secteur affiché.</div>}
  {sources.map(d=><p className="provenance" key={d.sourceId}><a href={d.catalogUrl} target="_blank" rel="noreferrer">{d.title}</a> — {d.publisher}. Année scolaire : {d.schoolYear||'non précisée'}. Source modifiée : {d.sourceModifiedAt||'non précisée'}. Téléchargé le {d.retrievedAt}. <a href={d.licenseUrl} target="_blank" rel="noreferrer">{d.licenseName}</a>.</p>)}
 </main>
}
