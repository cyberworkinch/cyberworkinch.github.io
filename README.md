> Mise à jour : la page d’accueil et bibliotheque.html utilisent maintenant la même recherche. **77 exercices** fixes et un sommaire CP1–CP9 ont été ajoutés. Voir AUDIT_EXERCICES_FINAL.md.

# SITE 1 — Bibliothèque documentaire TSSR

- Publier dans le dépôt existant `cyberworkinch.github.io` si l'on souhaite remplacer l'accueil actuel tout en conservant les cours originaux.
- Page principale : `index.html` conserve le moteur d'origine (176 pages). Nouveau moteur exhaustif dans `archives.html` ; ancien moteur aussi dans `cours.html`. PDF : `support.pdf`.
- Recherche texte **passive** dans 176 pages, 76 fiches, 57 commandes, 76 ports usuels, 13 diagnostics, compatibilités et ressources officielles.
- Aucune IA, aucun calculateur ni générateur de scripts/configurations. Les commandes affichées proviennent uniquement de documents archivés.
- Utilisation sans compte ; dépôt public visible ; les moteurs de recherche peuvent ignorer robots.txt.
- Attention aux droits d'auteur sur les supports de formation ; vérifier avant publication.
- Déploiement `main` / `(root)` ; tous les fichiers à la racine du dépôt (pas de ZIP chargé comme fichier).


## Personnalisation explicite (édition 30/10/2026)
Les champs à renseigner sont indiqués sous les lignes et étapes, séparés du contenu d’origine. Voir `LIRE_AVANT_DE_PUBLIER.md` et `JOURNAL_AJOUTS_IDENTIFIABLES.csv`.


## Mise à jour du 30/10/2026 — Nouveaux cours Studi

- 9 supports retrouvés dans les fichiers personnels de l'utilisateur ; 48 fiches originales de révision ajoutées.
- Dans le menu « FILTRER PAR SOURCE » : « Nouveaux cours Studi 2026 ».
- Fiches distinctes GLPI 10 + Debian 12 / PHP 8.2 et Debian 13 / PHP 8.4.
- Chaque fiche : titre précis, versions, prérequis, étapes et commentaires ajoutés clairement étiquetés.
- Recherche accessible dès la page index.html ; aucune IA, aucun calculateur, aucun script généré.
- Les PDF Studi originaux ne sont PAS inclus : les sources indiquent « reproduction interdite ». Vérifier séparément les droits sur les autres documents publiés.
- Les tests Chromium ont été exécutés sur la page HTML chargée avec ses scripts en mémoire, pas sur l'URL GitHub publique.
- La présence de commandes ne garantit pas l'exécution sans erreur : versions, paquets, réseau et droits réels restent à valider.
- Contrôles : node --check, indexation 48 fiches, 6 recherches, ouverture d'une fiche et affichage de commentaires, aucune erreur JS détectée.

### Extension Rsync/Cron (25 fiches nouvelles)

Ajout de **25 fiches documentaires fixes**, distinctes des 6 fiches Rsync/Cron déjà dans la version Studi 2026. Recherche par mots-clés et phrases, explication par étape et commentaires distincts des cours. Index : `INDEX_RSYNC_CRON_APPROFONDI.csv`. Vérifications et limites : `NOTES_RSYNC_CORRECTIONS_HORS_COURS.txt`. Aucun générateur automatique.
