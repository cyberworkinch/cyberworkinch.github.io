(()=>{'use strict';
const DB=window.TSSR_PHYSICAL_PAGES||[];
const BUILD='tssr-r4-fix-9187cdace129';
const TOTAL={1:270,2:248};
const FILE={1:'support.pdf',2:'TSSR_BLOC_2_APPROFONDISSEMENTS_COMPLETS.pdf'};
const $=s=>document.querySelector(s);
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae');
const words=s=>fold(s).match(/[a-z0-9]+/g)||[];
const noise=new Set(['le','la','les','des','une','un','aux','avec','dans','par','pour','sur','de','du','et','ou','en','au','a','l','d','comment','je','tu','on','suis','veut','voudrais','faire','que','quel','quelle','quels','laquelle','page','bloc']);
const eq={
 creation:['creer','installer','installation','configurer','mise en place','deployer'],
 creer:['creation','configurer','installation','installer','mise en place','deployer'],
 installe:['installer','installation','deployer','creation','mettre en place'],
 installer:['installation','deployer','mise en place','configurer','creer'],
 installation:['installer','deployer','configurer','mettre en place'],
 configurer:['configuration','parametrer','installer','creer'],
 lamp:['lamp','apache','mariadb','php','serveur web'],web:['web','apache','http','https'],
 php:['php','php-fpm'], serveur:['server','serveur'], glpi:['glpi'],active:['active'],
 ad:['active directory','ad ds','adds','annuaire'], vm:['machine virtuelle','virtualbox','virtualisation'],
 domaine:['domaine','active directory','ad ds'],vlan:['vlan','segmentation'],
 sauvegarde:['backup','sauvegarde','rsync'], restaurer:['restauration','restaurer','recuperer'],
 utilisateurs:['utilisateur','user','compte'],utilisateur:['utilisateurs','user','compte'],
 droits:['permission','permissions','acl','chmod'],dns:['dns','zone dns'],dhcp:['dhcp'],
 mariadb:['mariadb','mysql'],
};
const STOP_NUMERIC=new Set(['1','2','3','4','5','6','7','8','9']);
function groups(q){const unique=new Set(),out=[];
 for(const w of words(q)){
   if(noise.has(w)||STOP_NUMERIC.has(w))continue;
   const base=w.replace(/^(?:cree|creer|creez)$/,'creer');
   if(unique.has(base))continue;
   unique.add(base);out.push({base,expanded:[base,...(eq[base]||[])]});
 }return out.slice(0,14);
}
function eligibleAt(hay,term,pos){
 if(term.length>3)return true;
 let bef=pos>0?hay[pos-1]:'',aft=pos+term.length<hay.length?hay[pos+term.length]:'';
 return !(/[a-z0-9]/.test(bef)||/[a-z0-9]/.test(aft));
}
function indexOfTerm(hay,term){const t=fold(term);let pos=0;
 while((pos=hay.indexOf(t,pos))>=0){if(eligibleAt(hay,t,pos))return pos;pos++;}return -1;
}
function headingTitle(pg,gg){const scored=(pg.titles||[]).map(h=>{
 const htext=fold(h.title);let score=0;
 for(const g of gg){if(indexOfTerm(htext,g.base)>=0)score+=10;
 else if(g.expanded.some(x=>indexOfTerm(htext,x)>=0))score+=5;}
 return{title:h.title,score};
 });scored.sort((a,b)=>b.score-a.score);
 if(scored.length)return scored[0].title;
 return pg.fallback||'Contenu technique';
}
function evaluate(pg,gg,raw){if(!gg.length)return null;
 const content=fold(pg.text), titles=fold((pg.titles||[]).map(x=>x.title).join(' '));
 let coverage=0,score=0,loc=[];
 for(const g of gg){let best=null,weight=0,bestPos=1e9;
   if(g.base==='lamp'&&!content.includes('lamp')&&['apache','mariadb','php'].filter(k=>content.includes(k)).length<2)continue;
   for(const alt of g.expanded){const pos=indexOfTerm(content,alt);
     if(pos>=0){const w=(alt===g.base?6:3.5)+Math.min(4,alt.length/5);
       if(w>weight){weight=w;bestPos=pos;best=alt;}
     }
   }
   if(best){coverage++;score+=weight;loc.push({pos:bestPos,term:best,base:g.base});}
   if((pg.titles||[]).some(h=>fold(h.title).startsWith(g.base)))score+=36;
   else if(indexOfTerm(titles,g.base)>=0)score+=25;
   else if(g.expanded.some(x=>indexOfTerm(titles,x)>=0))score+=11;
 }
 const required=gg.length===1?1:gg.length===2?2:Math.ceil(gg.length*.6);
 if(coverage<required)return null;
 score+=coverage*14+coverage/gg.length*20;
 const literal=fold(raw);if(literal&&content.includes(literal))score+=55+50*Math.min(5,content.split(literal).length-1);
 if(!/sommaire|chapitre|index|plan/.test(fold(raw))&&((pg.block===1&&[1,2,177,201,259].includes(pg.page))||(pg.block===2&&pg.page===1)))score-=35;
 if(gg.some(g=>g.base==='lamp')&&['apache','mariadb','php'].every(k=>content.includes(k)))score+=10;
 if(loc.length>=2){const positions=loc.map(x=>x.pos).sort((a,b)=>a-b);const near=Math.min(...positions.slice(1).map((v,i)=>v-positions[i]));score+=Math.max(0,25-Math.min(25,near/30));}
 return{score,match:loc};
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
/* Map folded characters to UTF-16 offsets in the actual visible text (accent and œ tolerant). */
function foldedMap(text){let val='',map=[],i=0;
 for(const ch of text){const f=fold(ch);for(let j=0;j<f.length;j++){val+=f[j];map.push(i);}i+=ch.length;}
 map.push(i);return{val,map};
}
function rangesFor(text,gg){let dict=new Map();
 for(const g of gg){for(const t of g.expanded){const term=fold(t).trim();if(term.length>=2){
 const cls=term===g.base?'hl':'hl-near';if(!dict.has(term)||cls==='hl')dict.set(term,cls);
 }}}
 const {val,map}=foldedMap(text),out=[];
 for(const [term,cls] of [...dict.entries()].sort((a,b)=>b[0].length-a[0].length)){
   let i=0,at=0;while((at=val.indexOf(term,i))!==-1){
     if(eligibleAt(val,term,at))out.push({a:map[at],b:map[at+term.length]??text.length,cls});
     i=at+Math.max(1,term.length);if(out.length>350)break;
   }
 }
 out.sort((x,y)=>x.a-y.a||(x.cls==='hl'?-1:1)||(y.b-x.b));
 let last=0;return out.filter(r=>{if(r.a<last||r.b<=r.a)return false;last=r.b;return true;});
}
function highlight(node,txt,gg){let last=0;
 for(const {a,b,cls} of rangesFor(txt,gg)){
   if(a>last)node.append(document.createTextNode(txt.slice(last,a)));
   node.append(el('mark',txt.slice(a,b),cls));last=b;
 }node.append(document.createTextNode(txt.slice(last)));
}
/* Always show an evidence line with the actual word, so the user does not have to scan unrelated paragraphs. */
function snippets(pg,gg,query){
 const lines=pg.text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s.length>=5);
 const rawQ=fold(query);let candidates=[];
 for(let i=0;i<lines.length;i++){
   const raw=lines[i],f=fold(raw);let hits=0,exact=0,distinct=0;
   for(const g of gg){if(indexOfTerm(f,g.base)>=0){hits+=5;exact++;distinct++;}
     else if(g.expanded.some(t=>indexOfTerm(f,t)>=0)){hits+=2;distinct++;}}
   if(!hits)continue;
   const ratio=(raw.length>250)?Math.min(1,180/raw.length):1;
   const score=hits*ratio+exact*8+distinct*9+(rawQ&&f.includes(rawQ)?40:0)-i*.002;
   candidates.push({raw,i,score,exact,distinct});
 }
 candidates.sort((a,b)=>b.score-a.score);
 const chosen=[],seenGroups=new Set();
 for(const c of candidates){if(chosen.length>=3)break;
   if(chosen.some(x=>x.i===c.i))continue;
   const terms=gg.filter(g=>indexOfTerm(fold(c.raw),g.base)>=0).map(g=>g.base);
   if(chosen.length && terms.length&&terms.every(x=>seenGroups.has(x))&&candidates.length>chosen.length+1)continue;
   chosen.push(c);for(const t of terms)seenGroups.add(t);
 }
 if(!chosen.length)return ['Sujet présent dans le document ; recherche par synonymes.'];
 // Preserve complete source lines where possible, trim overlong lines around a match without hiding it.
 return chosen.sort((a,b)=>a.i-b.i).map(x=>{
   let line=x.raw.replace(/\s+/g,' ');
   if(line.length>300){const positions=gg.map(g=>indexOfTerm(fold(line),g.base)).filter(i=>i>=0);
     const at=positions.length?Math.min(...positions):0;
     const start=Math.max(0,at-95);line=(start?'…':'')+line.slice(start,start+240)+(start+240<x.raw.length?'…':'');
   }return line;
 });
}
const FILEURL=b=>FILE[b]+'?v='+BUILD;
const PDFURL=(b,page)=>FILEURL(b)+'#page='+page;
let mode='all',limit=30,entries=[];
function setMode(next){mode=next;limit=30;
 for(const b of document.querySelectorAll('.mode')){const sel=b.dataset.mode===mode;b.classList.toggle('active',sel);b.setAttribute('aria-pressed',String(sel));}
 search(false);
}
for(const b of document.querySelectorAll('.mode'))b.addEventListener('click',()=>setMode(b.dataset.mode));
for(const b of document.querySelectorAll('.card-search'))b.addEventListener('click',()=>{setMode(b.dataset.mode);$('#query').focus();document.querySelector('.search-section').scrollIntoView({behavior:'smooth',block:'start'});});
function render(){const container=$('#results');container.replaceChildren();const gg=groups($('#query').value.trim());
 for(const {pg,e:ev} of entries.slice(0,limit)){
   const a=el('a',undefined,'res');a.href=PDFURL(pg.block,pg.page);a.target='_blank';a.rel='noopener noreferrer';
   a.dataset.block=String(pg.block);a.dataset.page=String(pg.page);
   const labels=el('div',undefined,'badges');labels.append(el('span','BLOC '+pg.block,'block-pill'),el('span','PAGE DU PDF '+pg.page+' / '+TOTAL[pg.block],'page-pill'));a.append(labels);
   const title=el('div',undefined,'res-title');highlight(title,headingTitle(pg,gg),gg);a.append(title);
   const lineContainer=el('div',undefined,'hit-lines');
   for(const line of snippets(pg,gg,$('#query').value.trim())){const row=el('div',undefined,'hit-line');highlight(row,line,gg);lineContainer.append(row);}
   a.append(lineContainer);
   if(pg.isSupplement)a.append(el('div','AJOUT IA — hors cours original — chapitre associé à la page source '+pg.sourcePage,'add-note'));
   else if(pg.sourcePage!==pg.page)a.append(el('div','Numéro dans la version du cours d’origine : '+pg.sourcePage+' · la page PDF correcte est '+pg.page,'origin-note'));
   a.append(el('div','↗ Ouvrir précisément la page '+pg.page+' du PDF','res-action'));
   container.append(a);
 }
 $('#more').hidden=entries.length<=limit;
 if(!entries.length&&$('#query').value.trim())container.append(el('div','Aucune page ne correspond à cette recherche dans le périmètre sélectionné. Essaie un synonyme ou moins de mots.','empty'));
}
function search(scroll){const term=$('#query').value.trim(),g=groups(term);
 if(!term||!g.length){entries=[];$('#status').textContent='Saisis un sujet pour voir les pages et les blocs correspondants.';render();return;}
 entries=[];
 for(const p of DB){if(mode!=='all'&&String(p.block)!==mode)continue;const e=evaluate(p,g,term);if(e)entries.push({pg:p,e});}
 entries.sort((a,b)=>b.e.score-a.e.score||a.pg.block-b.pg.block||a.pg.page-b.pg.page);
 $('#status').textContent=entries.length+' page'+(entries.length!==1?'s':'')+' trouvée'+(entries.length!==1?'s':'')+' · '+(mode==='all'?'Recherche générale (blocs 1 et 2)':'Recherche bloc '+mode);
 render();if(scroll)$('#output').scrollIntoView({behavior:'smooth',block:'start'});
}
if(window.TSSR_BUILD!==BUILD||DB.length!==TOTAL[1]+TOTAL[2]){
 $('#status').textContent='Index incompatible avec cette version. Actualise la page avec Ctrl + Maj + R.';
 $('#results').replaceChildren();return;
}
$('#form').addEventListener('submit',ev=>{ev.preventDefault();limit=30;search(true);});
let timer;$('#query').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{limit=30;search(false);},140);});
$('#more').addEventListener('click',()=>{limit+=30;render();});
const params=new URLSearchParams(location.search);if(params.has('q'))$('#query').value=params.get('q').slice(0,250);
if(params.has('bloc')&&['1','2'].includes(params.get('bloc')))setMode(params.get('bloc'));else search(false);
})();