import {test,expect} from '@playwright/test'
const api='https://geo.api.gouv.fr/communes**'
const town={code:'31066',nom:'Bessières',codesPostaux:['31660'],codeDepartement:'31'}
test.beforeEach(async({page})=>{await page.route('https://tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>'}))})
test('real leading-zero postcode 01000 requires explicit commune choice',async({page})=>{
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('01000');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.getByLabel('Commune trouvée')).toBeVisible({timeout:20000})
 await expect(page.getByLabel('Commune trouvée').locator('option')).toHaveCount(3)
 await page.getByLabel('Commune trouvée').selectOption('01344');await page.getByRole('button',{name:'Choisir',exact:true}).click()
 await expect(page.getByRole('status')).toContainText('non disponibles');await expect(page.locator('h2')).toContainText('Saint-Denis-lès-Bourg')
})
test('fixture offline lookup has explicit retry and finite timeout is visible',async({page})=>{
 let mode='offline'
 await page.route(api,async r=>{if(mode==='offline')return r.abort();await new Promise(resolve=>setTimeout(resolve,16000));await r.fulfill({contentType:'application/json',body:'[]'}).catch(()=>{})})
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('Paris');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.getByRole('status')).toContainText('Recherche indisponible');mode='timeout';await page.getByRole('button',{name:'Réessayer',exact:true}).click()
 await expect(page.getByRole('status')).toContainText('Délai dépassé',{timeout:20000});await expect(page.locator('.map')).toHaveCount(0)
})
test('fixture popup close control is French, keyboard accessible and a 44px target',async({page})=>{
 await page.route(api,r=>r.fulfill({contentType:'application/json',body:JSON.stringify([town])}))
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('Bessières');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await page.getByLabel('Secteur',{exact:true}).selectOption({index:1})
 const close=page.getByRole('button',{name:'Fermer les détails du secteur'})
 await expect(close).toBeVisible()
 const box=await close.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44)
 await close.focus();await page.keyboard.press('Enter');await expect(page.locator('.leaflet-popup')).toHaveCount(0)
})
test('fixture failed Leaflet download retains keyboard college details',async({page})=>{
 await page.route(api,r=>r.fulfill({contentType:'application/json',body:JSON.stringify([town])}))
 await page.route('**/assets/leaflet-src*.js',r=>r.abort())
 await page.goto('/carte-scolaire/');await page.getByLabel('Code postal ou commune').fill('Bessières');await page.getByRole('button',{name:'Afficher la carte'}).click()
 await expect(page.getByRole('alert')).toContainText('Impossible d’afficher la carte')
 await page.getByLabel('Secteur',{exact:true}).selectOption({index:1});await expect(page.locator('.details')).toContainText('UAI')
 await expect(page.getByRole('button',{name:'Réessayer la carte'})).toBeVisible()
})
