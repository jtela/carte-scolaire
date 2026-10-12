import {useEffect,useRef,useState} from 'react'
import type * as Leaflet from 'leaflet'
import type {SectorFeature} from '../sectors/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
const TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const normal={color:'#165e86',weight:2,fillColor:'#2e86b5',fillOpacity:0.18}
const active={color:'#101d28',weight:4,fillColor:'#d78722',fillOpacity:0.38}
export function SectorMap({features,bounds,commune}:{features:SectorFeature[];bounds:[number,number,number,number];commune:string}){
 const container=useRef<HTMLDivElement>(null);const map=useRef<Leaflet.Map|null>(null)
 const layers=useRef(new Map<string,Leaflet.Polygon>())
 const [selected,setSelected]=useState('');const [tileWarning,setTileWarning]=useState(false)
 const [mapError,setMapError]=useState(false);const [attempt,setAttempt]=useState(0)
 const [mapRevision,setMapRevision]=useState(0)
 useEffect(()=>{
  let disposed=false;let observer:ResizeObserver|undefined;let local:Leaflet.Map|undefined
  setMapError(false);setTileWarning(false)
  void import('leaflet').then(L=>{
   if(disposed || !container.current)return
   local=L.map(container.current,{zoomControl:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false})
   map.current=local
   L.control.zoom({zoomInTitle:'Agrandir la carte',zoomOutTitle:'Réduire la carte'}).addTo(local)
   L.tileLayer(TILE_URL,{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).on('tileerror',()=>{if(!disposed)setTileWarning(true)}).addTo(local)
   const collection:import('geojson').FeatureCollection={type:'FeatureCollection',features}
   L.geoJSON(collection,{style:normal,onEachFeature:(feature,layer)=>{
    const sector=feature as SectorFeature;const polygon=layer as Leaflet.Polygon
    const popup=document.createElement('div')
    for(const college of sector.properties.colleges){const p=document.createElement('p');p.textContent=college.name+(college.uai?` — UAI ${college.uai}`:'');popup.append(p)}
    const year=document.createElement('p');year.textContent=sector.properties.schoolYear?`Année scolaire ${sector.properties.schoolYear}`:'Millésime non précisé';popup.append(year)
    polygon.bindPopup(popup)
    polygon.on('popupopen',()=>{
     const close=polygon.getPopup()?.getElement()?.querySelector<HTMLAnchorElement>('.leaflet-popup-close-button')
     close?.setAttribute('aria-label','Fermer les détails du secteur')
     close?.setAttribute('title','Fermer les détails du secteur')
    })
    polygon.on('click',()=>setSelected(sector.properties.id));layers.current.set(sector.properties.id,polygon)
   }}).addTo(local)
   local.fitBounds([[bounds[1],bounds[0]],[bounds[3],bounds[2]]],{animate:false,padding:[12,12]})
   observer=new ResizeObserver(()=>local?.invalidateSize({animate:false}));observer.observe(container.current)
   setMapRevision(revision=>revision+1)
  }).catch(()=>{if(!disposed)setMapError(true)})
  return ()=>{disposed=true;observer?.disconnect();local?.remove();map.current=null;layers.current.clear()}
 },[features,bounds,attempt])
 useEffect(()=>{
  for(const [id,layer] of layers.current)layer.setStyle(id===selected?active:normal)
  const layer=layers.current.get(selected)
  if(layer){layer.bringToFront();layer.openPopup(layer.getBounds().getCenter())}
  else map.current?.closePopup()
 },[selected,mapRevision])
 const feature=features.find(f=>f.properties.id===selected)
 return <section aria-label={`Secteurs de ${commune}`}>
  <Card className="map-card"><CardHeader><CardTitle><h2>Carte des secteurs</h2></CardTitle></CardHeader><CardContent>
   <div className="sector-choice"><Label htmlFor="sector">Secteur</Label><NativeSelect id="sector" value={selected} onChange={event=>setSelected(event.target.value)}><NativeSelectOption value="">Choisissez un secteur</NativeSelectOption>{features.map(f=><NativeSelectOption key={f.properties.id} value={f.properties.id}>{f.properties.colleges.map(c=>c.name).join(' / ')}</NativeSelectOption>)}</NativeSelect></div>
   <p id="map-help" className="map-help">Carte : flèches pour déplacer la vue, + et − pour zoomer, Échap pour fermer la fenêtre. Le choix de secteur est accessible au clavier.</p>
   {tileWarning && <Alert role="note" className="map-notice"><AlertDescription>Fond de carte indisponible. Les secteurs restent affichés.</AlertDescription></Alert>}
   {mapError && <Alert role="alert" variant="destructive" className="map-notice"><AlertDescription>Impossible d’afficher la carte. Les collèges restent accessibles dans la liste.</AlertDescription><Button variant="outline" type="button" className="mt-3" onClick={()=>setAttempt(n=>n+1)}>Réessayer la carte</Button></Alert>}
   <div className="map" ref={container} role="region" aria-label={`Carte des secteurs de ${commune}`} aria-describedby="map-help" tabIndex={0} onKeyDown={event=>{if(event.key==='Escape')map.current?.closePopup()}}/>
  </CardContent></Card>
  {feature && <Card className="detail-card"><CardHeader><CardTitle><h3>Détails du secteur sélectionné</h3></CardTitle></CardHeader><CardContent><p className="details">{feature.properties.colleges.map(c=>c.name+(c.uai?` — UAI ${c.uai}`:'')).join(' / ')}. {feature.properties.schoolYear||'Millésime non précisé'}.</p></CardContent></Card>}
 </section>
}
