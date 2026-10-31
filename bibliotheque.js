(()=>{'use strict';
const KB=window.KB_TSSR, E=window.TSSR_ENRICHI; const $=s=>document.querySelector(s);let current='tout',query='',limit=30,items=[],all=[];
const escape=s=>String(s??'');const norm=s=>escape(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe');const tok=s=>(norm(s).match(/[a-z0-9]+/g)||[]).filter(w=>w.length>1&&!new Set(['les','des','avec','dans','pour','une','aux','sur','est','comment','quelle','quel','quels','quelque','faut','faire','faire','peut','avoir','du','de','la','le','un','en','et','ou','je','tu','on','installer','installation','etape']).has(w));
const synonyms={'active directory':['ad','adds','utilisateur','compte','domaine'], 'wds':['pxe','boot.wim','install.wim'], 'rechercher':['trouver','verifier','exister'], 'linux':['debian','bash'], 'switch':['commutateur','cisco'], 'powershell':['ps1','script','cmdlet'], 'droit':['permission','chmod','acl'], 'imprimante':['impression','printer'], 'installer':['deployer','installation'], 'sauvegarde':['backup','restauration'], 'voip':['freepbx','sip','rtp','telephonie']};
function e(tag,txt,cls){let v=document.createElement(tag);if(txt!==undefined)v.textContent=escape(txt);if(cls)v.className=cls;return v;}
function append(t,txt,cls,parent){let x=e(t,txt,cls);(parent||$('#detail')).append(x);return x;}
function safeLink(url){return typeof url==='string'&&(url.startsWith('https://')||url.startsWith('support.pdf#')||url==='support.pdf'||url==='reperes.html')}
function aLink(parent,title,url,cls){if(!safeLink(url))return;let a=e('a',title,cls);a.href=url;a.target='_blank';a.rel='noopener noreferrer nofollow';parent.append(a);return a;}
function advice(s){let t=norm(s);const map=[[/v.rifier|contr.ler|tester|ping|statut|status|show /,'Le contrôle confirme que le service ou la liaison fonctionne avant de continuer.'],[/ouvrir|gestionnaire|console|outil|menu|cliquer|clic droit/,'Cette action ouvre le bon menu ou l’outil nécessaire à la suite.'],[/installer|ajouter le r.le|apt |d.nchement|t.l.charger/,'Cette étape ajoute les composants nécessaires ; vérifier la version et les droits.'],[/cr.er|nouveau|attribuer|nommer/,'Cette action prépare la ressource demandée avec son nom ou ses paramètres.'],[/configurer|renseigner|param.trer|saisir|d.finir/,'Cette étape adapte les paramètres au réseau et à l’énoncé exact.'],[/d.marrer|activer|red.marrer|enable/,'Cette action rend le service ou l’interface opérationnel.'],[/dns|dhcp|ip fixe|passerelle/,'Les paramètres réseau doivent correspondre au plan d’adressage.'],[/sauvegarde|restaur/,'Un test de restauration sert à vérifier que la sauvegarde est réellement exploitable.']];for(let [r,a] of map)if(r.test(t))return a;return 'Cette étape fait partie de la procédure d’origine ; vérifie sa cible, les prérequis et le résultat avant de poursuivre.';}
function add(type,id,title,body,sub,search,source,extra){all.push({type,id,title,body:body||'',sub:sub||'',search:search||'',source:source||'',tags:(extra&&extra.data&&extra.data.tags)||'',action:(extra&&extra.data&&extra.data.action)||'',kind:(extra&&extra.kind)||'',extra:extra||{}})}
const sec=KB.sections||[];
for(let p of KB.pages){let last=sec.filter(x=>x.page<=p.page).slice(-1)[0];add('cours','page-'+p.page,(p.precise_title || (last?last.title:'Cours de révision'))+' — page '+p.page,(p.text||'').slice(0,200),(last?.block||'Cours'),p.text||'','PDF 262 pages',{data:p})}
for(let g of KB.guides)add('guides','guide-'+g.id,g.title,g.summary,g.software+' · '+g.version,[g.title,g.action,g.version,g.tags,g.software,g.prereq,g.warning,...(g.steps||[]).map(s=>s.text+' '+(s.cmd||''))].join(' '),g.source||'Ancienne bibliothèque',{data:g});
for(let g of E.guides)add('nouveau',g.id,g.title,g.goal,g.domain+' · '+g.version,[g.tags,g.title,g.goal,g.domain,g.version,g.source,...g.steps.map(s=>s.text+' '+(s.command||''))].join(' '),g.source,{data:g});
add('nouveau','liens-techniques-exterieurs','Références Internet — retrouver une documentation technique','Liste de sites de référence et d’outils externes répertoriés dans l’annexe. Les calculateurs externes ne sont pas autorisés par défaut pour l’épreuve.','Ressources externes — accès volontaire','références internet liens externes ressources sites calculateurs IPv4 IPv6 subnet CIDR VLAN ACL cron linux powershell diagnostics commandes','Bibliothèque TSSR — annexe documentaire',{data:{id:'liens-techniques-exterieurs',title:'Références Internet — retrouver une documentation technique',goal:'Retrouver les liens techniques sans ouvrir automatiquement un site extérieur.',domain:'Annexe documentaire',version:'Sites externes',requirements:'Vérifier les règles du centre avant utilisation',steps:[],source:'Répertoire de ressources ajouté hors cours',origin:'Liste documentaire complémentaire',warning:'Les calculateurs et les générateurs externes ne sont pas présumés autorisés pendant l’épreuve.',links:[['Consulter les noms et adresses des références externes','reperes.html']]}});
for(let g of ((window.TSSR_STUDI_2026||{}).guides||[]))add('studi',g.id,g.title,g.goal,g.version,[g.tags,g.title,g.goal,g.source,g.version,...(g.steps||[]).map(s=>s.text+' '+(s.command||'')+' '+(s.why||''))].join(' '),g.source,{data:g});
for(let g of ((window.TSSR_STUDI_RSYNC_PLUS||{}).guides||[]))add('studi',g.id,g.title,g.goal,g.version,[g.tags,g.title,g.goal,g.source,g.version,...(g.steps||[]).map(s=>s.text+' '+(s.command||'')+' '+(s.why||''))].join(' '),g.source,{data:g});
for(let g of ((window.TSSR_EXERCICES||{}).guides||[]))add('exercices',g.id,g.title,g.goal,g.kind+' · '+g.version,[g.title,g.tags,g.goal,g.requirements,g.source,...(g.steps||[]).map(s=>s.text+' '+s.command+' '+s.why)].join(' '),g.source,{data:g});
for(let s of E.scripts)add('scripts',s.id,s.title,s.source,s.language,[s.tags,s.source,s.title,...s.lines.map(l=>l.code+' '+l.why)].join(' '),s.source,{data:s});
for(let c of KB.commands)add('commandes','cmd-'+all.length,c.name,c.description,'Linux / PowerShell',[c.tags,c.name,c.linux,c.ps,c.description].join(' '),'Commandes fixes',{data:c,kind:'cmd'});
for(let p of KB.ports)add('commandes','port-'+all.length,'Port '+p.port+' — '+p.name,p.description,p.proto,[p.port,p.name,p.proto,p.description].join(' '),'Table des ports',{data:p,kind:'port'});
for(let d of KB.diagnostics)add('diagnostics','diag-'+all.length,d.name,'Dépannage pas à pas','Diagnostic',[d.name,d.tags,...d.steps.map(s=>s.phase+' '+s.test+' '+s.next)].join(' '),'Fiche diagnostic',{data:d});
for(let v of KB.compat)add('compat','compat-'+all.length,v.title,v.text,v.status,v.title+' '+v.text,'Compatibilité',{data:v,kind:'compat'});
for(let r of KB.resources)add('compat','link-'+all.length,r.name,r.note,r.type,r.name+' '+r.type+' '+r.note,'Lien éditeur',{data:r,kind:'resource'});
for(let p of E.packets)add('pkt',p.id,p.title,p.note,p.category,p.tags+' '+p.title,'Fichier Cisco transmis',{data:p});
// Pages issues des PDF exacts : chaque résultat de recherche mène au numéro physique du PDF.
// Les fiches interactives restent accessibles en mode consultation (sans terme de recherche).
const pdfPages=window.TSSR_PDF_PAGES||[];
for(const pg of pdfPages){
 const blockLabel=pg.block===1?(pg.page>=177?'Bloc 1 — chapitre 3 : exemples techniques':'Bloc 1 — cours original'):'Bloc 2 — approfondissements';
 const subject=(pg.headings||[]).map(h=>h.title).slice(0,4).join(' — ')||(pg.context||blockLabel);
 add('pdfpage','pdf-'+pg.block+'-'+pg.page,subject,pg.text.slice(0,230),blockLabel,pg.text,(pg.block===1&&pg.page>=177?'Chapitre 3 · page ':'PDF original · page ')+pg.page,{data:pg,kind:'pdfpage'});
}

const filterText={'approfondissements':'Approfondissements','tout':'Tous les documents','cours':'Cours et exemples — 262 pages','exemples':'Chapitre 3 — exemples techniques','serieA':'Série A — support, AD, Linux, VLAN, WDS et sauvegardes','serieB':'Série B — AD DS, Wiki.js, LDAP, VLAN/DHCP, PostgreSQL, PowerShell','guides':'Fiches installations','nouveau':'Exemples et approfondissements techniques','scripts':'Scripts expliqués ligne par ligne','diagnostics':'Dépannage guidé','commandes':'Commandes et ports fixes','compat':'Versions, limites et téléchargements','pkt':'Exercices Cisco Packet Tracer','exercices':'Exercices corrigés et scénarios','studi':'Nouveaux cours Studi 2026'};
$('#statbar').innerHTML='';for(let [n,l] of [[262,'pages'],[KB.guides.length+E.guides.length+((window.TSSR_STUDI_2026||{}).guides||[]).length+((window.TSSR_STUDI_RSYNC_PLUS||{}).guides||[]).length,'fiches'],[E.scripts.length,'scripts annotés'],[((window.TSSR_EXERCICES||{}).guides||[]).length,'exercices fixes'],[KB.commands.length,'commandes'],[KB.diagnostics.length,'diagnostics']]){let tag=e('span');let b=e('b',n+' ');tag.append(b,document.createTextNode(l));$('#statbar').append(tag)}
function hits(text,word){if(!word)return false;let escaped=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(word.length<=3)return new RegExp('(^|[^a-z0-9])'+escaped+'($|[^a-z0-9])').test(text);return text.includes(word)}
const alias={'ad':['active directory','adds'], 'adds':['active directory','ad'], 'rechercher':['trouver','retrouver','verifier'], 'chercher':['rechercher','trouver'], 'sauvegarder':['sauvegarde','backup'], 'backup':['sauvegarde'], 'imprimer':['imprimante','impression'], 'windows':['win'], 'routeur':['router'], 'switch':['commutateur'], 'shell':['bash'], 'serveur':['server'], 'droits':['permissions','chmod'], 'compte':['utilisateur'], 'utilisateur':['compte'], 'powershell':['ps1'], 'fichier':['file'], 'controleur':['domain controller']};
function scoring(it,q){
 if(it.type==='pdfpage' && !/sommaire|table des matieres|chapitre|index des themes/.test(norm(q)) && ((it.extra.data.block===1 && it.extra.data.page<=2)||(it.extra.data.block===2 && it.extra.data.page===1)))return 0;
 let v=window.TSSR_SEARCH.rank(it,q);
 if(it.type==='pdfpage'&&v>0){
  const terms=tok(q).slice(0,12),fold=norm(it.extra.data.text);
  let occur=0;
  for(const w of terms){let i=0,ct=0;while((i=fold.indexOf(w,i))!==-1&&ct<8){ct++;i+=w.length;} occur+=ct;}
  v+=Math.min(24,occur*2);
 }
 return v;
}
function pageExcerpt(pg,q){
 const lines=String(pg.text||'').split('\n');const terms=tok(q).slice(0,15);
 if(!terms.length)return{text:lines.slice(0,4).join(' ').slice(0,290),at:0};
 let best=-Infinity,besti=0,offset=0,bestoff=0;
 for(let i=0;i<lines.length;i++){
  const folded=norm(lines[i]), before=norm(lines[i-1]||''), after=norm(lines[i+1]||'');
  const match=terms.filter(w=>hits(folded,w)).length;
  const surrounding=terms.filter(w=>hits(before+' '+folded+' '+after,w)).length;
  const score=match*18+surrounding*5+(norm(q).length>4&&folded.includes(norm(q))?33:0)-Math.min(i,80)*.06;
  if(score>best && match>0){best=score;besti=i;bestoff=offset;}
  offset+=lines[i].length+1;
 }
 if(best===-Infinity)return{text:lines.slice(0,3).join(' ').slice(0,260),at:0};
 let from=Math.max(0,besti-1),to=Math.min(lines.length,besti+3);
 let out=lines.slice(from,to).join(' ').replace(/\s+/g,' ').trim();
 return{text:(from?'… ':'')+out.slice(0,320)+(out.length>320?'…':''),at:bestoff};
}
function pageHeading(pg,at){
 let h=pg.context||'Documentation TSSR';
 for(const el of pg.headings||[])if(el.at<=at)h=el.title;else break;
 return h;
}
function extraitPertinent(it,q){
 if(it.type==='pdfpage')return pageExcerpt(it.extra.data,q).text;
 if(it.type!=='cours'||!q)return it.body;
 const full=it.extra.data.text||'',terms=tok(q);if(!full||!terms.length)return it.body;
 const pg={text:full};return pageExcerpt(pg,q).text;
}
function filtered(it){
 if(current==='tout')return true;
 if(current==='cours')return it.type==='cours'||(it.type==='pdfpage'&&it.extra.data.block===1);
 if(current==='exemples')return it.type==='pdfpage'&&it.extra.data.block===1&&it.extra.data.page>=177;
 if(current==='serieA')return it.type==='pdfpage'&&it.extra.data.series==='A';
 if(current==='serieB')return it.type==='pdfpage'&&it.extra.data.series==='B';
 if(current==='approfondissements')return it.type!=='cours'&&(it.type!=='pdfpage'||it.extra.data.block===2);
 return it.type===current;
}
function update(){
 query=$('#search').value.trim();
 $('#results-panel').hidden=!query&&current==='tout';$('#hint').hidden=!!query||current!=='tout';
 $('#resulttitle').textContent=query?'Pages trouvées pour « '+query+' »':filterText[current];
 $('#subtitle').textContent=query?'PAGES RÉELLES DES PDF · CLIQUER POUR OUVRIR':'SOMMAIRE DOCUMENTAIRE — CLASSEMENT PAR SUJET';
 // Une recherche porte sur les 478 pages réelles des PDF (261 + 216).
 // Le mode sans mot-clé conserve les fiches pédagogiques déjà présentes.
 items=all.filter(it=>filtered(it)&&((query||current==='exemples'||current==='serieA'||current==='serieB')?it.type==='pdfpage':it.type!=='pdfpage'))
   .map(it=>({...it,score:scoring(it,query)}))
   .filter(it=>it.score>0)
   .sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
 $('#count').textContent=items.length+(query?' page':' référence')+(items.length!==1?'s':'');
 $('#results').replaceChildren();
 if(query){let n=e('div','Chaque résultat indique le numéro exact de la page PDF et un extrait correspondant. Clique pour ouvrir cette page ; utilise Ctrl + F dans le PDF si tu veux retrouver le mot exact dans la page. Les 176 premières pages du cours et le bloc 2 sont conservés.','page-guide');$('#results').append(n);}
 for(let it of items.slice(0,limit)){
  let box=e('article',undefined,'result');
  if(it.type==='pdfpage'){
    const pg=it.extra.data,preview=pageExcerpt(pg,query),heading=pageHeading(pg,preview.at);
    const url=(pg.block===1?'support.pdf':'TSSR_BLOC_2_APPROFONDISSEMENTS_COMPLETS.pdf')+'#page='+pg.page;
    const link=e('a',undefined,'openresult page-result');link.href=url;link.target='_blank';link.rel='noopener noreferrer';
    const hd=e('div',undefined,'rhead');hd.append(e('span','BLOC '+pg.block,'pill'),e('span','PAGE '+pg.page,'page-badge'));link.append(hd);
    link.append(e('div',heading,'rtitle'),e('div',preview.text,'rdescr'));
    link.append(e('div','↗ Ouvrir directement le PDF à la page '+pg.page,'page-action'));
    box.append(link);
  }else{
   let btn=e('button',undefined,'openresult'),h=e('div',undefined,'rhead'),tag=e('span',({cours:'COURS PDF',guides:'PROCÉDURE',nouveau:'COMPLÉMENT',scripts:'SCRIPT ANNOTÉ',diagnostics:'DÉPANNAGE',commandes:'RÉFÉRENCE',compat:'COMPATIBILITÉ',pkt:'FICHIER PKT',studi:'COURS STUDI ACTUALISÉ',exercices:'EXERCICE / SCÉNARIO'})[it.type],'pill '+(it.type==='scripts'?'script':it.type==='nouveau'?'source':''));
   h.append(tag,e('span',it.sub,'meta'));btn.append(h,e('div',it.title,'rtitle'),e('div',extraitPertinent(it,query).slice(0,280),'rdescr'));
   let provenance=it.type==='cours'?'EXTRAIT DU COURS ORIGINAL':(it.type==='exercices'?'EXERCICE FIXE · SOURCE SIGNALÉE':it.type==='scripts'?'SCRIPT SOURCE + COMMENTAIRES AJOUTÉS':(it.type==='studi'?'SYNTHÈSE REFORMULÉE DE COURS STUDI':it.type==='nouveau'?'APPROFONDISSEMENT AJOUTÉ':'FICHE DOCUMENTAIRE DE RÉFÉRENCE'));
   btn.append(e('div',provenance+' · '+(it.source||''),'provenance '+(it.type==='cours'?'course':'added')));
   btn.addEventListener('click',()=>show(it));box.append(btn);
  }
  $('#results').append(box);
 }
 $('#more').hidden=items.length<=limit;
 if(!items.length)$('#results').append(e('div',query?'Aucune page ne contient ces termes. Essaye un autre mot ou un synonyme.':'Aucune fiche disponible.','none'));
}
function info(label,val,parent){if(!val)return;let box=e('div',undefined,'introinfo');box.append(e('b',label+' : '),document.createTextNode(escape(val)));parent.append(box)}
function warn(txt,par){if(txt)par.append(e('div','⚠ '+txt,'warn'))}
function steps(list,par,isScript=false){let i=0;for(let s of list){i++;let row=e('div',undefined,'step'),num=e('span',String(isScript?s.n:i),'stepnum'),body=e('div');row.append(num,body);
 if(isScript){body.append(e('div',s.code,'codebox'));body.append(e('div','EXPLICATION AJOUTÉE (hors script d’origine) → '+(s.why||'Explication à vérifier.'),'why comment-added'));}
 else {body.append(e('div',s.text||s.phase||'','action'));if(s.command||s.cmd)body.append(e('div',s.command||s.cmd,'codebox'));body.append(e('div','EXPLICATION AJOUTÉE (hors cours) → '+(s.why||advice(s.text||s.phase)),'why comment-added'));}
 if(isScript && s.correction_motif){body.append(e('div','⚠ CORRECTION IMMÉDIATEMENT APRÈS LA LIGNE D’ORIGINE : '+s.correction_motif,'warn'));body.append(e('div','REMPLACEMENT PROPOSÉ (hors source) → '+s.correction_proposee,'personal-note'));}
 if(s.personnaliser)body.append(e('div','À RENSEIGNER — NOTE AJOUTÉE (hors cours) : '+s.personnaliser,'personal-note'));
 if(s.complement)body.append(e('div','COMPLÉMENT AJOUTÉ (hors cours) → '+s.complement,'complement-note'));
 par.append(row)}}
let lastOpened=null;
function studiSteps(list,par){
  const terminal=/^(?:sudo |cat |ip |hostnamectl|systemctl|php |mariadb |CREATE |GRANT |EXIT;|a2enmod|a2enconf|ssh |ssh-keygen|ssh-copy-id|ls |chmod |scp |sftp |put |get |bye$|whoami|diff |crontab |bash |curl |rsync |nano |journalctl|tail |mkdir |df |du |echo |env |umask |command |grep |cp |tar |find |[0-5]?\d\s+\d{1,2}\s+\*\s+\*\s+\*\s+|\.?\?)/i;
  for(let i=0;i<list.length;i++){
    let s=list[i],row=e('div',undefined,'step'),n=e('span',String(i+1),'stepnum'),body=e('div');row.append(n,body);
    body.append(e('div',s.text,'action'));
    if(s.command){let v=s.command,code=terminal.test(v)||v.startsWith('<?php');
      body.append(e('div',code?'COMMANDE OU CODE DOCUMENTÉ':'MENU / PARAMÈTRE À RENSEIGNER (PAS UNE COMMANDE)','overline'));
      body.append(e('div',v,code?'codebox':'introinfo'));}
    body.append(e('div','EXPLICATION AJOUTÉE (hors cours) → '+s.why,'why comment-added'));
    par.append(row);
  }
}
function show(it){lastOpened=it;$('#modal').hidden=false;document.body.style.overflow='hidden';let p=$('#detail');p.replaceChildren();let d=e('article',undefined,'detail');p.append(d);append('div',({cours:'COURS D’ORIGINE',guides:'PROCÉDURE ARCHIVÉE',nouveau:'APPROFONDISSEMENT',scripts:'SCRIPT DE FORMATION',diagnostics:'DIAGNOSTIC',commandes:'FICHE DE RÉFÉRENCE',compat:'AVERTISSEMENT / LIEN',pkt:'EXERCICE TRANSMIS',studi:'SYNTHÈSE — NOUVEAU COURS STUDI',exercices:'EXERCICE DOCUMENTAIRE · SOURCE PRÉCISÉE'})[it.type],'overline',d);append('h2',it.title,undefined,d);append('p',it.body,'lead',d);
 let ob=it.extra.data;
 if(it.type==='cours'){if(ob.verification_notes)warn('NOTE TECHNIQUE AJOUTÉE — '+ob.verification_notes,d);let l='support.pdf#page='+ob.page;aLink(d,'↗ Ouvrir directement la page '+ob.page+' du PDF',l,'resultlink');append('h3','EXTRAIT DU COURS ORIGINAL — texte non modifié',undefined,d);append('div',(ob.text||'').slice(0,1800), 'codebox course-text',d);info('NOTE AJOUTÉE (hors cours)','Le texte de cet extrait est une copie de l’index du PDF. Le document intégral est conservé dans support.pdf.',d)}
 if(it.type==='guides'){info('Environnement',ob.software+' · '+ob.version,d);info('Prérequis',ob.prereq,d);append('h3','Étapes conservées · explications et compléments signalés séparément',undefined,d);steps(ob.steps||[],d);info('Vérification finale',ob.check,d);warn(ob.warning,d);info('Variantes / versions',ob.alternatives,d);if(ob.source)aLink(d,'↗ Source documentaire',ob.source);for(let l of ob.downloads||[])aLink(d,'↗ '+l.label+' (accès/licence à vérifier)',l.url);}
 if(it.type==='nouveau'){info('Environnement',ob.domain+' · '+ob.version,d);info('Préparation',ob.requirements,d);append('div','COMMENTAIRES / APPROFONDISSEMENTS AJOUTÉS — distincts du cours original','annotation-label',d);append('h3','Étapes chronologiques · une explication sous chaque étape',undefined,d);steps(ob.steps,d);warn(ob.warning,d);let s=e('div','CADRE : exemple technique et explications complémentaires','sourcebox');d.append(s);for(let l of ob.links)aLink(d,'↗ '+l[0],l[1]);}
 if(it.type==='studi'){info('Environnement et versions',ob.version,d);info('Prérequis',ob.requirements,d);append('div','FICHE REFORMULÉE — D’APRÈS LE COURS STUDI, AVEC EXPLICATIONS ET PRÉCAUTIONS AJOUTÉES. LE SUPPORT STUDI ORIGINAL N’EST PAS PUBLIÉ.','annotation-label',d);append('h3','Étapes et explications courtes',undefined,d);studiSteps(ob.steps||[],d);warn(ob.warning,d);info('Source du thème',ob.source,d);for(let l of ob.links||[])aLink(d,'↗ '+l[0],l[1]);}
 if(it.type==='exercices'){info('Type de référence',ob.kind,d);info('Type',ob.kind||'Exercice pratique',d);info('Environnement ou portée',ob.version,d);if(ob.requirements)info('Prérequis',ob.requirements,d);append('div','EXERCICE OU EXEMPLE PRÉPARÉ — reformulation documentaire ; commandes d’exemple non générées à partir de la consigne. Les explications ci-dessous sont des compléments hors cours.','annotation-label',d);append('h3','Démarche fixe et explication sous chaque étape',undefined,d);steps(ob.steps||[],d);warn(ob.warning,d);if(ob.related&&String(ob.related).startsWith('https://'))aLink(d,'↗ Référence de compatibilité',ob.related);if(ob.related&&String(ob.related).endsWith('.pkt'))info('Fichier de maquette non publié',ob.related,d);}
 if(it.type==='scripts'){info('Langage',ob.language,d);info('Contenu','Script documenté',d);warn('ÉTAT DE VÉRIFICATION : '+(ob.verification||'Non testé sur la machine cible.'),d);warn('Exemple de formation conservé comme variante distincte. Les champs à saisir sont précisés sous les lignes ; ne pas exécuter tel quel sans vérifier versions, chemins, domaine, droits et présence de secrets.',d);for(let w of ob.warnings)warn(w,d);append('h3','Script expliqué, ligne par ligne ('+ob.lines.length+' lignes non vides)',undefined,d);steps(ob.lines,d,true);if(ob.version_corrigee){append('h3','VARIANTE CORRIGÉE — À UTILISER À LA PLACE DU SCRIPT D’ORIGINE',undefined,d);warn('Cette variante est un ajout éditorial, distinct de la source. Adapter les valeurs et vérifier les prérequis avant exécution.',d);append('div',ob.version_corrigee,'codebox course-text',d);}}
 if(it.type==='diagnostics'){append('h3','Diagnostic, du début à la fin',undefined,d);steps(ob.steps.map(s=>({text:s.phase+' — '+s.test,why:s.next})),d)}
 if(it.type==='commandes'){if(it.extra.kind==='cmd'){append('h3','Commandes fixes',undefined,d);if(ob.linux){append('div','Linux / Bash', 'overline',d);append('div',ob.linux,'codebox',d);append('p','→ '+(ob.description||'Commande Linux à adapter aux droits et à la distribution.'),'why',d)}if(ob.ps){append('div','PowerShell / Windows','overline',d);append('div',ob.ps,'codebox',d);append('p','→ '+(ob.description||'Commande PowerShell à adapter au système.'),'why',d)}} else {info('Protocole',ob.proto,d);info('Définition simple',ob.description,d)}}
 if(it.type==='compat'){if(it.extra.kind==='compat'){info('Statut',ob.status,d);warn(ob.text,d);aLink(d,'↗ Documentation officielle',ob.url)}else{info('Type',ob.type,d);info('Accès',ob.note,d);aLink(d,'↗ Page de téléchargement ou documentation éditeur',ob.url)}}
 if(it.type==='pkt'){warn('Impossible de certifier la topologie ou les commandes internes du fichier binaire .pkt sans ouvrir ce fichier dans Cisco Packet Tracer. Il n’est pas publié.',d);info('Nom du fichier reçu',ob.filename,d);info('Donnée disponible',ob.note,d)}
 let src=e('div',undefined,'sourcebox');src.append(e('b','Prudence : '),document.createTextNode('Vérifier les versions, interfaces, paramètres, droits et liens de téléchargement avant utilisation. Les exemples ne sont pas adaptés automatiquement à ton exercice.'));d.append(src);try{history.replaceState(null,'','#'+encodeURIComponent(it.id));}catch(_){}}
function close(){ $('#modal').hidden=true;document.body.style.overflow='';try{history.replaceState(null,'',location.pathname+location.search)}catch(_){}}$('#close').onclick=close;$('#shade').onclick=close;$('#back').onclick=e=>{e.preventDefault();close()};window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!$('#modal').hidden)close();if(ev.key==='/'&&document.activeElement!==$('#search')&&$('#modal').hidden){ev.preventDefault();$('#search').focus()}});
$('#searchform').addEventListener('submit',event=>{event.preventDefault();limit=30;update();$('.results').scrollIntoView({behavior:'smooth',block:'start'})});$('#search').addEventListener('input',()=>{clearTimeout(window.searchTO);window.searchTO=setTimeout(()=>{limit=30;update()},130)});for(let b of document.querySelectorAll('#filters button'))b.onclick=()=>{current=(current===b.dataset.filter?'tout':b.dataset.filter);for(let x of document.querySelectorAll('#filters button')){let selected=(x.dataset.filter===current);x.classList.toggle('selected',selected);x.setAttribute('aria-pressed',selected?'true':'false')}limit=30;update();if(current!=='tout')$('#results-panel').scrollIntoView({behavior:'smooth',block:'start'})};for(let b of document.querySelectorAll('#quick button'))b.onclick=()=>{$('#search').value=b.dataset.q;current='tout';for(let x of document.querySelectorAll('#filters button'))x.classList.toggle('selected',x.dataset.filter==='tout');limit=30;update();$('.results').scrollIntoView({behavior:'smooth'})};$('#more').onclick=()=>{limit+=30;update()};let params=new URLSearchParams(location.search);if(params.has('q'))$('#search').value=params.get('q');if(params.has('category')){let x=params.get('category');if(filterText[x]){current=x;for(let b of document.querySelectorAll('#filters button')){let sel=b.dataset.filter===x;b.classList.toggle('selected',sel);b.setAttribute('aria-pressed',sel?'true':'false')}}}update();let id=decodeURIComponent(location.hash.slice(1));if(id){let obj=all.find(it=>it.id===id);if(obj)show(obj)}
})();