/*
  Données de la maquette Compagnie Petite Nature.
  Tout vient du site actuel (petitenature.fr, relevé du 27 octobre 2026).
  Ce qui manque est marqué « à compléter ». Pour ajouter une date : copier un bloc
  dans "evenements", changer les champs. Le tri à venir / passées est automatique.
*/
window.PN = {
  compagnie: {
    nom: 'Compagnie Petite Nature',
    email: 'compagnie@petitenature.fr',
    telephones: ['06 88 31 81 24', '06 46 31 45 47'],
    ville: '28220 Cloyes-sur-le-Loir',
    siret: '501 207 419 000 42',
    ape: '9001Z',
    licence: '2-004471',
    instagram: 'https://www.instagram.com/ciepetitenature',
    facebook: 'https://www.facebook.com/CiePetiteNature/'
  },

  categories: {
    'en-tournee': { nom: 'En tournée', court: 'Tournée', texte: 'Des lectures et des cycles littéraires prêts à être programmés.' },
    'en-immersion': { nom: 'En immersion', court: 'Immersion', texte: 'Une expérience avant ou pendant la lecture pour enrichir l’écoute.' },
    'sur-mesure': { nom: 'Sur mesure', court: 'Sur mesure', texte: 'Des lectures conçues autour d’un thème, d’un lieu ou d’un projet.' }
  },

  lectures: [
    {
      slug: 'histoires-dados', titre: 'Histoires d’Ados', cat: 'en-tournee', img: 'lectures/histoires-dados',
      accroche: 'Une découverte de la littérature adolescente contemporaine.',
      faits: [
        'Lectures à voix haute d’extraits de la sélection du prix Histoires d’ados de la médiathèque départementale d’Eure-et-Loir (édition 2026).',
        'Données dans des collèges, des lycées et des médiathèques d’Eure-et-Loir.'
      ],
      didascalie: '(Une classe. Des romans d’aujourd’hui, lus à voix haute.)'
    },
    {
      slug: 'habiter-le-monde', titre: 'Habiter le monde', cat: 'en-tournee', img: 'lectures/habiter-le-monde',
      accroche: 'Ce qui nous entoure, ce qui nous traverse.',
      faits: [
        'Présentée en veillée littéraire au FRAC Centre-Val de Loire, à Orléans, le 23 mai 2026, dans le cadre de l’exposition « Vivre avec / Living with ».',
        'Cinq rendez-vous de 10 à 15 minutes, chacun faisant dialoguer un texte avec une œuvre de la collection.',
        'Textes de B. Morizot, G. Sand, G. Filteau-Chiba, C. Lamarche et A. Krenak.'
      ],
      didascalie: '(La nuit, dans une exposition. Un texte devant une œuvre.)'
    },
    {
      slug: 'ecrire-une-aventure-a-soi', titre: 'Écrire, une aventure à soi', cat: 'en-tournee', img: 'lectures/ecrire-une-aventure-a-soi',
      accroche: 'L’écriture par celles et ceux qui écrivent.',
      faits: [],
      didascalie: '(Des écrivains parlent d’écrire.)'
    },
    {
      slug: 'paysans-paysages', titre: 'Paysans Paysages', cat: 'en-tournee', img: 'lectures/paysans-paysages-plein-air',
      accroche: 'Le monde rural par Balzac, Sand et Zola.',
      faits: [
        'Plusieurs volets : La Terre de Zola, Le Lys dans la vallée de Balzac.',
        'Lue notamment aux Rendez-vous de l’Histoire, à Arts en Scènes et au lycée polyvalent Henri Brisson.'
      ],
      didascalie: '(Un pré. Des chaises longues. La campagne racontée par trois romanciers.)'
    },
    {
      slug: 'george-sand', titre: 'George Sand, la femme aux mille visages', cat: 'en-tournee', img: 'lectures/george-sand',
      accroche: 'Une œuvre à découvrir sous plusieurs angles.',
      faits: [
        'Un cycle de lectures en plusieurs volets.',
        'Dernier volet : « George Sand, femme de la terre », à la bibliothèque de Gallardon, le 20 mai 2026 à 18 h 30.'
      ],
      didascalie: '(Plusieurs soirées, plusieurs visages d’une même autrice.)'
    },
    {
      slug: 'au-bord-de-leau', titre: 'Au bord de l’eau', cat: 'en-immersion', img: 'lectures/au-bord-de-leau-barque',
      accroche: 'Aventures végétales et récits d’aventures.',
      faits: [],
      didascalie: '(Une barque. L’eau. Une voix.)'
    },
    {
      slug: 'observer-le-vivant', titre: 'Observer le vivant', cat: 'en-immersion', img: 'lectures/observer-le-vivant-cyanotype',
      accroche: 'Cyanotype et littérature.',
      faits: [],
      didascalie: '(Une fleur posée sur un papier sensible. La lumière fait le reste.)'
    },
    {
      slug: 'atelier-paysans-paysages', titre: 'L’Atelier Paysans Paysages', cat: 'en-immersion', img: 'lectures/atelier-paysans-paysages-cueillette',
      img2: 'lectures/atelier-paysans-paysages-affiche',
      accroche: 'Cueillir, composer, écouter.',
      faits: [
        'Une cueillette et la création d’un herbier avec la plasticienne Clotilde Gaillard, puis une lecture à voix haute par Élise Truchard.',
        'Textes de Balzac, Sand et Zola : La Petite Fadette, Les Paysans.',
        'Présenté aux Rendez-vous Nature en Anjou et à Salbris.'
      ],
      didascalie: '(On cueille, on compose un herbier, puis on écoute.)'
    },
    {
      slug: 'toutes-petites-lectures', titre: 'Les Toutes Petites Lectures', cat: 'en-immersion', img: 'lectures/toutes-petites-lectures-plume',
      accroche: 'En cours de création.',
      faits: ['Lecture en cours de création : description à venir.'],
      didascalie: '(En cours de création.)'
    },
    {
      slug: 'au-supermarche', titre: 'Au supermarché', cat: 'sur-mesure', img: 'lectures/au-supermarche',
      accroche: 'Lire Annie Ernaux au rayon lessive…',
      faits: [],
      didascalie: '(Rayon lessives. Un public assis entre les caddies.)'
    },
    {
      slug: 'dans-une-gare', titre: 'Dans une gare', cat: 'sur-mesure', img: 'lectures/dans-une-gare',
      accroche: 'Écouter le voyage…',
      faits: [],
      didascalie: '(Un quai. Des départs. Une voix entre deux annonces.)'
    },
    {
      slug: 'au-musee', titre: 'Au musée', cat: 'sur-mesure', img: 'lectures/au-musee',
      accroche: 'Faire dialoguer texte et œuvre…',
      faits: [],
      didascalie: '(Une salle d’exposition. Un texte face à une œuvre.)'
    },
    {
      slug: 'en-entreprise', titre: 'En entreprise', cat: 'sur-mesure', img: 'lectures/en-entreprise',
      accroche: 'Faire une place à l’imaginaire dans le monde du travail.',
      faits: [],
      didascalie: '(Une salle de réunion. Une pause pour l’imaginaire.)'
    }
  ],

  /* Lieux : coordonnées projetées sur la carte (voir carte.json). */
  evenements: [
    { id: 'hda-luce-2026', debut: '2026-11-24T14:00:00+01:00', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture',
      lieu: 'Lycée professionnel de Lucé (nom complet à compléter)', adresse: '7 rue Jules Ferry, 28110 Lucé', carte: 'luce' },
    { id: 'hda-nogent-2026', debut: '2026-10-16T09:00:00+02:00', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture',
      lieu: 'Collège Jean Moulin', adresse: '11 rue du Onze Novembre 1918, 28210 Nogent-le-Roi', carte: 'nogent-le-roi' },
    { id: 'hda-chateaudun-2026', debut: '2026-10-15T14:00:00+02:00', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture',
      lieu: 'Médiathèque de Châteaudun', adresse: '36 boulevard Grindelle, 28200 Châteaudun', carte: 'chateaudun' },
    { id: 'hda-epernon-2026', debut: '2026-10-13T14:00:00+02:00', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture',
      lieu: 'Collège Michel Chasles', adresse: 'Boulevard Chasles, 28230 Épernon', carte: 'epernon' },
    { id: 'hda-cloyes-2026', debut: '2026-10-12T16:00:00+02:00', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture',
      lieu: 'Collège François Rabelais', adresse: '14 route de Montigny, 28220 Cloyes-les-Trois-Rivières', carte: 'cloyes' },
    { id: 'hda-toury-2026', debut: '2026-10-12T12:00:00+02:00', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture',
      lieu: 'Collège Louis Blériot', adresse: '5 rue du Onze Novembre 1918, 28310 Toury', carte: 'toury' },
    { id: 'passages-invisibles-2026', debut: '2026-06-08', titre: 'Les Passages Invisibles', labo: 'dire-ensemble', type: 'Labo',
      lieu: 'Centre de détention de Châteaudun', adresse: 'Châteaudun', carte: 'chateaudun',
      note: 'Un laboratoire littéraire mêlant écriture, lecture à voix haute et imaginaire à partir de l’œuvre de George Sand.' },
    { id: 'atelier-salbris-2026', debut: '2026-05-30', titre: 'L’Atelier Paysans Paysages', lecture: 'atelier-paysans-paysages', type: 'Atelier',
      lieu: 'Salbris', adresse: 'Salbris', carte: 'salbris',
      note: 'Cueillette et création d’un herbier avec Clotilde Gaillard, lecture de La Petite Fadette avec Élise Truchard.' },
    { id: 'hda-brossolette-2026', debut: '2026-05-28', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture',
      lieu: 'Collège Pierre Brossolette', adresse: 'Commune à compléter',
      note: 'Extraits de la sélection de la médiathèque départementale d’Eure-et-Loir, prix Histoires d’ados 2026.' },
    { id: 'frac-2026', debut: '2026-05-23T21:00:00+02:00', fin: '2026-05-23T23:00:00+02:00', titre: 'Habiter le monde, veillée littéraire', lecture: 'habiter-le-monde', type: 'Lecture',
      lieu: 'FRAC Centre-Val de Loire', adresse: 'Orléans', carte: 'orleans', img: 'agenda/affiche-frac-vivre-avec',
      note: 'Cinq rendez-vous, à 21 h, 21 h 30, 22 h, 22 h 30 et 23 h, dans l’exposition « Vivre avec / Living with ». Chaque lecture dure 10 à 15 minutes.' },
    { id: 'alizoa-ehpad-2026', debut: '2026-05-21', titre: 'La légende d’Alizoa, enquête poétique', labo: 'ecrire-ensemble', type: 'Restitution',
      lieu: 'EHPAD Les Coteaux Saint-Mathieu', adresse: 'Gallardon', carte: 'gallardon',
      note: 'Lecture à voix haute par les collégiens. Projet intergénérationnel Culture à partager ! (collège, EHPAD et bibliothèque de Gallardon).' },
    { id: 'sand-terre-2026', debut: '2026-05-20T18:30:00+02:00', titre: 'George Sand, femme de la terre', lecture: 'george-sand', type: 'Lecture',
      lieu: 'Bibliothèque de Gallardon, Espace des Oseraies, salle polyvalente', adresse: 'Rue Guy Pouillé, Gallardon', carte: 'gallardon', img: 'agenda/affiche-george-sand-femme-de-la-terre',
      note: 'Dernier volet du cycle « George Sand, la femme aux mille visages ».' },
    { id: 'alizoa-biblio-2026', debut: '2026-05-20', titre: 'La légende d’Alizoa, enquête poétique', labo: 'ecrire-ensemble', type: 'Restitution',
      lieu: 'Bibliothèque de Gallardon', adresse: 'Gallardon', carte: 'gallardon',
      note: 'Lecture à voix haute par les collégiens et exposition de leurs cyanotypes.' },
    { id: 'hda-hugo-2025', debut: '2025-11-07', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture', lieu: 'Collège Victor Hugo', adresse: 'Commune à compléter' },
    { id: 'hda-voise-2025', debut: '2025-11-07', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture', lieu: 'Collège Val de Voise', adresse: 'Gallardon', carte: 'gallardon' },
    { id: 'hda-pergola-2025', debut: '2025-11-04', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture', lieu: 'Médiathèque La Pergola', adresse: 'Commune à compléter' },
    { id: 'hda-france-2025', debut: '2025-11-03', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture', lieu: 'Collège Anatole France', adresse: 'Commune à compléter' },
    { id: 'hda-brossolette-2025', debut: '2025-11-03', titre: 'Histoires d’Ados', lecture: 'histoires-dados', type: 'Lecture', lieu: 'Collège Pierre Brossolette', adresse: 'Commune à compléter' },
    { id: 'zola-rdvh-2025', debut: '2025-10-10', titre: 'Paysans Paysages : La Terre de Zola', lecture: 'paysans-paysages', type: 'Lecture',
      lieu: 'Les Rendez-vous de l’Histoire', adresse: 'Blois', carte: 'blois', note: 'Deux dates publiées ce jour-là sur le site actuel.' },
    { id: 'fadette-anjou-2025', debut: '2025-07-09', titre: 'L’Atelier Paysans Paysages : La Petite Fadette de Sand', lecture: 'atelier-paysans-paysages', type: 'Atelier',
      lieu: 'Les Rendez-vous Nature en Anjou', adresse: 'Anjou (lieu à compléter)' },
    { id: 'zola-arts-2025', debut: '2025-06-14', titre: 'Paysans Paysages : La Terre de Zola', lecture: 'paysans-paysages', type: 'Lecture',
      lieu: 'Arts en Scènes', adresse: 'Lieu à compléter' },
    { id: 'balzac-anjou-2025', debut: '2025-04-27', titre: 'L’Atelier Paysans Paysages : Les Paysans de Balzac', lecture: 'atelier-paysans-paysages', type: 'Atelier',
      lieu: 'Les Rendez-vous Nature en Anjou', adresse: 'Anjou (lieu à compléter)' },
    { id: 'lys-brisson-2025', debut: '2025-03-24', titre: 'Paysans Paysages : Le Lys dans la vallée de Balzac', lecture: 'paysans-paysages', type: 'Lecture',
      lieu: 'Lycée polyvalent Henri Brisson', adresse: 'Vierzon', carte: 'vierzon' },
    { id: 'pousses-noirlac-2025b', debut: '2025-03-21', titre: 'Jeunes pousses & vieilles trognes', labo: 'ecrire-ensemble', type: 'Labo',
      lieu: 'Abbaye de Noirlac', adresse: 'Bruère-Allichamps', carte: 'noirlac' },
    { id: 'pousses-noirlac-2025a', debut: '2025-03-07', titre: 'Jeunes pousses & vieilles trognes', labo: 'ecrire-ensemble', type: 'Labo',
      lieu: 'Abbaye de Noirlac', adresse: 'Bruère-Allichamps', carte: 'noirlac' }
  ],

  /* Lieux de labos cités sur le site (en plus des dates d’agenda). */
  lieuxLabos: [
    { carte: 'rennes', quoi: 'Poésies amoureuses, lycée Bréquigny' },
    { carte: 'dun-sur-auron', quoi: 'Faire un feu, au chœur des mots, collège Le Colombier' },
    { carte: 'chateaudun', quoi: 'Parole d’homme, centre de détention' },
    { carte: 'gallardon', quoi: 'La légende d’Alizoa, collège, EHPAD et bibliothèque' },
    { carte: 'noirlac', quoi: 'Jeunes pousses & vieilles trognes, Le Repas' },
    { carte: 'bourges', quoi: 'Un paysage à soi, collège Le Grand Meaulnes' },
    { carte: 'nohant', quoi: 'Un paysage à soi, visite de la maison de George Sand' },
    { carte: 'saint-amand', quoi: 'Paysans Paysages « sauvage », Le Repas' },
    { carte: 'courville', quoi: 'Territoires, portraits sensibles, foyer de vie' }
  ],

  partenaires: [
    'DRAC Centre-Val de Loire', 'Région Centre-Val de Loire', 'Ciclic Centre-Val de Loire', 'Conseil départemental d’Eure-et-Loir',
    'Médiathèque départementale d’Eure-et-Loir', 'Maison de George Sand', 'Abbaye de Noirlac', 'FRAC Centre-Val de Loire',
    'Orchestre National de Bretagne', 'CPIE Brenne-Berry', 'Ligue de l’enseignement du Cher', 'Fol 18', 'Fondation SNCF',
    'Programme européen FEADER', 'Les Rendez-vous de l’Histoire'
  ]
};
