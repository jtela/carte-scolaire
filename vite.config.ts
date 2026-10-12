import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
const base=process.env.APP_BASE_PATH || '/carte-scolaire/'
if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error('APP_BASE_PATH must be a slash-delimited local path')
export default defineConfig({base,resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},plugins:[tailwindcss(),tanstackStart({router:{basepath:base.replace(/\/$/,'')||'/'},prerender:{enabled:true,autoStaticPathsDiscovery:false,crawlLinks:false,failOnError:true},pages:[{path:'/',prerender:{enabled:true,outputPath:'/index.html'}}]}),react()]})
