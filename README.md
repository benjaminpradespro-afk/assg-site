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

## Mettre à jour le reste du site

Tout se passe dans `js/data.js`.

- **Actualité** : ajoutez une entrée à `ACTUS` et déposez l'image dans `assets/`.
- **Événement** (loto, tournoi, AG...) : ajoutez une entrée à `EVENEMENTS`.

Le prochain match, le compte à rebours, le programme du week-end et l'agenda se calculent à partir de la date du jour.
