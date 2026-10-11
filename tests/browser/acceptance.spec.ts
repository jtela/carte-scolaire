import {test,expect,type Page} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const manifest=JSON.parse(readFileSync('public/data/manifest.json','utf8'))
const town={code:'31066',nom:'Bessières',codesPostaux:['31660'],codeDepartement:'31'}
const api='https://geo.api.gouv.fr/communes**'
async function search(page:Page,query:string,code:string){
 await page.getByLabel('Code postal ou commune').fill(query)
 await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.locator('main')).toHaveAttribute('data-state',/choose-commune|ready/,{timeout:25000})
 if(await page.getByLabel('Commune trouvée').isVisible()){await page.getByLabel('Commune trouvée').selectOption(code);await page.getByRole('button',{name:'Choisir',exact:true}).click()}
 await expect(page.locator('main')).toHaveAttribute('data-state','ready',{timeout:25000})
}
test.beforeEach(async({page})=>{await page.route('https://tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>'}))})
test('real Toulouse name/postcode, Paris year, static assets and reload',async({page,request})=>{
 const errors:string[]=[];const assets:{url:string;status:number;type:string}[]=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 page.on('response',r=>{if(r.url().includes('127.0.0.1'))assets.push({url:r.url(),status:r.status(),type:r.headers()['content-type']||''})})
 await page.goto('/carte-scolaire/?unknown=ok');await search(page,'Toulouse','31555')
 await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(41)
 await page.getByLabel('Secteur',{exact:true}).selectOption({index:1});await expect(page.locator('.leaflet-popup')).toBeVisible()
 await page.locator('.map').focus();await page.keyboard.press('Escape');await expect(page.locator('.leaflet-popup')).toHaveCount(0)
 const before=await page.locator('.leaflet-map-pane').getAttribute('style');await page.keyboard.press('ArrowRight')
 await expect.poll(()=>page.locator('.leaflet-map-pane').getAttribute('style')).not.toBe(before)
 await page.screenshot({path:'artifacts/toulouse-desktop.png',fullPage:true})
 await search(page,'31000','31555');await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(41)
 await search(page,'75001','75056');await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(110)
 await expect(page.locator('.provenance')).toContainText('2026-2027');await expect(page.locator('.provenance')).toContainText('ODbL')
 await page.locator('.map').scrollIntoViewIfNeeded()
 // Click an actually visible SVG boundary, not a synthetic zero-coordinate event.
 const point=await page.locator('.leaflet-overlay-pane').evaluate(pane=>{
  for(const path of pane.querySelectorAll<SVGPathElement>('path')){
   const matrix=path.getScreenCTM();if(!matrix)continue
   const length=path.getTotalLength()
   for(let distance=0;distance<length;distance+=Math.max(1,length/100)){
    const local=path.getPointAtLength(distance);const screen=new DOMPoint(local.x,local.y).matrixTransform(matrix)
    if(document.elementFromPoint(screen.x,screen.y)===path)return {x:screen.x,y:screen.y}
   }
  }
  return null
 })
 expect(point).not.toBeNull();await page.mouse.click(point!.x,point!.y)
 await expect(page.locator('.leaflet-popup-content')).toContainText('Année scolaire 2026-2027')
 await page.screenshot({path:'artifacts/paris-desktop.png',fullPage:true})
 expect(await page.locator('main').evaluate(e=>getComputedStyle(e).maxWidth)).toBe('1100px')
 await page.reload();await expect(page.locator('main')).toHaveAttribute('data-state','idle')
 expect((await request.get('/carte-scolaire/missing/')).status()).toBe(404)
 expect(assets.every(a=>a.url.includes('/carte-scolaire/') && [200,304].includes(a.status))).toBe(true)
 expect(assets.some(a=>a.type.includes('css'))).toBe(true);expect(assets.some(a=>a.url.includes('/data/sectors/'))).toBe(true)
 expect(errors).toEqual([])
 writeFileSync('artifacts/real-browser-evidence.json',JSON.stringify({queries:['Toulouse','31000','75001'],counts:{Toulouse:41,Paris:110},basemap:'test-only tile interception; polygons and commune API not stubbed',assets,errors,sources:manifest.datasets},null,2))
})
test('real small-town postcode at mobile, keyboard sector and 320px/200% text',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/carte-scolaire/');await search(page,'31660','31066')
 await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(2)
 await page.getByLabel('Secteur',{exact:true}).focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(page.locator('.details')).toContainText('UAI')
 await page.screenshot({path:'artifacts/bessieres-mobile.png',fullPage:true})
 for(const width of [375,320]){await page.setViewportSize({width,height:812});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)}
 await page.addStyleTag({content:'html {font-size:200%}'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)
 await page.screenshot({path:'artifacts/mobile-320-text-200.png',fullPage:true})
 await page.setViewportSize({width:1280,height:800})
 await page.addStyleTag({content:'html {font-size:100%;zoom:2}'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)
 await expect(page.getByRole('button',{name:'Afficher la carte'})).toBeVisible()
 await page.screenshot({path:'artifacts/desktop-css-zoom-200.png',fullPage:true})
})
test('fixtures: ambiguity, no match, missing coverage, HTTP failure and retry',async({page})=>{
 let mode='ambiguous';const other={code:'01053',nom:'Bourg-en-Bresse',codesPostaux:['01000'],codeDepartement:'01'}
 await page.route(api,r=>r.fulfill({status:mode==='http'?429:200,contentType:'application/json',body:JSON.stringify(mode==='ambiguous'?[other,{...other,code:'01344',nom:'Saint-Denis-lès-Bourg'}]:mode==='none'?[]:[other])}))
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('01000');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.getByLabel('Commune trouvée')).toBeVisible();await expect(page.getByRole('button',{name:'Choisir',exact:true})).toBeDisabled()
 await page.getByLabel('Commune trouvée').selectOption('01053');await page.getByRole('button',{name:'Choisir',exact:true}).click();await expect(page.getByRole('status')).toContainText('non disponibles')
 mode='none';await page.getByRole('button',{name:'Afficher la carte'}).click();await expect(page.getByRole('status')).toContainText('Aucune commune')
 mode='http';await page.getByRole('button',{name:'Afficher la carte'}).click();await expect(page.getByRole('status')).toContainText('Recherche indisponible')
 mode='none';await page.getByRole('button',{name:'Réessayer',exact:true}).click();await expect(page.getByRole('status')).toContainText('Aucune commune')
})
test('fixtures: corrupt/absent manifest, empty data and invalid geometry',async({page})=>{
 await page.route(api,r=>r.fulfill({contentType:'application/json',body:JSON.stringify([town])}));let mode='missing'
 await page.route('**/data/manifest.json',r=>{const m=structuredClone(manifest);if(mode==='empty')m.communes['31066'].featureIds=[];return r.fulfill({status:mode==='missing'?404:200,contentType:'application/json',body:mode==='corrupt'?'broken':JSON.stringify(m)})})
 await page.route('**/data/sectors/*',r=>{const data=JSON.parse(readFileSync(new URL(r.request().url()).pathname.replace('/carte-scolaire/','public/'),'utf8'));data.features[0].geometry=null;return r.fulfill({contentType:'application/json',body:JSON.stringify(data)})})
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('Bessières')
 for(mode of ['missing','corrupt','bad']){await page.getByRole('button',{name:'Afficher la carte'}).click();await expect(page.getByRole('status')).toContainText('Impossible de charger les secteurs');await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(0)}
 mode='empty';await page.getByRole('button',{name:'Afficher la carte'}).click();await expect(page.getByRole('status')).toContainText('Aucun polygone')
})
test('fixtures: delayed lookup error/sector response cannot restore cleared map',async({page})=>{
 let delayed=false
 await page.route(api,async r=>{if(new URL(r.request().url()).searchParams.get('nom')==='Ancien'){await new Promise(resolve=>setTimeout(resolve,900));return r.fulfill({status:500,body:'[]'}).catch(()=>{})}return r.fulfill({contentType:'application/json',body:JSON.stringify([town])})})
 await page.route('**/data/sectors/*',async r=>{if(delayed)await new Promise(resolve=>setTimeout(resolve,900));await r.continue().catch(()=>{})})
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('Ancien');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await search(page,'Bessières','31066');await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(2)
 await page.getByLabel('Secteur',{exact:true}).selectOption({index:1});await expect(page.locator('.leaflet-popup')).toBeVisible()
 delayed=true;await page.getByRole('button',{name:'Afficher la carte'}).click();await expect(page.locator('main')).toHaveAttribute('data-state','loading-sectors')
 await page.getByLabel('Code postal ou commune').fill('123');await page.getByRole('button',{name:'Afficher la carte'}).click();await expect(page.locator('main')).toHaveAttribute('data-state','invalid')
 await expect(page.locator('.leaflet-popup')).toHaveCount(0);await expect(page.locator('.provenance')).toHaveCount(0)
 await page.waitForTimeout(1100);await expect(page.locator('main')).toHaveAttribute('data-state','invalid')
})
test('fixture tile failure keeps polygons, malicious college labels are text',async({page})=>{
 await page.route('https://tile.openstreetmap.org/**',r=>r.abort());await page.route(api,r=>r.fulfill({contentType:'application/json',body:JSON.stringify([town])}))
 const malicious='<img src=x onerror="window.injected=true">'
 await page.route('**/data/sectors/*',r=>{const data=JSON.parse(readFileSync(new URL(r.request().url()).pathname.replace('/carte-scolaire/','public/'),'utf8'));for(const f of data.features)f.properties.colleges[0].name=malicious;return r.fulfill({contentType:'application/json',body:JSON.stringify(data)})})
 await page.goto('/carte-scolaire/');await search(page,'Bessières','31066');await expect(page.getByRole('note')).toContainText('Fond de carte indisponible');await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(2)
 await page.getByLabel('Secteur',{exact:true}).selectOption({index:1});await expect(page.locator('.leaflet-popup-content')).toContainText(malicious);await expect(page.locator('.leaflet-popup-content img')).toHaveCount(0)
 expect(await page.evaluate(()=>('injected' in window))).toBe(false)
})
