import {cp,mkdir} from 'node:fs/promises'
import {spawn} from 'node:child_process'
await mkdir('static-host/carte-scolaire',{recursive:true})
await cp('dist/client','static-host/carte-scolaire',{recursive:true})
const server=spawn('python3',['-m','http.server','4185','--bind','127.0.0.1','--directory','static-host'],{stdio:'inherit'})
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.kill(signal))
server.on('exit',code=>process.exit(code??0))
