(()=>{'use strict';
const DB=window.TSSR_PHYSICAL_PAGES||[];
const TOTAL={1:270,2:248};
const FILE={1:'support.pdf',2:'TSSR_BLOC_2_APPROFONDISSEMENTS_COMPLETS.pdf'};
const $=(s)=>document.querySelector(s);
const fold=(s)=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae');
const words=(s)=>fold(s).match(/[a-z0-9]+/g)||[];
const noise=new Set(['le','la','les','des','une','un','aux','avec','dans','par','pour','sur','de','du','et','ou','en','au','a','l','d','comment','je','tu','on','suis','veut','voudrais','faire','que','quel','quelle','quels','laquelle','page','bloc']);
const eq={
  creation:['creer','installer','installation','configurer','mise en place','deployer'],
  creer:['creer','creation','configurer','installation','installer','mise en place','deployer'],
  installe:['installer','installation','deployer','creation','mettre en place'],
  installer:['installation','installer','deployer','mise en place','configurer','creer'],
  installation:['installer','deployer','configurer','mettre en place'],
  configurer:['configuration','parametrer','installer','creer'],
  lamp:['lamp','apache','mariadb','php','serveur web'],
  web:['web','apache','http','https'],
  php:['php','php-fpm'],
  serveur:['server','serveur'],
  glpi:['glpi'],
  active:['active'],
  ad:['active directory','ad ds','adds','annuaire'],
  vm:['machine virtuelle','virtualbox','virtualisation'],
  domaine:['domaine','active directory','ad ds'],
  vlan:['vlan','segmentation'],
  sauvegarde:['backup','sauvegarde','rsync'],
  restaurer:['restauration','restaurer','recuperer'],
  utilisateurs:['utilisateur','user','compte'],
  utilisateur:['utilisateurs','user','compte'],
  droits:['permission','permissions','acl','chmod'],
  dns:['dns','zone dns'],
  dhcp:['dhcp'],
  mariadb:['mariadb','mysql'],
};
const STOP_NUMERIC=new Set(['1','2','3','4','5','6','7','8','9']);
function groups(q){const unique=new Set();const out=[];for(let w of words(q)){
 if(noise.has(w)||STOP_NUMERIC.has(w))continue;
 const base=w.replace(/^(?:cree|creer|creez)$/,'creer');
 if(unique.has(base))continue;unique.add(base);
 out.push({base,expanded:[base,...(eq[base]||[])]});
}return out.slice(0,14)}
function indexOfTerm(haystack,term){
 const t=fold(term);let pos=0;
 while((pos=haystack.indexOf(t,pos))>=0){
   const bef=pos>0?haystack[pos-1]:'';
   const aft=pos+t.length<haystack.length?haystack[pos+t.length]:'';
   if(t.length<=3 && (/[a-z0-9]/.test(bef) || /[a-z0-9]/.test(aft))) {pos++;continue;}
   return pos;
 }return -1;
}
function distinctMatch(text,alts){const t=fold(text);return alts.find(x=>t.includes(x))||null}
function headingTitle(pg,gg){const scored=(pg.titles||[]).map(h=>{
 const htext=fold(h.title);let score=0;
 for(const g of gg){if(htext.includes(g.base))score+=10;else if(g.expanded.some(x=>htext.includes(x)))score+=5;}
 return{title:h.title,score};
});scored.sort((a,b)=>b.score-a.score);
 if(scored.length && scored[0].score>=4)return scored[0].title;
 if(scored.length)return scored[0].title;
 return pg.fallback;
}
function evaluate(pg,gg,raw){
 if(!gg.length)return null;
 const content=fold(pg.text),titles=fold((pg.titles||[]).map(x=>x.title).join(' '));
 let coverage=0,score=0,loc=[];
 for(const g of gg){let best=null,bestWeight=0,bestPos=1e9;
  if(g.base==='lamp' && !content.includes('lamp') && ['apache','mariadb','php'].filter(k=>content.includes(k)).length<2)continue;
  for(const alt of g.expanded){const pos=indexOfTerm(content,alt);
   if(pos>=0){const weight=(alt===g.base?6:3.5)+Math.min(4,alt.length/5);if(weight>bestWeight){bestWeight=weight;bestPos=pos;best=alt;}}
  }
  if(best){coverage++;score+=bestWeight;loc.push({pos:bestPos,term:best});}
  if(titles.includes(g.base))score+=25;
  else if(g.expanded.some(x=>titles.includes(x)))score+=11;
 }
 // Each indexed page must actually contain the requested topic, not just a guessed card title.
 const required=gg.length===1?1:gg.length===2?2:Math.ceil(gg.length*.6);
 if(coverage<required)return null;
 score+=coverage*14+coverage/gg.length*20;
 const literal=fold(raw);if(literal && content.includes(literal)){const count=content.split(literal).length-1;score+=55+50*Math.min(5,count);}
 // A subject-rich technical procedure is preferred to a table of contents for ordinary queries.
 if(!/sommaire|chapitre|index|plan/.test(fold(raw)) && ((pg.block===1 && [1,2,177,201,259].includes(pg.page)) || (pg.block===2 && pg.page===1)))score-=35;
 if(gg.some(g=>g.base==='lamp') && ['apache','mariadb','php'].every(k=>content.includes(k)))score+=10;
 if(loc.length>=2){const positions=loc.map(x=>x.pos).sort((a,b)=>a-b);const near=Math.min(...positions.slice(1).map((v,i)=>v-positions[i]));score+=Math.max(0,25-Math.min(25,near/30));}
 // Anchor excerpt to a term actually visible on this physical page.
 const anchor=loc.reduce((a,b)=>a.pos<=b.pos?a:b).pos;
 return{score,anchor,match:loc};
}
function excerpt(pg,e){let raw=pg.text.replace(/\s+/g,' '),canon=fold(raw);let query=fold($('#query').value.trim());let match=e.match.slice().sort((a,b)=>b.term.length-a.term.length);let needle=match.length?match[0].term:'';let offset=query?canon.indexOf(query):-1;if(offset<0)offset=indexOfTerm(canon,needle);
 if(offset<0)offset=0;
 let start=Math.max(0,offset-92),end=Math.min(raw.length,offset+235);
 if(start>0){let i=raw.indexOf(' ',start);if(i>0&&i<start+30)start=i+1;}
 if(end<raw.length){let i=raw.lastIndexOf(' ',end);if(i>0&&i>end-30)end=i;}
 return (start?'…':'')+raw.slice(start,end).trim()+(end<raw.length?'…':'');
}
const make=(tag,text,cls)=>{let x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x};
/* Accent-insensitive match ranges are mapped back to the original text; every mark is a safe text node. */
function foldedPositionMap(text){let val='',map=[],idx=0;for(const char of text){const seq=fold(char);for(const c of seq){val+=c;map.push(idx);}idx+=char.length;}map.push(idx);return {val,map};}
function highlight(node,txt,query){
  const gs=groups(query),dict=new Map();
  for(const g of gs){for(const term of g.expanded){const t=fold(term).trim();if(t.length>=2)dict.set(t,t===g.base?'hl':'hl-near');}}
  const {val,map}=foldedPositionMap(txt),ranges=[];
  for(const [term,cls] of [...dict.entries()].sort((a,b)=>b[0].length-a[0].length)){
    let start=0,found=0;while((found=val.indexOf(term,start))!==-1){
      const a=map[found],b=map[found+term.length]??txt.length;
      const bef=found>0?val[found-1]:''; const aft=found+term.length<val.length?val[found+term.length]:'';
      if(b>a && !(term.length<=3 && (/[a-z0-9]/.test(bef) || /[a-z0-9]/.test(aft))))ranges.push([a,b,cls]);start=found+Math.max(1,term.length);if(ranges.length>250)break;
    }
  }
  ranges.sort((a,b)=>a[0]-b[0]||(a[2]==='hl'?-1:1)||(b[1]-a[1]));
  let last=0;for(const [a,b,cls] of ranges){if(a<last)continue;
    if(a>last)node.append(document.createTextNode(txt.slice(last,a)));
    node.append(make('mark',txt.slice(a,b),cls));last=b;
  }node.append(document.createTextNode(txt.slice(last)));
}

let mode='all',limit=30,entries=[];
function setMode(next){mode=next;limit=30;
 for(let b of document.querySelectorAll('.mode')){let sel=b.dataset.mode===mode;b.classList.toggle('active',sel);b.setAttribute('aria-pressed',String(sel));}
 search(false);
}
for(const b of document.querySelectorAll('.mode'))b.addEventListener('click',()=>setMode(b.dataset.mode));
for(const b of document.querySelectorAll('.card-search'))b.addEventListener('click',()=>{setMode(b.dataset.mode);$('#query').focus();document.querySelector('.search-section').scrollIntoView({behavior:'smooth',block:'start'});});
function render(){let container=$('#results');container.replaceChildren();for(const {pg,e:ev} of entries.slice(0,limit)){
 const a=make('a',undefined,'res');a.href=FILE[pg.block]+'#page='+pg.page;a.target='_blank';a.rel='noopener noreferrer';
 const labels=make('div',undefined,'badges');labels.append(make('span','BLOC '+pg.block,'block-pill'),make('span','PAGE '+pg.page+' / '+TOTAL[pg.block],'page-pill'));a.append(labels);
 const title=make('div',undefined,'res-title');highlight(title,headingTitle(pg,groups($('#query').value)),$('#query').value);a.append(title);
 const snippet=make('div',undefined,'excerpt');highlight(snippet,excerpt(pg,ev),$('#query').value);a.append(snippet);
 if(pg.isSupplement)a.append(make('div','AJOUT IA — hors cours original — chapitre associé à la page source '+pg.sourcePage,'add-note'));
 else if(pg.sourcePage!==pg.page)a.append(make('div','Page du cours original : '+pg.sourcePage,'origin-note'));
 a.append(make('div','↗ Ouvrir le bloc '+pg.block+' à la page '+pg.page,'res-action'));
 container.append(a);
 }
 $('#more').hidden=entries.length<=limit;
 if(!entries.length&&$('#query').value.trim())container.append(make('div','Aucune page ne correspond à cette recherche dans le périmètre sélectionné. Essaie un synonyme ou moins de mots.','empty'));
}
function search(scroll){const term=$('#query').value.trim();let g=groups(term);if(!term||!g.length){entries=[];$('#status').textContent='Saisis un sujet pour voir les pages et les blocs correspondants.';render();return;}
 entries=[];
 for(let p of DB){if(mode!=='all'&&String(p.block)!==mode)continue;const e=evaluate(p,g,term);if(e)entries.push({pg:p,e});}
 entries.sort((a,b)=>b.e.score-a.e.score || a.pg.block-b.pg.block || a.pg.page-b.pg.page);
 $('#status').textContent=entries.length+' page'+(entries.length!==1?'s':'')+' trouvée'+(entries.length!==1?'s':'')+' · '+(mode==='all'?'Recherche générale (blocs 1 et 2)':'Recherche bloc '+mode);
 render();if(scroll)$('#output').scrollIntoView({behavior:'smooth',block:'start'});
}
$('#form').addEventListener('submit',ev=>{ev.preventDefault();limit=30;search(true)});
let timer;$('#query').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{limit=30;search(false)},160)});
$('#more').addEventListener('click',()=>{limit+=30;render()});
const params=new URLSearchParams(location.search);if(params.has('q'))$('#query').value=params.get('q').slice(0,250);
if(params.has('bloc')&&['1','2'].includes(params.get('bloc')))setMode(params.get('bloc'));else search(false);
})();
