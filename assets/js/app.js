/*
  Compagnie Petite Nature — interactions de la maquette.
  Sans GSAP (ou en mode calme), tout reste lisible et utilisable.
*/
(function () {
  'use strict';

  var D = document, H = D.documentElement, W = window;
  var PN = W.PN || {};
  var IMG = W.PN_IMAGES || {};
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { W.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  };
  var session = {
    get: function (k) { try { return W.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { W.sessionStorage.setItem(k, v); } catch (e) { /* idem */ } },
    del: function (k) { try { W.sessionStorage.removeItem(k); } catch (e) { /* idem */ } }
  };

  var gsapOK = !!(W.gsap && W.ScrollTrigger);
  var calme = H.classList.contains('calme');
  var anime = gsapOK && !calme;
  var fin = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var RACINE = D.body.getAttribute('data-racine') || '';
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  if (gsapOK) {
    var plugins = [W.ScrollTrigger];
    if (W.ScrollSmoother) plugins.push(W.ScrollSmoother);
    if (W.Flip) plugins.push(W.Flip);
    W.gsap.registerPlugin.apply(W.gsap, plugins);
  }
  var gsap = W.gsap, ST = W.ScrollTrigger;

  /* ------------------------------------------------------------ Dates */
  var TZ = 'Europe/Paris';
  function parseDebut(e) {
    if (e.debut.length > 10) return new Date(e.debut);
    var p = e.debut.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
  }
  function finEvt(e) {
    if (e.fin) return new Date(e.fin);
    var d = parseDebut(e);
    if (e.debut.length > 10) return new Date(d.getTime() + 2 * 3600 * 1000);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  }
  var fJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
  var fCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: TZ });
  var fNum = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: TZ });
  var fAn = new Intl.DateTimeFormat('fr-FR', { year: 'numeric', timeZone: TZ });
  var fHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  function heure(e) {
    if (e.debut.length <= 10) return '';
    var h = fHeure.format(parseDebut(e)).replace(':', ' h ').replace(' h 00', ' h');
    if (e.fin) h += ' – ' + fHeure.format(new Date(e.fin)).replace(':', ' h ').replace(' h 00', ' h');
    return h;
  }
  function evenements() { return (PN.evenements || []).slice().sort(function (a, b) { return parseDebut(a) - parseDebut(b); }); }
  function aVenir(now) { now = now || new Date(); return evenements().filter(function (e) { return finEvt(e) >= now; }); }
  function passes(now) { now = now || new Date(); return evenements().filter(function (e) { return finEvt(e) < now; }).reverse(); }
  function lienEvt(e) {
    if (e.lecture) return RACINE + 'lectures/' + e.lecture + '.html';
    if (e.labo) return RACINE + e.labo + '.html';
    return '';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function marquerACompleter(s) {
    return esc(s).replace(/\(?(nom complet |lieu |commune )?à compléter\)?/gi, function (m) { return '<span class="a-completer">' + m.replace(/[()]/g, '') + '</span>'; });
  }

  function ics(e) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var utc = function (d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z'; };
    var lignes = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Compagnie Petite Nature//Agenda//FR', 'BEGIN:VEVENT', 'UID:' + e.id + '@petitenature.fr', 'DTSTAMP:' + utc(new Date())];
    if (e.debut.length > 10) { lignes.push('DTSTART:' + utc(parseDebut(e)), 'DTEND:' + utc(finEvt(e))); }
    else { var d = parseDebut(e); lignes.push('DTSTART;VALUE=DATE:' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())); }
    lignes.push('SUMMARY:' + e.titre + ' (Compagnie Petite Nature)', 'LOCATION:' + e.lieu + ', ' + e.adresse, 'END:VEVENT', 'END:VCALENDAR');
    var blob = new Blob([lignes.join('\r\n')], { type: 'text/calendar' });
    var a = D.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'petite-nature-' + e.id + '.ics';
    D.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  /* ------------------------------------------------------------ Mode calme */
  $$('.calme-btn').forEach(function (b) {
    b.setAttribute('aria-pressed', calme ? 'true' : 'false');
    b.addEventListener('click', function () {
      store.set('pn-calme', calme ? '0' : '1');
      session.set('pn-y', String(W.scrollY));
      W.location.reload();
    });
  });
  var yMemo = session.get('pn-y');
  if (yMemo) { session.del('pn-y'); W.addEventListener('load', function () { W.scrollTo(0, +yMemo); }); }

  /* ------------------------------------------------------------ Menu */
  var entete = $('.entete');
  var menu = $('#menu');
  var menuBtn = $('.menu-btn');
  function fermerMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); entete.classList.remove('menu-ouvert');
    var sw = $('#smooth-wrapper'); if (sw) sw.inert = false;
    D.body.style.overflow = '';
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var ouvrir = menu.hidden;
      if (!ouvrir) { fermerMenu(); return; }
      menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); entete.classList.add('menu-ouvert');
      var sw = $('#smooth-wrapper'); if (sw) sw.inert = true;
      D.body.style.overflow = 'hidden';
      $$('.neon', menu).forEach(function (n, i) { allumer(n, 0.08 * i); });
      var premier = $('a', menu); if (premier) premier.focus();
    });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape') { fermerMenu(); menuBtn.focus(); } });
  }

  /* ------------------------------------------------------------ En-tête */
  var dernierY = W.scrollY;
  function surScroll() {
    var y = W.scrollY;
    if (entete) {
      entete.classList.toggle('est-plein', y > 30);
      if (!calme && menu && menu.hidden) entete.classList.toggle('est-cache', y > dernierY + 4 && y > 420);
      if (y < dernierY - 4) entete.classList.remove('est-cache');
    }
    dernierY = y;
  }
  W.addEventListener('scroll', surScroll, { passive: true });
  surScroll();

  /* ------------------------------------------------------------ Défilement fluide */
  var smoother = null;
  if (anime && fin && W.ScrollSmoother && W.innerWidth >= 960 && $('#smooth-wrapper')) {
    smoother = W.ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.05, effects: false, normalizeScroll: false });
  }
  D.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var cible = id && D.getElementById(id);
    if (!cible) return;
    e.preventDefault();
    if (smoother) smoother.scrollTo(cible, true, 'top 90px');
    else cible.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'start' });
    if (cible.tabIndex < 0) cible.setAttribute('tabindex', '-1');
    cible.focus({ preventScroll: true });
  });

  /* ------------------------------------------------------------ Néon prononcé */
  function decouperNeon(el) {
    if (el._decoupe) return;
    var txt = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    var sr = D.createElement('span'); sr.className = 'sr'; sr.textContent = txt; el.appendChild(sr);
    txt.split(' ').forEach(function (mot, k) {
      if (k) el.appendChild(D.createTextNode(' '));
      var m = D.createElement('span');
      m.style.whiteSpace = 'nowrap'; m.style.display = 'inline-block';
      Array.prototype.forEach.call(mot, function (ch) {
        var s = D.createElement('span');
        s.className = 'l'; s.setAttribute('aria-hidden', 'true');
        s.textContent = ch;
        m.appendChild(s);
      });
      el.appendChild(m);
    });
    el._decoupe = true;
  }
  function allumer(el, delai) {
    decouperNeon(el);
    if (el._allume) return;
    el._allume = true;
    var ls = $$('.l', el);
    if (!anime) { el.classList.add('est-allume'); ls.forEach(function (l) { l.classList.add('on'); }); return; }
    var tl = gsap.timeline({ delay: delai || 0 });
    var pas = clamp(0.5 / ls.length, 0.035, 0.07);
    ls.forEach(function (l, i) {
      tl.call(function () { l.classList.add('on'); }, null, i * pas);
      tl.fromTo(l, { '--yr': 40, '--xr': -12 }, { '--yr': 0, '--xr': 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' }, i * pas);
    });
    /* deux grésillements au plus, espacés d'une demi-seconde : moins de 3 éclats par seconde */
    var fins = ls.length * pas + 0.25;
    var cibles = [Math.floor(ls.length * 0.3), Math.floor(ls.length * 0.75)].filter(function (v, i, a) { return a.indexOf(v) === i && ls[v]; });
    cibles.forEach(function (idx, k) {
      var t0 = fins + k * 0.5;
      tl.call(function () { ls[idx].classList.remove('on'); }, null, t0);
      tl.call(function () { ls[idx].classList.add('on'); }, null, t0 + 0.08);
    });
    tl.call(function () { el.classList.add('est-allume'); }, null, fins + 1.1);
  }
  $$('.neon').forEach(decouperNeon);

  function suivreNeon(el) {
    if (!anime || !fin) return;
    var ls = $$('.l', el);
    var qx = ls.map(function (l) { return gsap.quickTo(l, '--xr', { duration: 0.6, ease: 'power3.out' }); });
    var qy = ls.map(function (l) { return gsap.quickTo(l, '--yr', { duration: 0.6, ease: 'power3.out' }); });
    var rafId = 0, px = 0, py = 0;
    W.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      if (rafId || !el._allume) return;
      rafId = requestAnimationFrame(function () {
        rafId = 0;
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > W.innerHeight) return;
        ls.forEach(function (l, i) {
          var b = l.getBoundingClientRect();
          var dx = (px - (b.left + b.width / 2)) / W.innerWidth;
          var dy = (py - (b.top + b.height / 2)) / W.innerHeight;
          qy[i](clamp(dx * 70, -30, 30));
          qx[i](clamp(-dy * 50, -25, 25));
        });
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------ Mots qui se disent */
  function decouperMots(el, classe) {
    if (el._mots) return el._mots;
    var mots = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var sr = D.createElement('span'); sr.className = 'sr'; sr.textContent = mots.join(' '); el.appendChild(sr);
    el._mots = mots.map(function (m, i) {
      var s = D.createElement('span'); s.className = classe || 'mot'; s.setAttribute('aria-hidden', 'true'); s.textContent = m;
      el.appendChild(s);
      if (i < mots.length - 1) el.appendChild(D.createTextNode(' '));
      return s;
    });
    return el._mots;
  }
  function initDit() {
    $$('.dit').forEach(function (el) {
      var mots = decouperMots(el, 'mot');
      if (!anime) return;
      ST.create({
        trigger: el, start: 'top 82%', end: 'bottom 40%', scrub: true,
        onUpdate: function (s) {
          var n = Math.round(s.progress * mots.length);
          mots.forEach(function (m, i) {
            m.classList.toggle('dit-on', i < n);
            m.classList.toggle('dit-courant', i === n - 1 && s.progress < 0.995);
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------ Fil de voix */
  function initFil() {
    var main = $('main');
    if (!main || calme) return;
    var ancres = $$('[data-fil]', main);
    if (ancres.length < 2) return;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = D.createElementNS(NS, 'svg'); svg.setAttribute('class', 'fil'); svg.setAttribute('aria-hidden', 'true');
    var path = D.createElementNS(NS, 'path'); svg.appendChild(path);
    main.insertBefore(svg, main.firstChild);
    var echant = [], longueur = 0;
    function calculer() {
      var mr = main.getBoundingClientRect();
      var w = main.clientWidth, h = main.scrollHeight;
      var marge = clamp(w * 0.022, 7, 34);
      var bruts = ancres.map(function (a, k) {
        var r = a.getBoundingClientRect();
        var mode = a.getAttribute('data-fil');
        var y = r.top - mr.top + Math.min(40, r.height * 0.08);
        var gauche = w < 960 || mode === 'g' || (mode !== 'd' && k % 2 === 0);
        return [gauche ? marge : w - marge, y];
      }).sort(function (a, b) { return a[1] - b[1]; });
      var pts = [bruts[0]];
      for (var b = 1; b < bruts.length; b++) {
        var prev = bruts[b - 1], cur = bruts[b];
        if (prev[0] !== cur[0]) {
          var c = Math.min(150, (cur[1] - prev[1]) * 0.45);
          pts.push([prev[0], cur[1] - c]);
        }
        pts.push(cur);
      }
      pts.push([pts[pts.length - 1][0], h - 4]);
      var d = 'M' + pts[0][0] + ',' + pts[0][1];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
      }
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.style.height = h + 'px';
      path.setAttribute('d', d);
      longueur = path.getTotalLength();
      path.style.strokeDasharray = longueur + ' ' + longueur;
      echant = [];
      for (var l = 0; l <= longueur; l += 24) echant.push([l, path.getPointAtLength(l).y]);
      maj();
    }
    function maj() {
      if (!longueur) return;
      var mr = main.getBoundingClientRect();
      var cibleY = -mr.top + W.innerHeight * 0.78;
      var l = 0;
      for (var i = 0; i < echant.length; i++) { if (echant[i][1] <= cibleY) l = echant[i][0]; else break; }
      path.style.strokeDashoffset = String(longueur - l);
    }
    if (gsapOK) { ST.addEventListener('refresh', calculer); ST.create({ trigger: main, start: 'top top', end: 'bottom bottom', onUpdate: maj }); }
    else W.addEventListener('scroll', maj, { passive: true });
    W.addEventListener('resize', calculer);
    calculer();
    W.addEventListener('load', calculer);
  }

  /* ------------------------------------------------------------ Le rouge-gorge */
  var robin = null;
  function initRobin() {
    var contenu = $('#smooth-content');
    var perches = $$('[data-perche]').filter(function (p) { return W.innerWidth >= 960 || p.classList.contains('neon') || p.querySelector('.neon'); });
    if (!contenu || !perches.length || calme || !gsapOK) return;
    var el = D.createElement('div');
    el.className = 'rouge-gorge';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img src="' + RACINE + 'assets/img/identite/rouge-gorge-480.webp" alt="" width="480" height="557">';
    contenu.appendChild(el);
    var etat = { x: -200, y: -300, dir: 1, i: -1, vol: null };
    function boiteTexte(p) {
      try {
        var rg = D.createRange(); rg.selectNodeContents(p);
        var lignes = Array.prototype.filter.call(rg.getClientRects(), function (x) { return x.width > 2 && x.height > 2; });
        if (!lignes.length) return p.getBoundingClientRect();
        var haut = Math.min.apply(null, lignes.map(function (x) { return x.top; }));
        var premiere = lignes.filter(function (x) { return x.top < haut + 4; });
        return {
          left: Math.min.apply(null, premiere.map(function (x) { return x.left; })),
          right: Math.max.apply(null, premiere.map(function (x) { return x.right; })),
          top: haut, width: 0, height: premiere[0].height
        };
      } catch (e) { return p.getBoundingClientRect(); }
    }
    function pos(p) {
      var cr = contenu.getBoundingClientRect();
      var r = p.matches('h1, h2, h3, p, .neon') ? boiteTexte(p) : p.getBoundingClientRect();
      if (r.width === 0) r.width = r.right - r.left;
      var w = el.offsetWidth || 70, h = w * 1.16;
      var mode = p.getAttribute('data-perche');
      var x = mode === 'g' ? r.left - cr.left + w * 0.1 : mode === 'c' ? r.left - cr.left + r.width / 2 - w / 2 : r.right - cr.left - w * 0.95;
      x = clamp(x, 8, contenu.clientWidth - w - 8);
      var y = r.top - cr.top - h * 0.93 + (p.classList.contains('neon') || p.querySelector('.neon') ? r.height * 0.13 : 0);
      return { x: x, y: y };
    }
    function poser(x, y, dir) {
      etat.x = x; etat.y = y;
      gsap.set(el, { x: x, y: y, scaleX: dir });
    }
    function sauter(i, opts) {
      opts = opts || {};
      if (i === etat.i && !opts.force) return;
      var p = perches[i]; if (!p) return;
      etat.i = i;
      var cible = pos(p);
      var x0 = etat.x, y0 = etat.y;
      var dir = cible.x >= x0 ? 1 : -1;
      var dist = Math.hypot(cible.x - x0, cible.y - y0);
      var arc = clamp(dist * 0.28 + 50, 60, 260);
      if (etat.vol) etat.vol.kill();
      var o = { t: 0 };
      etat.vol = gsap.timeline();
      etat.vol.to(el, { scaleY: 0.82, duration: 0.12, ease: 'power2.in' })
        .to(o, {
          t: 1, duration: clamp(dist / 1400, 0.55, 1.1), ease: 'power1.inOut',
          onStart: function () { gsap.set(el, { scaleY: 1.06 }); },
          onUpdate: function () {
            var t = o.t;
            poser(lerp(x0, cible.x, t), lerp(y0, cible.y, t) - arc * 4 * t * (1 - t), dir);
            gsap.set(el, { rotation: (0.5 - t) * 18 * dir });
          }
        })
        .to(el, { scaleY: 0.86, rotation: 0, duration: 0.1, ease: 'power2.out' })
        .to(el, { scaleY: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)' });
    }
    function replacer() { if (etat.i >= 0) { var c = pos(perches[etat.i]); poser(c.x, c.y, 1); } }
    perches.forEach(function (p, i) {
      ST.create({
        trigger: p, start: 'top 68%',
        onEnter: function () { sauter(i); },
        onLeaveBack: function () { sauter(Math.max(0, i - 1)); }
      });
    });
    ST.addEventListener('refresh', replacer);
    el.addEventListener('click', function () {
      gsap.timeline().to(el, { y: etat.y - 30, duration: 0.18, ease: 'power2.out' }).to(el, { y: etat.y, duration: 0.3, ease: 'bounce.out' });
    });
    robin = {
      arrivee: function (delai) {
        var c = pos(perches[0]);
        etat.i = 0;
        poser(c.x + 120, c.y - W.innerHeight * 0.7, -1);
        gsap.timeline({ delay: delai || 0 })
          .to(el, { x: c.x, y: c.y, duration: 1, ease: 'power2.out', onUpdate: function () { etat.x = gsap.getProperty(el, 'x'); etat.y = gsap.getProperty(el, 'y'); } })
          .to(el, { scaleY: 0.84, duration: 0.1 })
          .to(el, { scaleY: 1, scaleX: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
      },
      sauter: sauter,
      nb: perches.length,
      placer: function () { etat.i = 0; var c = pos(perches[0]); poser(c.x, c.y, 1); }
    };
  }

  /* ------------------------------------------------------------ Curseur */
  function initCurseur() {
    if (!fin || calme) return;
    var c = D.createElement('div');
    c.className = 'curseur'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="curseur__anneau"><span class="curseur__label"></span></div><div class="curseur__point"></div>';
    D.body.appendChild(c);
    H.classList.add('curseur-actif');
    var anneau = $('.curseur__anneau', c), point = $('.curseur__point', c), label = $('.curseur__label', c);
    var mx = -100, my = -100, ax = -100, ay = -100;
    W.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      var cible = e.target.closest ? e.target.closest('[data-curseur], a, button, input, select, textarea, label') : null;
      var txt = cible && cible.getAttribute('data-curseur');
      c.classList.toggle('est-grand', !!txt);
      label.textContent = txt || '';
      anneau.style.borderColor = cible && !txt ? 'rgba(255,43,58,.95)' : '';
    }, { passive: true });
    D.addEventListener('pointerleave', function () { mx = my = -100; });
    (function boucle() {
      ax = lerp(ax, mx, 0.2); ay = lerp(ay, my, 0.2);
      point.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      anneau.style.transform = 'translate(' + ax + 'px,' + ay + 'px)';
      requestAnimationFrame(boucle);
    })();
  }

  /* ------------------------------------------------------------ Boutons magnétiques et cartes inclinables */
  function initMagnetique() {
    if (!fin || !anime) return;
    $$('.btn, .magnetique').forEach(function (b) {
      var qx = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3.out' });
      var qy = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3.out' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.25);
        qy((e.clientY - r.top - r.height / 2) * 0.35);
      });
      b.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
    $$('[data-tilt]').forEach(function (c) {
      var cible = $('.visuel', c) || c;
      var rx = gsap.quickTo(cible, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      var ry = gsap.quickTo(cible, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      gsap.set(cible, { transformPerspective: 900 });
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
      });
      c.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  /* ------------------------------------------------------------ La page qui se tourne */
  function initFeuillet() {
    var f = $('.feuillet');
    if (!f) return;
    var page = $('.feuillet__page', f), mot = $('.feuillet .neon', f);
    if (anime && session.get('pn-tourne')) {
      session.del('pn-tourne');
      f.style.visibility = 'visible';
      gsap.set(page, { rotationY: 0 });
      gsap.to(page, { rotationY: -96, duration: 0.75, ease: 'power3.inOut', delay: 0.05, onComplete: function () { f.style.visibility = 'hidden'; } });
    }
    W.addEventListener('pageshow', function (e) { if (e.persisted) f.style.visibility = 'hidden'; });
    if (!anime) return;
    D.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto|tel|https?):/i.test(href)) return;
      if (!/\.html(#.*)?$/.test(href)) return;
      e.preventDefault();
      fermerMenu();
      mot.textContent = (a.getAttribute('data-feuillet') || a.textContent || '').trim().slice(0, 28);
      mot._decoupe = false; mot._allume = false;
      f.style.visibility = 'visible';
      gsap.fromTo(page, { rotationY: 96 }, {
        rotationY: 0, duration: 0.6, ease: 'power3.inOut',
        onComplete: function () { session.set('pn-tourne', '1'); W.location.href = a.href; }
      });
      allumer(mot, 0.15);
    });
  }

  /* ------------------------------------------------------------ Images en parallaxe */
  function initParallaxe() {
    if (!anime) return;
    $$('.parallaxe').forEach(function (fig) {
      var img = $('img, canvas[data-scene]', fig); if (!img) return;
      gsap.set(img, { scale: 1.14 });
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ------------------------------------------------------------ Compteurs */
  function initCompteurs() {
    $$('[data-compte]').forEach(function (el) {
      var fin_ = parseInt(el.getAttribute('data-compte'), 10);
      var debut = parseInt(el.getAttribute('data-compte-depuis') || '0', 10);
      if (!anime) return;
      ST.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          var o = { v: debut };
          gsap.to(o, { v: fin_, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = String(Math.round(o.v)); } });
        }
      });
    });
  }

  /* ------------------------------------------------------------ Sections horizontales */
  function initHorizontal() {
    if (!anime || W.innerWidth < 960) return;
    $$('[data-horizontal]').forEach(function (sec) {
      var piste = $('[data-piste]', sec); if (!piste) return;
      sec.classList.add('est-horizontal');
      var dist = function () { return Math.max(0, piste.scrollWidth - W.innerWidth); };
      gsap.to(piste, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    });
  }

  /* ------------------------------------------------------------ Corde à linge */
  function initCordes() {
    $$('[data-corde]').forEach(function (c) {
      var cadre = $('.corde__cadre', c), piste = $('.corde__piste', c);
      var items = $$('.corde__item', c);
      if (!anime || W.innerWidth < 960) { cadre.classList.add('defile-x'); return; }
      gsap.fromTo(piste, { x: 0 }, {
        x: function () { return -Math.max(0, piste.scrollWidth - cadre.clientWidth); }, ease: 'none',
        scrollTrigger: { trigger: c, start: 'top 85%', end: 'bottom 15%', scrub: 0.6, invalidateOnRefresh: true }
      });
      var rot = items.map(function (it) { return gsap.quickTo(it, 'rotation', { duration: 1.4, ease: 'elastic.out(1, 0.25)' }); });
      ST.create({
        trigger: c, start: 'top bottom', end: 'bottom top',
        onUpdate: function (s) {
          var v = clamp(s.getVelocity() / 140, -9, 9);
          rot.forEach(function (q, i) { q(v * (i % 2 ? 0.8 : 1.1)); });
          clearTimeout(c._t); c._t = setTimeout(function () { rot.forEach(function (q) { q(0); }); }, 120);
        }
      });
    });
  }

  /* ------------------------------------------------------------ Prochaine date */
  function initProchaine() {
    var blocs = $$('[data-prochaine]');
    if (!blocs.length) return;
    var e = aVenir()[0];
    blocs.forEach(function (b) {
      var vide = $('[data-p-vide]', b), plein = $('[data-p-plein]', b);
      if (!e) { if (plein) plein.hidden = true; if (vide) vide.hidden = false; return; }
      var d = parseDebut(e);
      var set = function (k, v) { $$('[data-p-' + k + ']', b).forEach(function (n) { n.innerHTML = v; }); };
      set('jour', esc(fNum.format(d)).replace('/', '.'));
      set('an', esc(fAn.format(d)));
      set('date', esc(fJour.format(d)) + (heure(e) ? ', ' + esc(heure(e)) : ''));
      set('titre', esc(e.titre));
      set('lieu', marquerACompleter(e.lieu));
      set('adresse', marquerACompleter(e.adresse));
      set('court', esc(fCourt.format(d)) + ', ' + esc((e.adresse.split(',').pop() || '').replace(/\d{5}\s*/, '').trim()));
      $$('[data-p-lien]', b).forEach(function (a) { var l = lienEvt(e); if (l) a.href = l; });
      $$('[data-p-ics]', b).forEach(function (btn) { btn.onclick = function () { ics(e); }; });
      var dec = $('[data-decompte]', b);
      if (dec) {
        var cases = { j: $('[data-j]', dec), h: $('[data-h]', dec), m: $('[data-m]', dec), s: $('[data-s]', dec) };
        var tick = function () {
          var ms = Math.max(0, d - new Date());
          var j = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
          if (cases.j) cases.j.textContent = j; if (cases.h) cases.h.textContent = String(h).padStart(2, '0');
          if (cases.m) cases.m.textContent = String(m).padStart(2, '0'); if (cases.s) cases.s.textContent = String(s).padStart(2, '0');
        };
        tick(); setInterval(tick, 1000);
      }
    });
  }

  /* ------------------------------------------------------------ Agenda */
  function carteEvt(e, passe) {
    var d = parseDebut(e);
    var lien = lienEvt(e);
    var h = heure(e);
    return '<li class="evt' + (passe ? ' evt--passe' : '') + '" data-type="' + esc(e.type) + '">' +
      '<div class="evt__date"><b>' + esc(fCourt.format(d)) + '</b>' + esc(fAn.format(d)) + (h ? ', ' + esc(h) : '') + '</div>' +
      '<div><p class="meta">' + esc(e.type) + '</p><h3>' + (lien ? '<a href="' + lien + '">' + esc(e.titre) + '</a>' : esc(e.titre)) + '</h3>' +
      '<p>' + marquerACompleter(e.lieu) + ' — ' + marquerACompleter(e.adresse) + '</p>' +
      (e.note ? '<p class="dida dida--petite">(' + esc(e.note) + ')</p>' : '') + '</div>' +
      '<div class="evt__actions">' + (!passe ? '<button class="btn btn--trait" type="button" data-ics="' + esc(e.id) + '">Ajouter à mon agenda</button>' : '') +
      (lien ? '<a class="btn btn--trait" href="' + lien + '">' + (e.lecture ? 'Voir la lecture' : 'Voir le projet') + '</a>' : '') + '</div></li>';
  }
  function initAgenda() {
    var zone = $('[data-agenda]');
    if (!zone) return;
    var futurs = $('[data-agenda-futurs]', zone), anciens = $('[data-agenda-passes]', zone);
    var filtres = $$('[data-agenda-filtre]');
    var type = 'tout';
    function rendre() {
      var garde = function (e) { return type === 'tout' || e.type === type; };
      var f = aVenir().filter(garde), p = passes().filter(garde);
      futurs.innerHTML = f.length ? f.map(function (e) { return carteEvt(e, false); }).join('') :
        '<li class="vide">Aucune date à venir publiée pour l’instant. Les prochaines dates seront annoncées ici et dans la lettre d’information.</li>';
      var parAn = {};
      p.forEach(function (e) { var a = fAn.format(parseDebut(e)); (parAn[a] = parAn[a] || []).push(e); });
      anciens.innerHTML = Object.keys(parAn).sort().reverse().map(function (a, k) {
        return '<li><details class="annees-passees"' + (k === 0 ? ' open' : '') + '><summary>' + a + ' <span class="n">' + parAn[a].length + ' date' + (parAn[a].length > 1 ? 's' : '') + '</span></summary><ul class="agenda-liste">' + parAn[a].map(function (e) { return carteEvt(e, true); }).join('') + '</ul></details></li>';
      }).join('') || '<li class="vide">Aucune date passée pour ce type de rendez-vous.</li>';
      $$('details', anciens).forEach(function (dt) { dt.addEventListener('toggle', function () { if (gsapOK) ST.refresh(); }); });
      $$('[data-ics]', zone).forEach(function (b) {
        b.addEventListener('click', function () { var ev = (PN.evenements || []).filter(function (x) { return x.id === b.getAttribute('data-ics'); })[0]; if (ev) ics(ev); });
      });
      if (gsapOK) ST.refresh();
    }
    filtres.forEach(function (b) {
      b.addEventListener('click', function () {
        type = b.getAttribute('data-agenda-filtre');
        filtres.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        rendre();
      });
    });
    rendre();
  }
  function initDatesLiees() {
    $$('[data-dates-lecture], [data-dates-labo]').forEach(function (ul) {
      var slug = ul.getAttribute('data-dates-lecture'), labo = ul.getAttribute('data-dates-labo');
      var now = new Date();
      var evts = evenements().filter(function (e) { return slug ? e.lecture === slug : e.labo === labo; }).reverse();
      if (!evts.length) { ul.innerHTML = '<li>Aucune date publiée sur le site actuel.</li>'; return; }
      ul.innerHTML = evts.map(function (e) {
        var p = finEvt(e) < now, d = parseDebut(e);
        return '<li class="' + (p ? 'passee' : 'a-venir') + '"><span class="meta">' + esc(fNum.format(d)) + '.' + esc(fAn.format(d)) + (p ? '<br>passée' : '<br>à venir') + '</span><span>' + esc(e.titre === 'Histoires d’Ados' ? e.lieu : e.titre) + '<br><span class="meta">' + marquerACompleter(e.adresse) + '</span></span></li>';
      }).join('');
    });
  }

  /* ------------------------------------------------------------ Filtres du catalogue */
  function initFiltres() {
    var zone = $('[data-catalogue]');
    if (!zone) return;
    var boutons = $$('[data-filtre]', zone), cartes = $$('[data-cat]', zone), texte = $('.filtres__texte', zone);
    function appliquer(cat, depuisClic) {
      var etat = anime && W.Flip ? W.Flip.getState(cartes) : null;
      boutons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filtre') === cat ? 'true' : 'false'); });
      cartes.forEach(function (c) { c.hidden = !(cat === 'toutes' || c.getAttribute('data-cat') === cat); });
      if (texte) texte.textContent = cat === 'toutes' ? 'Les 13 lectures du répertoire.' : ((PN.categories || {})[cat] || {}).texte || '';
      if (etat) W.Flip.from(etat, { duration: 0.6, ease: 'power3.inOut', scale: true, absolute: true, onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 }); }, onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.3 }); }, onComplete: function () { ST.refresh(); } });
      if (depuisClic) { try { history.replaceState(null, '', cat === 'toutes' ? location.pathname : '#' + cat); } catch (e) { /* adresse figée */ } }
    }
    boutons.forEach(function (b) { b.addEventListener('click', function () { appliquer(b.getAttribute('data-filtre'), true); }); });
    $$('[data-filtre-lien]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        appliquer(a.getAttribute('data-filtre-lien'), true);
        if (smoother) smoother.scrollTo(zone, true, 'top 80px'); else zone.scrollIntoView({ behavior: calme ? 'auto' : 'smooth' });
      });
    });
    var h = (location.hash || '').slice(1);
    if (PN.categories && PN.categories[h]) appliquer(h, false);
  }

  /* ------------------------------------------------------------ Formulaires */
  function emailValide(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function initLettres() {
    $$('form[data-lettre]').forEach(function (f) {
      var champ = $('input[type="email"]', f), retour = $('.retour', f);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!emailValide(champ.value.trim())) { retour.className = 'retour erreur'; retour.textContent = 'Saisissez une adresse e-mail complète, par exemple prenom@exemple.fr.'; champ.focus(); return; }
        retour.className = 'retour ok';
        retour.textContent = 'Inscription simulée : dans la maquette, aucune adresse n’est enregistrée.';
        f.reset();
      });
    });
  }
  function initCopie() {
    $$('[data-copier]').forEach(function (b) {
      b.addEventListener('click', function () {
        var txt = b.getAttribute('data-copier');
        var ok = function () { var t = b.textContent; b.textContent = 'Copié'; setTimeout(function () { b.textContent = t; }, 1500); };
        var repli = function () { var code = b.parentNode.querySelector('code'); if (code) { var r = D.createRange(); r.selectNodeContents(code); var s = W.getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Sélectionné'; } };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, repli); else repli();
      });
    });
  }

  function initDemande() {
    var f = $('#demande');
    if (!f) return;
    var etapes = $$('.etape', f), puces = $$('.etapes li', f), jauge = $('.jauge i', f);
    var precedent = $('[data-precedent]', f), suivant = $('[data-suivant]', f), envoyer = $('[data-envoyer]', f);
    var recap = $('[data-recap]', f), retour = $('.retour', f), nav = $('.form-nav', f);
    var n = 0;
    var h = decodeURIComponent((location.hash || '').slice(1));
    if (h) { var c = f.querySelector('input[name="envie"][value="' + h.replace(/"/g, '') + '"]'); if (c) c.checked = true; }
    function voir(i, sansFocus) {
      n = i;
      etapes.forEach(function (et, k) { et.hidden = k !== i; });
      puces.forEach(function (p, k) { p.classList.toggle('est-active', k === i); p.classList.toggle('est-faite', k < i); });
      recap.hidden = i !== etapes.length;
      jauge.style.width = (Math.min(i, etapes.length) / etapes.length * 100) + '%';
      precedent.hidden = i === 0;
      suivant.hidden = i >= etapes.length;
      envoyer.hidden = i !== etapes.length;
      retour.textContent = ''; retour.className = 'retour';
      var cible = i < etapes.length ? etapes[i] : recap;
      if (anime) gsap.fromTo(cible, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out' });
      var titre = $('legend, h3', cible); if (titre && !sansFocus) { titre.setAttribute('tabindex', '-1'); titre.focus({ preventScroll: true }); }
    }
    function valeurs(nom) { return $$('[name="' + nom + '"]', f).filter(function (x) { return (x.type !== 'radio' && x.type !== 'checkbox') || x.checked; }).map(function (x) { return x.value.trim(); }).filter(Boolean); }
    function erreur(msg, champ) { retour.className = 'retour erreur'; retour.textContent = msg; if (champ) champ.focus(); return false; }
    function valider(i) {
      if (i === 0) {
        if (!valeurs('type').length) return erreur('Choisissez le type de votre structure.', $('[name="type"]', f));
        if (!valeurs('structure').length) return erreur('Indiquez le nom de votre structure.', $('#f-structure'));
        if (!valeurs('commune').length) return erreur('Indiquez la commune.', $('#f-commune'));
      }
      if (i === 1 && !valeurs('public').length) return erreur('Cochez au moins un public.', $('[name="public"]', f));
      if (i === 2 && !valeurs('envie').length) return erreur('Choisissez au moins une lecture ou un labo, ou « Je ne sais pas encore ».', $('[name="envie"]', f));
      if (i === 3) {
        if (!valeurs('nom').length) return erreur('Indiquez votre nom.', $('#f-nom'));
        if (!emailValide(($('#f-email').value || '').trim())) return erreur('Saisissez une adresse e-mail complète, par exemple prenom@exemple.fr.', $('#f-email'));
        if (!$('#f-accord').checked) return erreur('Cochez la case d’accord pour continuer.', $('#f-accord'));
      }
      return true;
    }
    function remplirRecap() {
      var lignes = [['Structure', valeurs('type').join(', ') + ' — ' + valeurs('structure').join('') + ', ' + valeurs('commune').join('')],
        ['Public', valeurs('public').join(', ') + (valeurs('effectif').length ? ' (' + valeurs('effectif')[0] + ')' : '')],
        ['Lieu', valeurs('espace').join(', ') || 'Non précisé'],
        ['Envie', valeurs('envie').map(function (v) { var l = (PN.lectures || []).filter(function (x) { return x.slug === v; })[0]; return l ? l.titre : v; }).join(', ')],
        ['Période', valeurs('periode').join('') || 'Non précisée'],
        ['Contact', valeurs('nom').join('') + ', ' + valeurs('email').join('') + (valeurs('tel').length ? ', ' + valeurs('tel')[0] : '')],
        ['Projet', valeurs('projet').join('') || '—']];
      $('dl', recap).innerHTML = lignes.map(function (l) { return '<dt>' + esc(l[0]) + '</dt><dd>' + esc(l[1]) + '</dd>'; }).join('');
    }
    suivant.addEventListener('click', function () {
      if (!valider(n)) return;
      if (n === etapes.length - 1) remplirRecap();
      voir(n + 1);
    });
    precedent.addEventListener('click', function () { voir(Math.max(0, n - 1)); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (n < etapes.length) { suivant.click(); return; }
      retour.className = 'retour ok';
      retour.textContent = 'Demande prête. Dans cette maquette, rien n’est envoyé : sur le site final, elle arrivera à compagnie@petitenature.fr.';
      envoyer.disabled = true;
      if (robin) robin.sauter(robin.nb - 1, { force: true });
    });
    voir(0, true);
    if (nav) nav.hidden = false;
  }

  /* ------------------------------------------------------------ Carte des voix */
  function initCarte() {
    if (W.innerWidth >= 960) $$('[data-ouvert-large]').forEach(function (d) { d.open = true; });
    $$('.carte__plus').forEach(function (d) { d.addEventListener('toggle', function () { if (gsapOK) ST.refresh(); }); });
    $$('[data-carte]').forEach(function (bloc) {
      var svg = $('svg', bloc); if (!svg) return;
      var vbFin = svg.getAttribute('viewBox').split(/\s+/).map(Number);
      var vbDebut = (svg.getAttribute('data-vb-france') || '0 0 1000 964').split(/\s+/).map(Number);
      var points = $$('.point', svg), trajets = $$('.trajet', svg);
      function echelle(vb) {
        var px = svg.getBoundingClientRect().width || 600;
        var k = vb[2] / px;
        var milieu = vb[0] + vb[2] * 0.55;
        points.forEach(function (p) {
          var c = $('circle.c', p), h = $('circle.h', p), t = $('text', p);
          c.setAttribute('r', 4.2 * k); h.setAttribute('r', 11 * k);
          if (t) {
            var droite = +c.getAttribute('cx') > milieu;
            t.setAttribute('text-anchor', droite ? 'end' : 'start');
            t.setAttribute('font-size', 12 * k); t.setAttribute('dx', (droite ? -8 : 8) * k); t.setAttribute('dy', 4 * k); t.style.strokeWidth = 3 * k + 'px';
          }
        });
      }
      echelle(vbFin);
      W.addEventListener('resize', function () { echelle(svg.getAttribute('viewBox').split(/\s+/).map(Number)); });
      $$('[data-lieu]', bloc).forEach(function (li) {
        var p = $('.point[data-id="' + li.getAttribute('data-lieu') + '"]', svg); if (!p) return;
        var on = function () { li.classList.add('est-actif'); p.classList.add('est-actif'); var t = $('text', p); if (t) t.style.opacity = 1; if (anime) gsap.fromTo($('circle.h', p), { opacity: 0.6, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 0.25, scale: 1.6, duration: 0.6 }); };
        var off = function () { li.classList.remove('est-actif'); p.classList.remove('est-actif'); var t = $('text', p); if (t && !t.hasAttribute('data-fixe')) t.style.opacity = ''; };
        li.addEventListener('pointerenter', on); li.addEventListener('pointerleave', off);
        li.addEventListener('focus', on); li.addEventListener('blur', off);
      });
      if (!anime) return;
      trajets.forEach(function (t) { var l = t.getTotalLength(); t.style.strokeDasharray = l; t.style.strokeDashoffset = l; });
      ST.create({
        trigger: bloc, start: 'top 75%', once: true,
        onEnter: function () {
          var o = { t: 0 };
          svg.setAttribute('viewBox', vbDebut.join(' ')); echelle(vbDebut);
          gsap.to(o, {
            t: 1, duration: 1.8, ease: 'power3.inOut',
            onUpdate: function () { var vb = vbDebut.map(function (v, i) { return lerp(v, vbFin[i], o.t); }); svg.setAttribute('viewBox', vb.join(' ')); echelle(vb); }
          });
          gsap.from(points, { opacity: 0, duration: 0.4, stagger: 0.06, delay: 1.2 });
          gsap.to(trajets, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out', stagger: 0.07, delay: 1.4 });
        }
      });
    });
  }

  /* ------------------------------------------------------------ Aimants à mots */
  function initAimants() {
    var zone = $('[data-aimants]');
    if (!zone) return;
    var mots = $$('.aimant', zone);
    var corps = mots.map(function (el) { return { el: el, x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, tenu: false }; });
    var rafId = 0;
    function mesurer() { corps.forEach(function (c) { c.w = c.el.offsetWidth; c.h = c.el.offsetHeight; }); }
    function phrase() {
      mesurer();
      var W_ = zone.clientWidth, H_ = zone.clientHeight;
      var lignes = [[]], larg = [0], maxL = Math.min(W_ * 0.86, 900);
      corps.forEach(function (c, i) {
        if (c.el.hasAttribute('data-hors')) return;
        var l = lignes.length - 1;
        if (larg[l] + c.w > maxL && lignes[l].length) { lignes.push([]); larg.push(0); l++; }
        lignes[l].push(c); larg[l] += c.w + 12;
      });
      var hTot = lignes.length * 64, y0 = H_ * 0.42 - hTot / 2;
      lignes.forEach(function (lg, li) {
        var x = (W_ - larg[li] + 12) / 2;
        lg.forEach(function (c) { c.cx = x; c.cy = y0 + li * 64; x += c.w + 12; });
      });
      var hors = corps.filter(function (c) { return c.el.hasAttribute('data-hors'); });
      var bandes = [[], []], largB = [0, 0];
      hors.forEach(function (c, i) { var k = largB[0] <= largB[1] ? 0 : 1; bandes[k].push(c); largB[k] += c.w + 28; });
      bandes.forEach(function (bd, k) {
        var x = Math.max(8, (W_ - largB[k] + 28) / 2);
        var yb = k === 0 ? Math.max(10, y0 - 64 * 1.6 - 30) : y0 + hTot + 30;
        bd.forEach(function (c, i) {
          if (x + c.w > W_ - 8) { x = 8; yb += 58; }
          c.cx = x; c.cy = clamp(yb + (i % 2 ? 18 : -6), 6, H_ - c.h - 56); x += c.w + 28;
        });
      });
    }
    function placer(c) { c.el.style.transform = 'translate(' + c.x + 'px,' + c.y + 'px) rotate(' + (c.rot || 0) + 'deg)'; }
    function tout(anim) {
      phrase();
      corps.forEach(function (c, i) {
        if (anim && anime) {
          var o = { x: c.x, y: c.y };
          gsap.to(o, { x: c.cx, y: c.cy, duration: 1, ease: 'power3.inOut', delay: i * 0.03, onUpdate: function () { c.x = o.x; c.y = o.y; placer(c); }, onComplete: function () { if (i === corps.length - 1) relancer(); } });
        } else { c.x = c.cx; c.y = c.cy; placer(c); }
        c.vx = c.vy = 0; c.rot = 0;
      });
    }
    if (calme) return;
    tout(false);
    function etape() {
      var W_ = zone.clientWidth, H_ = zone.clientHeight, bouge = false;
      corps.forEach(function (c) {
        if (c.tenu) { bouge = true; return; }
        c.x += c.vx; c.y += c.vy; c.vx *= 0.92; c.vy *= 0.92;
        if (c.x < 0) { c.x = 0; c.vx *= -0.6; } if (c.x + c.w > W_) { c.x = W_ - c.w; c.vx *= -0.6; }
        if (c.y < 0) { c.y = 0; c.vy *= -0.6; } if (c.y + c.h > H_) { c.y = H_ - c.h; c.vy *= -0.6; }
        if (Math.abs(c.vx) > 0.05 || Math.abs(c.vy) > 0.05) bouge = true;
      });
      for (var i = 0; i < corps.length; i++) for (var j = i + 1; j < corps.length; j++) {
        var a = corps[i], b = corps[j];
        var ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        var oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > 0 && oy > 0) {
          var ka = a.tenu ? 0 : 1, kb = b.tenu ? 0 : 1; if (!ka && !kb) continue;
          var s = ka + kb;
          if (ox < oy) { var dx = (a.x < b.x ? -1 : 1) * ox; a.x += dx * ka / s; b.x -= dx * kb / s; var v = (a.vx + b.vx) / 2; if (ka) a.vx = v + dx * 0.05; if (kb) b.vx = v - dx * 0.05; }
          else { var dy = (a.y < b.y ? -1 : 1) * oy; a.y += dy * ka / s; b.y -= dy * kb / s; var v2 = (a.vy + b.vy) / 2; if (ka) a.vy = v2 + dy * 0.05; if (kb) b.vy = v2 - dy * 0.05; }
          bouge = true;
        }
      }
      corps.forEach(placer);
      rafId = bouge ? requestAnimationFrame(etape) : 0;
    }
    function relancer() { if (!rafId) rafId = requestAnimationFrame(etape); }
    corps.forEach(function (c) {
      var dx = 0, dy = 0, lx = 0, ly = 0, lt = 0;
      c.el.addEventListener('pointerdown', function (e) {
        c.tenu = true; c.el.setPointerCapture(e.pointerId);
        var r = zone.getBoundingClientRect();
        dx = e.clientX - r.left - c.x; dy = e.clientY - r.top - c.y; lx = e.clientX; ly = e.clientY; lt = performance.now();
        c.el.style.zIndex = 5; c.rot = (Math.random() - 0.5) * 8; relancer();
      });
      c.el.addEventListener('pointermove', function (e) {
        if (!c.tenu) return;
        var r = zone.getBoundingClientRect(), t = performance.now(), dt = Math.max(16, t - lt);
        c.x = e.clientX - r.left - dx; c.y = e.clientY - r.top - dy;
        c.vx = (e.clientX - lx) / dt * 16; c.vy = (e.clientY - ly) / dt * 16; lx = e.clientX; ly = e.clientY; lt = t;
        placer(c);
      });
      var lacher = function () { if (!c.tenu) return; c.tenu = false; c.el.style.zIndex = ''; c.rot = 0; relancer(); };
      c.el.addEventListener('pointerup', lacher); c.el.addEventListener('pointercancel', lacher);
      c.el.addEventListener('keydown', function (e) {
        var k = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key];
        if (!k) return; e.preventDefault(); c.vx = k[0] * 0.4; c.vy = k[1] * 0.4; relancer();
      });
    });
    var btn = $('[data-aimants-phrase]');
    if (btn) btn.addEventListener('click', function () { tout(true); });
    W.addEventListener('resize', function () { tout(false); });
    if (anime) {
      /* ouverture : les mots tombent et se rangent en phrase */
      corps.forEach(function (c) { c.x = Math.random() * (zone.clientWidth - c.w); c.y = -80 - Math.random() * 200; placer(c); });
      tout(true);
    }
  }

  /* ------------------------------------------------------------ Le chœur */
  function initChoeur() {
    $$('[data-choeur]').forEach(function (z) {
      var voix = $$('.choeur__voix', z).map(function (v) { return decouperMots(v, 'mot'); });
      if (!anime) return;
      var N = voix.length, decal = 0.13;
      ST.create({
        trigger: z, start: 'top 72%', end: 'bottom 35%', scrub: true,
        onUpdate: function (s) {
          voix.forEach(function (mots, v) {
            var p = clamp((s.progress - v * decal) / (1 - decal * (N - 1)), 0, 1);
            var n = Math.round(p * mots.length);
            mots.forEach(function (m, i) { m.classList.toggle('on', i < n); m.classList.toggle('courant', i === n - 1 && p < 1); });
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------ Faire un feu */
  function initFeu() {
    if (!D.body.classList.contains('page-feu')) return;
    var lum = $('.flamme-lumiere');
    var textes = $$('.feu-texte');
    if (calme) { textes.forEach(function (t) { t.classList.add('est-eclaire'); }); return; }
    var cv = $('canvas.neige');
    if (cv) {
      var ctx = cv.getContext('2d'), flocons = [], vent = 0, cible = 0, lastX = null;
      var dim = function () {
        var dpr = Math.min(W.devicePixelRatio || 1, 2);
        cv.width = W.innerWidth * dpr; cv.height = W.innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.round(W.innerWidth * W.innerHeight / 9000);
        flocons = []; for (var i = 0; i < n; i++) flocons.push({ x: Math.random() * W.innerWidth, y: Math.random() * W.innerHeight, r: 0.6 + Math.random() * 2.2, v: 0.3 + Math.random() * 0.9, o: Math.random() * 6 });
      };
      dim(); W.addEventListener('resize', dim);
      W.addEventListener('pointermove', function (e) { if (lastX !== null) cible = clamp((e.clientX - lastX) * 0.08, -3, 3); lastX = e.clientX; }, { passive: true });
      (function neige() {
        vent = lerp(vent, cible, 0.03); cible *= 0.97;
        ctx.clearRect(0, 0, W.innerWidth, W.innerHeight);
        ctx.fillStyle = 'rgba(239,231,218,0.8)';
        flocons.forEach(function (f) {
          f.o += 0.01; f.y += f.v * (0.6 + f.r * 0.3); f.x += Math.sin(f.o) * 0.3 + vent * f.r * 0.4;
          if (f.y > W.innerHeight + 4) { f.y = -4; f.x = Math.random() * W.innerWidth; }
          if (f.x > W.innerWidth + 4) f.x = -4; if (f.x < -4) f.x = W.innerWidth + 4;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        });
        requestAnimationFrame(neige);
      })();
    }
    var px = W.innerWidth / 2, py = W.innerHeight * 0.4, dejaBouge = false;
    function eclairer() {
      if (lum) { lum.style.setProperty('--x', px + 'px'); lum.style.setProperty('--y', py + 'px'); }
      textes.forEach(function (t) {
        var r = t.getBoundingClientRect();
        var dx = Math.max(r.left - px, 0, px - r.right), dy = Math.max(r.top - py, 0, py - r.bottom);
        t.classList.toggle('est-eclaire', !dejaBouge ? true : Math.hypot(dx, dy) < 220);
      });
    }
    if (fin) W.addEventListener('pointermove', function (e) { dejaBouge = true; px = e.clientX; py = e.clientY; eclairer(); }, { passive: true });
    else { dejaBouge = true; px = W.innerWidth / 2; py = W.innerHeight * 0.55; }
    W.addEventListener('scroll', eclairer, { passive: true });
    eclairer();
    var traces = $('[data-traces]');
    if (traces && gsapOK) {
      var homme = $$('.pas-homme', traces), chien = $$('.pas-chien', traces);
      var tous = homme.concat(chien).sort(function (a, b) { return (+a.getAttribute('data-o')) - (+b.getAttribute('data-o')); });
      ST.create({ trigger: traces, start: 'top 85%', end: 'bottom 35%', scrub: true, onUpdate: function (s) { var n = Math.round(s.progress * tous.length); tous.forEach(function (p, i) { p.style.opacity = i < n ? 0.75 : 0; }); } });
    }
  }

  /* ------------------------------------------------------------ Extraits sonores (emplacements) */
  function initExtraits() {
    $$('.extrait canvas').forEach(function (cv) {
      var r = cv.getBoundingClientRect(), dpr = Math.min(W.devicePixelRatio || 1, 2);
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      var n = Math.floor(r.width / 5), s = 7;
      for (var i = 0; i < n; i++) {
        s = (s * 9301 + 49297) % 233280; var v = s / 233280;
        var hh = (0.15 + v * 0.85) * Math.sin((i / n) * Math.PI) * r.height * 0.9 + 2;
        ctx.fillStyle = 'rgba(42,36,32,.28)';
        ctx.fillRect(i * 5, (r.height - hh) / 2, 2.5, hh);
      }
    });
  }

  /* ------------------------------------------------------------ Ouvertures */
  var onde = $('#onde-clip path');
  function dessinerOnde(base, amp, phase) {
    if (!onde) return;
    var d = 'M0,1 L0,' + (base + amp * Math.sin(phase)).toFixed(4);
    for (var i = 1; i <= 40; i++) {
      var x = i / 40;
      var y = base + amp * Math.sin(phase + x * Math.PI * 3.2) * (0.6 + 0.4 * Math.sin(x * Math.PI));
      d += ' L' + x.toFixed(3) + ',' + clamp(y, 0, 1).toFixed(4);
    }
    onde.setAttribute('d', d + ' L1,1 Z');
  }

  function ouvertureAccueil() {
    var hero = $('.hero');
    if (!hero) return false;
    var titre = $('.hero .neon');
    if (!anime) { if (titre) allumer(titre); return true; }
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (entete) tl.from(entete, { y: -30, autoAlpha: 0, duration: 0.6 }, 0);
    if (titre) tl.call(function () { allumer(titre); }, null, 0.15);
    if (robin) tl.call(function () { robin.arrivee(0); }, null, 0.5);
    var chapeau = $('.hero .chapeau');
    if (chapeau) { var mots = decouperMots(chapeau, 'mot-c'); tl.from(mots, { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.025 }, 0.55); }
    tl.from($$('.hero .actions > *, .hero .prochaine-pastille'), { autoAlpha: 0, y: 12, duration: 0.5, stagger: 0.08 }, 0.9);
    if (onde) {
      var o = { b: 1, a: 0.06, p: 0 };
      tl.to(o, { b: 0.07, a: 0.035, p: 2.4, duration: 1.6, ease: 'power3.inOut', onUpdate: function () { dessinerOnde(o.b, o.a, o.p); } }, 0.45);
      var img = $('.hero__image img');
      if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 2, ease: 'power2.out' }, 0.45);
    }
    if (titre) suivreNeon(titre);
    return true;
  }

  function ouverturePage() {
    var titre = $('.ouverture .neon, .erreur-404 .neon');
    if (titre) {
      if (anime) { gsap.delayedCall(0.15, function () { allumer(titre); }); suivreNeon(titre); } else allumer(titre);
    }
    if (robin) { if (anime) gsap.delayedCall(0.35, function () { robin.arrivee(0); }); }
    var img = $('.ouverture__image');
    if (img && anime) gsap.fromTo(img, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power3.inOut', delay: 0.35, clearProps: 'clipPath' });
  }

  function neonAuDefilement() {
    $$('.neon').forEach(function (n) {
      if (n.closest('.hero') || n.closest('.ouverture') || n.closest('.menu') || n.closest('.feuillet') || n.closest('.erreur-404')) return;
      if (!anime) { allumer(n); return; }
      ST.create({ trigger: n, start: 'top 86%', once: true, onEnter: function () { allumer(n); } });
    });
  }

  /* ------------------------------------------------------------ Lancement */
  function lancer() {
    initRobin();
    initDit();
    neonAuDefilement();
    if (!ouvertureAccueil()) ouverturePage();
    initCurseur();
    initMagnetique();
    initFeuillet();
    initParallaxe();
    initCompteurs();
    initHorizontal();
    initCordes();
    initProchaine();
    initAgenda();
    initDatesLiees();
    initFiltres();
    initLettres();
    initCopie();
    initDemande();
    initCarte();
    initAimants();
    initChoeur();
    initFeu();
    initExtraits();
    initFil();
    if (gsapOK) { ST.refresh(); W.addEventListener('load', function () { ST.refresh(); }); }
    D.dispatchEvent(new CustomEvent('pn:pret'));
  }

  var polices = D.fonts && D.fonts.ready ? Promise.race([D.fonts.ready, new Promise(function (r) { setTimeout(r, 1200); })]) : Promise.resolve();
  polices.then(lancer);

  W.PNApp = { allumer: allumer, aVenir: aVenir, passes: passes, parseDebut: parseDebut };
})();
