import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'svelte/compiler';
const helpers=new Set(['formatDateTime','formatNaira','formatUSD','formatPrice','formatSqm','formatDate','formatRelative','formatBedBath']);
function files(directory) { for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())files(file);else if(file.endsWith('.svelte')) {
    let source=fs.readFileSync(file,'utf8'); const ast=parse(source), edits=[];
    function visit(node) {
      if(!node||typeof node!=='object')return;
      if(node.type==='CallExpression') {
        const name=node.callee?.type==='Identifier'?node.callee.name:null;
        if(helpers.has(name)&&!source.slice(node.start,node.end).includes('$adkLocale')) {
          const missing=name==='formatPrice'&&node.arguments.length===1?', undefined':'';
          const trailingComma=/,\s*$/.test(source.slice(node.arguments.at(-1)?.end ?? node.start+1,node.end-1));
          edits.push([node.end-1,node.end-1,(trailingComma?missing.replace(/^,/, ''):missing)+(trailingComma&& !missing?' ':', ')+'$adkLocale']);
        }
        if(node.callee?.type==='MemberExpression'&&['toLocaleString','toLocaleDateString','toLocaleTimeString'].includes(node.callee.property?.name)&&!source.slice(node.start,node.end).includes('$adkLocale')) {
          const argument='$adkLocale === "ar" ? "ar-NG" : "en-NG"';
          if(node.arguments.length)edits.push([node.arguments[0].start,node.arguments[0].end,argument]);
          else edits.push([node.end-1,node.end-1,argument]);
        }
      }
      for(const [key,value] of Object.entries(node)) {
        if(['loc','parent','name_loc'].includes(key))continue;
        if(Array.isArray(value))value.forEach(visit); else if(value&&typeof value==='object')visit(value);
      }
    }
    visit(ast);
    if(edits.length) {
      for(const [start,end,text] of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+text+source.slice(end);
      source=source.replace(/<script(?:\s+[^>]*?)?>/,match=>match+'\n  import { getI18n } from "$lib/i18n";\n  const { locale: adkLocale } = getI18n();\n');
      fs.writeFileSync(file,source);
    }
  }
}}
files('src');
