/** One-time AST migration and repeatable extraction of application-owned copy.
 * No customer data is read. Run with --write to migrate newly added Svelte text. */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
const strings = new Set();
const normalize = value => value.replace(/\s+/g, ' ').trim();
const eligible = text => /[A-Za-z]{2}/.test(text) && !/^(https?:|\/|data:|#[a-f0-9]|\$)/i.test(text) && !/[@{}]|(?:px|rem|rgba)\b|(?:bg|text|border|flex|grid|rounded|hover|w|h|p|m)-/.test(text);
const add = value => { const text=normalize(value); if (eligible(text)) strings.add(text); };
function scriptStrings(source) {
  const tree=ts.createSourceFile('copy.ts',source,ts.ScriptTarget.Latest,true);
  function visit(node) {
    if(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if(eligible(node.text) && !/^(class|style|href|src|id|key|slug|icon|image|imageUrl|url|storageKey)$/.test(node.parent?.name?.getText?.(tree) ?? '')) add(node.text);
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);
}
function migrate(file) {
  if(file.includes(`${path.sep}i18n${path.sep}`) || file.endsWith('LanguageSwitcher.svelte'))return;
  let source=fs.readFileSync(file,'utf8');
  if(!file.endsWith('.svelte')) { scriptStrings(source); return; }
  const ast=parse(source);
  if(ast.instance)scriptStrings(source.slice(ast.instance.content.start,ast.instance.content.end));
  const edits=[];
  let used=false;
  function wrap(start,end,text){edits.push([start,end,text]);used=true;}
  const excluded=/\b(?:displayName|fullName|contactName|nin|email|phone|address|password|reason|body|reply|subject)\b|(?:user|profile|session|recipient|message|thread|selected|file|event)\??\./i;
  function walk(node,parent) {
    if(!node||typeof node!=='object')return;
    if(node.type==='Text') {
      const value=normalize(node.data);
      if(value&&/[A-Za-z]/.test(value)&&!['script','style','pre','code'].includes(parent?.name)) {
        add(value);
        wrap(node.start,node.end,`${/^\s/.test(node.data)?' ':''}{$adkT(${JSON.stringify(value)})}${/\s$/.test(node.data)?' ':''}`);
      }
      return;
    }
    if(node.type==='MustacheTag') {
      const expr=source.slice(node.expression.start,node.expression.end);
      if(!expr.includes('$adkT')&&!excluded.test(expr)&&!/^\s*(?:true|false|\d+)\s*$/.test(expr)) wrap(node.start,node.end,`{$adkT(${expr})}`);
      scriptStrings(expr);
      return;
    }
    if(node.type==='Element'&&['script','style','pre','code'].includes(node.name))return;
    for(const attr of node.attributes??[]) {
      if(attr.type!=='Attribute'||!['title','aria-label','placeholder','alt','label','description','subtitle'].includes(attr.name)||!Array.isArray(attr.value))continue;
      if(attr.value.length===1&&attr.value[0].type==='Text'&&/[A-Za-z]/.test(attr.value[0].data)) {
        const value=normalize(attr.value[0].data);add(value);
        wrap(attr.start,attr.end,`${attr.name}={$adkT(${JSON.stringify(value)})}`);
      } else if(attr.value.length===1&&attr.value[0].type==='MustacheTag') {
        const expr=source.slice(attr.value[0].expression.start,attr.value[0].expression.end);
        if(!expr.includes('$adkT')&&!excluded.test(expr))wrap(attr.start,attr.end,`${attr.name}={$adkT(${expr})}`);
        scriptStrings(expr);
      }
    }
    if(node.type==='Element'&&['input','textarea'].includes(node.name)&&!(node.attributes??[]).some(a=>a.name==='dir')) {
      edits.push([node.start+node.name.length+1,node.start+node.name.length+1,' dir="auto"']);
    }
    for(const key of ['children','else','pending','then','catch']) {
      const child=node[key];
      if(Array.isArray(child))child.forEach(n=>walk(n,node)); else if(child)walk(child,node);
    }
  }
  walk(ast.html);
  if(process.argv.includes('--write')&&edits.length) {
    for(const [start,end,value] of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+value+source.slice(end);
    if(used&&!source.includes('const adkT =')) {
      const imports='\n  import { getTranslation } from "$lib/i18n";\n  const adkT = getTranslation();\n';
      if(ast.instance) source=source.replace(/<script(?:\s+[^>]*?)?>/, match=>match+imports);
      else source='<script lang="ts">'+imports+'</script>\n'+source;
    }
    fs.writeFileSync(file,source);
  }
}
function walkFiles(directory) {for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
  const file=path.join(directory,entry.name);
  if(entry.isDirectory()) { if(!['i18n','_generated','schema','server'].includes(entry.name))walkFiles(file); }
  else if(/\.(svelte|ts)$/.test(file)&&!file.endsWith('.d.ts')) migrate(file);
}}
walkFiles('src');
// Include backend validation messages, but never configuration or runtime data.
for(const entry of fs.readdirSync('convex',{withFileTypes:true})) {
  if(!entry.isFile()||!entry.name.endsWith('.ts'))continue;
  const source=fs.readFileSync(path.join('convex',entry.name),'utf8');
  const tree=ts.createSourceFile(entry.name,source,ts.ScriptTarget.Latest,true);
  function errors(node) {
    if(ts.isNewExpression(node)&&['Error','ConvexError'].includes(node.expression.getText(tree))&&node.arguments?.[0]&&ts.isStringLiteral(node.arguments[0])) add(node.arguments[0].text);
    ts.forEachChild(node,errors);
  }
  errors(tree);
}
function jsonStrings(value) { if(typeof value==='string')add(value);else if(value&&typeof value==='object') Object.values(value).forEach(jsonStrings); }
jsonStrings(JSON.parse(fs.readFileSync('convex/data/serviceCatalog.json','utf8')));
fs.mkdirSync('src/lib/i18n',{recursive:true});
fs.writeFileSync('src/lib/i18n/en.json',JSON.stringify(Object.fromEntries([...strings].sort().map(text=>[text,text])),null,2)+'\n');
console.log(`Extracted ${strings.size} application copy strings.`);
