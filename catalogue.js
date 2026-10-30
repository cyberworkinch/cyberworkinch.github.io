(()=>{'use strict';
const kb=window.KB_TSSR;const $=s=>document.querySelector(s);let tab='all',query='',limit=20;
const n=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const sw=new Set('le la les un une des de du et ou au aux en pour dans sur avec comment quelle quel combien faire je veux me mon ma mes tu il ce cette ça a est ai avoir obtenir les installer configurer etablir mettre trouver affiche donne permet'.split(' '));
function words(s){return [...new Set((n(s).match(/[a-z0-9]+/g)||[]).filter(t=>t.length>1&&!sw.has(t)))].slice(0,18);}
function el(tag,text,cls){let p=document.createElement(tag);if(text!==undefined)p.textContent=String(text);if(cls)p.className=cls;return p;}
function link(parent,title,url){if(!/^https:\/\//.test(url)&&!url.startsWith('support.pdf#'))return;let a=el('a',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer nofollow';parent.append(a);}
function paragraph(p,t,label){if(!t)return;let d=el('p',label?label+' : '+t:t);p.append(d);}
const add=($p,tag,t,cls)=>{let x=el(tag,t,cls);$p.append(x);return x;};
function cp(g){let t=n([g.software,g.title,g.tags].join(' '));if(/freepbx|asterisk|xivo|telephon|voip|sip|rtp/.test(t))return 4;if(/sauvegard|rsync|cobian|raid|restaur/.test(t))return 8;if(/wds|pxe|wsus|mdt|deploiement/.test(t))return 9;if(/proxmox|vsphere|vmware|hyper-v|virtualbox|hyperviseur/.test(t))return 5;if(/script|bash|powershell/.test(t))return 6;if(/pfsense|proxy|squid|acl|vpn|firewall|pare-feu/.test(t))return 7;if(/active directory|gpo|dns|dhcp|smb|rds|windows server|ldap/.test(t))return 2;if(/linux|debian|ssh|wiki.js|permission/.test(t))return 3;if(/glpi|ticket|incident|imprimant|diagnostic|agent/.test(t))return 1;return 4;}
const cpnames=['','Support et tickets','Windows / AD / DNS / GPO','Linux / SSH','Réseaux IP','Virtualisation','Scripts','Sécurité / pare-feu','Sauvegarde','Déploiement'];
let datasets={
 guides:kb.guides.map(g=>({type:'guides',data:g,header:g.title,body:[g.title,g.software,g.version,g.action,g.summary,g.tags,g.prereq,g.check,g.warning,g.alternatives,...(g.steps||[]).flatMap(s=>[s.text,s.cmd])].join(' ')})),
 pages:kb.pages.map(p=>({type:'pages',data:p,header:(kb.sections.filter(s=>s.page<=p.page).slice(-1)[0]||{}).title||'Cours de révision',body:p.text})),
 diagnostics:kb.diagnostics.map(x=>({type:'diagnostics',data:x,header:x.name,body:[x.name,x.tags,...x.steps.flatMap(s=>[s.phase,s.test,s.next])].join(' ')})),
 commands:kb.commands.map(x=>({type:'commands',data:x,header:x.name,body:[x.name,x.description,x.tags,x.linux,x.ps].join(' ')})),
 ports:kb.ports.map(x=>({type:'ports',data:x,header:x.name,body:[x.name,x.port,x.proto,x.description].join(' ')})),
 compat:kb.compat.map(x=>({type:'compat',data:x,header:x.title,body:[x.title,x.status,x.text].join(' ')})),
 resources:kb.resources.map(x=>({type:'resources',data:x,header:x.name,body:[x.name,x.type,x.note].join(' ')}))
};let all=Object.values(datasets).flat();all.forEach(x=>{x.norm=n(x.header+' '+x.body);x.titleNorm=n(x.header)});
$('#stats').textContent=`${kb.pages.length} pages • ${kb.guides.length} procédures • ${kb.diagnostics.length} diagnostics • ${kb.commands.length} commandes • ${kb.ports.length} ports courants • ${kb.resources.length} ressources`;
let opts=[...new Set(kb.guides.map(g=>g.software))].sort((a,b)=>a.localeCompare(b));for(let v of opts){let o=el('option',v);o.value=v;$('#software').append(o);}for(let v of [...new Set(kb.guides.map(g=>g.action))].sort()){let o=el('option',v);o.value=v;$('#action').append(o);}
const resourceAudit=u=>kb.linkAudit.find(x=>x.url===u)?.etat||'Non vérifié individuellement';
function renderItem(x){let d=x.data,r=el('article',undefined,'card');
 if(x.type==='guides'){
  add(r,'div',`CP${cp(d)} · ${cpnames[cp(d)]} | ${d.software} | ${d.version} | ${d.action}`,'meta');add(r,'h3',d.title);paragraph(r,d.summary,'Contexte');let details=add(r,'details');add(details,'summary','Afficher prérequis, étapes, vérification et sources');paragraph(details,d.prereq,'Prérequis');if(d.recommend)paragraph(details,d.recommend,'Conseil');let ol=add(details,'ol');for(let s of d.steps){let li=add(ol,'li',s.text);if(s.cmd)add(li,'pre',s.cmd);}paragraph(details,d.check,'Vérifier');if(d.warning)paragraph(details,d.warning,'Attention');if(d.alternatives)paragraph(details,d.alternatives,'Variantes');let links=add(details,'div',undefined,'rowlinks');if(d.source)link(links,'Documentation éditeur',d.source);for(let down of d.downloads||[])link(links,down.label,down.url);
 } else if(x.type==='pages'){
  add(r,'div','Dossier original · page '+d.page,'meta');add(r,'h3',x.header);let raw=d.text.replace(/\s+/g,' ').trim();let p=0,terms=words(query);for(let t of terms){let k=n(raw).indexOf(t);if(k>=0){p=Math.max(0,k-110);break;}}paragraph(r,(p?'… ':'')+raw.slice(p,p+390)+(p+390<raw.length?'…':''));let links=add(r,'div',undefined,'rowlinks');link(links,'Ouvrir la page '+d.page+' du PDF','support.pdf#page='+d.page);
 } else if(x.type==='diagnostics'){
  add(r,'div','Diagnostic guidé — document existant','meta');add(r,'h3',d.name);let det=add(r,'details');add(det,'summary','Afficher le diagnostic complet');let ol=add(det,'ol');d.steps.forEach(s=>add(ol,'li',`${s.phase} → Test : ${s.test} → Suite : ${s.next}`));
 } else if(x.type==='commands'){
  add(r,'div','Mémento Linux / PowerShell — document existant','meta');add(r,'h3',d.name);paragraph(r,d.description);let det=add(r,'details');add(det,'summary','Voir les commandes connues');add(det,'p','Linux / Bash :');add(det,'pre',d.linux);add(det,'p','PowerShell :');add(det,'pre',d.ps);
 }else if(x.type==='ports'){
  add(r,'div','Port usuel','meta');add(r,'h3',`${d.port} / ${d.proto} — ${d.name}`);paragraph(r,d.description);
 }else if(x.type==='compat'){
  add(r,'div','Compatibilité / restriction de version','meta');add(r,'h3',d.title);add(r,'p',d.status,'warning');paragraph(r,d.text);let links=add(r,'div',undefined,'rowlinks');if(d.url)link(links,'Source officielle',d.url);
 }else if(x.type==='resources'){
  add(r,'div',`${d.type||'Lien'} • ${resourceAudit(d.url)}`,'meta');add(r,'h3',d.name);paragraph(r,d.note);let links=add(r,'div',undefined,'rowlinks');link(links,'Ouvrir la page officielle',d.url);
 }
 return r;
}
function renderCIDR(){let wrap=el('div');add(wrap,'p','Table de correspondance statique, pré-calculée lors de la préparation des fichiers. /31 et /32 : cas particuliers.','note');let t=add(wrap,'table',undefined,'smalltable');let h=add(t,'tr');['CIDR','Masque','Wildcard','Adresses','Hôtes classiques','Pas'].forEach(v=>add(h,'th',v));for(let row of kb.cidrTable){let tr=add(t,'tr');row.forEach(v=>add(tr,'td',v));}return wrap;}
function renderREAC(){let w=el('div');add(w,'p','REAC officiel TP-01351, millésime 02 du 24/05/2023. Les fiches de cette archive sont des aides, pas le texte exhaustif du référentiel.','note');let a=add(w,'div',undefined,'rowlinks');link(a,'Référentiel officiel France compétences',kb.officialReac);cpnames.forEach((x,i)=>{if(!i)return;let c=add(w,'article',undefined,'card');add(c,'h3',`Compétence ${i} — ${x}`);add(c,'p',`Utiliser l’onglet Procédures et chercher les logiciels / situations correspondants. ${kb.guides.filter(g=>cp(g)===i).length} fiches classées dans cette catégorie.`);});return w;}
function find(){let t=words(query),types=tab==='all'?null:tab,cands=types?(datasets[types]||[]):all;let software=$('#software').value,action=$('#action').value;
 let r=cands.map(x=>{if(x.type==='guides'){if(software&&x.data.software!==software)return null;if(action&&x.data.action!==action)return null;}else if(software||action){return null;}
  if(!t.length)return {x,score:0};let hit=t.filter(w=>x.norm.includes(w));if(!hit.length)return null;let score=hit.length*12+(hit.length===t.length?24:0)+t.filter(w=>x.titleNorm.includes(w)).length*24;if(n(x.data.version||'').includes(n(query)))score+=8;return {x,score};}).filter(Boolean).sort((a,b)=>b.score-a.score);return r;
}
function render(){let out=$('#results');out.replaceChildren();$('#more').hidden=true;$('#modeText').textContent=tab==='all'?'Tous les types':({guides:'Fiches de procédures',pages:'Pages du PDF',diagnostics:'Diagnostics',commands:'Commandes',ports:'Ports',compat:'Compatibilités',resources:'Liens éditeurs',cidr:'Table fixe',reac:'Référentiel'})[tab];
 if(tab==='cidr'){out.append(renderCIDR());$('#title').textContent='Table IPv4 / CIDR';$('#subtitle').textContent='Lecture, sans calcul automatique';return;}
 if(tab==='reac'){out.append(renderREAC());$('#title').textContent='Les 9 compétences TSSR';$('#subtitle').textContent='Organisation du référentiel 2023';return;}
 let found=find();$('#title').textContent=`${found.length} résultat(s) documenté(s)`;$('#subtitle').textContent=words(query).length?'Extraits et fiches préexistants : contrôler la version et la consigne.':'Choisis une catégorie ou lance une recherche.';
 if(!found.length){add(out,'p','Aucun passage correspondant. Reformule avec le nom du logiciel, la version ou une notion précise. Aucune réponse n’est inventée.','warning');return;}
 for(let x of found.slice(0,limit))out.append(renderItem(x.x));$('#more').hidden=found.length<=limit;$('#more').textContent=`Afficher encore (${Math.min(20,found.length-limit)} sur ${found.length-limit})`;
}
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();query=$('#query').value.trim();limit=20;render();});
document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{$('#query').value=b.dataset.q;query=b.dataset.q;tab='all';document.querySelectorAll('.tab').forEach(z=>z.classList.toggle('active',z.dataset.tab==='all'));limit=20;render();}));
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;document.querySelectorAll('.tab').forEach(z=>z.classList.toggle('active',z===b));limit=20;render();}));
$('#software').addEventListener('change',()=>{tab='guides';document.querySelectorAll('.tab').forEach(z=>z.classList.toggle('active',z.dataset.tab==='guides'));limit=20;render();});$('#action').addEventListener('change',()=>{tab='guides';document.querySelectorAll('.tab').forEach(z=>z.classList.toggle('active',z.dataset.tab==='guides'));limit=20;render();});
$('#more').addEventListener('click',()=>{limit+=20;render();});
const start=new URL(location.href).searchParams.get('q');if(start){$('#query').value=start;query=start;}render();
})();