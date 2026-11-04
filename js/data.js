/* ============================================================
   CONTENU ÉDITORIAL DU SITE : liens, événements, actualités et partenaires.
   Les scores, le calendrier et les classements sont dans js/resultats.js,
   mis à jour automatiquement par scripts/maj-resultats.pl.
   ============================================================ */

const SITE = {
  saison: "2026 – 2027",
  stade: "Stade municipal, route de Pardon, 63122 Saint-Genès-Champanelle",
  liens: {
    instagram: "https://www.instagram.com/assaintgeneschampanelle/",
    facebook: "https://www.facebook.com/ASSAINTGENESCHAMPANELLE",
    boutique: "https://www.adidasteam.com/fr-fr/clubshop/a-s-st-genes-champanelle/",
    fff: "https://epreuves.fff.fr/competition/club/524952-a-s-st-genes-champanelle/information.html",
    /* Bouton « Voir sur la carte » : Plans sur iPhone et iPad, Google Maps sur Android et ordinateur */
    plans: "https://maps.apple.com/?ll=45.719304,3.0143615&q=AS%20Saint-Gen%C3%A8s-Champanelle",
    googleMaps: "https://www.google.com/maps/search/?api=1&query=AS%20Saint-Gen%C3%A8s-Champanelle%2C%20Route%20de%20Pardon%2C%2063122%20Saint-Gen%C3%A8s-Champanelle"
  }
};

/* Événements du club hors matchs (loto, tournoi, assemblée générale…).
   Exemple : { date: "2027-03-14", heure: "14:00", titre: "Loto du club", lieu: "Salle des fêtes" } */
const EVENEMENTS = [];

/* Articles : l'image est dans assets/, le lien renvoie à la publication Instagram.
   Ordre d'affichage : 1er = grande une, 2e = encart à droite, 3e = article moyen, suivants = liste de brèves.
   « une » remplit le visuel de la grande une.
   Pour mettre un mot-clé en surbrillance dans un titre ou un texte : <mark>mot</mark>. */
const ACTUS = [
  {
    date: "2026-10-26", tag: "Régional 3", img: "assets/victoire-belbex.webp",
    alt: "Les joueurs de l'ASSG célèbrent dans le vestiaire, affiche Victoire 2-1 contre Belbex",
    titre: "Belbex battu <mark class='nb'>2-1</mark>, la fête au vestiaire",
    texte: "Samedi 24 octobre à domicile, l'équipe fanion s'impose 2-1 contre Belbex pour la 5e journée. C'est sa deuxième victoire en championnat, qui la porte à <mark>7 points</mark>.",
    lien: "https://www.instagram.com/p/De7o9y5NpbZ/",
    une: { haut: "Résumé", bas: "du match", a: "ASSG", b: "Belbex", h: 2, c: 1 }
  },
  {
    date: "2026-09-23", tag: "Vétérans", img: "assets/veterans.webp",
    alt: "Affiche Rejoins-nous de la section Vétérans pour la saison 2026-2027",
    titre: "Les <mark>Vétérans</mark> recrutent pour 2026-2027",
    texte: "Même passion, même esprit, toujours ensemble. La section Vétérans cherche de nouveaux joueurs : esprit d'équipe, plaisir du jeu, convivialité et championnat loisir.",
    lien: "https://www.instagram.com/p/DdhjHgPg-9L/"
  },
  {
    date: "2026-09-22", tag: "Coupe de France", img: "assets/gameday-vergongheon.webp",
    alt: "Affiche Gameday du 4e tour de Coupe de France, Saint-Genès-Champanelle contre Vergongheon",
    titre: "Un parcours jusqu'au <mark>4e tour</mark> de Coupe de France",
    texte: "Après un <mark>8-0</mark> à Thiers et une qualification aux tirs au but contre Ouvoimoija, l'ASSG a reçu Vergongheon-Arvant le 26 septembre. L'aventure s'arrête là, sur un score de 0-2.",
    lien: "https://www.instagram.com/p/DdhihEZAcgf/"
  },
  {
    date: "2026-10-26", tag: "Week-end", img: "assets/resultats-24-25-oct.webp",
    alt: "Résultats du week-end : R3 victoire 2-1, D2 défaite 5-1",
    titre: "Les résultats du 24 et 25 octobre : succès de la R3, revers de la D2 à Orcines",
    lien: "https://www.instagram.com/p/De7qGCitIb1/"
  },
  {
    date: "2026-10-11", tag: "Coupe Laura Foot", img: "assets/defaite-chamalieres.webp",
    alt: "Maillot du club sur un cintre, affiche Défaite 4-1 à Chamalières",
    titre: "Coupe Laura Foot : défaite 4-1 à Chamalières",
    lien: "https://www.instagram.com/p/DeXcWCpgwRM/"
  },
  {
    date: "2026-10-03", tag: "Régional 3", img: "assets/nul-quinssaines.webp",
    alt: "Affiche Match nul 1-1 entre l'ASSG et Quinssaines, avec le terrain en arrière-plan",
    titre: "Un point partagé contre Quinssaines, 1-1 à domicile",
    lien: "https://www.instagram.com/p/DeDFk4IAJhX/"
  }
];

/* Module « En images » : la première affiche s'ouvre en grand, les autres au clic. */
const MUR = [
  { img: "assets/weekend-24-25-oct.webp", titre: "Programme du week-end", sous: "24 et 25 octobre", alt: "Programme du week-end des 24 et 25 octobre", lien: "https://www.instagram.com/p/DezzPrQtgVy/" },
  { img: "assets/weekend-17-18-oct.webp", titre: "Programme du week-end", sous: "17 et 18 octobre", alt: "Programme du week-end des 17 et 18 octobre, joueurs numéros 8 et 11 de dos", lien: "https://www.instagram.com/p/Dei9J4WA94F/" },
  { img: "assets/gameday-vergongheon.webp", titre: "Gameday, Coupe de France", sous: "26 septembre", alt: "Affiche Gameday du 4e tour de Coupe de France contre Vergongheon", lien: "https://www.instagram.com/p/DdhihEZAcgf/" },
  { img: "assets/victoire-belbex.webp", titre: "Victoire contre Belbex", sous: "24 octobre", alt: "Les joueurs célèbrent la victoire 2-1 contre Belbex au vestiaire", lien: "https://www.instagram.com/p/De7o9y5NpbZ/" }
];

const PARTENAIRES = [
  "Furodet", "Chauff Granules", "Coudert", "Garage Theix", "Société Construction des Puys", "Sanchez", "Rebatet",
  "Carrière de Manson", "DG Plomberie", "Crousti Pain", "Charade", "Doutre-Pierron", "Beaudonnat RDL", "Transports Diagonale",
  "Vieira et fils", "Le Comptoir", "Chai Victorius", "Marché aux fleurs", "Boisvallon", "Ernova", "Machado", "De Barros",
  "Blackrock Games", "AADR63", "Village Auvergnat", "Soulière traiteur", "Fenêtres au carré", "GAEC de Chatignat", "Koesio",
];
