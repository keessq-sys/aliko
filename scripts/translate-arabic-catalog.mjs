/** Build-time translation of source-controlled UI copy only; never called by browsers. */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const input=JSON.parse(fs.readFileSync('src/lib/i18n/en.json','utf8'));
const output=JSON.parse(fs.readFileSync('src/lib/i18n/ar.json','utf8'));
let token=process.env.WORKERS_AI_API_TOKEN;
if(!token) {
  const result=spawnSync(process.execPath,['node_modules/convex/bin/main.js','env','get','WORKERS_AI_API_TOKEN'],{encoding:'utf8'});
  if(result.status!==0)throw new Error('Translation credential unavailable');
  token=result.stdout.trim();
}
const account=process.env.CLOUDFLARE_ACCOUNT_ID ?? '6060b2b79eec818da0add21f995cd375';
const keys=Object.keys(input).filter(k=>!output[k]);
const batches=[];
for(let i=0;i<keys.length;i+=12)batches.push(keys.slice(i,i+12));
let cursor=0, complete=0;
async function worker() {
  while(cursor<batches.length) {
    const batch=batches[cursor++];
    const payload=Object.fromEntries(batch.map((key,index)=>[String(index),key]));
    let success=false;
    for(let attempt=0;attempt<6&&!success;attempt++) {
      try {
        const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,{
          method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
          signal:AbortSignal.timeout(90000),body:JSON.stringify({
            messages:[{role:'system',content:'Translate every value of this JSON object from English to fluent Modern Standard Arabic for Aliko Diamond Key, a Nigerian real-estate application. Return ONLY the same JSON object with the same numbered keys and translated string values. Preserve all facts, prices, legal meaning, placeholders, URLs, emails and identifiers. Translate UI labels, real-estate terms, errors and sentences. Preserve brand and person names when appropriate. Never add explanations or omit keys.'},{role:'user',content:JSON.stringify(payload)}],
            max_tokens:8192,temperature:0,
          }),
        });
        if(!response.ok)throw new Error(`Translation provider HTTP ${response.status}`);
        const body=await response.json();
        if(!body.success)throw new Error('Translation provider rejected request');
        fs.writeFileSync('.backups/translation-response.json', JSON.stringify(body, null, 2));
        const raw=body.result.response;
        const translated=typeof raw==='string'?JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1)):raw;
        if(!batch.every((_,i)=>typeof translated[String(i)]==='string'&&translated[String(i)].trim()))throw new Error('Incomplete translation batch');
        batch.forEach((key,i)=>output[key]=translated[String(i)]);
        fs.writeFileSync('src/lib/i18n/ar.json',JSON.stringify(output,null,2)+'\n');
        complete+=batch.length;success=true;
        console.log(`Translated ${complete}/${keys.length} source strings.`);
      } catch(error) {
        if(attempt===5)throw new Error(`Translation batch failed: ${error.message}`);
        await new Promise(resolve=>setTimeout(resolve,2000*(attempt+1)));
      }
    }
  }
}
await Promise.all(Array.from({length:4},worker));
console.log('Arabic catalogue generated. Review translations before publishing.');
