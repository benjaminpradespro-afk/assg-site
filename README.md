# Site de l'AS Saint-Genès-Champanelle

Site statique publié sur GitHub Pages. Pour le voir sur votre ordinateur, ouvrez `index.html` dans un navigateur.

## Publication

Chaque modification envoyée sur la branche `main` est publiée automatiquement par `.github/workflows/publier.yml`. Seuls `index.html`, `mentions-legales.html`, `css/`, `js/` et `assets/` sont mis en ligne.

Récupérez d'abord les derniers résultats avant de modifier le site sur votre ordinateur :

```bash
git pull
```

## Résultats, calendrier et classements

Ils sont dans `js/resultats.js`, un fichier généré : ne le modifiez pas à la main.

`scripts/maj-resultats.pl` le met à jour à partir des pages d'équipes de SportCorico, qui reprennent les données de la FFF. Il télécharge aussi le logo d'un nouveau club adverse. Si une page est illisible, il ne modifie rien et GitHub prévient le propriétaire du dépôt par e-mail.

GitHub le lance chaque matin, lundi compris, et le samedi et le dimanche soir. Vous pouvez aussi le lancer depuis l'onglet **Actions** du dépôt, avec **Run workflow**.

- **Nom d'un club mal écrit** : corrigez-le dans `scripts/clubs.tsv`.
- **Nouvelle saison** : vérifiez les adresses des équipes en haut de `scripts/maj-resultats.pl` et les forfaits corrigés à la main (`%FORFAITS_FFF`).

## Actualité du club

- **Résumé des matchs (grande card)** : la page le calcule à partir des résultats. Il change chaque lundi à 8 h et porte sur la dernière semaine terminée où le club a joué.
- **Posts Instagram (autres cards)** : chaque lundi matin, `scripts/maj-actus.pl` reprend les 5 dernières publications depuis le flux Behold relié au compte du club, dont l'adresse est dans la variable de dépôt `BEHOLD_FLUX`. Meta interdit de lire Instagram directement par script. Vous pouvez aussi le lancer avec **Run workflow**.

Tant qu'il manque des posts, ces cards affichent les actualités de `ACTUS`, dans `js/data.js`.

## Mettre à jour le reste du site

Tout se passe dans `js/data.js`.

- **Événement** (loto, tournoi, AG...) : ajoutez une entrée à `EVENEMENTS`.
- **Partenaire** : ajoutez son nom à `PARTENAIRES`. La vitesse du bandeau s'adapte toute seule.

Le prochain match, le compte à rebours, le programme du week-end et l'agenda se calculent à partir de la date du jour.
