// Générateur des pages statiques de la maquette Petite Nature.
// node build.mjs <dossier du site>
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SITE = process.argv[2];
const GEN = path.dirname(new URL(import.meta.url).pathname);
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(SITE, 'assets/data/site.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(SITE, 'assets/data/images.js'), 'utf8'), ctx);
const PN = ctx.window.PN;
const IMG = ctx.window.PN_IMAGES;
const CARTE = JSON.parse(fs.readFileSync(path.join(GEN, 'carte.json'), 'utf8'));
const GROK_DIR = path.join(SITE, 'assets/img/grok');
const GROK = new Set(fs.existsSync(GROK_DIR) ? fs.readdirSync(GROK_DIR).map((f) => f.replace(/-\d+\.webp$/, '')) : []);
const GROK_TAILLES = {};
if (fs.existsSync(GROK_DIR)) fs.readdirSync(GROK_DIR).forEach((f) => { const m = f.match(/^(.*)-(\d+)\.webp$/); if (m) (GROK_TAILLES[m[1]] = GROK_TAILLES[m[1]] || []).push(+m[2]); });
const AUJOURDHUI = new Date('2026-10-27T12:00:00+01:00');

let R = '';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ac = (t = 'à compléter') => `<span class="a-completer">${t}</span>`;
const lect = (slug) => PN.lectures.find((l) => l.slug === slug);

/* ---------------------------------------------------------------- images */
function image(key, o = {}) {
  const m = IMG[key];
  if (!m) throw new Error('Image inconnue : ' + key);
  const srcset = m.sizes.map((w) => `${R}assets/img/${key}-${w}.webp ${w}w`).join(', ');
  const def = m.sizes.find((w) => w >= 960) || m.sizes[m.sizes.length - 1];
  const cls = ['visuel', o.cls, o.insole && 'insole', o.parallaxe && 'parallaxe', o.contenu && 'visuel--contenu', o.cadre && 'visuel--cadre', key.startsWith('identite/') && 'sans-fond'].filter(Boolean).join(' ');
  const style = [o.naturel ? `aspect-ratio:${m.w}/${m.h}` : '', o.style || ''].filter(Boolean).join(';');
  return `<figure class="${cls}"${style ? ` style="${style}"` : ''}${o.onde ? ' data-onde' : ''}${o.attrs ? ' ' + o.attrs : ''}><img src="${R}assets/img/${key}-${def}.webp" srcset="${srcset}" sizes="${o.sizes || '(min-width: 960px) 50vw, 100vw'}" width="${m.w}" height="${m.h}" alt="${esc(o.alt ?? m.alt)}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${key.startsWith('identite/') ? '' : ` style="background-color:${m.color}"`}>${o.legende ? `<figcaption>${o.legende}</figcaption>` : ''}</figure>`;
}

/* Visuel provisoire codé, ou image Grok si elle a été livrée. */
function visuel(scene, grok, o = {}) {
  const cls = ['visuel', o.cls, o.parallaxe && 'parallaxe'].filter(Boolean).join(' ');
  if (grok && GROK.has(grok)) {
    const tailles = GROK_TAILLES[grok].sort((a, b) => a - b);
    const srcset = tailles.map((w) => `${R}assets/img/grok/${grok}-${w}.webp ${w}w`).join(', ');
    const mob = o.mobile && GROK.has(o.mobile) ? `<source media="(max-width: 700px)" srcset="${GROK_TAILLES[o.mobile].map((w) => `${R}assets/img/grok/${o.mobile}-${w}.webp ${w}w`).join(', ')}">` : '';
    return `<figure class="${cls}${o.insole ? ' insole' : ''}"${o.style ? ` style="${o.style}"` : ''}><picture>${mob}<img src="${R}assets/img/grok/${grok}-${tailles[tailles.length - 1]}.webp" srcset="${srcset}" sizes="${o.sizes || '100vw'}" alt="${esc(o.alt || '')}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"></picture></figure>`;
  }
  return `<figure class="${cls}"${o.style ? ` style="${o.style}"` : ''}><canvas data-scene="${scene}" role="img" aria-label="${esc(o.alt || 'Visuel provisoire')}"></canvas><span class="provisoire">Visuel provisoire</span></figure>`;
}

function neon(texte, o = {}) {
  const tag = o.tag || 'h2';
  const cls = ['neon', o.cls].filter(Boolean).join(' ');
  return `<${tag} class="${cls}"${o.perche ? ` data-perche="${o.perche}"` : ''}${o.id ? ` id="${o.id}"` : ''}>${esc(texte)}</${tag}>`;
}

/* ---------------------------------------------------------------- dates */
const fJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
const fCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });
const fNum = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' });
const fHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
const debut = (e) => (e.debut.length > 10 ? new Date(e.debut) : new Date(e.debut + 'T12:00:00+01:00'));
const finEvt = (e) => (e.fin ? new Date(e.fin) : e.debut.length > 10 ? new Date(debut(e).getTime() + 7200e3) : new Date(e.debut + 'T23:59:00+01:00'));
const heure = (e) => (e.debut.length > 10 ? fHeure.format(debut(e)).replace(':', ' h ').replace(' h 00', ' h') : '');
const evts = [...PN.evenements].sort((a, b) => debut(a) - debut(b));
const prochain = evts.find((e) => finEvt(e) >= AUJOURDHUI);
const ville = (adr) => (adr.split(',').pop() || '').replace(/\d{5}\s*/, '').trim();
const marque = (s) => esc(s).replace(/\(?(nom complet |lieu |commune )?à compléter\)?/gi, (m) => ac(m.replace(/[()]/g, '')));

/* ---------------------------------------------------------------- mise en page */
const NAV = [
  ['compagnie.html', 'La compagnie', 'compagnie'],
  ['lectures.html', 'Lectures', 'lectures'],
  ['labos.html', 'Labos', 'labos'],
  ['creations-sceniques.html', 'Créations', 'creations'],
  ['agenda.html', 'Agenda', 'agenda'],
  ['contact.html', 'Contact', 'contact']
];

function ondeChemin(base, amp, phase) {
  let d = `M0,1 L0,${(base + amp * Math.sin(phase)).toFixed(4)}`;
  for (let i = 1; i <= 40; i++) {
    const x = i / 40;
    const y = base + amp * Math.sin(phase + x * Math.PI * 3.2) * (0.6 + 0.4 * Math.sin(x * Math.PI));
    d += ` L${x.toFixed(3)},${Math.max(0, Math.min(1, y)).toFixed(4)}`;
  }
  return d + ' L1,1 Z';
}

