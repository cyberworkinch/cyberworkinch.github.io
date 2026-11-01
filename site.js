(()=>{'use strict';
const BUILD='tssr-pagination-unique-20261101-v9';
const PAGES=window.TSSR_PHYSICAL_PAGES || [];
const FILE=window.TSSR_PDF_FILES || {};
const HASH=window.TSSR_PDF_DIGESTS || {};
const TOTAL=window.TSSR_PDF_TOTALS || {};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae');
const words=s=>esc(s).match(/[a-z0-9]+/g)||[];
const stop=new Set(['le','la','les','des','une','un','aux','avec','dans','par','pour','sur','de','du','et','ou','en','au','a','l','d','comment','je','tu','on','suis','veut','voudrais','faire','que','quel','quelle','quels','laquelle','page','bloc']);
const numeric=new Set(['1','2','3','4','5','6','7','8','9']);
const syn={creation:['creer','installer','installation','configurer','mise en place','deployer'],creer:['creation','installation','installer','mise en place'],installation:['installer','deployer','configurer'],installer:['installation','configurer','deployer'],configurer:['configuration','parametrer','installer'],lamp:['apache','mariadb','php','serveur web'],web:['apache','http','https'],php:['php-fpm'],serveur:['server'],ad:['active directory','ad ds','annuaire'],vm:['machine virtuelle','virtualbox','virtualisation'],domaine:['active directory','ad ds'],vlan:['segmentation'],sauvegarde:['backup','rsync'],restaurer:['restauration','recuperer'],utilisateur:['utilisateurs','user','compte'],utilisateurs:['utilisateur','user','compte'],droits:['permissions','chmod','acl'],mariadb:['mysql'],dns:['zone dns']};
function groups(q){const out=[],done=new Set();for(const w of words(q)){
 if(stop.has(w)||numeric.has(w))continue;
 const key=w==='cree'||w==='creez'?'creer':w;
 if(done.has(key))continue;done.add(key);out.push({key,terms:[key,...(syn[key]||[])]});
 }return out.slice(0,14);
}
function eligible(s,t,pos){if(t.length>3)return true;const before=pos?s[pos-1]:'';const after=s[pos+t.length]||'';return !(/[a-z0-9]/.test(before)||/[a-z0-9]/.test(after));}
function match(s,t){const hay=esc(s),needle=esc(t);if(!needle)return -1;let at=0;while((at=hay.indexOf(needle,at))>=0){if(eligible(hay,needle,at))return at;at++;}return -1;}
function foldedMap(s){let val='',map=[],i=0;for(const c of s){const part=esc(c);for(let j=0;j<part.length;j++){val+=part[j];map.push(i);}i+=c.length;}map.push(i);return{val,map};}
function occurrences(s,g){const {val,map}=foldedMap(s);const lex=new Map();for(const x of g){for(const t of x.terms){const v=esc(t).trim();if(v.length<2)continue;if(!lex.has(v)||v===x.key)lex.set(v,v===x.key?'hl':'hl-near');}}
const candidates=[];for(const [term,cls] of [...lex.entries()].sort((a,b)=>b[0].length-a[0].length)){
 let at=0;while((at=val.indexOf(term,at))>=0){if(eligible(val,term,at))candidates.push({a:map[at],b:map[at+term.length]??s.length,cls});at+=Math.max(1,term.length);if(candidates.length>400)break;}}
 candidates.sort((a,b)=>a.a-b.a||(a.cls==='hl'?-1:1)||(b.b-a.b));const out=[];let prev=0;for(const r of candidates){if(r.a>=prev&&r.b>r.a){out.push(r);prev=r.b;}}return out;
}
function el(tag,txt,cls){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;}
function hilite(where,s,g){let i=0;for(const r of occurrences(s,g)){if(r.a>i)where.append(document.createTextNode(s.slice(i,r.a)));where.append(el('mark',s.slice(r.a,r.b),r.cls));i=r.b;}where.append(document.createTextNode(s.slice(i)));}
function indexedLines(pg){return pg.text.split(/\r?\n/).map((s,i)=>({text:s.trim(),line:i+1})).filter(x=>x.text.length>=3);}
function scoreLine(line,g,q){let score=0,count=0;for(const x of g){if(match(line,x.key)>=0){score+=19;count++;}else if(x.terms.some(t=>match(line,t)>=0)){score+=6;count++;}}
if(!count)return -100;
if(esc(line).includes(esc(q)))score+=20;
if(/^(?:[•●▪■]|\d+[.)]|#|\*|—)/.test(line))score+=3;
if(line.length>280)score-=Math.min(12,(line.length-280)/30);
return score+count*6;
}
function matchesPage(pg,g,q){const text=pg.text;let coverage=0,score=0;for(const x of g){const direct=match(text,x.key)>=0,similar=x.terms.some(t=>match(text,t)>=0);if(!similar)continue;coverage++;score+=direct?36:13;}
const required=g.length<=2?g.length:Math.ceil(g.length*.6);if(coverage<required)return null;
score+=coverage*10;
if(esc(text).includes(esc(q)))score+=35;
const lines=indexedLines(pg);const max=Math.max(0,...lines.map(l=>scoreLine(l.text,g,q)));score+=max;
// Penalize tables of contents when real matching procedure pages are available.
if(pg.page<=2)score-=30;
return score;
}
function bestLines(pg,g,q){return indexedLines(pg).map(x=>({...x,score:scoreLine(x.text,g,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.line-b.line);}
function headingLine(pg,g,q){const all=bestLines(pg,g,q);const headings=all.filter(x=>/^(?:[•●▪■]|\d+[.)]|#)/.test(x.text)&&x.text.length<180);
return (headings[0]||all[0]||indexedLines(pg)[0]||{text:'Page du cours',line:1});
}
let mode='all',pages=[],limit=25,query='',gg=[],active=null,verified={};
function error(msg){$('#notice').textContent=msg;$('#notice').hidden=false;}
function clearError(){$('#notice').hidden=true;$('#notice').textContent='';}
function displaySearch(){const out=$('#results');out.replaceChildren();const subset=pages.slice(0,limit);
for(const it of subset){const pg=it.pg;const matched=bestLines(pg,gg,query),head=headingLine(pg,gg,query);
 const card=el('button',undefined,'res');card.type='button';card.dataset.block=String(pg.block);card.dataset.page=String(pg.page);
 const badges=el('div',undefined,'badges');badges.append(el('span','BLOC '+pg.block,'block-pill'),el('span','PAGE '+pg.page+' / '+TOTAL[pg.block],'page-pill'));
 card.append(badges);
 const title=el('div',undefined,'res-title');hilite(title,head.text,gg);card.append(title);
 const snippetRow=el('div',undefined,'hit-lines');const chosen=[head,...matched.filter(x=>x.line!==head.line)].slice(0,4).sort((a,b)=>a.line-b.line);
 for(const x of chosen){const row=el('div',undefined,'hit-line');const pre=el('span','Ligne '+x.line+' · ','line-label');row.append(pre);hilite(row,x.text,gg);row.addEventListener('click',e=>{e.stopPropagation();showPage(pg,x.line);});snippetRow.append(row);}
 card.append(snippetRow);
 card.append(el('div','↗ Voir la page exacte et le passage surligné','res-action'));
 card.addEventListener('click',()=>showPage(pg,head.line));
 out.append(card);
}
$('#more').hidden=pages.length<=limit;
if(!pages.length&&query)out.append(el('p','Aucun passage trouvé. Essaie moins de mots ou un synonyme.','empty'));
}
function showPage(pg,focusLine){active=pg;
 const view=$('#viewer');view.hidden=false;$('#pdfzone').hidden=true;$('#pdfzone').replaceChildren();
 $('#viewer-title').textContent='Bloc '+pg.block+' — page PDF '+pg.page+' / '+TOTAL[pg.block];
 $('#viewer-print').textContent='Page '+pg.page+' du bloc '+pg.block+' : même numéro dans le PDF, le sommaire et la recherche.';
 const all=$('#page-lines');all.replaceChildren();const lines=pg.text.split(/\r?\n/);let target=null;
 for(let i=0;i<lines.length;i++){const raw=lines[i],row=el('div',undefined,'page-line');row.dataset.line=String(i+1);if(!raw.trim())row.classList.add('blank');
  const lab=el('span',String(i+1),'line-num');row.append(lab);const body=el('span',undefined,'line-text');hilite(body,raw,gg);row.append(body);all.append(row);
  if(i+1===focusLine)target=row;
 }
 if(target)target.classList.add('passage-focus');
 view.scrollIntoView({block:'start',behavior:'instant'});
 if(target)target.scrollIntoView({block:'center',behavior:'instant'});
 $('#viewer-close').focus({preventScroll:true});
}
async function verifiedBlob(block){if(verified[block])return verified[block];
 const file=FILE[block];if(!file)throw Error('Nom du PDF inconnu');
 const res=await fetch(file+'?v='+BUILD,{cache:'no-store'});if(!res.ok)throw Error('PDF introuvable sur le site (HTTP '+res.status+')');
 const buf=await res.arrayBuffer();if(!window.crypto?.subtle)throw Error('Vérification SHA-256 non disponible : ouvrir le site en HTTPS.');
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',buf));const sha=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(sha!==HASH[block])throw Error('ERREUR : le PDF en ligne n’est PAS celui de l’index. Ne pas utiliser ce résultat. Il faut remplacer les fichiers du même lot.');
 const blob=URL.createObjectURL(new Blob([buf],{type:'application/pdf'}));verified[block]=blob;return blob;
}
async function openPDF(newWindow){if(!active)return;clearError();const button=$('#pdf-open');button.disabled=true;button.textContent='Vérification du fichier PDF…';
 try{const base=await verifiedBlob(active.block);const url=base+'#page='+active.page;
  if(newWindow){const a=el('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';document.body.append(a);a.click();a.remove();}
  else{const area=$('#pdfzone');area.replaceChildren();const ifr=el('iframe');ifr.src=url;ifr.title='PDF original — bloc '+active.block+' — page '+active.page;ifr.className='pdf-frame';area.append(ifr);area.hidden=false;area.scrollIntoView({block:'start',behavior:'smooth'});}
 }catch(e){error(e.message||String(e));}
 finally{button.disabled=false;button.textContent='Voir cette page dans le PDF original (vérifié)';}
}
function search(doScroll){query=$('#query').value.trim();gg=groups(query);pages=[];clearError();if(!gg.length){$('#status').textContent='Saisis un ou plusieurs mots-clés.';$('#results').replaceChildren();$('#more').hidden=true;return;}
 for(const pg of PAGES){if(mode!=='all'&&String(pg.block)!==mode)continue;const score=matchesPage(pg,gg,query);if(score!==null)pages.push({pg,score});}
 pages.sort((a,b)=>b.score-a.score||a.pg.block-b.pg.block||a.pg.page-b.pg.page);
 $('#status').textContent=pages.length+' page(s) trouvée(s) · '+(mode==='all'?'Les deux blocs':'Bloc '+mode);
 displaySearch();if(doScroll)$('#output').scrollIntoView({block:'start',behavior:'smooth'});
}
function setMode(m){mode=m;limit=25;for(const b of document.querySelectorAll('.mode')){b.classList.toggle('active',b.dataset.mode===m);b.setAttribute('aria-pressed',String(b.dataset.mode===m));}search(false);}
if(window.TSSR_BUILD!==BUILD||PAGES.length!==Number(TOTAL[1])+Number(TOTAL[2])||!FILE[1]||!FILE[2]){error('ERREUR DE VERSION : index incomplet ou ancien. Tous les fichiers du lot doivent être déployés ensemble.');$('#form button').disabled=true;return;}
for(const b of document.querySelectorAll('.mode'))b.addEventListener('click',()=>setMode(b.dataset.mode));
for(const b of document.querySelectorAll('.card-search'))b.addEventListener('click',()=>{setMode(b.dataset.mode);$('#query').focus();$('.search-section').scrollIntoView({block:'start',behavior:'smooth'});});
$('#form').addEventListener('submit',e=>{e.preventDefault();limit=25;search(true);});
let timer;$('#query').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{limit=25;search(false);},110);});
$('#more').addEventListener('click',()=>{limit+=25;displaySearch();});
$('#viewer-close').addEventListener('click',()=>{$('#viewer').hidden=true;$('#pdfzone').replaceChildren();$('#output').scrollIntoView({block:'start',behavior:'smooth'});});
$('#pdf-open').addEventListener('click',()=>openPDF(false));$('#pdf-tab').addEventListener('click',()=>openPDF(true));
const params=new URLSearchParams(location.search);if(params.has('q'))$('#query').value=params.get('q').slice(0,250);
if(['1','2'].includes(params.get('bloc')))setMode(params.get('bloc'));else search(false);
window.TSSR_TEST={get results(){return pages.map(x=>({block:x.pg.block,page:x.pg.page,score:x.score}));},get active(){return active;},verifiedBlob,search,setMode,bestLines,headingLine};
})();
