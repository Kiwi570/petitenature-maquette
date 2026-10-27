# Compagnie Petite Nature — maquette

Maquette du futur site de la Compagnie Petite Nature, direction « Néon & papier ».
Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel.

## Modifier les contenus

- **Dates de l'agenda** : `assets/data/site.js`, liste `evenements`. Le tri entre dates à venir et passées se fait tout seul.
- **Images Grok** : déposer les fichiers WebP dans `assets/img/grok/` (nom du document de consignes, suivi de `-1600.webp` par exemple), puis relancer `node outils/build.mjs .` : les visuels provisoires sont remplacés.
- **Textes des pages** : `outils/build.mjs` génère toutes les pages HTML à partir de `assets/data/site.js`.

## Ce qui reste à compléter

Les mentions « à compléter » visibles sur les pages : public, durée, jauge, technique et tarif de chaque lecture,
adresse postale, forme juridique, directeur de la publication, numéro de licence au format actuel, portrait
d'Élise Truchard, photos de Faire un feu, extraits sonores, logos des partenaires.

## Technique

GSAP (ScrollTrigger, ScrollSmoother, Flip), OGL pour l'effet d'insolation cyanotype, polices Literata,
Tilt Neon et Courier Prime hébergées avec le site. Le bouton « Mode calme » coupe toutes les animations ;
le réglage « réduire les animations » du système est respecté.