function page({ fichier, titre, description, corps, actif = '', classe = '', onde = false, scripts = '' }) {
  const prof = fichier.split('/').length - 1;
  R = '../'.repeat(prof);
  const contenu = typeof corps === 'function' ? corps() : corps;
  const nav = NAV.map(([h, t, k]) => `<a href="${R}${h}"${k === actif ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const menuLiens = NAV.map(([h, t], i) => `<a href="${R}${h}" data-feuillet="${t}"><span class="neon neon--nuit">${t}</span></a>`).join('');
  const html = `<!doctype html>
<html lang="fr" class="sans-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titre)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta name="theme-color" content="#ede6d6">
<link rel="icon" type="image/webp" href="${R}assets/img/identite/rouge-gorge-480.webp">
<link rel="preload" href="${R}assets/fonts/literata-var.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${R}assets/fonts/tilt-neon-var.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="${R}assets/css/site.css">
<script>(function(){var h=document.documentElement,r=false;h.classList.remove('sans-js');try{r=matchMedia('(prefers-reduced-motion: reduce)').matches;var c=localStorage.getItem('pn-calme');if(c==='1'||(c===null&&r))h.classList.add('calme');}catch(e){if(r)h.classList.add('calme');}})();</script>
</head>
<body data-racine="${R}"${classe ? ` class="${classe}"` : ''}>
<a class="passer" href="#contenu">Aller au contenu</a>
<header class="entete">
  <div class="wrap entete__in">
    <a class="logo" href="${R}index.html" data-feuillet="Petite Nature"><img src="${R}assets/img/identite/logo-480.webp" srcset="${R}assets/img/identite/logo-480.webp 480w, ${R}assets/img/identite/logo-960.webp 960w" sizes="11rem" width="4500" height="3000" alt="Compagnie Petite Nature, accueil"></a>
    <nav class="nav" aria-label="Navigation principale">${nav}</nav>
    <a class="btn btn--neon" href="${R}programmer.html">Programmer une lecture</a>
    <button class="calme-btn" type="button" aria-pressed="false" title="Arrête les animations, le son reste au clic">Mode calme</button>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><span></span><span></span><span class="sr">Menu</span></button>
  </div>
</header>
<nav id="menu" class="menu" hidden aria-label="Menu">
  ${menuLiens}
  <div class="menu__pied">
    <a class="btn btn--neon" href="${R}programmer.html">Programmer une lecture</a>
    <p class="meta">${PN.compagnie.email}</p>
    <p class="meta">${PN.compagnie.telephones.join(' ou ')}</p>
  </div>
</nav>
<div id="smooth-wrapper"><div id="smooth-content">
<main id="contenu" tabindex="-1">
${contenu}
</main>
${pied()}
</div></div>
<div class="feuillet" aria-hidden="true"><div class="feuillet__page"><span class="neon neon--moyen"></span></div></div>
${onde ? `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><clipPath id="onde-clip" clipPathUnits="objectBoundingBox"><path d="${ondeChemin(0.07, 0.035, 2.4)}"/></clipPath></svg>` : ''}
<script src="${R}assets/data/site.js"></script>
<script src="${R}assets/data/images.js"></script>
<script src="${R}assets/vendor/gsap.min.js"></script>
<script src="${R}assets/vendor/ScrollTrigger.min.js"></script>
<script src="${R}assets/vendor/ScrollSmoother.min.js"></script>
<script src="${R}assets/vendor/Flip.min.js"></script>
<script src="${R}assets/js/scenes.js"></script>
<script src="${R}assets/js/app.js"></script>
<script type="module" src="${R}assets/js/gl.js"></script>
${scripts}
</body>
</html>
`;
  const typo = (h) => h.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/).map((part, i) => (i % 2 ? part : part.replace(/>([^<]+)</g, (m, t) => '>' + t.replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0') + '<'))).join('');
  const out = path.join(SITE, fichier);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, typo(html));
  return html;
}

function pied() {
  const c = PN.compagnie;
  return `<footer class="pied nuit" data-fil="g" data-fil-y="0.1">
  <div class="wrap pied__grille">
    <div style="display:grid;gap:1.2rem;align-content:start">
      <img class="pied__logo" src="${R}assets/img/identite/logo-480.webp" width="4500" height="3000" alt="Compagnie Petite Nature" loading="lazy">
      <p class="dida">(Lectures à voix haute et labos littéraires. Une compagnie née en 2007.)</p>
      <form class="lettre" data-lettre novalidate>
        <label for="lettre-pied" class="champ"><span>Recevez la lettre d’information, une par saison</span></label>
        <div class="ligne-form"><input id="lettre-pied" type="email" name="email" autocomplete="email" placeholder="votre@adresse.fr" required><button class="btn btn--neon" type="submit">Je veux la recevoir</button></div>
        <p class="retour" role="status"></p>
      </form>
    </div>
    <div>
      <h2>La compagnie</h2>
      <ul>
        ${NAV.slice(0, 5).map(([h, t]) => `<li><a href="${R}${h}">${t}</a></li>`).join('')}
        <li><a href="${R}programmer.html">Programmer une lecture</a></li>
      </ul>
    </div>
    <div>
      <h2>Contact</h2>
      <ul>
        <li class="copie"><code>${c.email}</code><button type="button" data-copier="${c.email}">Copier</button></li>
        ${c.telephones.map((t) => `<li class="copie"><code>${t}</code><button type="button" data-copier="${t.replace(/\s/g, '')}">Copier</button></li>`).join('')}
        <li>${c.ville}</li>
        <li><a href="${c.instagram}" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="${c.facebook}" target="_blank" rel="noopener">Facebook</a></li>
      </ul>
    </div>
    <div>
      <h2>Informations</h2>
      <ul>
        <li><a href="${R}mentions-legales.html">Mentions légales</a></li>
        <li><a href="${R}confidentialite.html">Confidentialité</a></li>
        <li><a href="${R}cookies.html">Cookies</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap pied__bas">
    <span>© Compagnie Petite Nature 2026</span>
    <span>SIRET ${c.siret}</span>
    <span>APE ${c.ape}</span>
    <span>Licence n° ${c.licence} (format à vérifier)</span>
    <span>Maquette de travail, octobre 2026</span>
  </div>
</footer>`;
}

/* ---------------------------------------------------------------- blocs communs */
function blocProchaine(titreTag = 'h2') {
  const e = prochain;
  const d = e ? debut(e) : null;
  const lien = e ? (e.lecture ? `${R}lectures/${e.lecture}.html` : e.labo ? `${R}${e.labo}.html` : `${R}agenda.html`) : `${R}agenda.html`;
  return `<div data-prochaine>
  <div class="billet" data-p-plein>
    <div>
      <p class="meta">Prochaine lecture</p>
      <p class="billet__date"><span data-p-jour>${e ? fNum.format(d).replace('/', '.') : ''}</span><small data-p-date>${e ? fJour.format(d) + (heure(e) ? ', ' + heure(e) : '') : ''}</small></p>
    </div>
    <div style="display:grid;gap:0.6rem">
      <${titreTag} class="titre--petit"><a data-p-lien href="${lien}" data-p-titre>${e ? esc(e.titre) : ''}</a></${titreTag}>
      <p><span data-p-lieu>${e ? marque(e.lieu) : ''}</span><br><span class="meta" data-p-adresse>${e ? marque(e.adresse) : ''}</span></p>
      <div class="decompte" data-decompte aria-label="Temps restant avant la lecture">
        <div><b data-j>–</b><span>jours</span></div><div><b data-h>–</b><span>heures</span></div><div><b data-m>–</b><span>minutes</span></div><div><b data-s>–</b><span>secondes</span></div>
      </div>
      <div class="actions"><button class="btn" type="button" data-p-ics>Ajouter à mon agenda</button><a class="lien-fleche" href="${R}agenda.html">Tout l’agenda</a></div>
    </div>
    ${image('agenda/visuel-prix-histoires-dados', { cls: 'ratio-45', alt: "Visuel du prix Histoires d'ados", sizes: '220px' })}
  </div>
  <p class="vide" data-p-vide hidden>Aucune date à venir n’est publiée pour l’instant. <a href="${R}agenda.html">Voir les dates passées</a>.</p>
</div>`;
}

function carteFrance({ id = 'carte', titreListe = true } = {}) {
  const lieuxUtilises = new Map();
  const ajouter = (k, quoi) => { if (!CARTE.lieux[k]) return; if (!lieuxUtilises.has(k)) lieuxUtilises.set(k, new Set()); lieuxUtilises.get(k).add(quoi); };
  ajouter('cloyes', 'Siège de la compagnie');
  evts.forEach((e) => e.carte && ajouter(e.carte, e.titre));
  PN.lieuxLabos.forEach((l) => ajouter(l.carte, l.quoi));
  const pts = [...lieuxUtilises.keys()];
  const xs = pts.map((k) => CARTE.lieux[k].x), ys = pts.map((k) => CARTE.lieux[k].y);
  const pad = 60;
  const vb = [Math.min(...xs) - pad, Math.min(...ys) - pad * 1.2, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
  const ratio = 1 / 0.82;
  if (vb[2] / vb[3] < ratio) { const nw = vb[3] * ratio; vb[0] -= (nw - vb[2]) / 2; vb[2] = nw; } else { const nh = vb[2] / ratio; vb[1] -= (nh - vb[3]) / 2; vb[3] = nh; }
  const vbS = vb.map((v) => v.toFixed(1)).join(' ');
  const s = CARTE.lieux.cloyes;
  const fixes = new Set(['cloyes', 'rennes', 'orleans', 'blois', 'bourges', 'gallardon', 'noirlac']);
  const regions = CARTE.regions.map((r) => `<path class="region${r.code === '24' || r.code === '53' ? ' region--forte' : ''}" d="${r.d}"><title>${esc(r.nom)}</title></path>`).join('');
  const trajets = pts.filter((k) => k !== 'cloyes').map((k) => {
    const p = CARTE.lieux[k];
    const mx = (s.x + p.x) / 2, my = (s.y + p.y) / 2 - Math.hypot(p.x - s.x, p.y - s.y) * 0.25;
    return `<path class="trajet" d="M${s.x},${s.y} Q${mx.toFixed(1)},${my.toFixed(1)} ${p.x},${p.y}"/>`;
  }).join('');
  const points = pts.map((k) => {
    const p = CARTE.lieux[k];
    return `<g class="point${k === 'cloyes' ? ' siege' : ''}" data-id="${k}"><circle class="h" cx="${p.x}" cy="${p.y}" r="7"/><circle class="c" cx="${p.x}" cy="${p.y}" r="2.6"/><text x="${p.x}" y="${p.y}" dx="5" dy="2.5" font-size="7.5"${fixes.has(k) ? ' data-fixe' : ' style="opacity:0"'}>${esc(k === 'cloyes' ? 'Cloyes, siège' : p.nom.replace(' (maison de George Sand)', ''))}</text></g>`;
  }).join('');
  const liste = pts.map((k) => `<li data-lieu="${k}" tabindex="0"${k === 'cloyes' ? ' class="siege"' : ''}><span><b>${esc(CARTE.lieux[k].nom)}</b><br><span class="meta">${[...lieuxUtilises.get(k)].slice(0, 3).map(esc).join(' ; ')}</span></span></li>`).join('');
  return `<div class="carte" data-carte id="${id}">
  <figure>
    <div class="carte__cadre"><svg viewBox="${vbS}" data-vb-france="0 0 ${CARTE.w} ${CARTE.h}" role="img" aria-labelledby="${id}-t"><title id="${id}-t">Carte des lieux où la compagnie a lu, du siège de Cloyes vers chaque lieu</title>${regions}<g>${trajets}</g><g>${points}</g></svg></div>
    <figcaption class="carte__source meta">Fond de carte : IGN Admin Express, Licence ouverte. Positions approximatives, à l’échelle de la commune.</figcaption>
  </figure>
  <div>
    ${titreListe ? '<p class="meta" style="margin-bottom:0.6rem">Les lieux cités sur le site actuel</p>' : ''}
    <ul class="carte__liste">${liste}</ul>
  </div>
</div>`;
}

function appelProgrammer(titre = 'Programmer une lecture') {
  return `<section class="section nuit" data-fil="c" data-fil-y="0.2">
  <div class="wrap appel">
    <div style="display:grid;gap:1.4rem">
      ${neon('À vous', { cls: 'neon--moyen', perche: 'd' })}
      <h2 class="titre--moyen titre">${titre}</h2>
      <p class="lecture">Médiathèque, établissement scolaire, musée, festival, lieu de soin ou entreprise : décrivez votre projet en quatre étapes pour préparer une proposition avec la compagnie.</p>
      <div class="actions"><a class="btn btn--neon" href="${R}programmer.html">Commencer la demande</a><span class="copie meta"><code>${PN.compagnie.email}</code><button type="button" data-copier="${PN.compagnie.email}">Copier</button></span></div>
    </div>
    ${image('lectures/paysans-paysages-plein-air', { cls: 'ratio-43 parallaxe', sizes: '(min-width: 960px) 40vw, 100vw', alt: 'Public assis dans un pré pour une lecture en plein air' })}
  </div>
</section>`;
}

/* ================================================================= ACCUEIL */
function accueil() {
  const portes = [
    { neon: 'Lectures', h: 'lectures.html', lien: 'Parcourir les 13 lectures', txt: 'Des lectures prêtes à être programmées, en tournée, en immersion ou sur mesure. Au supermarché, on lit Annie Ernaux au rayon lessive.', vis: () => image('lectures/au-supermarche', { cls: 'porte__visuel parallaxe', sizes: '(min-width: 960px) 45vw, 100vw' }), dida: '(Rayon lessives. Un public assis entre les rayons.)' },
    { neon: 'Labos', h: 'labos.html', lien: 'Découvrir les labos', txt: 'Des projets où la littérature devient une expérience collective, menés dans des établissements scolaires, des hôpitaux, des EHPAD, des foyers de vie, des prisons ou des lieux de patrimoine.', vis: () => image('labos/poesies-amoureuses-repetitions', { cls: 'porte__visuel parallaxe', sizes: '(min-width: 960px) 45vw, 100vw' }), dida: '(Répétition au lycée Bréquigny, avec des musiciens de l’Orchestre National de Bretagne.)' },
    { neon: 'Créations', h: 'creations-sceniques.html', lien: 'Voir Faire un feu', txt: 'Faire un feu, d’après la nouvelle de Jack London : théâtre d’ombre, arts plastiques, création visuelle et sonore en direct.', vis: () => visuel('feu-neige', 'accueil-porte-creations', { cls: 'porte__visuel', alt: 'Visuel provisoire : un feu dans la neige, la nuit' }), dida: '(Le Grand Nord. Un homme, un chien, un feu à allumer.)' }
  ];
  const corde = [
    ['labos/poesies-amoureuses-restitution-orchestre', 'Poésies amoureuses', 'Lycée Bréquigny, Rennes', 'dire-ensemble.html#poesies-amoureuses'],
    ['labos/legende-alizoa-couverture', 'La légende d’Alizoa', 'Gallardon', 'ecrire-ensemble.html#alizoa'],
    ['labos/paysage-a-soi-bocal-lumineux', 'Un paysage à soi', 'Collège Le Grand Meaulnes, Bourges', 'ecrire-ensemble.html#paysage-a-soi'],
    ['labos/parole-dhomme-livres', 'Parole d’homme', 'Centre de détention de Châteaudun', 'dire-ensemble.html#parole-dhomme'],
    ['labos/jeunes-pousses-roman-photo', 'Jeunes pousses & vieilles trognes', 'Abbaye de Noirlac', 'ecrire-ensemble.html#jeunes-pousses'],
    ['labos/paysans-paysages-sauvage-vegetaux', 'Paysans Paysages « sauvage »', 'EHPAD et hôpital de jour', 'imaginer-ensemble.html#sauvage'],
    ['labos/paysage-a-soi-poeme-fenetre', 'Un paysage à soi', 'Poème d’élève sur une fenêtre', 'ecrire-ensemble.html#paysage-a-soi'],
    ['lectures/atelier-paysans-paysages-cueillette', 'L’Atelier Paysans Paysages', 'Cueillir, composer, écouter', 'lectures/atelier-paysans-paysages.html']
  ];
  return page({
    fichier: 'index.html', actif: '', onde: true,
    titre: 'Compagnie Petite Nature',
    description: 'La Compagnie Petite Nature propose des lectures à voix haute et des labos littéraires pour faire de la littérature une expérience à partager.',
    corps: () => `
<section class="hero" data-fil="g" data-fil-y="0.2">
  <div class="wrap">
    <div class="tapuscrit">
      <p class="marge dida">(Un pré, en fin de journée. Des chaises longues. Une voix porte un texte.)</p>
      <div class="plein hero__titre">
        <h1><span class="sr">Compagnie </span>${neon('Petite Nature', { tag: 'span', perche: 'd' })}</h1>
      </div>
    </div>
    <div class="tapuscrit hero__bas">
      <div class="marge"><a class="prochaine-pastille" href="${R}agenda.html" data-prochaine><span data-p-plein>Prochaine lecture : <span data-p-court>${prochain ? fCourt.format(debut(prochain)) + ', ' + ville(prochain.adresse) : ''}</span></span><span data-p-vide hidden>Dates à venir bientôt</span></a></div>
      <div class="large" style="display:grid;gap:1.5rem">
        <p class="chapeau">La Compagnie Petite Nature propose des lectures à voix haute et des labos littéraires pour faire de la littérature une expérience à partager.</p>
        <div class="actions"><a class="btn" href="${R}lectures.html" data-curseur="Lire">Voir les lectures</a><a class="btn btn--trait" href="${R}programmer.html">Programmer une lecture</a></div>
      </div>
    </div>
  </div>
  <div class="hero__image">
    ${image('lectures/paysans-paysages-plein-air', { cls: 'insole', onde: true, eager: true, sizes: '100vw', alt: 'Lecture en plein air : un public assis dans un pré, au soleil du soir' })}
    <p class="hero__legende">(Paysans Paysages, lecture en plein air)</p>
  </div>
</section>

<section class="section" data-fil="d" data-fil-y="0.3">
  <div class="wrap tapuscrit">
    <p class="marge dida">(D’une lecture en classe à un parcours dans un musée, d’un cycle littéraire à une lecture en pleine nature.)</p>
    <div class="corps">
      <p class="citation dit" data-perche="g">Un texte, une voix, un temps pour écouter.</p>
      <p class="lecture">Les formes changent selon les textes, les lieux et les projets. Ce qui reste : quelqu’un lit, d’autres écoutent, et la littérature se partage dans le même temps.</p>
    </div>
    <div class="plein manifeste__images" style="margin-top:clamp(2rem,5vw,4rem)">
      <figure>${image('lectures/au-musee', { cls: 'ratio-45 insole', sizes: '(min-width: 960px) 40vw, 50vw' })}<p class="legende">(Au musée. Un texte dialogue avec une œuvre.)</p></figure>
      <figure>${image('lectures/au-bord-de-leau-barque', { cls: 'ratio-23 insole', sizes: '(min-width: 960px) 40vw, 50vw' })}<p class="legende">(Au bord de l’eau. Une barque, une voix.)</p></figure>
    </div>
  </div>
</section>

<section class="portes" data-horizontal data-fil="g" data-fil-y="0.5">
  <div class="portes__piste wrap" data-piste>
    <div class="portes__intro" style="display:grid;gap:1rem">
      <h2 class="titre titre--moyen" data-perche="g">Trois façons de faire entendre un texte</h2>
      <p class="dida">(Faites défiler : les portes passent de gauche à droite.)</p>
    </div>
    ${portes.map((p) => `<article class="porte">
      <a href="${R}${p.h}" data-curseur="Entrer" aria-label="${p.neon}">${p.vis()}</a>
      <div class="porte__texte">
        ${neon(p.neon, { cls: 'neon--moyen' })}
        <p>${p.txt}</p>
        <p class="dida dida--petite">${p.dida}</p>
        <a class="lien-fleche" href="${R}${p.h}">${p.lien}</a>
      </div>
    </article>`).join('')}
  </div>
</section>

<section class="section" data-fil="d" data-fil-y="0.4">
  <div class="wrap" style="display:grid;gap:2rem">
    <div class="tapuscrit"><p class="marge dida">(Une date, un lieu, une heure. Le reste est dans l’agenda.)</p><h2 class="corps titre titre--moyen" data-perche="d">La prochaine lecture</h2></div>
    ${blocProchaine('h3')}
  </div>
</section>

<section class="section section--serree" data-corde data-fil="g" data-fil-y="0.3">
  <div class="wrap tapuscrit" style="margin-bottom:2.5rem">
    <p class="marge dida">(Les projets menés, accrochés au fil comme des tirages qui sèchent.)</p>
    <div class="corps"><h2 class="titre titre--moyen" data-perche="g">Ce que les labos ont fait naître</h2><p class="lecture" style="margin-top:1rem">Des livrets, un roman-photo, des installations, des lectures publiques et des créations sonores, réalisés avec les participants.</p></div>
  </div>
  <div class="corde__cadre corde">
    <div class="corde__fil"></div>
    <div class="corde__piste">
      ${corde.map(([k, t, l, h]) => `<a class="corde__item" href="${R}${h}" data-curseur="Voir"><span class="corde__pince"></span>${image(k, { cls: 'ratio-45', sizes: '300px' })}<p>${t}<span class="meta">${l}</span></p></a>`).join('')}
    </div>
  </div>
  <div class="wrap" style="margin-top:clamp(3rem,6vw,5rem)">
    <div class="compteurs">
      <div class="compteur"><b data-compte="13">13</b><span>lectures au répertoire, prêtes à être programmées</span></div>
      <div class="compteur"><b data-compte="9">9</b><span>projets de labos présentés sur le site</span></div>
      <div class="compteur"><b data-compte="80">80</b><span>élèves de 6e dans le projet Un paysage à soi</span></div>
      <div class="compteur"><b data-compte="2007" data-compte-depuis="1990">2007</b><span>année de création de la compagnie</span></div>
    </div>
  </div>
</section>

<section class="section" data-fil="c" data-fil-y="0.05">
  <div class="wrap" style="display:grid;gap:2.5rem">
    <div class="tapuscrit"><p class="marge dida">(La voix part de Cloyes. Elle va jusqu’à Rennes, Orléans, Bourges ou Noirlac.)</p><div class="corps"><h2 class="titre titre--moyen" data-perche="d">Où la compagnie a lu</h2><p class="lecture" style="margin-top:1rem">Des classes d’Eure-et-Loir au centre de détention de Châteaudun, d’une abbaye du Cher à un lycée de Rennes : les lieux cités sur le site actuel.</p></div></div>
    ${carteFrance()}
  </div>
</section>

<section class="section" data-fil="d" data-fil-y="0.3">
  <div class="wrap cote-a-cote">
    <div style="display:grid;gap:1.5rem;justify-items:start">
      ${image('identite/rouge-gorge', { cls: 'robin-grand visuel--contenu', naturel: true, sizes: '360px', style: 'background:transparent', alt: 'Le rouge-gorge, emblème de la compagnie, dessiné aux crayons de couleur' })}
      <p class="dida">(Le rouge-gorge, emblème de la compagnie. Il vous suit de page en page.)</p>
    </div>
    <div class="corps">
      <h2 class="titre titre--moyen" data-perche="g">Une compagnie de lecture</h2>
      <p class="lecture">Créée en 2007 par Élise Truchard et Ale, la Compagnie Petite Nature se consacre aujourd’hui aux projets littéraires portés par Élise Truchard : lectures à voix haute et labos littéraires.</p>
      <p class="lecture">Elle envisage la lecture à voix haute comme un travail artistique à part entière : choisir et assembler les textes, construire une dramaturgie, travailler le rythme, la voix, l’adresse et les conditions d’écoute.</p>
      <p><a class="lien-fleche" href="${R}compagnie.html">Découvrir la compagnie</a></p>
    </div>
  </div>
  <div style="margin-top:clamp(3rem,6vw,5rem)">
    <p class="wrap meta" style="margin-bottom:0.8rem">Ils ont accompagné les projets <span class="a-completer">logos à fournir</span></p>
    <div class="partenaires" aria-label="Partenaires cités sur le site"><div class="partenaires__piste">${[...PN.partenaires, ...PN.partenaires].map((p, i) => `<span${i >= PN.partenaires.length ? ' aria-hidden="true"' : ''}>${esc(p)}</span>`).join('')}</div></div>
  </div>
</section>

${appelProgrammer()}
`
  });
}

/* ================================================================= LA COMPAGNIE */
function compagnie() {
  const gestes = [
    ['Choisir et assembler les textes', () => image('labos/parole-dhomme-livres', { cls: '', sizes: '360px' }), '(Des livres, une carte, des pages à relier.)'],
    ['Construire une dramaturgie', () => visuel('scene', 'compagnie-hero', { alt: 'Visuel provisoire : une scène vide, une chaise et un pupitre' }), '(Un début, un milieu, une fin, pour des textes qui n’étaient pas faits pour se suivre.)'],
    ['Travailler le rythme', () => visuel('metronome', 'compagnie-geste-rythme', { alt: 'Visuel provisoire : un métronome' }), '(Les silences comptent autant que les mots.)'],
    ['La voix', () => image('lectures/au-bord-de-leau-barque', { sizes: '360px' }), '(Une voix, à ciel ouvert.)'],
    ['L’adresse', () => image('lectures/au-musee', { sizes: '360px' }), '(À qui parle-t-on ? À une œuvre, à une salle, à une personne.)'],
    ['Les conditions d’écoute', () => image('lectures/au-supermarche', { sizes: '360px' }), '(Assis entre les rayons, on écoute autrement.)']
  ];
  return page({
    fichier: 'compagnie.html', actif: 'compagnie',
    titre: 'La compagnie, Petite Nature',
    description: 'Créée en 2007 par Élise Truchard et Ale, la Compagnie Petite Nature se consacre aux lectures à voix haute et aux labos littéraires.',
    corps: () => `
<section class="ouverture" data-fil="g" data-fil-y="0.3">
  <div class="wrap ouverture__titre tapuscrit">
    <p class="marge dida">(Une scène vide. Une chaise, un pupitre, une lampe.)</p>
    <div class="large">${neon('La compagnie', { tag: 'h1', cls: 'neon--moyen', perche: 'd' })}</div>
  </div>
  <div class="ouverture__image">${visuel('scene', 'compagnie-hero', { cls: 'parallaxe', style: 'height:100%', mobile: 'compagnie-hero-mobile', alt: 'Visuel provisoire : une scène vide éclairée par un faisceau' })}</div>
</section>

<section class="section" data-fil="d" data-fil-y="0.2">
  <div class="wrap tapuscrit">
    <div class="marge" style="display:grid;gap:1rem;align-content:start">
      ${visuel('lampe', '', { cls: 'ratio-45', alt: 'Visuel provisoire : des feuillets sous une lampe' })}
      <p class="dida dida--petite">(Portrait d’Élise Truchard ${ac('à fournir')})</p>
    </div>
    <div class="corps">
      <h2 class="titre titre--moyen" data-perche="g">Élise Truchard</h2>
      <p class="meta">Artiste associée. Comédienne, metteuse en scène et lectrice.</p>
      <p class="lecture">Formée au théâtre et à la mise en scène à Paris VIII et Paris X, Élise Truchard travaille comme comédienne avant de devenir assistante à la mise en scène de Julie Brochen. Son parcours la conduit à travailler auprès de Valère Novarina, Joël Jouanneau, Claude Buchvald ou Gabriel Garran.</p>
      <p class="lecture">Depuis une dizaine d’années, la littérature et la lecture à voix haute occupent une place centrale dans son travail. Pendant sept ans, elle participe aux Mille lectures d’hiver, dispositif porté par Ciclic Centre-Val de Loire, et développe de nombreux projets avec des bibliothèques, des établissements scolaires et des lieux culturels, patrimoniaux, sociaux ou de soin.</p>
      <p class="citation dit" style="margin-top:2rem">La lecture à voix haute est un travail artistique à part entière.</p>
    </div>
  </div>
</section>

<section class="gestes" data-horizontal data-fil="g" data-fil-y="0.5">
  <div class="gestes__piste wrap" data-piste>
    <div class="gestes__intro" style="display:grid;gap:1rem;align-content:center">
      <h2 class="titre titre--moyen" data-perche="g">La démarche</h2>
      <p class="lecture">Choisir et assembler les textes, construire une dramaturgie, travailler le rythme, la voix, l’adresse et les conditions d’écoute, pour faire entendre une écriture.</p>
    </div>
    ${gestes.map(([t, v, d]) => `<article class="geste">${v()}<h3>${t}</h3><p class="dida dida--petite">${d}</p></article>`).join('')}
  </div>
</section>

<section class="section" data-fil="d" data-fil-y="0.1">
  <div class="wrap tapuscrit">
    <p class="marge dida">(La compagnie en quatre dates.)</p>
    <div class="corps">
      <h2 class="titre titre--moyen" data-perche="g" style="margin-bottom:2.5rem">Origines</h2>
      <ol class="frise">
        <li><span class="annee-frise">2007</span><p>Élise Truchard et Ale créent la Compagnie Petite Nature. Le travail se fait à la croisée de l’art et de la science : <i>Vite, plus vite que la lumière</i>, <i>Le Temps du monde fini</i>, <i>Les Molécules désaccordées</i>, <i>La Théorie du nuage</i>, écrits et mis en scène à deux, avec Élise comme interprète.</p></li>
        <li><span class="annee-frise">2016</span><p>Les recherches prennent des formes différentes. Élise Truchard adapte et met en scène <a href="${R}creations-sceniques.html"><i>Faire un feu</i>, d’après Jack London</a>. Ale développe des projets d’art numérique : <i>Haïkus numériques</i>, <i>Bienvenue à la maison</i>.</p></li>
        <li><span class="annee-frise">Depuis une dizaine d’années</span><p>La lecture à voix haute devient centrale : sept ans aux Mille lectures d’hiver de Ciclic, et des projets avec des bibliothèques, des écoles, des lieux de soin et de patrimoine.</p></li>
        <li><span class="annee-frise">2026</span><p>Ale poursuit son travail au sein de la Compagnie Haïkus Numériques (<a href="https://haikusnumeriques.fr" target="_blank" rel="noopener">haikusnumeriques.fr</a>). La Compagnie Petite Nature se consacre aux projets littéraires portés par Élise Truchard : lectures à voix haute et labos littéraires.</p></li>
      </ol>
    </div>
  </div>
</section>

<section class="section section--serree" data-fil="g" data-fil-y="0.3">
  <div class="wrap cote-a-cote">
    ${image('lectures/paysans-paysages-plein-air', { cls: 'ratio-43 insole', sizes: '(min-width: 900px) 50vw, 100vw' })}
    <div class="corps">
      <h2 class="titre titre--moyen" data-perche="g">Deux pôles de travail</h2>
      <p class="lecture">Des <a href="${R}lectures.html">lectures à voix haute</a>, en tournée, en immersion ou sur mesure, et des <a href="${R}labos.html">labos littéraires</a>, où la littérature devient une expérience collective avec les participants.</p>
      <div class="actions"><a class="btn" href="${R}lectures.html">Les lectures</a><a class="btn btn--trait" href="${R}labos.html">Les labos</a></div>
    </div>
  </div>
</section>

${appelProgrammer()}
`
  });
}

/* ================================================================= LECTURES */
function lectures() {
  const n = (c) => PN.lectures.filter((l) => l.cat === c).length;
  return page({
    fichier: 'lectures.html', actif: 'lectures',
    titre: 'Lectures à voix haute, Petite Nature',
    description: 'Lectures en tournée, en immersion ou sur mesure : la Compagnie Petite Nature fait entendre des œuvres issues de toutes les littératures.',
    corps: () => `
<section class="ouverture" data-fil="g" data-fil-y="0.3">
  <div class="wrap">
    <div class="ouverture__titre tapuscrit">
      <p class="marge dida">(D’une lecture en classe à un parcours dans un musée, d’un cycle littéraire à une lecture en pleine nature.)</p>
      <div class="large" style="display:grid;gap:1.2rem">${neon('Lectures', { tag: 'h1', perche: 'd' })}<p class="chapeau">Un texte, une voix, un temps pour écouter. Les formes changent selon les textes, les lieux et les projets.</p></div>
    </div>
    <div class="collage" aria-label="Lectures en situation">
      ${image('lectures/au-supermarche', { cls: 'insole parallaxe', sizes: '(min-width: 960px) 55vw, 60vw', eager: true })}
      ${image('lectures/au-musee', { cls: 'insole parallaxe', sizes: '40vw' })}
      ${image('lectures/au-bord-de-leau-barque', { cls: 'visuel--cadre', sizes: '30vw' })}
    </div>
  </div>
</section>

<section class="section" data-catalogue data-fil="d" data-fil-y="0.05">
  <div class="wrap">
    <div class="tapuscrit">
      <p class="marge dida">(Choisissez une forme. Les cartes se rangent.)</p>
      <div class="corps">
        <h2 class="titre titre--moyen" data-perche="g">Le répertoire</h2>
        <div class="filtres" role="group" aria-label="Filtrer les lectures" style="margin-top:1.5rem">
          <button class="filtre" type="button" data-filtre="toutes" aria-pressed="true">Toutes <span class="n">13</span></button>
          ${Object.entries(PN.categories).map(([k, c]) => `<button class="filtre cat-${k}" type="button" data-filtre="${k}" aria-pressed="false"><span class="filtre__pastille"></span>${c.nom} <span class="n">${n(k)}</span></button>`).join('')}
        </div>
        <p class="filtres__texte dida" aria-live="polite">Les 13 lectures du répertoire.</p>
      </div>
    </div>
    <div class="cartes">
      ${PN.lectures.map((l) => `<a class="carte-lecture cat-${l.cat}" href="${R}lectures/${l.slug}.html" data-cat="${l.cat}" data-tilt data-curseur="Lire">
        ${image(l.img, { sizes: '(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 100vw' })}
        <span class="carte-lecture__tube"></span>
        <span class="carte-lecture__in"><span class="etiquette">${PN.categories[l.cat].nom}</span><h3>${esc(l.titre)}</h3><p>${esc(l.accroche)}</p></span>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="section nuit" data-fil="g" data-fil-y="0.3">
  <div class="wrap">
    <div class="tapuscrit"><p class="marge dida">(Trois manières de faire.)</p><h2 class="corps titre titre--moyen" data-perche="g">En tournée, en immersion, sur mesure</h2></div>
    <div class="projets" style="margin-top:2.5rem">
      ${[['en-tournee', 'neon--soleil', 'lectures/paysans-paysages-plein-air'], ['en-immersion', 'neon--bleu', 'lectures/observer-le-vivant-cyanotype'], ['sur-mesure', '', 'lectures/dans-une-gare']].map(([k, c, im]) => `<div class="projet-carte">${image(im, { sizes: '(min-width: 960px) 30vw, 100vw' })}${neon(PN.categories[k].nom, { tag: 'h3', cls: 'neon--petit neon--nuit ' + c })}<p style="color:#d6cabb">${PN.categories[k].texte}</p><a class="lien-fleche" href="#${k}" data-filtre-lien="${k}" style="justify-self:start">Voir ces lectures</a></div>`).join('')}
    </div>
  </div>
</section>

${appelProgrammer('Programmer une lecture')}
`
  });
}

function ficheLecture(l, i) {
  const cat = PN.categories[l.cat];
  const prev = PN.lectures[(i - 1 + PN.lectures.length) % PN.lectures.length];
  const next = PN.lectures[(i + 1) % PN.lectures.length];
  const m = IMG[l.img];
  const paysage = m.w > m.h;
  return page({
    fichier: `lectures/${l.slug}.html`, actif: 'lectures',
    titre: `${l.titre}, Petite Nature`,
    description: `${l.titre} : ${l.accroche} Une lecture à voix haute de la Compagnie Petite Nature.`,
    corps: () => `
<section class="ouverture" data-fil="g" data-fil-y="0.2">
  <div class="wrap">
    <nav class="fil-ariane" aria-label="Fil d’Ariane"><a href="${R}lectures.html">Lectures</a><span aria-hidden="true">/</span><a href="${R}lectures.html#${l.cat}">${cat.nom}</a></nav>
    <div class="fiche" style="margin-top:1.5rem">
      <div class="fiche__visuel${paysage ? ' paysage' : ''}">${image(l.img, { cls: 'insole', eager: true, sizes: '(min-width: 960px) 55vw, 100vw' })}<p class="legende">${esc(l.didascalie)}</p></div>
      <div class="corps cat-${l.cat}">
        <span class="etiquette">${cat.nom}</span>
        <h1 class="titre" data-perche="d">${esc(l.titre)}</h1>
        <p class="chapeau">${esc(l.accroche)}</p>
        <dl class="infos">
          <dt>Format</dt><dd>${cat.nom}. ${cat.texte}</dd>
          <dt>Public</dt><dd>${ac()}</dd>
          <dt>Durée</dt><dd>${ac()}</dd>
          <dt>Jauge</dt><dd>${ac()}</dd>
          <dt>Espace et technique</dt><dd>${ac()}</dd>
          <dt>Tarif</dt><dd>${ac()}</dd>
        </dl>
        <div class="actions"><a class="btn btn--neon" href="${R}programmer.html#${l.slug}">Programmer cette lecture</a><a class="btn btn--trait" href="${R}agenda.html">Voir l’agenda</a></div>
      </div>
    </div>
  </div>
</section>

<section class="section" data-fil="d" data-fil-y="0.2">
  <div class="wrap tapuscrit">
    <p class="marge dida">(Ce que dit le site actuel. Le reste viendra de la compagnie.)</p>
    <div class="corps">
      <h2 class="titre titre--petit" data-perche="g">À propos de cette lecture</h2>
      ${l.faits.length ? `<ul class="faits">${l.faits.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : `<p>Description détaillée ${ac()} : textes lus, auteurs, déroulé.</p>`}
      ${l.img2 ? image(l.img2, { naturel: true, cls: 'visuel--cadre', sizes: '(min-width: 960px) 50vw, 100vw' }) : ''}
      <div class="extrait">
        <button class="extrait__btn" type="button" disabled aria-label="Extrait sonore à fournir"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z"/></svg></button>
        <div><canvas aria-hidden="true"></canvas><p class="meta">Extrait sonore ${ac('à fournir')} : il se lancera au clic.</p></div>
      </div>
      <h3 class="titre--petit" style="margin-top:2.5rem">Dates</h3>
      <ul class="dates-liees" data-dates-lecture="${l.slug}"><li>Chargement des dates…</li></ul>
    </div>
  </div>
  <div class="wrap" style="margin-top:var(--pas)">
    <nav class="voisines" aria-label="Autres lectures">
      <a href="${R}lectures/${prev.slug}.html"><span class="meta">Lecture précédente</span><span>${esc(prev.titre)}</span></a>
      <a href="${R}lectures/${next.slug}.html"><span class="meta">Lecture suivante</span><span>${esc(next.titre)}</span></a>
    </nav>
  </div>
</section>

${appelProgrammer(`Programmer « ${esc(l.titre)} »`)}
`
  });
}

/* ================================================================= LABOS */
const LABOS = {
  dire: {
    fichier: 'dire-ensemble.html', mot: 'Dire', titre: 'Dire ensemble', grok: 'labos-dire',
    intro: 'Ces projets explorent la lecture à voix haute comme une expérience collective de la littérature.',
    img: 'labos/poesies-amoureuses-repetitions',
    projets: [
      { id: 'poesies-amoureuses', titre: 'Poésies amoureuses', ou: 'Lycée Bréquigny, Rennes', resti: 'Restitution publique', img: 'labos/poesies-amoureuses-restitution-orchestre' },
      { id: 'faire-un-feu', titre: 'Faire un feu, au chœur des mots', ou: '9 classes de collège, Dun-sur-Auron', resti: 'Spectacle déambulatoire en plein air', scene: 'foret-neige' },
      { id: 'parole-dhomme', titre: 'Parole d’homme', ou: 'Centre de détention de Châteaudun', resti: 'Restitution et capsule sonore', img: 'labos/parole-dhomme-livres' }
    ]
  },
  ecrire: {
    fichier: 'ecrire-ensemble.html', mot: 'Écrire', titre: 'Écrire ensemble', grok: 'labos-ecrire',
    intro: 'Ces projets explorent l’écriture comme espace d’invention, de partage et de création collective.',
    img: 'labos/paysage-a-soi-poeme-fenetre',
    projets: [
      { id: 'alizoa', titre: 'À travers les feuilles, enquête poétique avec George Sand', ou: 'Projet intergénérationnel, Gallardon', resti: 'Création d’un livret illustré', img: 'labos/legende-alizoa-couverture' },
      { id: 'jeunes-pousses', titre: 'Jeunes pousses & vieilles trognes', ou: 'Projet intergénérationnel, Abbaye de Noirlac', resti: 'Création d’un roman-photo', img: 'labos/jeunes-pousses-roman-photo' },
      { id: 'paysage-a-soi', titre: 'Un paysage à soi', ou: '4 classes de 6e, Bourges', resti: 'Installations poétiques exposées dans le collège', img: 'labos/paysage-a-soi-bocal-lumineux' }
    ]
  },
  imaginer: {
    fichier: 'imaginer-ensemble.html', mot: 'Imaginer', titre: 'Imaginer ensemble', grok: 'labos-imaginer',
    intro: 'Ces projets explorent l’imaginaire collectif à travers des expériences sensibles autour de la littérature.',
    img: 'labos/paysans-paysages-sauvage-vegetaux',
    projets: [
      { id: 'sauvage', titre: 'Paysans Paysages « sauvage »', ou: 'Résidents d’EHPAD et hôpital de jour', resti: 'Restitution', img: 'labos/paysans-paysages-sauvage-vegetaux' },
      { id: 'territoires', titre: 'Territoires, portraits sensibles', ou: 'Foyer de vie, Courville-sur-Eure', resti: 'Capsule sonore à écouter', scene: 'onde' },
      { id: 'le-repas', titre: 'Le Repas, de Valère Novarina', ou: 'CAP cuisine et hôpital, Abbaye de Noirlac', resti: 'Spectacle', scene: 'repas' }
    ]
  }
};

function labos() {
  const mots = ['La', 'littérature', 'est', 'à', 'tout', 'le', 'monde'];
  const hors = [['Dire', 1], ['Écrire', 1], ['Imaginer', 1], ['écoles'], ['hôpitaux'], ['EHPAD'], ['foyers de vie'], ['prisons'], ['lieux de patrimoine']];
  return page({
    fichier: 'labos.html', actif: 'labos',
    titre: 'Labos littéraires, Petite Nature',
    description: 'La Compagnie Petite Nature développe des projets où la littérature devient une expérience collective, à travers l’écriture, la lecture à voix haute et la création partagée.',
    corps: () => `
<section class="ouverture" data-fil="g" data-fil-y="0.2">
  <div class="wrap ouverture__titre tapuscrit">
    <p class="marge dida">(Une table de travail. Des végétaux, des mots. Attrapez-en un.)</p>
    <div class="large" style="display:grid;gap:1rem">${neon('Labos', { tag: 'h1', perche: 'd' })}<p class="chapeau">La compagnie conçoit des projets où la littérature devient une expérience collective.</p></div>
  </div>
  <div class="aimants" data-aimants style="margin-top:clamp(2rem,4vw,3rem)">
    ${image('lectures/atelier-paysans-paysages-cueillette', { eager: true, sizes: '100vw', alt: '' })}
    <div class="aimants__voile"></div>
    <div class="aimants__mots" aria-label="La littérature est à tout le monde">
      ${mots.map((m) => `<button type="button" class="aimant">${m}</button>`).join('')}
      ${hors.map(([m, n]) => `<button type="button" class="aimant${n ? ' aimant--neon' : ''}" data-hors>${m}</button>`).join('')}
    </div>
    <div class="aimants__aide"><button class="btn btn--trait" type="button" data-aimants-phrase style="color:#efe7da;border-color:#efe7da">Remettre la phrase</button></div>
  </div>
</section>

<section class="section" data-fil="d" data-fil-y="0.2">
  <div class="wrap tapuscrit">
    <p class="marge dida">(Là où la littérature ne va pas toujours.)</p>
    <div class="corps">
      <p class="lecture">Menées dans des établissements scolaires, des hôpitaux, des EHPAD, des foyers de vie, des prisons ou des lieux de patrimoine, ces propositions donnent lieu à des créations réalisées avec les participants.</p>
      <div class="lieux-ruban"><span>établissements scolaires</span><span>hôpitaux</span><span>EHPAD</span><span>foyers de vie</span><span>prisons</span><span>lieux de patrimoine</span></div>
    </div>
  </div>
</section>

${Object.values(LABOS).map((L, k) => `
<section class="section${k === 1 ? ' nuit' : ''}" data-fil="${k % 2 ? 'd' : 'g'}" data-fil-y="0.1">
  <div class="wrap chapitre">
    <div class="chapitre__entete">
      <div style="display:grid;gap:1rem">${neon(L.mot, { cls: k === 1 ? 'neon--nuit' : '', perche: 'd' })}<p class="chapeau">${L.intro}</p></div>
      ${image(L.img, { cls: 'ratio-43 insole parallaxe', sizes: '(min-width: 960px) 40vw, 100vw' })}
    </div>
    <div class="projets">
      ${L.projets.map((p) => `<a class="projet-carte" href="${R}${L.fichier}#${p.id}" data-tilt data-curseur="Voir">${p.img ? image(p.img, { sizes: '(min-width: 960px) 30vw, 100vw' }) : visuel(p.scene, '', { alt: 'Visuel animé du projet' })}<h3>${esc(p.titre)}</h3><p${k === 1 ? ' style="color:#d6cabb"' : ''}>${esc(p.ou)}</p><span class="restitution">${esc(p.resti)}</span></a>`).join('')}
    </div>
    <p><a class="lien-fleche" href="${R}${L.fichier}">Tous les projets « ${L.titre} »</a></p>
  </div>
</section>`).join('')}

${appelProgrammer('Imaginer un labo avec la compagnie')}
`
  });
}

function pageLabo(cle) {
  const L = LABOS[cle];
  const autres = Object.entries(LABOS).filter(([k]) => k !== cle).map(([, v]) => v);
  const sections = {
    dire: () => `
<article class="projet wrap" id="poesies-amoureuses" data-fil="d" data-fil-y="0.1">
  <div class="galerie">
    ${image('labos/poesies-amoureuses-restitution-orchestre', { cls: 'insole', sizes: '(min-width: 960px) 30vw, 66vw' })}
    ${image('labos/poesies-amoureuses-lecture-eleves', { sizes: '20vw' })}
    ${image('labos/poesies-amoureuses-repetitions', { sizes: '20vw' })}
  </div>
  <div class="projet__texte">
    <h2 data-perche="g">Poésies amoureuses</h2>
    <p class="meta">Lycée Bréquigny, Rennes · avec l’Orchestre National de Bretagne</p>
    <p>Projet mené avec deux classes de seconde du lycée Bréquigny, à Rennes. Accompagnés par Élise Truchard, le musicien Soroush Kamalian et le violoniste David Chivers, les élèves ont exploré la lecture à voix haute de poèmes amoureux venus de différentes époques et traditions littéraires, de Louise Labé à Farîd-Ud-Dîn ‘Attar.</p>
    <p class="restitution">Lecture musicale publique, mise en musique par Soroush Kamalian</p>
    <div class="liens-externes"><span class="tag-provisoire">Vidéo : lien Vimeo ${ac('à corriger')}</span></div>
  </div>
</article>

<article class="projet wrap projet--inverse" id="faire-un-feu" data-fil="g" data-fil-y="0.1">
  <div class="choeur" data-choeur aria-label="Le chœur : plusieurs voix lisent le début de Faire un feu, en canon">
    <p class="choeur__voix" style="left:5%;top:10%">Le jour s’était levé froid et gris, extrêmement froid et gris,</p>
    <p class="choeur__voix" style="left:42%;top:30%">quand l’homme quitta la grande piste du Yukon</p>
    <p class="choeur__voix" style="left:12%;top:52%">et gravit la haute berge de terre,</p>
    <p class="choeur__voix" style="left:46%;top:62%">là où un sentier à peine visible s’enfonçait vers l’est dans la forêt d’épicéas.</p>
    <p class="choeur__source dida dida--petite">(D’après Jack London, <i>To Build a Fire</i>, 1908. Traduction de travail : ${ac('remplacer par la traduction lue')})</p>
  </div>
  <div class="projet__texte">
    <h2 data-perche="g">Faire un feu, au chœur des mots</h2>
    <p class="meta">TREAC avec 9 classes du collège Le Colombier, Dun-sur-Auron</p>
    <p>Au fil de l’année, les élèves ont travaillé la lecture à voix haute collective, le rythme et l’oralité aux côtés d’Élise Truchard et de son équipe artistique.</p>
    <p>Le projet a donné lieu à un spectacle déambulatoire présenté dans l’espace naturel sensible du domaine de la Périsse, à Dun-sur-Auron, où le public découvrait le texte de Jack London à travers différents groupes de lecteurs disséminés dans le paysage.</p>
    <p class="restitution">Spectacle déambulatoire en plein air</p>
    <p class="soutiens">Avec le soutien de la Fol 18, du programme européen FEADER, de la Région Centre-Val de Loire, de la DRAC Centre et de la Fondation SNCF.</p>
    <p class="dida dida--petite">(Photos du spectacle déambulatoire ${ac('à fournir')})</p>
  </div>
</article>

<article class="projet wrap" id="parole-dhomme" data-fil="d" data-fil-y="0.1">
  <div style="display:grid;gap:1rem;align-content:start">${image('labos/parole-dhomme-livres', { cls: 'insole', naturel: true, sizes: '(min-width: 960px) 40vw, 100vw' })}<p class="legende">(Mille douzaine d’œufs, une nouvelle du recueil Parole d’homme.)</p></div>
  <div class="projet__texte">
    <h2 data-perche="g">Parole d’homme, Jack London</h2>
    <p class="meta">Centre de détention de Châteaudun (28), avec la DRAC Centre</p>
    <p>À partir de la nouvelle <i>Mille douzaine d’œufs</i>, tirée du recueil <i>Parole d’homme</i>, ce projet proposait un atelier de lecture à voix haute mêlant travail vocal, écoute et création sonore collective.</p>
    <p>Les participants ont exploré le texte à travers la mise en voix, le rythme et l’évocation sonore des mots, avant de présenter une restitution devant les autres détenus du centre de détention.</p>
    <p class="restitution">Restitution et enregistrement d’une capsule sonore</p>
    <p class="mise-en-garde">L’enregistrement de la restitution attend l’autorisation de l’administration pénitentiaire : il n’est pas publié.</p>
    <p class="soutiens">Au même endroit, en juin 2026 : <b>Les Passages Invisibles</b>, un laboratoire littéraire mêlant écriture, lecture à voix haute et imaginaire à partir de l’œuvre de George Sand.</p>
  </div>
</article>`,
    ecrire: () => `
<article class="projet wrap" id="alizoa" data-fil="d" data-fil-y="0.1">
  <div style="display:grid;gap:1rem;align-content:start">${image('labos/legende-alizoa-couverture', { cls: 'insole visuel--cadre', naturel: true, sizes: '(min-width: 960px) 35vw, 100vw' })}</div>
  <div class="projet__texte">
    <h2 data-perche="g">À travers les feuilles, enquête poétique autour de George Sand</h2>
    <p class="meta">Gallardon · dispositif Culture à partager ! (Région Centre-Val de Loire)</p>
    <p>Projet intergénérationnel mené avec trois groupes de 6e du collège Val de Voise, les résidents de l’EHPAD Les Coteaux Saint-Mathieu et la bibliothèque municipale.</p>
    <p>À partir de l’univers de George Sand, les participants ont imaginé collectivement un récit légendaire, <i>La légende d’Alizoa</i>, accompagné de cyanotypes réalisés avec la plasticienne Delphine Vaute.</p>
    <p class="restitution">Un livret illustré et plusieurs lectures publiques</p>
    <div class="liens-externes"><a class="btn btn--trait" href="https://www.calameo.com/read/0082199423775ddb1a12b" target="_blank" rel="noopener">Feuilleter le livret</a></div>
    <ul class="dates-liees" data-dates-labo="ecrire-ensemble"></ul>
  </div>
</article>

<article class="projet wrap projet--inverse" id="jeunes-pousses" data-fil="g" data-fil-y="0.1">
  <div style="display:grid;gap:1rem;align-content:start">${image('labos/jeunes-pousses-roman-photo', { cls: 'insole visuel--cadre', naturel: true, sizes: '(min-width: 960px) 35vw, 100vw' })}</div>
  <div class="projet__texte">
    <h2 data-perche="g">Jeunes pousses & vieilles trognes</h2>
    <p class="meta">Abbaye de Noirlac · Les Futurs de l’Écrit</p>
    <p>Projet intergénérationnel mené avec les jeunes du Club Nature du CPIE Brenne-Berry et les anciens de l’ASEF 18.</p>
    <p>À partir de souvenirs, d’émotions et d’anecdotes liés au bocage de Noirlac, les participants ont exploré différents genres littéraires pour imaginer des récits inspirés du polar, du fantastique, du conte et du récit d’horreur.</p>
    <p class="restitution">Un roman-photo édité, présenté à Noirlac au festival Échos des Futurs et aux Rendez-vous aux jardins</p>
    <div class="liens-externes"><a class="btn btn--trait" href="https://www.calameo.com/read/008219942180970790027" target="_blank" rel="noopener">Feuilleter le roman-photo</a></div>
  </div>
</article>

<article class="projet wrap" id="paysage-a-soi" data-fil="d" data-fil-y="0.1">
  <div class="galerie">
    ${image('labos/paysage-a-soi-bocaux-au-sol', { cls: 'insole', sizes: '(min-width: 960px) 30vw, 66vw' })}
    ${image('labos/paysage-a-soi-poeme-liberte', { sizes: '20vw' })}
    ${image('labos/paysage-a-soi-installation-suspendue', { sizes: '20vw' })}
    ${image('labos/paysage-a-soi-cadre-bois', { sizes: '20vw' })}
    ${image('labos/paysage-a-soi-poemes-calque', { sizes: '20vw' })}
    ${image('labos/paysage-a-soi-poeme-fenetre', { sizes: '20vw' })}
  </div>
  <div class="projet__texte">
    <h2 data-perche="g">Un paysage à soi</h2>
    <p class="meta">Collège Le Grand Meaulnes, Bourges · Cité éducative · Ligue de l’enseignement du Cher</p>
    <div class="chiffre-cle"><b data-compte="80">80</b><span>élèves de 6e, dans quatre classes</span></div>
    <p>Le projet commence en octobre à Nohant : les élèves découvrent la maison de George Sand, écoutent une lecture de <i>La Petite Fadette</i> et se promènent dans le parc. Au fil de l’année, ils suivent cinq séances d’atelier d’écriture avec Élise Truchard et trois séances d’art buissonnier avec la plasticienne Clotilde Gaillard, entrecoupées d’une balade sensorielle dans les marais de Bourges.</p>
    <p>Chaque élève a façonné son paysage intérieur, un paysage à soi : des textes, des poèmes et de petites compositions plastiques autour de paysages réels, familiers ou imaginaires.</p>
    <p class="restitution">Une installation poétique disséminée dans tout le collège</p>
  </div>
</article>`,
    imaginer: () => `
<article class="projet wrap" id="sauvage" data-fil="d" data-fil-y="0.1">
  <div class="galerie galerie--deux">
    ${image('labos/paysans-paysages-sauvage-vegetaux', { cls: 'insole', sizes: '(min-width: 960px) 25vw, 50vw' })}
    ${image('labos/paysans-paysages-sauvage-presse-1', { sizes: '(min-width: 960px) 25vw, 50vw', contenu: true })}
  </div>
  <div class="projet__texte">
    <h2 data-perche="g">Paysans Paysages « sauvage »</h2>
    <p class="meta">Avec la Maison de George Sand, l’Abbaye de Noirlac et le CPIE Brenne-Berry</p>
    <p>Ce laboratoire, mené avec des résidents d’EHPAD et des patients d’hôpital de jour, a prolongé le projet Paysans Paysages dans une forme sensorielle et collective.</p>
    <p>Autour de lectures à voix haute d’extraits de <i>La Petite Fadette</i> et de <i>François le Champi</i> de George Sand, Élise Truchard, Clotilde Gaillard et Jean-Christophe Désert ont mêlé paysages sonores, matières végétales et créations plastiques pour imaginer une expérience immersive autour de la littérature, de l’écoute et du vivant.</p>
    <p class="soutiens">Dans la presse : « L’ambiance d’un roman de George Sand au Champ-Nadot », article publié le 23 octobre 2021 (titre du journal ${ac()}).</p>
  </div>
</article>

<article class="projet wrap projet--inverse" id="territoires" data-fil="g" data-fil-y="0.1">
  <div style="display:grid;gap:1rem;align-content:start">
    ${visuel('onde', '', { cls: 'ratio-43', alt: 'Visuel animé : cinq lignes de voix' })}
    <div class="extrait"><button class="extrait__btn" type="button" disabled aria-label="Capsule sonore à fournir"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z"/></svg></button><div><canvas aria-hidden="true"></canvas><p class="meta">Cinq portraits sensibles, 9 min 55. Fichier MP3 ${ac('à fournir')}</p></div></div>
  </div>
  <div class="projet__texte">
    <h2 data-perche="g">Territoires, portraits sensibles</h2>
    <p class="meta">Foyer de vie Gérard Vivien, Courville-sur-Eure · avec le Conseil départemental d’Eure-et-Loir et la DRAC Centre-Val de Loire</p>
    <p>Élise Truchard est allée à la rencontre des résidents du foyer de vie pour échanger avec eux autour de leurs goûts, de leurs souvenirs et de leur rapport sensible au monde.</p>
    <p>À partir de ces paroles enregistrées, elle a imaginé une création sonore intime mêlant voix, silences et paysages sonores : une forme construite à partir du quotidien, des sensations et de ce qui nous relie aux lieux, aux émotions et aux souvenirs.</p>
    <div class="liens-externes"><a class="btn btn--trait" href="https://vimeo.com/410585597" target="_blank" rel="noopener">Voir la vidéo sur Vimeo</a></div>
  </div>
</article>

<article class="projet wrap" id="le-repas" data-fil="d" data-fil-y="0.1">
  <div>${visuel('repas', '', { cls: 'ratio-43', alt: 'Visuel provisoire : une table dressée vue de dessus' })}<p class="legende">(Photos de la restitution ${ac('à fournir')})</p></div>
  <div class="projet__texte">
    <h2 data-perche="g">Le Repas, de Valère Novarina</h2>
    <p class="meta">Abbaye de Noirlac · festival Les Futurs de l’Écrit</p>
    <p>Projet mené avec des élèves de CAP cuisine de Saint-Amand-Montrond et les patients de l’accueil thérapeutique de jour de l’hôpital George Sand.</p>
    <p>À partir de la langue singulière de Valère Novarina, les participants ont exploré la lecture à voix haute et la puissance de la parole adressée à l’autre.</p>
    <p class="restitution">Restitution publique de plusieurs extraits à l’Abbaye de Noirlac</p>
  </div>
</article>`
  };
  return page({
    fichier: L.fichier, actif: 'labos',
    titre: `${L.titre}, Petite Nature`,
    description: `${L.titre} : ${L.intro}`,
    corps: () => `
<section class="ouverture" data-fil="g" data-fil-y="0.3">
  <div class="wrap">
    <nav class="fil-ariane" aria-label="Fil d’Ariane"><a href="${R}labos.html">Labos</a><span aria-hidden="true">/</span><span>${L.titre}</span></nav>
    <div class="ouverture__titre tapuscrit" style="margin-top:1rem">
      <p class="marge dida">(${L.intro})</p>
      <div class="large">${neon(L.mot, { tag: 'h1', perche: 'd' })}<p class="titre titre--petit" style="margin-top:0.5rem">ensemble</p></div>
    </div>
  </div>
</section>
${sections[cle]()}
<section class="section nuit" data-fil="g" data-fil-y="0.2">
  <div class="wrap" style="display:grid;gap:2rem">
    <h2 class="titre titre--moyen" data-perche="g">Les autres labos</h2>
    <div class="projets">${autres.map((a) => `<a class="projet-carte" href="${R}${a.fichier}" data-tilt>${image(a.img, { sizes: '(min-width: 960px) 40vw, 100vw' })}${neon(a.mot, { tag: 'h3', cls: 'neon--petit neon--nuit' })}<p style="color:#d6cabb">${a.intro}</p></a>`).join('')}</div>
  </div>
</section>
${appelProgrammer('Imaginer un labo avec la compagnie')}
`
  });
}

/* ================================================================= CRÉATIONS */
function creations() {
  const pas = [];
  for (let i = 0; i < 22; i++) {
    const x = 40 + i * 44, yH = 40 + Math.sin(i * 0.5) * 8;
    if (i < 15) pas.push(`<ellipse class="pas-homme" data-o="${i * 2}" cx="${x}" cy="${yH + (i % 2 ? 10 : -10)}" rx="9" ry="4.5" transform="rotate(${-6 + (i % 2) * 12} ${x} ${yH})"/>`);
    const xc = 30 + i * 44, yc = 92 + Math.sin(i * 0.4 + 1) * 6 - (i > 15 ? (i - 15) * 7 : 0);
    [[0, 0], [7, 4], [14, -2], [21, 3]].forEach(([dx, dy], k) => pas.push(`<ellipse class="pas-chien" data-o="${i * 2 + 1 + k * 0.01}" cx="${xc + dx}" cy="${yc + dy}" rx="2.6" ry="2.2"/>`));
  }
  return page({
    fichier: 'creations-sceniques.html', actif: 'creations', classe: 'page-feu',
    titre: 'Faire un feu, Petite Nature',
    description: 'Faire un feu : adaptation et mise en scène d’Élise Truchard, d’après la nouvelle de Jack London. Théâtre d’ombre, arts plastiques, création visuelle et sonore en direct.',
    corps: () => `
<canvas class="neige" aria-hidden="true"></canvas>
<div class="flamme-lumiere" aria-hidden="true"></div>
<section class="ouverture nuit" style="background:transparent" data-fil="g" data-fil-y="0.3">
  <div class="wrap ouverture__titre tapuscrit">
    <p class="marge dida">(Le Grand Nord. Soixante-quinze degrés sous zéro. Un homme, un chien.)</p>
    <div class="large" style="display:grid;gap:1rem">${neon('Faire un feu', { tag: 'h1', cls: 'neon--nuit', perche: 'd' })}<p class="chapeau">Adaptation et mise en scène d’Élise Truchard, d’après la nouvelle de Jack London.</p></div>
  </div>
  <div class="ouverture__image">${visuel('foret-neige', 'creations-hero', { style: 'height:100%', cls: 'parallaxe', mobile: 'creations-hero-mobile', alt: 'Visuel provisoire : une piste dans une forêt enneigée, un homme et un chien au loin' })}</div>
</section>

<section class="section" style="position:relative;z-index:2" data-fil="d" data-fil-y="0.2">
  <div class="wrap tapuscrit">
    <p class="marge dida">(Approchez la flamme du texte pour le lire mieux.)</p>
    <div class="corps" style="display:grid;gap:1.6rem">
      <p class="lecture feu-texte chapeau">Avec <i>Faire un feu</i>, Élise Truchard adapte pour la scène la nouvelle de Jack London et construit le spectacle autour de la confrontation entre l’homme et son environnement.</p>
      <p class="lecture feu-texte">Le récit interroge la croyance de l’homme en sa capacité à maîtriser la nature. Malgré les signes qui l’entourent, le personnage poursuit sa route, tandis que le chien, guidé par son instinct, perçoit ce que l’homme refuse de voir.</p>
      <div class="traces" data-traces aria-hidden="true"><svg viewBox="0 0 1000 130" preserveAspectRatio="xMidYMid meet">${pas.join('')}</svg></div>
      <p class="lecture feu-texte">Cette tension traverse toute l’écriture du spectacle : théâtre d’ombre, arts plastiques, création visuelle et sonore en direct, transformation des corps et des présences.</p>
      <p class="citation feu-texte">Le chien apparaît d’abord comme une ombre avant de devenir vivant face aux spectateurs ; l’homme suit le mouvement inverse, du vivant vers la marionnette.</p>
    </div>
  </div>
</section>

<section class="section" style="position:relative;z-index:2" data-fil="g" data-fil-y="0.2">
  <div class="wrap cote-a-cote">
    ${visuel('feu-neige', 'creations-allumette', { cls: 'ratio-45', alt: 'Visuel provisoire : un feu dans la neige' })}
    <div class="corps">
      <h2 class="titre titre--moyen" data-perche="g">Le spectacle en pratique</h2>
      <dl class="infos" style="border-top-color:#efe7da">
        <dt>Distribution</dt><dd>${ac()}</dd>
        <dt>Durée</dt><dd>${ac()}</dd>
        <dt>Public</dt><dd>${ac()}</dd>
        <dt>Fiche technique</dt><dd>${ac()}</dd>
        <dt>Photos</dt><dd>${ac('à fournir')}</dd>
      </dl>
      <p>Le texte de Jack London a aussi été au cœur d’un labo avec neuf classes de collège : <a href="${R}dire-ensemble.html#faire-un-feu">Faire un feu, au chœur des mots</a>.</p>
      <div class="actions"><a class="btn btn--neon" href="${R}programmer.html#faire-un-feu">Accueillir le spectacle</a></div>
    </div>
  </div>
</section>
${appelProgrammer('Programmer la compagnie')}
`
  });
}

/* ================================================================= AGENDA */
function agenda() {
  const futurs = evts.filter((e) => finEvt(e) >= AUJOURDHUI);
  return page({
    fichier: 'agenda.html', actif: 'agenda',
    titre: 'Agenda, Petite Nature',
    description: 'Agenda de la Compagnie Petite Nature : les prochaines lectures à voix haute, rencontres et restitutions.',
    corps: () => `
<section class="ouverture" data-fil="g" data-fil-y="0.3">
  <div class="wrap ouverture__titre tapuscrit">
    <p class="marge dida">(Une route à l’aube. Des collèges, des médiathèques, des abbayes.)</p>
    <div class="large" style="display:grid;gap:1rem">${neon('Agenda', { tag: 'h1', perche: 'd' })}<p class="chapeau">Les lectures, labos et restitutions de la compagnie. Les dates passées restent visibles, classées par année.</p></div>
  </div>
  <div class="ouverture__image">${visuel('route', 'agenda-hero', { style: 'height:100%', cls: 'parallaxe', mobile: 'agenda-hero-mobile', alt: 'Visuel provisoire : une route de campagne bordée de peupliers à l’aube' })}</div>
</section>

<section class="section" data-fil="d" data-fil-y="0.1">
  <div class="wrap" style="display:grid;gap:2rem">
    <h2 class="titre titre--moyen" data-perche="g">La prochaine date</h2>
    ${blocProchaine('h3')}
  </div>
</section>

<section class="section section--serree" data-agenda data-fil="g" data-fil-y="0.05">
  <div class="wrap tapuscrit">
    <div class="marge" style="display:grid;gap:1rem;align-content:start">
      <p class="dida">(Filtrer par type de rendez-vous.)</p>
      <div class="filtres" role="group" aria-label="Filtrer l’agenda">
        ${[['tout', 'Tout'], ['Lecture', 'Lectures'], ['Atelier', 'Ateliers'], ['Labo', 'Labos'], ['Restitution', 'Restitutions']].map(([k, t], i) => `<button class="filtre" type="button" data-agenda-filtre="${k}" aria-pressed="${i ? 'false' : 'true'}">${t}</button>`).join('')}
      </div>
      <p class="note-maquette">Les dates viennent d’un seul fichier. Le tri entre à venir et passées se fait tout seul, chaque jour.</p>
    </div>
    <div class="large">
      <h2 class="titre titre--petit" data-perche="g">À venir</h2>
      <ul class="agenda-liste" data-agenda-futurs style="margin-top:1rem">${futurs.map((e) => `<li class="evt"><div class="evt__date"><b>${fCourt.format(debut(e))}</b>${debut(e).getFullYear()}</div><div><h3>${esc(e.titre)}</h3><p>${marque(e.lieu)} — ${marque(e.adresse)}</p></div></li>`).join('')}</ul>
      <h2 class="titre titre--petit" style="margin-top:4rem">Dates passées</h2>
      <ul class="agenda-liste" data-agenda-passes><li class="vide">Les dates passées s’affichent ici.</li></ul>
      <p class="note-maquette" style="margin-top:1.5rem">D’autres dates plus anciennes existent sur le site actuel (bouton « Charger plus ») : ${ac('à reprendre')}.</p>
    </div>
  </div>
</section>

<section class="section" data-fil="d" data-fil-y="0.1">
  <div class="wrap" style="display:grid;gap:2rem">
    <h2 class="titre titre--moyen" data-perche="g">Sur la carte</h2>
    ${carteFrance({ id: 'carte-agenda' })}
  </div>
</section>
${appelProgrammer()}
`
  });
}

/* ================================================================= PROGRAMMER */
function programmer() {
  const types = ['Médiathèque ou bibliothèque', 'Établissement scolaire', 'Musée ou lieu de patrimoine', 'Festival ou lieu culturel', 'EHPAD ou établissement de soin', 'Entreprise', 'Collectivité', 'Autre'];
  const publics = ['Petite enfance', 'Enfants', 'Adolescents', 'Adultes', 'Personnes âgées', 'Tous publics'];
  const choix = (name, items, type = 'radio') => `<div class="choix">${items.map((t, i) => { const [v, l] = Array.isArray(t) ? t : [t, t]; return `<label><input type="${type}" name="${name}" value="${esc(v)}" id="f-${name}-${i}">${esc(l)}</label>`; }).join('')}</div>`;
  const envies = [...PN.lectures.map((l) => [l.slug, l.titre]), ['labo-dire', 'Un labo : Dire ensemble'], ['labo-ecrire', 'Un labo : Écrire ensemble'], ['labo-imaginer', 'Un labo : Imaginer ensemble'], ['faire-un-feu', 'Le spectacle Faire un feu'], ['je-ne-sais-pas', 'Je ne sais pas encore']];
  return page({
    fichier: 'programmer.html', actif: '',
    titre: 'Programmer une lecture, Petite Nature',
    description: 'Programmer une lecture à voix haute, un labo littéraire ou le spectacle Faire un feu avec la Compagnie Petite Nature : une demande en quatre étapes.',
    corps: () => `
<section class="ouverture" data-fil="g" data-fil-y="0.3">
  <div class="wrap ouverture__titre tapuscrit">
    <p class="marge dida">(Une salle prête. Des chaises en rang, un pupitre, une lampe.)</p>
    <div class="large" style="display:grid;gap:1rem">${neon('Programmer', { tag: 'h1', cls: 'neon--moyen', perche: 'd' })}<p class="chapeau">Une lecture, un labo ou un spectacle : décrivez votre projet en quatre étapes. La compagnie s’en sert pour préparer une proposition adaptée à votre lieu et à votre public.</p></div>
  </div>
  <div class="ouverture__image" style="height:clamp(220px,34vw,420px)">${visuel('salle', 'programmer-hero', { style: 'height:100%', mobile: 'programmer-hero-mobile', alt: 'Visuel provisoire : une salle de bibliothèque préparée pour une lecture' })}</div>
</section>

<section class="section" data-fil="d" data-fil-y="0.05">
  <div class="wrap tapuscrit">
    <aside class="marge" style="display:grid;gap:1.5rem;align-content:start">
      <div style="display:grid;gap:0.5rem">
        <h2 class="titre--petit" style="font-size:var(--t-3)">Ou directement</h2>
        <p class="copie"><code>${PN.compagnie.email}</code><button type="button" data-copier="${PN.compagnie.email}">Copier</button></p>
        ${PN.compagnie.telephones.map((t) => `<p class="copie"><code>${t}</code><button type="button" data-copier="${t.replace(/\s/g, '')}">Copier</button></p>`).join('')}
      </div>
      <div style="display:grid;gap:0.5rem">
        <h2 class="titre--petit" style="font-size:var(--t-3)">Documents</h2>
        <p>Dossier de présentation ${ac()}</p>
        <p>Fiches techniques des lectures ${ac()}</p>
        <p>Conditions et tarifs ${ac()}</p>
      </div>
      <p class="mise-en-garde">Maquette : le formulaire fonctionne, mais rien n’est envoyé.</p>
    </aside>
    <div class="large">
      <form id="demande" class="formulaire" novalidate data-perche="d">
        <ol class="etapes" aria-label="Étapes de la demande"><li>Votre structure</li><li>Votre public</li><li>Votre envie</li><li>Vos coordonnées</li></ol>
        <div class="jauge" aria-hidden="true"><i></i></div>
        <fieldset class="etape">
          <legend>Votre structure</legend>
          <div class="champ"><span id="l-type" style="font-weight:520;font-size:var(--t-1)">Type de structure</span>${choix('type', types)}</div>
          <div class="champ"><label for="f-structure">Nom de la structure</label><input id="f-structure" name="structure" type="text" autocomplete="organization"></div>
          <div class="champ"><label for="f-commune">Commune</label><input id="f-commune" name="commune" type="text" autocomplete="address-level2"></div>
        </fieldset>
        <fieldset class="etape" hidden>
          <legend>Votre public</legend>
          <div class="champ"><span style="font-weight:520;font-size:var(--t-1)">Pour qui ? <span class="aide">Plusieurs choix possibles</span></span>${choix('public', publics, 'checkbox')}</div>
          <div class="champ"><label for="f-effectif">Nombre de personnes, à peu près</label><select id="f-effectif" name="effectif"><option value="">Choisir</option><option>Moins de 30</option><option>30 à 80</option><option>80 à 150</option><option>Plus de 150</option><option>Je ne sais pas</option></select></div>
          <div class="champ"><span style="font-weight:520;font-size:var(--t-1)">Où ?</span>${choix('espace', ['En intérieur', 'En plein air', 'Les deux'])}</div>
        </fieldset>
        <fieldset class="etape" hidden>
          <legend>Votre envie</legend>
          <div class="champ"><span style="font-weight:520;font-size:var(--t-1)">Ce qui vous intéresse <span class="aide">Plusieurs choix possibles</span></span>${choix('envie', envies, 'checkbox')}</div>
          <div class="champ"><label for="f-projet">Votre projet en quelques mots</label><textarea id="f-projet" name="projet" placeholder="Un thème, une occasion, un lieu particulier…"></textarea></div>
        </fieldset>
        <fieldset class="etape" hidden>
          <legend>Vos coordonnées</legend>
          <div class="champ"><label for="f-periode">Période souhaitée</label><input id="f-periode" name="periode" type="text" placeholder="Par exemple : printemps 2027"></div>
          <div class="champ"><label for="f-nom">Nom et prénom</label><input id="f-nom" name="nom" type="text" autocomplete="name"></div>
          <div class="champ"><label for="f-email">Adresse e-mail</label><input id="f-email" name="email" type="email" autocomplete="email"></div>
          <div class="champ"><label for="f-tel">Téléphone <span class="aide">facultatif</span></label><input id="f-tel" name="tel" type="tel" autocomplete="tel"></div>
          <div class="choix" style="grid-template-columns:1fr"><label for="f-accord"><input id="f-accord" type="checkbox" name="accord" value="oui">J’accepte que ces informations servent uniquement à répondre à ma demande.</label></div>
        </fieldset>
        <div data-recap hidden class="recap"><h3 class="titre--petit">Récapitulatif</h3><dl></dl></div>
        <p class="retour" role="status" aria-live="polite"></p>
        <div class="form-nav" hidden>
          <button class="btn btn--trait" type="button" data-precedent>Étape précédente</button>
          <button class="btn" type="button" data-suivant>Continuer</button>
          <button class="btn btn--neon" type="submit" data-envoyer hidden>Envoyer la demande</button>
        </div>
        <noscript><p>Ce formulaire a besoin de JavaScript. Écrivez directement à ${PN.compagnie.email}.</p></noscript>
      </form>
    </div>
  </div>
</section>
`
  });
}

/* ================================================================= CONTACT */
function contact() {
  const c = PN.compagnie;
  return page({
    fichier: 'contact.html', actif: 'contact',
    titre: 'Contact, Petite Nature',
    description: 'Programmer une lecture à voix haute ou échanger autour d’un projet littéraire : contactez la Compagnie Petite Nature.',
    corps: () => `
<section class="ouverture" data-fil="g" data-fil-y="0.3">
  <div class="wrap ouverture__titre tapuscrit">
    <p class="marge dida">(Un matin de givre. Le rouge-gorge attend sur sa branche.)</p>
    <div class="large" style="display:grid;gap:1rem">${neon('Contact', { tag: 'h1', perche: 'd' })}<p class="chapeau">Pour programmer une lecture, imaginer un labo ou simplement échanger autour d’un projet littéraire.</p></div>
  </div>
  <div class="ouverture__image" style="position:relative;height:clamp(260px,40vw,480px)">
    ${visuel('givre', 'contact-hero', { style: 'height:100%', mobile: 'contact-hero-mobile', alt: 'Visuel provisoire : du givre sur une vitre bleue' })}
    <div style="position:absolute;inset:0;display:grid;place-items:center;pointer-events:none">${image('identite/rouge-gorge', { cls: 'visuel--contenu', style: 'background:transparent;width:min(34vw,260px)', naturel: true, sizes: '260px' })}</div>
  </div>
</section>
<section class="section" data-fil="d" data-fil-y="0.1">
  <div class="wrap cote-a-cote" style="align-items:start">
    <div class="corps">
      <h2 class="titre titre--moyen" data-perche="g">Compagnie Petite Nature</h2>
      <p class="copie"><code>${c.email}</code><button type="button" data-copier="${c.email}">Copier l’adresse</button></p>
      ${c.telephones.map((t) => `<p class="copie"><code>${t}</code><button type="button" data-copier="${t.replace(/\s/g, '')}">Copier le numéro</button></p>`).join('')}
      <p>${c.ville}<br><span class="meta">Adresse postale complète ${ac()}</span></p>
      <p class="meta">SIRET ${c.siret}<br>Code APE ${c.ape}<br>Licence d’entrepreneur de spectacles n° ${c.licence} ${ac('format à vérifier')}</p>
      <div class="actions"><a class="btn" href="${c.instagram}" target="_blank" rel="noopener">Instagram</a><a class="btn btn--trait" href="${c.facebook}" target="_blank" rel="noopener">Facebook</a></div>
    </div>
    <div style="display:grid;gap:2rem">
      <form class="lettre" data-lettre novalidate style="background:var(--papier-clair);border:1px solid var(--papier-ombre)">
        <h2 class="titre--petit" style="font-size:var(--t-3)">Recevez la lettre d’information <span class="meta">(une par saison)</span></h2>
        <label for="lettre-contact" class="sr">Adresse e-mail</label>
        <div class="ligne-form"><input id="lettre-contact" type="email" name="email" autocomplete="email" placeholder="votre@adresse.fr"><button class="btn btn--neon" type="submit">Je veux la recevoir</button></div>
        <p class="retour" role="status"></p>
      </form>
      <div style="display:grid;gap:0.8rem"><p class="lecture">Vous préparez une programmation ? Le formulaire en quatre étapes rassemble tout ce qu’il faut pour une première proposition.</p><a class="btn btn--neon" href="${R}programmer.html" style="justify-self:start">Programmer une lecture</a></div>
    </div>
  </div>
</section>
`
  });
}

/* ================================================================= LÉGAL */
function legal(fichier, titre, desc, html) {
  return page({ fichier, titre: `${titre}, Petite Nature`, description: desc, corps: () => `
<section class="ouverture"><div class="wrap tapuscrit"><p class="marge dida">(Les informations obligatoires, en clair.)</p><div class="corps legal"><h1 class="titre titre--moyen" data-perche="d">${titre}</h1>${html}</div></div></section>
<section class="section section--serree"><div class="wrap"><p class="note-maquette">Maquette : les mentions « à compléter » doivent être renseignées par la compagnie avant la mise en ligne.</p></div></section>` });
}

/* ================================================================= GÉNÉRATION */
accueil();
compagnie();
lectures();
PN.lectures.forEach(ficheLecture);
labos();
Object.keys(LABOS).forEach(pageLabo);
creations();
agenda();
programmer();
contact();
const c = PN.compagnie;
legal('mentions-legales.html', 'Mentions légales', 'Mentions légales du site de la Compagnie Petite Nature.', `
<h2>Éditeur du site</h2>
<p>Compagnie Petite Nature, ${ac('forme juridique')}<br>Siège : ${c.ville}, ${ac('adresse complète')}<br>SIRET ${c.siret}, code APE ${c.ape} (arts du spectacle vivant)<br>Licence d’entrepreneur de spectacles n° ${c.licence} ${ac('à vérifier : les récépissés délivrés depuis 2020 sont au format PLATESV')}<br>Contact : ${c.email}, ${c.telephones.join(' ou ')}</p>
<h2>Directeur ou directrice de la publication</h2><p>${ac()}</p>
<h2>Hébergement</h2><p>Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis.</p>
<h2>Crédits</h2>
<ul><li>Photographies et visuels : Compagnie Petite Nature, ${ac('auteurs et droits à confirmer pour chaque image')}.</li><li>Fond de carte : IGN Admin Express, Licence ouverte.</li><li>Polices : Literata, Tilt Neon et Courier Prime, sous licence SIL Open Font License.</li></ul>
<h2>Propriété intellectuelle</h2><p>Les textes, images et vidéos de ce site appartiennent à leurs auteurs. Toute reproduction demande l’accord de la compagnie.</p>`);
legal('confidentialite.html', 'Politique de confidentialité', 'Comment la Compagnie Petite Nature traite les informations transmises par le site.', `
<p>Le site recueille des informations à deux endroits : la demande de programmation et l’inscription à la lettre d’information.</p>
<h2>Ce qui est recueilli</h2><ul><li>Demande de programmation : structure, commune, public, envies, période, nom, adresse e-mail et, si vous le souhaitez, téléphone.</li><li>Lettre d’information : adresse e-mail.</li></ul>
<h2>Pourquoi</h2><p>Pour répondre à votre demande et, si vous vous inscrivez, pour envoyer la lettre d’information, une par saison. Les informations ne sont ni vendues ni cédées.</p>
<h2>Combien de temps</h2><p>${ac('durées de conservation')}</p>
<h2>Vos droits</h2><p>Vous pouvez demander à consulter, corriger ou effacer vos informations, ou vous opposer à leur utilisation, en écrivant à ${c.email}. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).</p>
<h2>Outil d’envoi de la lettre</h2><p>${ac()}</p>`);
legal('cookies.html', 'Cookies', 'Les cookies et le stockage utilisés par le site de la Compagnie Petite Nature.', `
<p>Ce site ne dépose aucun cookie de mesure d’audience ni de publicité.</p>
<h2>Ce qui est gardé dans votre navigateur</h2><p>Seul votre choix du mode calme (animations réduites) est gardé dans votre navigateur, pour s’appliquer à toutes les pages. Il ne quitte pas votre appareil.</p>
<h2>Liens externes</h2><p>Les liens vers Instagram, Facebook, Vimeo ou Calaméo ouvrent ces services, qui ont leurs propres règles.</p>`);
page({ fichier: '404.html', titre: 'Page introuvable, Petite Nature', description: 'Cette page n’existe pas ou plus.', corps: () => `
<section class="ouverture"><div class="wrap erreur-404">
  ${neon('Introuvable', { tag: 'h1', cls: 'neon--moyen', perche: 'd' })}
  <p class="chapeau">Cette page n’existe pas, ou plus. Le rouge-gorge connaît d’autres chemins.</p>
  <div class="actions"><a class="btn" href="${R}index.html">Revenir à l’accueil</a><a class="btn btn--trait" href="${R}lectures.html">Voir les lectures</a><a class="btn btn--trait" href="${R}agenda.html">Voir l’agenda</a></div>
  ${image('identite/rouge-gorge', { cls: 'visuel--contenu', naturel: true, style: 'background:transparent;width:180px', sizes: '180px' })}
</div></section>` });

fs.writeFileSync(path.join(SITE, 'vercel.json'), JSON.stringify({ cleanUrls: true, trailingSlash: false }, null, 2) + '\n');
console.log('Pages générées. Prochaine date :', prochain && prochain.titre, prochain && prochain.debut, '— images Grok :', GROK.size);
