(()=>{'use strict';
const BUILD='tssr-cible-lignes-20261101-v12';
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
let mode='all',pages=[],limit=25,query='',gg=[],active=null,verified={},focusCard=null,selectedLine=1;
const dialog=$('#reader-dialog');
const readerLines=$('#reader-page-lines');
const readerFocus=$('#reader-focus');
const readerPDF=$('#reader-pdfzone');
let readerHistory=false;
const countText=(v)=>v===1?'ligne':'lignes';
function error(msg){$('#notice').textContent=msg;$('#notice').hidden=false;}
function clearError(){$('#notice').hidden=true;$('#notice').textContent='';}
function lineExcerpt(pg,line){
 const rows=pg.text.split(/\r?\n/),i=Math.max(0,line-1);let text=(rows[i]||'').trim(),extra=0;
 // Un titre ou une instruction peut être coupé par le retour à la ligne du PDF.
 // Ne recoller que la ligne suivante commençant par une minuscule, sans ajouter un autre chapitre.
 while(extra<2 && text.length<300 && text && !/[.!?;:]$/.test(text)){
  const nx=(rows[i+extra+1]||'').trim();
  if(!nx || !/^[a-zà-öø-ÿ]/.test(nx))break;
  text+=' '+nx;extra++;
 }
 return {text,from:line,to:line+extra};
}
function locationLabel(pg,line){let n=pg.text.split(/\r?\n/).length;const pc=line/Math.max(n,1);
  return pc<.36?'au début':pc<.71?'vers le milieu':'vers la fin';}
function displaySearch(){const out=$('#results');out.replaceChildren();const subset=pages.slice(0,limit);
for(const it of subset){const pg=it.pg;const matched=bestLines(pg,gg,query),head=headingLine(pg,gg,query);
 const card=el('button',undefined,'res');card.type='button';card.dataset.block=String(pg.block);card.dataset.page=String(pg.page);
 const badges=el('div',undefined,'badges');badges.append(el('span','BLOC '+pg.block,'block-pill'),el('span','PAGE PDF '+pg.page+' / '+TOTAL[pg.block],'page-pill'));
 card.append(badges);
 const title=el('div',undefined,'res-title');hilite(title,lineExcerpt(pg,head.line).text,gg);card.append(title);
 const snippetRow=el('div',undefined,'hit-lines');const chosen=[head,...matched.filter(x=>x.line!==head.line)].slice(0,4).sort((a,b)=>a.line-b.line);
 for(const x of chosen){const row=el('div',undefined,'hit-line');const pre=el('span','Ligne '+x.line+(lineExcerpt(pg,x.line).to>x.line?'–'+lineExcerpt(pg,x.line).to:'')+' ('+locationLabel(pg,x.line)+' de la page) · ','line-label');row.append(pre);hilite(row,lineExcerpt(pg,x.line).text,gg);row.addEventListener('click',e=>{e.stopPropagation();showReader(pg,x.line,card);});snippetRow.append(row);}
 card.append(snippetRow);
 card.append(el('div','↗ Lire ce passage en surbrillance sans quitter la recherche','res-action'));
 card.addEventListener('click',()=>showReader(pg,head.line,card));
 out.append(card);
}
$('#more').hidden=pages.length<=limit;
if(!pages.length&&query)out.append(el('p','Aucun passage trouvé. Essaie moins de mots ou un synonyme.','empty'));
}
function updateSelected(pg,line){selectedLine=line;
 const selection=lineExcerpt(pg,line),chosen=selection.text;
 $('#reader-where').textContent='Passage sélectionné : ligne '+line+(selection.to>line?' à '+selection.to:'')+', '+locationLabel(pg,line)+' de la page PDF '+pg.page+'.';
 readerFocus.replaceChildren();hilite(readerFocus,chosen,gg);
 for(const r of readerLines.querySelectorAll('.passage-focus'))r.classList.remove('passage-focus');
 const target=readerLines.querySelector('[data-line="'+line+'"]');
 if(target){target.classList.add('passage-focus');target.scrollIntoView({block:'center',behavior:'instant'});}
}
function showReader(pg,line,card){active=pg;focusCard=card;
 $('#reader-title').textContent='Bloc '+pg.block+' — page '+pg.page+' / '+TOTAL[pg.block];
 $('#reader-identifier').textContent='Même page pour le résultat, le texte et le PDF. Cette page peut contenir plusieurs chapitres.';
 const all=readerLines;all.replaceChildren();let lines=pg.text.split(/\r?\n/);
 for(let i=0;i<lines.length;i++){const raw=lines[i];let row=el('div',undefined,'page-line');row.dataset.line=String(i+1);if(!raw.trim())row.classList.add('blank');
  row.append(el('span',String(i+1),'line-num'));const body=el('span',undefined,'line-text');hilite(body,raw,gg);row.append(body);all.append(row);
 }
 readerPDF.hidden=true;readerPDF.replaceChildren();$('#reader-pdf-toggle').textContent='Afficher la page dans le PDF original';
 if(!dialog.open){dialog.showModal();readerHistory=true;
   history.pushState({tssrReader:true},'','#passage-b'+pg.block+'-p'+pg.page+'-l'+line);
 }
 requestAnimationFrame(()=>{updateSelected(pg,line);$('#reader-close').focus({preventScroll:true});});
}
function closeReader(byHistory=false){if(dialog.open)dialog.close();readerPDF.replaceChildren();readerPDF.hidden=true;
 if(!byHistory && readerHistory && history.state?.tssrReader)history.back();
 readerHistory=false;if(focusCard?.isConnected)focusCard.focus({preventScroll:true});}
async function verifiedBlob(block){if(verified[block])return verified[block];
 const file=FILE[block];if(!file)throw Error('Nom du PDF inconnu');
 const res=await fetch(file+'?v='+BUILD,{cache:'no-store'});if(!res.ok)throw Error('PDF introuvable sur le site (HTTP '+res.status+')');
 const buf=await res.arrayBuffer();if(!window.crypto?.subtle)throw Error('Vérification SHA-256 indisponible : site HTTPS requis.');
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',buf));const sha=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(sha!==HASH[block])throw Error('ALERTE : le PDF publié ne correspond pas à l’index. N’utilise pas ce résultat tant que tous les fichiers ne sont pas publiés ensemble.');
 const blob=URL.createObjectURL(new Blob([buf],{type:'application/pdf'}));verified[block]=blob;return blob;
}
async function openPDF(newWindow=false){if(!active)return;clearError();const button=$('#reader-pdf-toggle');button.disabled=true;const old=button.textContent;button.textContent='Contrôle SHA-256 du PDF…';
 // Ouvrir la fenêtre dans le geste utilisateur, sinon la plupart des navigateurs bloquent l'onglet.
 const tab=newWindow?window.open('about:blank','_blank'):null;
 try{const base=await verifiedBlob(active.block);const url=base+'#page='+active.page;
 if(newWindow){if(tab){tab.location.href=url;}else error('Nouvel onglet bloqué : autorise les fenêtres contextuelles pour ce site.');}
 else{const area=readerPDF;area.replaceChildren();const tip=el('p','Repère : le passage sélectionné se trouve '+locationLabel(active,selectedLine)+' de la page. Le PDF peut présenter plusieurs chapitres sur la même page.','pdf-tip');area.append(tip);
 const ifr=el('iframe');ifr.src=url;ifr.title='Bloc '+active.block+' — page PDF '+active.page;ifr.className='pdf-frame';area.append(ifr);area.hidden=false;button.textContent='Masquer le PDF';
 area.scrollIntoView({block:'start',behavior:'smooth'});}}
 catch(e){if(tab)tab.close();error(e.message||String(e));}
 finally{button.disabled=false;if(readerPDF.hidden)button.textContent=old;}
}
function search(doScroll){query=$('#query').value.trim();gg=groups(query);pages=[];clearError();
 if(!gg.length){$('#status').textContent='Saisis un ou plusieurs mots-clés.';$('#results').replaceChildren();$('#more').hidden=true;return;}
 for(const pg of PAGES){if(mode!=='all'&&String(pg.block)!==mode)continue;const score=matchesPage(pg,gg,query);if(score!==null)pages.push({pg,score});}
 pages.sort((a,b)=>b.score-a.score||a.pg.block-b.pg.block||a.pg.page-b.pg.page);
 $('#status').textContent=pages.length+' page(s) trouvée(s) · '+(mode==='all'?'Les deux blocs':'Bloc '+mode);
 displaySearch();if(doScroll)$('#output').scrollIntoView({block:'start',behavior:'smooth'});
}
function setMode(m){mode=m;limit=25;for(const b of document.querySelectorAll('.mode')){b.classList.toggle('active',b.dataset.mode===m);b.setAttribute('aria-pressed',String(b.dataset.mode===m));}search(false);}
if(window.TSSR_BUILD!==BUILD||PAGES.length!==Number(TOTAL[1])+Number(TOTAL[2])||!FILE[1]||!FILE[2]){error('ERREUR DE VERSION : index incomplet ou ancien. Tous les fichiers du lot doivent être déployés ensemble.');$('#form button').disabled=true;}
else{
 for(const b of document.querySelectorAll('.mode'))b.addEventListener('click',()=>setMode(b.dataset.mode));
 for(const b of document.querySelectorAll('.card-search'))b.addEventListener('click',()=>{setMode(b.dataset.mode);$('#query').focus();$('.search-section').scrollIntoView({block:'start',behavior:'smooth'});});
 $('#form').addEventListener('submit',e=>{e.preventDefault();limit=25;search(true);});
 let timer;$('#query').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{limit=25;search(false);},110);});
 $('#more').addEventListener('click',()=>{limit+=25;displaySearch();});
 $('#reader-close').addEventListener('click',()=>closeReader());
 $('#reader-dialog').addEventListener('cancel',e=>{e.preventDefault();closeReader();});
 window.addEventListener('popstate',()=>{if(dialog.open)closeReader(true);});
 $('#reader-pdf-toggle').addEventListener('click',()=>{
  if(!readerPDF.hidden){readerPDF.hidden=true;readerPDF.replaceChildren();$('#reader-pdf-toggle').textContent='Afficher la page dans le PDF original';readerLines.scrollIntoView({block:'start'});}
  else openPDF(false);
 });
 $('#reader-pdf-tab').addEventListener('click',()=>openPDF(true));
 $('#reader-return').addEventListener('click',()=>{readerPDF.hidden=true;readerPDF.replaceChildren();$('#reader-pdf-toggle').textContent='Afficher la page dans le PDF original';updateSelected(active,selectedLine);readerFocus.scrollIntoView({block:'start',behavior:'smooth'});});
 const params=new URLSearchParams(location.search);if(params.has('q'))$('#query').value=params.get('q').slice(0,250);
 if(['1','2'].includes(params.get('bloc')))setMode(params.get('bloc'));else search(false);
}
window.TSSR_TEST={get results(){return pages.map(x=>({block:x.pg.block,page:x.pg.page,score:x.score}));},get active(){return active;},verifiedBlob,search,setMode,bestLines,headingLine,openReader:showReader};
})();