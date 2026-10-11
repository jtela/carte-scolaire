import {test,expect} from '@playwright/test'
import {mkdirSync,writeFileSync} from 'node:fs'
mkdirSync('artifacts/versailles',{recursive:true})
test.beforeEach(async({page})=>{await page.route('https://tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>'}))})
for(const query of ['Versailles','78000'])test(`real Versailles ${query}: nine publisher sectors, popup, pan/zoom and provenance`,async({page})=>{
 const errors:string[]=[];const responses:{url:string;status:number}[]=[]
 page.on('pageerror',e=>errors.push(e.message))
 page.on('response',r=>{if(r.url().includes('geo.api.gouv.fr')||r.url().includes('/data/'))responses.push({url:r.url(),status:r.status()})})
 if(query==='78000')await page.setViewportSize({width:375,height:812})
 await page.goto('/carte-scolaire/')
 await page.getByLabel('Code postal ou commune').fill(query)
 await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.locator('main')).toHaveAttribute('data-state',/choose-commune|ready|unavailable/,{timeout:25000})
 if(await page.getByLabel('Commune trouvée').isVisible()){
  await page.getByLabel('Commune trouvée').selectOption('78646');await page.getByRole('button',{name:'Choisir',exact:true}).click()
 }
 await page.screenshot({path:`artifacts/versailles/${query}-result.png`,fullPage:true})
 await expect(page.locator('main')).toHaveAttribute('data-state','ready',{timeout:25000})
 await expect(page.getByRole('heading',{name:'Versailles (78646)'})).toBeVisible()
 await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(9)
 // Exercise a real visible polygon boundary, not a synthetic map event.
 await page.locator('.map').scrollIntoViewIfNeeded()
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
 await expect(page.locator('.leaflet-popup-content')).toContainText('Collège')
 await page.locator('.map').focus();await page.keyboard.press('Escape')
 await page.getByLabel('Secteur',{exact:true}).selectOption('')
 await expect(page.getByRole('status')).toContainText('codes commune du producteur')
 await expect(page.locator('.provenance')).toContainText('2025-2026')
 await expect(page.locator('.limitation')).toContainText('indicative')
 await expect(page.locator('.limitation')).toContainText('discordances entre zonage et voirie')
 await expect(page.locator('.provenance')).toContainText('Conseil départemental des Yvelines')
 await expect(page.locator('.provenance')).toContainText('aucune licence explicite')
 const options=page.getByLabel('Secteur',{exact:true}).locator('option');await expect(options).toHaveCount(10)
 for(let i=1;i<=9;i++){
  await page.getByLabel('Secteur',{exact:true}).selectOption({index:i})
  await expect(page.locator('.leaflet-popup-content')).toContainText('Collège')
  await expect(page.locator('.leaflet-popup-content')).toContainText(/UAI 078[0-9]{4}[A-Z]/)
  await expect(page.locator('.leaflet-popup-content')).toContainText('2025-2026')
 }
 const labels=await options.allTextContents();expect(new Set(labels.slice(1)).size).toBe(5)
 await page.screenshot({path:`artifacts/versailles/${query}-popup.png`,fullPage:true})
 await page.locator('.map').focus();await page.keyboard.press('Escape')
 const before=await page.locator('.leaflet-map-pane').getAttribute('style');await page.keyboard.press('ArrowRight')
 await expect.poll(()=>page.locator('.leaflet-map-pane').getAttribute('style')).not.toBe(before)
 const geometry=await page.locator('.leaflet-overlay-pane').innerHTML();await page.getByRole('button',{name:'Agrandir la carte',exact:true}).click()
 await expect.poll(()=>page.locator('.leaflet-overlay-pane').innerHTML()).not.toBe(geometry)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)
 await page.screenshot({path:`artifacts/versailles/${query}-map.png`,fullPage:true})
 expect(errors).toEqual([])
 expect(responses.some(r=>r.url.includes('geo.api.gouv.fr')&&r.status===200)).toBe(true)
 writeFileSync(`artifacts/versailles/${query}-browser.json`,JSON.stringify({query,labels,responses,errors,polygons:9,api:'actual commune API; only basemap tiles intercepted'},null,2))
})
