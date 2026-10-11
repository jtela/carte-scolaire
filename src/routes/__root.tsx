import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import css from '../styles/app.css?url'
import leafletCss from 'leaflet/dist/leaflet.css?url'
export const Route=createRootRoute({
 head:()=>({meta:[{charSet:'utf-8'},{name:'viewport',content:'width=device-width, initial-scale=1'},{title:'Secteurs des collèges publics'}],links:[{rel:'stylesheet',href:css},{rel:'stylesheet',href:leafletCss}]}),
 component:Outlet,
 shellComponent:({children})=><html lang="fr"><head><HeadContent/></head><body>{children}<noscript>Activez JavaScript pour rechercher une commune et afficher les secteurs.</noscript><Scripts/></body></html>
})
