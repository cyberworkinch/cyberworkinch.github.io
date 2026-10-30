/* Classement documentaire déterministe : ni IA, ni calcul de réseaux, ni script généré. */
(function(){'use strict';
const F=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').toLowerCase().replace(/[^a-z0-9+/. -]/g,' ');
const STOP=new Set('le la les un une des du de et ou au aux en pour dans avec sur depuis selon par je tu il elle on me mon ma mes votre vos a ai est etre faire comment peux peut veut voudrais avoir une tâche tache chose donner donne trouver cherche recherche quelle quel quels quelles celui exemple plusieurs via'.split(' '));
const ACTION=/^(installer|installation|install|telecharger|telechargement|definir|definition|signification|comprendre|planifier|planification|programmer|programmation|automatiser|automatisation|executer|lancer|activer|configurer|configuration|deployer|deploiement|depanner|diagnostiquer|diagnostic|erreur|panne|verifier|tester|controle|securiser|creer|creation|afficher|lister|rechercher|restaurer|sauvegarder|calculer|convertir|mettre|demarrer)$/;
const SYN={cron:['crontab','crond'],crontab:['cron'],crond:['cron'],rond:['cron','crontab'],cran:['cron','crontab'],ad:['active directory','adds'],adds:['active directory','ad'],ssh:['openssh'],wsus:['windows server update services'],wds:['windows deployment services'],vlan:['vlan','commutateur'],switch:['commutateur'],serveur:['server'],backup:['sauvegarde'],sauvegarde:['backup'],powershell:['ps1'],bash:['sh','shell'],imprimante:['impression'],ip:['ipv4'],ou:['organizational unit'],acl:['access control list'],freepbx:['asterisk']};
const TYPES={planifier:['planifier','cron','crontab','horaire','planification','programmer','automatiser'],definition:['definition','signifie','comprendre','notion','champs','principe'],installation:['installer','installation','paquet','apt','deployer','deploiement'],telechargement:['telecharger','telechargement','download','iso','site officiel'],diagnostic:['depanner','diagnostic','panne','erreur','corriger','incident'],configuration:['configurer','configuration','parametrer'],script:['script','bash','powershell','sh','ps1'],verification:['verifier','controle','tester','status','etat']};
function words(s){return [...new Set((F(s).match(/[a-z0-9]+/g)||[]).filter(x=>x.length>1&&!STOP.has(x)))].slice(0,18)}
function intent(q){let n=F(q);if(/\b(definition|definir|signifie|c.?est quoi|a quoi sert)\b/.test(n))return 'definition';if(/\b(rechercher|retrouver|trouver|localiser|chercher)\b/.test(n))return 'recherche';if(/\b(telecharger|telechargement|download|lien de telechargement)\b/.test(n))return 'telechargement';if(/\b(installer|installation|mettre en place|installation de)\b/.test(n))return 'installation';if(/\b(depanner|depannage|diagnostic|erreur|ne fonctionne|panne|echec|ne se lance|probleme)\b/.test(n))return 'diagnostic';if(/\b(planifier|planification|crontab|programmer|automatiser|automatisation|tous les jours|chaque jour|chaque nuit)\b/.test(n))return 'planifier';if(/\b(configurer|configuration|parametrer|creer|creation)\b/.test(n))return 'configuration';if(/\b(script|powershell|bash)\b/.test(n))return 'script';if(/\b(verifier|verification|tester|controle|status)\b/.test(n))return 'verification';return 'general'}
function matches(s,t){if(t.length<=3)return (' '+s.replace(/[^a-z0-9]+/g,' ')+' ').includes(' '+t+' ');return s.includes(t)}
function role(doc){let name=F(doc.title||''), action=F(doc.action||''), type=doc.type||'', field=name+' '+action;
 if(type==='resources'||doc.kind==='resource'||/\btelechargement\b/.test(field))return 'telechargement';
 if(type==='compat'||type==='pkt')return 'reference';
 if(/\b(diagnostiquer|diagnostic|depanner|panne|echec|incident)\b/.test(field))return 'diagnostic';
 if(/\b(installer|installation|deployer|deploiement)\b/.test(field))return 'installation';
 if(/\b(definition|comprendre|signification|notions|principe|lire les cinq champs|lire les 5 champs)\b/.test(field)||type==='port')return 'definition';
 if(/\b(rechercher|retrouver|trouver)\b/.test(field))return 'recherche';
 if(/\b(planifier|planification|programmer|automatiser)\b/.test(field) || (/^cron\b/.test(name)&&/\b(crontab|tache|execution)\b/.test(field)))return 'planifier';
 if(type==='scripts')return 'script';
 if(/\b(configurer|configuration|creer|creation|activer|ajouter)\b/.test(field))return 'configuration';
 if(/\b(verifier|tester|controle)\b/.test(field))return 'verification';
 return type==='guides'||type==='nouveau'||type==='studi'?'procedure':'reference';}
function rank(doc,query){if(!String(query||'').trim())return 1;
 const original=words(query), w=original.filter(x=>!ACTION.test(x)); const target=(w.length?w:original).slice(0,16);
 const title=F(doc.title||''),subject=F(doc.sub||''),tags=F(doc.tags||''),intro=F(doc.body||''),search=F(doc.search||''),source=F(doc.source||'');
 const short=(title+' '+subject+' '+tags), entire=(short+' '+intro+' '+search+' '+source);
 let score=0,found=0,inTitle=0;
 for(let token of target){const vars=[token,...(SYN[token]||[])], weights=[45,24,13,5,2];let best=0;for(const v of vars){if(matches(title,v))best=Math.max(best,weights[0]);else if(matches(subject,v))best=Math.max(best,weights[1]);else if(matches(tags,v))best=Math.max(best,weights[2]);else if(matches(intro,v))best=Math.max(best,weights[3]);else if(matches(search+' '+source,v))best=Math.max(best,weights[4]);}if(best){found++;score+=best;if(best===45)inTitle++;}}
 if(!found)return 0;
 score+=Math.round(70*found/target.length); if(found===target.length)score+=40; else score-=22*(target.length-found);
 const qclean=F(query).trim();if(qclean.length>6 && title.includes(qclean))score+=80;
 const ii=intent(query),r=role(doc);
 if(ii==='definition' && /\bdefinition\b/.test(title))score+=25;
 if(ii!=='general') {if(r===ii)score+=95;else if((ii==='planifier'&&r==='procedure')||(ii==='installation'&&r==='procedure')||(ii==='configuration'&&r==='procedure'))score+=38;else if(ii==='telechargement'&&r==='installation')score+=35;else if(ii==='script'&&r==='procedure')score+=20;}
 else if(r==='planifier'||r==='procedure'||r==='configuration')score+=24;
 const qx=F(query),tx=F(doc.title||'');
 if(/\b(installer|installation)\b/.test(qx)){if(/\binstaller\b/.test(tx))score+=95; if(/\bverifier\b/.test(tx))score-=35;}
 if(/\b(sauvegarder|sauvegarde|backup)\b/.test(qx)){if(/\b(sauvegarder|sauvegarde)\b/.test(tx))score+=80;if(/\bsecuriser\b/.test(tx)&&! /\bsauvegard/.test(tx))score-=30;}
 if(/\b(restaurer|restauration|recuperer)\b/.test(qx)){if(/\brestaurer\b/.test(tx))score+=105; if(/\bcopier\b/.test(tx))score-=25;}
 if(/\b(2h30|02h30|2 h 30|02:30)\b/.test(qx)&&/2 h 30/.test(tx))score+=95;
 if(/\b(agent|inventaire automatique)\b/.test(qx)&&/glpi agent/.test(tx))score+=95;
 if(/\b(ssh)\b/.test(qx)&&/ssh/.test(tx))score+=12;
 if(doc.type==='exercices') {
   if(/\b(exercice|question|enonce|corrige|packet tracer|situation|tp|cas pratique)\b/.test(qx)) score+=105;
   if(found===target.length) score+=36;
   if(inTitle>=2) score+=42;
 }
 // Les particularités numériques et matérielles orientent vers l’exercice le plus proche.
 if(/\b3[- ]2[- ]1\b/.test(qx) && /\b3[- ]2[- ]1\b/.test(tx))score+=145;
 if(/\b4\s*(pc|postes)\b/.test(qx) && /quatre pc|4 pc/.test(tx))score+=110;
 if(/\b3\s*vlan\b/.test(qx) && /trois vlan|3 vlan/.test(tx))score+=95;
 if(/\bacl standard\b/.test(qx) && /acl standard :/.test(tx))score+=85;
 if(/\b(22\s*h|22:00)\b/.test(qx) && /22 h/.test(tx))score+=95;
 if(/\b(voir|consulter|afficher)\b/.test(qx)&&doc.type==='exercices')score+=10;
 if(doc.type==='cours')score-=3;
 if(doc.type==='scripts' && (ii==='script'||ii==='recherche'))score+=28;
 if((doc.type==='nouveau'||doc.type==='studi') && found===target.length)score+=8;

 // Départage documentaire supplémentaire : favoriser le titre correspondant à la tâche demandée.
 // Aucun calcul technique, génération de configuration ou adaptation de script.
 if (/\bcron\b/.test(qx) && /\b(automatiser|planifier|programmer|tache|taches)\b/.test(qx)) {
   if (r==='planifier' && /\b(planifier|programmer|automatiser)\b/.test(tx)) score+=135;
   if (/\b(distinguer|notions|comprendre)\b/.test(tx))score-=45;
 }
 if (/\bacl\b/.test(qx)) {
   if (/\bacl\b/.test(tx)) score+=140;
   if (/\b(entrante|entrant)\b/.test(qx) && /\b(entrante|entrant|entree|inbound)\b/.test(tx))score+=65;
   if (/\b(wifi|wi.fi|point d.acces|point d acces)\b/.test(tx))score-=75;
 }
 if (/\b(proxmox|esxi)\b/.test(qx)) {
   if (/\b(proxmox|esxi)\b/.test(tx))score+=135;
   else if (/\b(virtualisation|hyperviseur)\b/.test(tx))score+=35;
   if (/\b(mdt|wds|deploiement windows)\b/.test(tx))score-=90;
 }
 if (/\b(restaurer)\b/.test(qx) && /\b(dossier|dossiers)\b/.test(qx) && /\bdossier\b/.test(tx))score+=95;
 return Math.max(0,score);
}
window.TSSR_SEARCH={fold:F,words,intent,role,rank};
})();
