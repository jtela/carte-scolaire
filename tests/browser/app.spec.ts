import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const manifest=JSON.parse(readFileSync('public/data/manifest.json','utf8'))
const town={code:'31066',nom:'Bessières',codesPostaux:['31660'],codeDepartement:'31'}
const api='https://geo.api.gouv.fr/communes**'
import type { Page } from '@playwright/test'
async function search(page:Page,query:string,code:string){
 await page.getByLabel('Code postal ou commune').fill(query)
 await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.locator('main')).toHaveAttribute('data-state',/choose-commune|ready/,{timeout:25000})
 if(await page.getByLabel('Commune trouvée').isVisible()){
  await page.getByLabel('Commune trouvée').selectOption(code)
  await page.getByRole('button',{name:'Choisir',exact:true}).click()
 }
 await expect(page.locator('main')).toHaveAttribute('data-state','ready',{timeout:25000})
}
test.beforeEach(async({page})=>{
 // TEST ONLY: no automated OSM tile traffic; sector snapshots and real API are untouched.
 await page.route('https://tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>'}))
})
test('real small town name displays sourced polygons, college popup and zoom',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('/carte-scolaire/')
 await search(page,'Bessières','31066')
 await expect(page.getByRole('status')).toContainText('2 secteurs')
 await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(2)
 await expect(page.getByText('Entrée en 6ème uniquement',{exact:false})).toBeVisible()
 await page.getByLabel('Secteur', {exact:true}).selectOption({index:1})
 await expect(page.locator('.leaflet-popup-content')).toContainText('Collège')
 const before=await page.locator('.leaflet-overlay-pane').innerHTML()
 await page.getByRole('button',{name:'Agrandir la carte',exact:true}).click()
 await expect.poll(()=>page.locator('.leaflet-overlay-pane').innerHTML()).not.toBe(before)
 await page.screenshot({path:'artifacts/bessieres-desktop.png',fullPage:true})
 expect(errors).toEqual([])
})
test('French static form hydrates at the repository path and validates input',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('/carte-scolaire/')
 await expect(page.getByRole('heading',{name:'Secteurs des collèges publics'})).toBeVisible()
 await expect(page.getByLabel('Code postal ou commune')).toBeVisible()
 await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.getByRole('status')).toContainText('Saisissez un code postal à 5 chiffres')
 expect(errors).toEqual([])
})
