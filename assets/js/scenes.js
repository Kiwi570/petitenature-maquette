/*
  Visuels provisoires dessinés en code, en attendant les images Grok.
  Chaque <canvas data-scene="..."> est peint ici. Rien n'est une photo de la compagnie.
*/
(function () {
  'use strict';

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function grain(ctx, w, h, force) {
    const r = rng(7);
    const n = Math.floor(w * h / 90);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const v = r();
      ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,' + (force * 0.5) + ')' : 'rgba(0,0,0,' + force + ')';
      ctx.fillRect(r() * w, r() * h, 1, 1);
    }
    ctx.restore();
  }

  function grad(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }

  function sapin(ctx, x, base, h, w, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    const etages = 5;
    for (let i = 0; i < etages; i++) {
      const y = base - (h / etages) * i;
      const ww = w * (1 - i / (etages + 0.6));
      ctx.moveTo(x - ww / 2, y);
      ctx.lineTo(x, y - h / etages * 1.7);
      ctx.lineTo(x + ww / 2, y);
    }
    ctx.fill();
    ctx.fillRect(x - w * 0.04, base, w * 0.08, h * 0.06);
  }

  function chaise(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x + s * 0.1, y - s * 1.55, s * 0.62, s * 0.62);
    ctx.fillRect(x + s * 0.1, y - s * 1.0, s * 0.07, s * 0.35);
    ctx.fillRect(x + s * 0.65, y - s * 1.0, s * 0.07, s * 0.35);
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.62); ctx.lineTo(x + s * 0.82, y - s * 0.62); ctx.lineTo(x + s * 0.9, y - s * 0.5); ctx.lineTo(x + s * 0.08, y - s * 0.5); ctx.fill();
    ctx.fillRect(x + s * 0.06, y - s * 0.52, s * 0.07, s * 0.52);
    ctx.fillRect(x + s * 0.8, y - s * 0.52, s * 0.07, s * 0.52);
  }

  function pupitre(ctx, x, y, s, col) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.35, y); ctx.lineTo(x, y - s * 0.25); ctx.lineTo(x + s * 0.35, y); ctx.stroke();
    ctx.save(); ctx.translate(x, y - s * 1.55); ctx.rotate(-0.35);
    ctx.fillRect(-s * 0.42, -s * 0.28, s * 0.84, s * 0.32);
    ctx.restore();
  }

  const peintres = {
    'feu-neige': function (ctx, w, h, t) {
      ctx.fillStyle = grad(ctx, 0, 0, 0, h, [[0, '#0b1020'], [0.6, '#16203a'], [1, '#1d2433']]);
      ctx.fillRect(0, 0, w, h);
      const r = rng(11);
      for (let i = 0; i < 120; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + r() * 0.5) + ')'; ctx.fillRect(r() * w, r() * h * 0.5, 1.2, 1.2); }
      ctx.filter = 'blur(1.5px)';
      for (let i = 0; i < 12; i++) sapin(ctx, r() * w, h * 0.6, h * (0.25 + r() * 0.2), h * 0.12, '#1a2236');
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(40,52,80,.35)'; ctx.fillRect(0, h * 0.3, w, h * 0.4);
      for (let i = 0; i < 18; i++) sapin(ctx, r() * w, h * (0.62 + r() * 0.1), h * (0.35 + r() * 0.3), h * 0.16, '#0a0f1a');
      ctx.fillStyle = grad(ctx, 0, h * 0.68, 0, h, [[0, '#2b3348'], [1, '#d9dde8']]);
      ctx.beginPath(); ctx.moveTo(0, h * 0.72); ctx.quadraticCurveTo(w * 0.5, h * 0.64, w, h * 0.74); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      const fx = w * 0.52, fy = h * 0.8;
      const flick = 0.85 + Math.sin(t * 7) * 0.05 + Math.sin(t * 13) * 0.04;
      const g = ctx.createRadialGradient(fx, fy, 2, fx, fy, h * 0.55 * flick);
      g.addColorStop(0, 'rgba(255,190,110,0.95)'); g.addColorStop(0.15, 'rgba(255,90,50,0.55)'); g.addColorStop(0.5, 'rgba(255,43,58,0.12)'); g.addColorStop(1, 'rgba(255,43,58,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd59a';
      ctx.beginPath(); ctx.moveTo(fx - 14, fy); ctx.quadraticCurveTo(fx, fy - 46 * flick, fx + 14, fy); ctx.fill();
      ctx.fillStyle = '#ff5a3a';
      ctx.beginPath(); ctx.moveTo(fx - 9, fy); ctx.quadraticCurveTo(fx - 2, fy - 28 * flick, fx + 9, fy); ctx.fill();
      const rs = rng(5);
      for (let i = 0; i < 26; i++) {
        const p = (rs() + t * (0.08 + rs() * 0.1)) % 1;
        ctx.fillStyle = 'rgba(255,' + (140 + rs() * 80) + ',80,' + (1 - p) + ')';
        ctx.fillRect(fx + (rs() - 0.5) * 60 + Math.sin(p * 9 + i) * 10, fy - p * h * 0.5, 2, 2);
      }
      grain(ctx, w, h, 0.05);
    },

    'foret-neige': function (ctx, w, h) {
      ctx.fillStyle = grad(ctx, 0, 0, 0, h, [[0, '#c9ced6'], [0.55, '#dfe3e8'], [1, '#f3f4f6']]);
      ctx.fillRect(0, 0, w, h);
      const r = rng(23);
      for (let rang = 0; rang < 3; rang++) {
        const col = ['#a9b1bc', '#7d8794', '#4c5562'][rang];
        ctx.filter = 'blur(' + (2 - rang) * 1.5 + 'px)';
        for (let i = 0; i < 26; i++) sapin(ctx, r() * w, h * (0.52 + rang * 0.08), h * (0.25 + r() * 0.2 + rang * 0.08), h * (0.1 + rang * 0.03), col);
        ctx.filter = 'none';
        ctx.fillStyle = grad(ctx, 0, h * (0.3 + rang * 0.08), 0, h * (0.62 + rang * 0.08), [[0, 'rgba(225,229,234,0)'], [1, 'rgba(225,229,234,.55)']]);
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = '#f5f6f8';
      ctx.beginPath(); ctx.moveTo(0, h * 0.7); ctx.quadraticCurveTo(w * 0.5, h * 0.66, w, h * 0.72); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      ctx.strokeStyle = 'rgba(120,130,145,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.3, h); ctx.quadraticCurveTo(w * 0.5, h * 0.8, w * 0.56, h * 0.69); ctx.stroke();
      ctx.fillStyle = '#2a2420';
      const x = w * 0.555, y = h * 0.69, s = h * 0.03;
      ctx.fillRect(x, y - s * 1.8, s * 0.45, s * 1.8);
      ctx.beginPath(); ctx.arc(x + s * 0.22, y - s * 2.05, s * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x + s * 0.8, y - s * 0.55, s * 0.9, s * 0.35);
      ctx.fillRect(x + s * 1.55, y - s * 0.8, s * 0.3, s * 0.3);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (let i = 0; i < 300; i++) ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
      grain(ctx, w, h, 0.04);
    },

    'scene': function (ctx, w, h) {
      ctx.fillStyle = '#120f0d'; ctx.fillRect(0, 0, w, h);
      const x = w * 0.5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const cone = ctx.createLinearGradient(x, 0, x, h * 0.85);
      cone.addColorStop(0, 'rgba(255,236,200,0.28)'); cone.addColorStop(1, 'rgba(255,220,170,0.04)');
      ctx.fillStyle = cone;
      ctx.beginPath(); ctx.moveTo(x - w * 0.02, 0); ctx.lineTo(x + w * 0.02, 0); ctx.lineTo(x + w * 0.2, h * 0.86); ctx.lineTo(x - w * 0.2, h * 0.86); ctx.fill();
      const pool = ctx.createRadialGradient(x, h * 0.86, 4, x, h * 0.86, w * 0.26);
      pool.addColorStop(0, 'rgba(255,225,180,0.35)'); pool.addColorStop(1, 'rgba(255,225,180,0)');
      ctx.fillStyle = pool; ctx.fillRect(0, h * 0.6, w, h * 0.4);
      const r = rng(3);
      for (let i = 0; i < 160; i++) { const yy = r() * h * 0.85; const spread = w * 0.02 + (yy / h) * w * 0.2; ctx.fillStyle = 'rgba(255,240,210,' + r() * 0.35 + ')'; ctx.fillRect(x + (r() - 0.5) * spread * 2, yy, 1.4, 1.4); }
      ctx.restore();
      ctx.fillStyle = '#1e1916'; ctx.fillRect(0, h * 0.86, w, h * 0.14);
      const s = h * 0.13;
      chaise(ctx, x - s * 1.4, h * 0.86, s, '#050404');
      pupitre(ctx, x + s * 0.6, h * 0.86, s, '#050404');
      ctx.fillStyle = 'rgba(255,43,58,.9)'; ctx.shadowColor = '#ff2b3a'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(x + s * 1.5, h * 0.86 - s * 1.55, 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      grain(ctx, w, h, 0.06);
    },

    'metronome': function (ctx, w, h) {
      ctx.fillStyle = grad(ctx, 0, 0, w, h, [[0, '#2a221d'], [1, '#120f0d']]); ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.3, h * 0.2, 4, w * 0.3, h * 0.2, w * 0.9);
      g.addColorStop(0, 'rgba(255,214,160,.32)'); g.addColorStop(1, 'rgba(255,214,160,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const cx = w * 0.5, base = h * 0.8, s = Math.min(w, h) * 0.5;
      ctx.fillStyle = '#5a3f2b';
      ctx.beginPath(); ctx.moveTo(cx - s * 0.32, base); ctx.lineTo(cx - s * 0.12, base - s); ctx.lineTo(cx + s * 0.12, base - s); ctx.lineTo(cx + s * 0.32, base); ctx.fill();
      ctx.fillStyle = '#e9dcc5'; ctx.fillRect(cx - s * 0.05, base - s * 0.9, s * 0.1, s * 0.6);
      ctx.strokeStyle = '#d9b77a'; ctx.lineWidth = 3;
      for (let k = -2; k <= 2; k++) {
        ctx.globalAlpha = k === 0 ? 1 : 0.18;
        ctx.save(); ctx.translate(cx, base - s * 0.25); ctx.rotate(k * 0.18);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.85); ctx.stroke();
        ctx.fillStyle = '#d9b77a'; ctx.fillRect(-6, -s * 0.6, 12, 10);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      grain(ctx, w, h, 0.06);
    },

    'lampe': function (ctx, w, h) {
      ctx.fillStyle = '#d9cfbc'; ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.5, h * 0.3, 8, w * 0.5, h * 0.3, h * 0.9);
      g.addColorStop(0, 'rgba(255,240,205,1)'); g.addColorStop(0.5, 'rgba(240,222,186,.6)'); g.addColorStop(1, 'rgba(90,70,55,.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const r = rng(9);
      for (let i = 0; i < 7; i++) {
        ctx.save(); ctx.translate(w * (0.25 + r() * 0.5), h * (0.45 + r() * 0.35)); ctx.rotate((r() - 0.5) * 0.6);
        ctx.fillStyle = 'rgba(250,246,236,.95)'; ctx.shadowColor = 'rgba(40,30,20,.25)'; ctx.shadowBlur = 12;
        ctx.fillRect(-w * 0.16, -h * 0.11, w * 0.32, h * 0.22);
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(42,36,32,.18)';
        for (let l = 0; l < 6; l++) ctx.fillRect(-w * 0.12, -h * 0.08 + l * h * 0.03, w * (0.18 + r() * 0.06), 2);
        ctx.restore();
      }
      grain(ctx, w, h, 0.05);
    },

    'route': function (ctx, w, h) {
      ctx.fillStyle = grad(ctx, 0, 0, 0, h * 0.55, [[0, '#9fb0c4'], [0.55, '#e7c9b3'], [1, '#f2dcc4']]);
      ctx.fillRect(0, 0, w, h);
      const hz = h * 0.52;
      const sun = ctx.createRadialGradient(w * 0.62, hz, 2, w * 0.62, hz, h * 0.5);
      sun.addColorStop(0, 'rgba(255,236,200,.95)'); sun.addColorStop(1, 'rgba(255,236,200,0)');
      ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = grad(ctx, 0, hz, 0, h, [[0, '#a59a7c'], [1, '#5d5541']]);
      ctx.fillRect(0, hz, w, h - hz);
      const vx = w * 0.5;
      ctx.fillStyle = '#4a4339';
      ctx.beginPath(); ctx.moveTo(vx - 2, hz); ctx.lineTo(vx + 2, hz); ctx.lineTo(w * 0.72, h); ctx.lineTo(w * 0.28, h); ctx.fill();
      ctx.strokeStyle = 'rgba(240,230,210,.6)'; ctx.setLineDash([12, 18]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(vx, hz); ctx.lineTo(vx, h); ctx.stroke(); ctx.setLineDash([]);
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 14; i++) {
          const p = Math.pow(i / 13, 1.8);
          const x = vx + side * (6 + p * w * 0.36);
          const base = hz + p * (h - hz) * 0.75;
          const th = 18 + p * h * 0.75;
          ctx.fillStyle = 'rgba(44,52,40,' + (0.45 + p * 0.5) + ')';
          ctx.beginPath(); ctx.ellipse(x, base - th * 0.55, 3 + p * 22, th * 0.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(x - 1 - p * 2, base - th * 0.1, 2 + p * 4, th * 0.12);
        }
      }
      ctx.fillStyle = grad(ctx, 0, hz - h * 0.06, 0, hz + h * 0.12, [[0, 'rgba(245,235,220,0)'], [0.5, 'rgba(245,235,220,.55)'], [1, 'rgba(245,235,220,0)']]);
      ctx.fillRect(0, hz - h * 0.06, w, h * 0.18);
      ctx.fillStyle = 'rgba(255,214,120,.9)';
      [[0.14, 0], [0.17, 0.004], [0.85, 0.002]].forEach(function (p) { ctx.fillRect(w * p[0], hz - 6 - p[1] * h, 3, 3); });
      grain(ctx, w, h, 0.05);
    },

    'salle': function (ctx, w, h) {
      ctx.fillStyle = '#efe6d4'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) {
        const x = w * (0.08 + i * 0.23);
        ctx.fillStyle = grad(ctx, 0, h * 0.06, 0, h * 0.56, [[0, '#cfe0e6'], [1, '#e9efe8']]);
        ctx.fillRect(x, h * 0.06, w * 0.17, h * 0.5);
        ctx.fillStyle = 'rgba(70,110,70,.28)';
        ctx.beginPath(); ctx.ellipse(x + w * 0.08, h * 0.45, w * 0.1, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d8ccb6'; ctx.lineWidth = 4; ctx.strokeRect(x, h * 0.06, w * 0.17, h * 0.5);
      }
      ctx.fillStyle = grad(ctx, 0, h * 0.62, 0, h, [[0, '#d6c7aa'], [1, '#b9a682']]);
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.fillStyle = 'rgba(255,248,230,.5)';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w * (0.08 + i * 0.23), h * 0.62); ctx.lineTo(w * (0.25 + i * 0.23), h * 0.62); ctx.lineTo(w * (0.32 + i * 0.23), h); ctx.lineTo(w * (0.12 + i * 0.23), h); ctx.fill(); }
      for (let row = 0; row < 3; row++) {
        const y = h * (0.78 + row * 0.08), s = h * (0.06 + row * 0.02);
        for (let i = 0; i < 7 + row; i++) chaise(ctx, w * 0.08 + i * (w * 0.84 / (7 + row)), y, s, 'rgba(60,48,38,' + (0.55 + row * 0.15) + ')');
      }
      pupitre(ctx, w * 0.5, h * 0.7, h * 0.09, '#3a2f27');
      ctx.fillStyle = '#ff2b3a'; ctx.shadowColor = '#ff2b3a'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(w * 0.56, h * 0.58, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      grain(ctx, w, h, 0.04);
    },

    'givre': function (ctx, w, h) {
      ctx.fillStyle = grad(ctx, 0, 0, w, h, [[0, '#1c2a4a'], [1, '#0e1526']]); ctx.fillRect(0, 0, w, h);
      const r = rng(31);
      ctx.strokeStyle = 'rgba(220,235,255,.5)'; ctx.lineCap = 'round';
      function branche(x, y, a, l, d) {
        if (d > 6 || l < 3) return;
        const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l;
        ctx.lineWidth = Math.max(0.4, 2.2 - d * 0.35);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
        branche(x2, y2, a + 0.5 + (r() - 0.5) * 0.3, l * 0.62, d + 1);
        branche(x2, y2, a - 0.5 + (r() - 0.5) * 0.3, l * 0.62, d + 1);
        branche(x2, y2, a + (r() - 0.5) * 0.2, l * 0.7, d + 1);
      }
      for (let i = 0; i < 14; i++) branche(r() * w, r() * h, r() * Math.PI * 2, 30 + r() * 70, 0);
      grain(ctx, w, h, 0.05);
    },

    'onde': function (ctx, w, h) {
      ctx.fillStyle = '#1b1714'; ctx.fillRect(0, 0, w, h);
      const r = rng(17);
      for (let v = 0; v < 5; v++) {
        const y0 = h * (0.18 + v * 0.16);
        ctx.strokeStyle = v === 2 ? '#ff2b3a' : 'rgba(239,231,218,' + (0.25 + v * 0.08) + ')';
        if (v === 2) { ctx.shadowColor = '#ff2b3a'; ctx.shadowBlur = 10; }
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const env = Math.sin((x / w) * Math.PI) * (0.4 + r() * 0.6);
          const y = y0 + Math.sin(x * 0.05 + v) * h * 0.04 * env + (r() - 0.5) * h * 0.05 * env;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      grain(ctx, w, h, 0.05);
    },

    'repas': function (ctx, w, h) {
      ctx.fillStyle = '#1b1714'; ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 4, w * 0.5, h * 0.45, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(255,214,160,.10)'); g.addColorStop(1, 'rgba(255,214,160,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.3;
      function trait(largeur, couleur, flou, dessin) {
        ctx.save(); ctx.strokeStyle = couleur; ctx.lineWidth = largeur; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = '#ff2b3a'; ctx.shadowBlur = flou; ctx.beginPath(); dessin(); ctx.stroke(); ctx.restore();
      }
      function dessin() {
        ctx.moveTo(cx + R, cy); ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.moveTo(cx + R * 0.72, cy); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
        const xf = cx - R * 1.45;
        ctx.moveTo(xf, cy - R * 0.95); ctx.lineTo(xf, cy + R * 0.95);
        for (let k = -1; k <= 1; k++) { ctx.moveTo(xf + k * R * 0.09, cy - R * 0.95); ctx.lineTo(xf + k * R * 0.09, cy - R * 0.55); }
        ctx.moveTo(xf - R * 0.09, cy - R * 0.55); ctx.quadraticCurveTo(xf, cy - R * 0.4, xf + R * 0.09, cy - R * 0.55);
        const xc = cx + R * 1.45;
        ctx.moveTo(xc, cy - R * 0.95); ctx.quadraticCurveTo(xc + R * 0.16, cy - R * 0.5, xc, cy - R * 0.05);
        ctx.lineTo(xc, cy + R * 0.95);
      }
      trait(6, 'rgba(255,43,58,.35)', 18, dessin);
      trait(1.6, '#ffd9d6', 8, dessin);
      grain(ctx, w, h, 0.05);
    }
  };

  const anim = [];
  function peindre(cv) {
    const type = cv.getAttribute('data-scene');
    const f = peintres[type];
    if (!f) return;
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(10, Math.round(rect.width)), h = Math.max(10, Math.round(rect.height));
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    f(ctx, w, h, 0);
    cv._peindre = function (t) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); f(ctx, w, h, t); };
  }

  function tout() {
    document.querySelectorAll('canvas[data-scene]').forEach(peindre);
  }

  window.PNScenes = { tout: tout, peindre: peindre };

  let resizeT;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(tout, 200); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tout); else tout();

  /* Le feu de la porte « Créations » vit doucement, seulement s'il est visible et hors mode calme. */
  function boucle() {
    const calme = document.documentElement.classList.contains('calme');
    const t = performance.now() / 1000;
    document.querySelectorAll('canvas[data-scene="feu-neige"]').forEach(function (cv) {
      if (calme || !cv._peindre || !cv._visible) return;
      cv._peindre(t);
    });
    requestAnimationFrame(boucle);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target._visible = e.isIntersecting; }); });
    const obs = function () { document.querySelectorAll('canvas[data-scene="feu-neige"]').forEach(function (c) { io.observe(c); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', obs); else obs();
  }
  requestAnimationFrame(boucle);
})();
