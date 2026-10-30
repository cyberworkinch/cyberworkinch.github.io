// Recherche locale. Aucun compte, aucune API et aucun script externe ne sont nécessaires.
'use strict';
const $ = (id) => document.getElementById(id);
const input = $('q');
let library = null;
let indexed = [];
let filter = 'all';
let found = [];
let shown = 0;
const PER_PAGE = 25;

function fold(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function tokenize(query) {
  const words = fold(query).match(/[a-z0-9]+/g) || [];
  const ignored = new Set(['le','la','les','de','du','des','un','une','en','et','a','au','aux','pour','sur','avec','est','dans','comment','faire','mon','ma','mes','son','ses','par','que','qui','il','elle','je','tu','on','the','of']);
  const kept = words.filter(w => w.length >= 2 && !ignored.has(w));
  return [...new Set(kept.length ? kept : words.filter(w => w.length >= 2))].slice(0, 12);
}
function escapeHtml(value) {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function pdfHref(page) { return `support.pdf#page=${encodeURIComponent(page)}`; }
function computeScore(p, terms) {
  // Classement purement documentaire. Ne calcule aucune réponse ni ne génère de script.
  const doc={type:'cours',title:p.precise_title||p.topic||'',sub:p.block,
    body:p.text.slice(0,250),search:p.text,source:'PDF original'};
  const score=window.TSSR_SEARCH.rank(doc,input.value);
  return score>0?score:-1;
}
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function highlightSnippet(source,terms) {
  // Map accentless characters back to the original string to highlight accented French text too.
  const mapping=[];
  let normalized='';
  for(let i=0;i<source.length;){
    const cp=source.codePointAt(i);
    const char=String.fromCodePoint(cp);
    const f=fold(char);
    for(let j=0;j<f.length;j++)mapping.push([i,i+char.length]);
    normalized+=f;
    i+=char.length;
  }
  const ranges=[];
  for(const term of terms){
    let pos=normalized.indexOf(term);
    while(pos !== -1){if(mapping[pos]&&mapping[pos+term.length-1])ranges.push([mapping[pos][0],mapping[pos+term.length-1][1]]);pos=normalized.indexOf(term,pos+term.length);}
  }
  ranges.sort((a,b)=>a[0]-b[0]);
  const merged=[];
  for(const r of ranges){const prev=merged[merged.length-1];if(prev&&r[0]<=prev[1])prev[1]=Math.max(prev[1],r[1]);else merged.push(r.slice());}
  let result='',start=0;
  for(const [a,b] of merged){result+=escapeHtml(source.slice(start,a));result+='<mark>'+escapeHtml(source.slice(a,b))+'</mark>';start=b;}
  result+=escapeHtml(source.slice(start));
  return result;
}
function bestExcerpt(p,terms) {
  const folded=p.folded;
  let bestPos=0,bestScore=-1;
  // Extract a readable 360-character passage around a relevant occurrence.
  for (const term of terms){
    let pos=folded.indexOf(term),steps=0;
    while(pos !== -1 && steps++ < 75){
      const first=Math.max(0,pos-130),last=Math.min(folded.length,pos+270);
      let score=0;
      for(const other of terms){if(folded.slice(first,last).includes(other))score+=20;}
      if(score > bestScore){bestScore=score;bestPos=pos;}
      pos=folded.indexOf(term,pos+term.length);
    }
  }
  const offset=Math.max(0,bestPos-135);
  const end=Math.min(p.text.length,offset+400);
  let excerpt=p.text.slice(offset,end).replace(/\s+/g,' ').trim();
  return `${offset>0?'… ':''}${highlightSnippet(excerpt,terms)}${end<p.text.length?' …':''}`;
}
function renderIndex() {
  const byBlock={'Bloc 1':[], 'Bloc 2':[]};
  for(const p of library.pages) {
    // Les titres précis de navigation proviennent du contenu de chaque page, pas du titre du chapitre précédent.
    byBlock[p.block].push(p);
  }
  $('num-pages').textContent=library.pages.length;
  $('num-sections').textContent=library.sections.length;
  $('index-groups').innerHTML=Object.entries(byBlock).map(([name,items],idx)=>`
    <article class="index-group">
      <h3>${name==='Bloc 1'?'Fondamentaux et priorités':'Compléments et procédures avancées'}</h3>
      <p class="sub">${escapeHtml(name)} · ${items.length} pages avec un titre précis · pages ${idx===0?'1–79':'80–176'}</p>
      <details><summary>Afficher les ${items.length} titres précis</summary><ol class="section-list">
        ${items.map(p=>`<li><a href="${pdfHref(p.page)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(p.precise_title || p.topic)}</span><em>p. ${p.page} ↗</em></a></li>`).join('')}
      </ol></details>
    </article>`).join('');
}
function doSearch(query,scroll=true){
  input.value=query;
  const terms=tokenize(query);
  if(!library){return;}
  const resultsSection=$('results-section');
  if(!terms.length){
    resultsSection.hidden=true;found=[];
    const url=new URL(window.location.href);url.searchParams.delete('q');history.replaceState(null,'',url);
    return;
  }
  const url=new URL(window.location.href);url.searchParams.set('q',query);history.replaceState(null,'',url);
  found=indexed.map(p=>({p,score:computeScore(p,terms)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score || a.p.page-b.p.page);
  shown=0;
  resultsSection.hidden=false;
  drawResults(terms);
  if(scroll)resultsSection.scrollIntoView({behavior:'smooth',block:'start'});
}
function drawResults(terms){
  const matches=found.filter(x=>filter==='all'||x.p.block===filter);
  $('results-title').textContent=matches.length===0?'Aucune page trouvée':`${matches.length} page${matches.length>1?'s':''} trouvée${matches.length>1?'s':''}`;
  const upTo=Math.min(matches.length,shown+PER_PAGE);
  const chunk=matches.slice(shown,upTo);
  const html=chunk.map(({p})=>`<article class="result">
    <div><div class="meta">${escapeHtml(p.block)}<span class="dot">·</span>Page ${p.page}</div>
      <h3>${escapeHtml(p.precise_title || p.topic)}</h3><p class="excerpt">${bestExcerpt(p,terms)}</p></div>
    <a href="${pdfHref(p.page)}" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir la page ${p.page} du PDF">Ouvrir p. ${p.page} ↗</a>
  </article>`).join('');
  if(shown===0)$('results').innerHTML=html||'<div class="empty">Aucun résultat. Essaie un nom de logiciel, une commande ou un autre mot-clé.</div>';
  else $('results').insertAdjacentHTML('beforeend',html);
  shown=upTo;
  $('show-more').hidden=shown>=matches.length;
}
function setFilter(value){
  filter=value;
  document.querySelectorAll('[data-filter]').forEach(btn=>{const active=btn.dataset.filter===value;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
  const terms=tokenize(input.value);
  shown=0;
  drawResults(terms);
}
$('search-form').addEventListener('submit',event=>{event.preventDefault();doSearch(input.value);});
input.addEventListener('input',()=>{if(!input.value.trim())doSearch('',false);});
document.querySelectorAll('[data-query]').forEach(btn=>btn.addEventListener('click',()=>doSearch(btn.dataset.query)));
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>setFilter(btn.dataset.filter)));
$('show-more').addEventListener('click',()=>drawResults(tokenize(input.value)));
document.addEventListener('keydown',event=>{if(event.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();input.focus();}if(event.key==='Escape' && document.activeElement===input){input.blur();}});
Promise.resolve(window.TSSR_DATA)
  .then(data=>{if(!data)throw new Error('Index introuvable');return data;})
  .then(data=>{library=data;indexed=data.pages.map(p=>({...p,folded:fold(p.text)}));renderIndex();$('load-state').textContent='Index prêt';const q=new URL(window.location.href).searchParams.get('q');if(q)doSearch(q,false);})
  .catch(error=>{$('load-state').textContent='Index indisponible';$('index-groups').innerHTML='<p class="empty">Le moteur de recherche ne s’est pas chargé. Le PDF complet reste consultable avec le lien ci-dessus. Vérifie que tous les fichiers ont été publiés.</p>';console.error(error);});
