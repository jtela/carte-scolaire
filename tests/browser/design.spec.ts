import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
const api='https://geo.api.gouv.fr/communes**'

test('390px sector-loading skeleton, stage-correct retry and cancellation remain usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});let lookups=0,mode='pending';let finish:(()=>void)|undefined
 await page.route(api,r=>{lookups++;return r.fulfill({contentType:'application/json',body:JSON.stringify([town])})})
 await page.route('**/data/manifest.json',async r=>{
  if(mode==='pending')await new Promise<void>(resolve=>{finish=resolve})
  return r.fulfill({status:mode==='error'?503:200,contentType:'application/json',body:readFileSync('public/data/manifest.json','utf8')}).catch(()=>{})
 })
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('Bessières');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.locator('main')).toHaveAttribute('data-state','loading-sectors')
 await expect(page.locator('[aria-busy=true]')).toHaveCount(1);await expect(page.locator('[data-slot=skeleton]')).toHaveCount(2);await noOverflow(page)
 mode='error';finish!();await expect(page.getByRole('status')).toContainText('Impossible de charger les secteurs')
 await noOverflow(page);mode='ready';await page.getByRole('button',{name:'Réessayer',exact:true}).click()
 await expect(page.locator('main')).toHaveAttribute('data-state','ready');expect(lookups).toBe(1)
 await page.getByLabel('Secteur',{exact:true}).selectOption({index:1});await expect(page.locator('.details')).toContainText('UAI');await noOverflow(page)
 mode='pending';await page.getByRole('button',{name:'Afficher la carte'}).click();await expect(page.locator('main')).toHaveAttribute('data-state','loading-sectors')
 await page.getByLabel('Code postal ou commune').fill('Paris');await expect(page.locator('main')).toHaveAttribute('data-state','idle');await expect(page.locator('.details')).toHaveCount(0)
 mode='ready';finish!();await expect(page.locator('.provenance')).toHaveCount(0);await noOverflow(page)
})
const town={code:'31066',nom:'Bessières',codesPostaux:['31660'],codeDepartement:'31'}
mkdirSync('docs/screenshots',{recursive:true})
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)}
test('320px 200% text shows complete wrapped header and commune badges',async({page})=>{
 await page.setViewportSize({width:320,height:812})
 await page.route(api,r=>r.fulfill({contentType:'application/json',body:JSON.stringify([town])}))
 await page.goto('/carte-scolaire/')
 await page.getByLabel('Code postal ou commune').fill('Bessières')
 await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.locator('main')).toHaveAttribute('data-state','ready')
 await page.addStyleTag({content:'html {font-size:200%}'})
 const badges=page.locator('[data-slot=badge]')
 await expect(badges).toHaveCount(3)
 const metrics=await badges.evaluateAll(elements=>elements.map(element=>{
  const box=element.getBoundingClientRect(),range=document.createRange()
  range.selectNodeContents(element)
  return {text:element.textContent,box:{top:box.top,bottom:box.bottom,left:box.left,right:box.right},clientHeight:element.clientHeight,scrollHeight:element.scrollHeight,clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,textRects:Array.from(range.getClientRects()).map(rect=>({top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right}))}
 }))
 writeFileSync('artifacts/shadcn-badge-text-200.json',JSON.stringify(metrics,null,2))
 await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0)})
 await page.screenshot({path:'docs/screenshots/shadcn-bessieres-320-text-200.png',fullPage:true})
 for(const badge of metrics){
  expect(badge.scrollHeight,`${badge.text}: vertical content overflow`).toBeLessThanOrEqual(badge.clientHeight)
  expect(badge.scrollWidth,`${badge.text}: horizontal content overflow`).toBeLessThanOrEqual(badge.clientWidth)
  expect(badge.textRects.length).toBeGreaterThan(0)
  for(const rect of badge.textRects){
   expect(rect.top,`${badge.text}: text above badge`).toBeGreaterThanOrEqual(badge.box.top)
   expect(rect.bottom,`${badge.text}: text below badge`).toBeLessThanOrEqual(badge.box.bottom)
   expect(rect.left,`${badge.text}: text left of badge`).toBeGreaterThanOrEqual(badge.box.left)
   expect(rect.right,`${badge.text}: text right of badge`).toBeLessThanOrEqual(badge.box.right)
  }
 }
 // The narrow commune warning must really wrap; one-line/page-width checks missed R1.
 expect(metrics.filter(badge=>badge.text==='Couverture partielle').some(badge=>badge.textRects.length>1)).toBe(true)
 await noOverflow(page)
})
test.beforeEach(async({page})=>{
 // Test-only blank basemap: actual commune requests and local polygon snapshots in real-data tests.
 await page.route('https://tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>'}))
})
test('styled shadcn primitives, desktop hierarchy, labels, focus and idle screenshot',async({page})=>{
 await page.goto('/carte-scolaire/')
 await expect(page.locator('h1')).toHaveCount(1)
 await expect(page.getByRole('status')).toHaveCount(1)
 await expect(page.getByRole('alert')).toHaveCount(0)
 await expect(page.getByRole('region',{name:'Couverture et limites'})).toBeVisible()
 const button=page.getByRole('button',{name:'Afficher la carte'})
 await expect(button).toHaveAttribute('data-slot','button')
 const style=await button.evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,color:s.color,radius:parseFloat(s.borderRadius),height:e.getBoundingClientRect().height}})
 expect(style.background).toBe('rgb(29, 78, 216)');expect(style.color).toBe('rgb(255, 255, 255)');expect(style.radius).toBeGreaterThanOrEqual(8);expect(style.height).toBeGreaterThanOrEqual(44)
 const field=page.getByLabel('Code postal ou commune')
 await expect(field).toHaveAttribute('data-slot','input')
 expect(await field.evaluate(e=>getComputedStyle(e).borderTopColor)).toBe('rgb(100, 116, 139)')
 expect(await page.locator('[data-slot=card]').first().evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)')
 const left=await page.locator('.sidebar').boundingBox(),right=await page.locator('.map-card').boundingBox()
 expect(right!.x).toBeGreaterThan(left!.x+left!.width);expect(right!.width).toBeGreaterThan(left!.width)
 await noOverflow(page)
 await page.screenshot({path:'docs/screenshots/shadcn-idle-desktop.png',fullPage:true})
 await button.click();await expect(field).toBeFocused();await expect(field).toHaveAttribute('aria-invalid','true')
 expect(await field.evaluate(e=>getComputedStyle(e).outlineWidth)).toBe('3px')
 await expect(page.getByRole('status')).toContainText('Saisissez un code postal')
 await page.setViewportSize({width:390,height:844});await noOverflow(page)
 expect((await button.boundingBox())!.width).toBe((await field.boundingBox())!.width)
})
for(const viewport of [{width:1280,height:800},{width:390,height:844}])test(`real Versailles design, Leaflet styles and screenshot ${viewport.width}px`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.setViewportSize(viewport);await page.goto('/carte-scolaire/')
 await page.getByLabel('Code postal ou commune').fill('Versailles');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.locator('main')).toHaveAttribute('data-state',/choose-commune|ready/,{timeout:25000})
 if(await page.getByLabel('Commune trouvée').isVisible()){await page.getByLabel('Commune trouvée').selectOption('78646');await page.getByRole('button',{name:'Choisir',exact:true}).click()}
 await expect(page.locator('main')).toHaveAttribute('data-state','ready',{timeout:25000})
 await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(9)
 await expect(page.getByLabel('Secteur',{exact:true})).toHaveAttribute('data-slot','native-select')
 await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible()
 const tile=await page.locator('.leaflet-tile-loaded').first().evaluate(e=>{const s=getComputedStyle(e);return {width:s.width,height:s.height,maxWidth:s.maxWidth,position:s.position}})
 expect(tile).toEqual({width:'256px',height:'256px',maxWidth:'none',position:'absolute'})
 const svg=await page.locator('.leaflet-overlay-pane svg').evaluate(e=>({width:e.getBoundingClientRect().width,overflow:getComputedStyle(e).overflow}))
 expect(svg.width).toBeGreaterThan(250);expect(svg.overflow).toBe('hidden')
 await expect(page.locator('.leaflet-control-attribution')).toBeVisible()
 // Mobile evidence captures the default fitted overview before popup auto-pan.
 if(viewport.width===390){await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0)});await page.screenshot({path:'docs/screenshots/shadcn-versailles-mobile.png',fullPage:true})}
 await page.getByLabel('Secteur',{exact:true}).selectOption({index:1})
 await expect(page.locator('.details')).toContainText('UAI');await expect(page.locator('.details')).toContainText('2025-2026')
 await expect(page.locator('.limitation')).toContainText('discordances entre zonage et voirie')
 await expect(page.locator('.provenance')).toContainText('aucune licence explicite')
 await noOverflow(page)
 if(viewport.width===390){const left=await page.locator('.sidebar').boundingBox(),right=await page.locator('.map-card').boundingBox();expect(right!.y).toBeGreaterThan(left!.y+left!.height)}
 await page.locator('.map').focus();await page.keyboard.press('Escape')
 await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0)})
 if(viewport.width===1280)await page.screenshot({path:'docs/screenshots/shadcn-versailles-desktop.png',fullPage:true})
 writeFileSync(`artifacts/shadcn-leaflet-${viewport.width}.json`,JSON.stringify({viewport,query:'Versailles',tile,svg,errors,basemap:'blank test-only tile interception; real commune API and real snapshots'},null,2))
 expect(errors).toEqual([])
})
test('390px pending, choices, errors and reduced-motion skeleton keep accessible flow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'})
 let mode='pending';let finish:(()=>void)|undefined
 await page.route(api,async r=>{
  if(mode==='pending')await new Promise<void>(resolve=>{finish=resolve})
  await r.fulfill({status:mode==='error'?503:200,contentType:'application/json',body:JSON.stringify(mode==='choice'?[town,{...town,code:'31067',nom:'Autre commune'}]:[])}).catch(()=>{})
 })
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('Bessières');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.locator('main')).toHaveAttribute('data-state','searching')
 await expect(page.locator('[aria-busy=true]')).toHaveCount(1)
 await expect(page.getByRole('status')).toContainText('Recherche des communes')
 expect(await page.getByRole('status').evaluate(e=>e.closest('[aria-busy=true]'))).toBeNull()
 expect(await page.locator('[data-slot=skeleton]').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none')
 await noOverflow(page);mode='choice';finish!()
 await expect(page.getByLabel('Commune trouvée')).toBeVisible();await noOverflow(page)
 await expect(page.getByRole('button',{name:'Choisir',exact:true})).toBeDisabled()
 await page.getByLabel('Commune trouvée').focus();expect(await page.getByLabel('Commune trouvée').evaluate(e=>getComputedStyle(e).outlineWidth)).toBe('3px')
 mode='error';await page.getByRole('button',{name:'Afficher la carte'}).click();await expect(page.getByRole('status')).toContainText('Recherche indisponible')
 await expect(page.getByRole('alert')).toHaveCount(0);await noOverflow(page)
 mode='none';await page.getByRole('button',{name:'Réessayer',exact:true}).click();await expect(page.getByRole('status')).toContainText('Aucune commune trouvée')
 await noOverflow(page)
})
