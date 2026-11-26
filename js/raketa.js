/* Animirana raketa u pojasu "Delatnost" (canvas, bez biblioteka).
   Uz prefers-reduced-motion crta se jedna staticna slika; van kadra animacija stoji. */
(function () {
  var canvas = document.getElementById('raketa');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, S = 1, CX = 0, CY = 0, DPR = 1, raf = null, t = 0;
  var mouse = { x: 0, y: 0 }, glow = null, stars = [], parts = [];
  var RB = 0.058;                       /* poluprecnik tela u duzinama rakete */

  function radius(x) {                  /* x: -0.5 rep ... 0.5 vrh */
    if (x > 0.16) {                     /* fon Karmanov vrh */
      var u = Math.min(1, Math.max(0, (0.5 - x) / 0.34));
      var th = Math.acos(1 - 2 * u);
      return RB * Math.sqrt((th - Math.sin(2 * th) / 2) / Math.PI);
    }
    if (x < -0.43) return RB * (0.78 + 0.22 * (x + 0.5) / 0.07);
    return RB;
  }

  var rings = [], x;
  for (x = -0.5; x <= 0.5001; x += 0.02) rings.push(x);
  var FINS = [0.785, 2.356, 3.927, 5.498];
  var FIN = [[-0.31, 0], [-0.41, 0.095], [-0.50, 0.095], [-0.50, 0]];   /* x, visina iznad tela */

  function makeGlow() {
    var g = 48 * DPR;
    glow = document.createElement('canvas');
    glow.width = glow.height = g;
    var c = glow.getContext('2d');
    var gr = c.createRadialGradient(g / 2, g / 2, 0, g / 2, g / 2, g / 2);
    gr.addColorStop(0, 'rgba(210, 235, 255, 0.85)');
    gr.addColorStop(0.35, 'rgba(120, 195, 255, 0.32)');
    gr.addColorStop(1, 'rgba(111, 194, 255, 0)');
    c.fillStyle = gr;
    c.fillRect(0, 0, g, g);
  }

  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = r.width; H = r.height;
    DPR = Math.min(window.devicePixelRatio || 1, W <= 700 ? 2 : 2.5);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    S = Math.min(W * 0.66, H * 1.55);
    CX = W * 0.58; CY = H * 0.45;
    stars = [];
    for (var i = 0; i < (W <= 700 ? 50 : 90); i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.2 + 0.4, d: Math.random() * 0.8 + 0.2 });
    }
    makeGlow();
  }

  /* telo -> ekran: valjanje oko ose, propinjanje, skretanje, perspektiva */
  var cr, sr, cp, sp, cw, sw;
  function setAngles(roll, pitch, yaw) {
    cr = Math.cos(roll); sr = Math.sin(roll); cp = Math.cos(pitch); sp = Math.sin(pitch); cw = Math.cos(yaw); sw = Math.sin(yaw);
  }
  function proj(px, py, pz, rolled) {
    var y1 = rolled ? py * cr - pz * sr : py, z1 = rolled ? py * sr + pz * cr : pz;
    var x2 = px * cp - y1 * sp, y2 = px * sp + y1 * cp;
    var x3 = x2 * cw + z1 * sw, z3 = -x2 * sw + z1 * cw;
    var k = 1 / (1 - z3 * 0.45);
    return { x: CX + x3 * S * k, y: CY - y2 * S * k, z: z3, k: k };
  }
  function facing(ny, nz) {             /* koliko je povrsina okrenuta ka posmatracu: 0..1 */
    var y1 = ny * cr - nz * sr, z1 = ny * sr + nz * cr;
    var x2 = -y1 * sp;
    return (1 + (-x2 * sw + z1 * cw)) / 2;
  }

  function emit(p) {
    p.a = Math.random() * 6.283; p.r = Math.random() * 0.6; p.v = 0.55 + Math.random() * 0.5; p.age = 0; p.life = 0.75 + Math.random() * 0.55;
  }
  for (var n = 0; n < 150; n++) { var q = {}; emit(q); q.age = Math.random() * q.life; parts.push(q); }

  function frame(dt) {
    ctx.clearRect(0, 0, W, H);
    var pitch = 0.33 + 0.025 * Math.sin(t * 0.7) - mouse.y * 0.10, yaw = -0.42 + mouse.x * 0.22;
    setAngles(t * 0.55, pitch, yaw);
    var i, j, p, a, b;

    /* zvezde klize unazad duz pravca leta */
    var vx = -Math.cos(pitch) * 26 * dt, vy = Math.sin(pitch) * 26 * dt;
    for (i = 0; i < stars.length; i++) {
      p = stars[i];
      p.x += vx * p.d; p.y += vy * p.d;
      if (p.x < -4) { p.x = W + 4; p.y = Math.random() * H; }
      if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; }
      ctx.fillStyle = 'rgba(200, 225, 255, ' + (0.18 + 0.4 * p.d) + ')';
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }

    /* mlaz: cestice iz mlaznice, sire se i gase */
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      p.age += dt;
      if (p.age > p.life) emit(p);
      var f = p.age / p.life, sx = -0.5 - 0.012 - f * p.v * 0.62, rr = RB * (0.38 + f * 1.5) * p.r;
      a = proj(sx, Math.cos(p.a) * rr, Math.sin(p.a) * rr, false);
      var size = (12 + f * 40) * a.k * (S / 520);
      ctx.globalAlpha = Math.pow(1 - f, 1.5) * 0.62;
      ctx.drawImage(glow, a.x - size / 2, a.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    /* izvodnice tela */
    ctx.lineWidth = 1;
    for (j = 0; j < 12; j++) {
      var ang = j * 6.283 / 12, cy = Math.cos(ang), cz = Math.sin(ang), fr = facing(cy, cz);
      ctx.strokeStyle = 'rgba(111, 194, 255, ' + (0.05 + fr * fr * 0.42) + ')';
      ctx.beginPath();
      for (i = 0; i < rings.length; i++) {
        var rr2 = radius(rings[i]);
        a = proj(rings[i], cy * rr2, cz * rr2, true);
        if (i) ctx.lineTo(a.x, a.y); else ctx.moveTo(a.x, a.y);
      }
      ctx.stroke();
    }

    /* prstenovi od tacaka */
    for (i = 0; i < rings.length; i++) {
      var rad = radius(rings[i]), cnt = rad < 0.012 ? 6 : 22;
      for (j = 0; j < cnt; j++) {
        var an = j * 6.283 / cnt + i * 0.14, ny = Math.cos(an), nz = Math.sin(an), fc = facing(ny, nz);
        a = proj(rings[i], ny * rad, nz * rad, true);
        ctx.fillStyle = 'rgba(150, 208, 255, ' + (0.07 + fc * fc * 0.8) + ')';
        ctx.beginPath();
        ctx.arc(a.x, a.y, (0.55 + fc * 1.25) * a.k * (S / 520), 0, 6.283);
        ctx.fill();
      }
    }

    /* krilca */
    for (j = 0; j < FINS.length; j++) {
      var fy = Math.cos(FINS[j]), fz = Math.sin(FINS[j]), ff = facing(-fz, fy), vis = 0.18 + 0.6 * Math.abs(2 * ff - 1);
      ctx.strokeStyle = 'rgba(168, 220, 255, ' + vis + ')';
      ctx.fillStyle = 'rgba(111, 194, 255, ' + (vis * 0.16) + ')';
      ctx.beginPath();
      for (i = 0; i < FIN.length; i++) {
        var hr = radius(FIN[i][0]) + FIN[i][1];
        b = proj(FIN[i][0], fy * hr, fz * hr, true);
        if (i) ctx.lineTo(b.x, b.y); else ctx.moveTo(b.x, b.y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  var last = 0;
  function tick(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now; t += dt;
    frame(dt);
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function () { resize(); if (reduce) { frame(0); } });
  resize();
  if (reduce) { t = 1.4; frame(0); return; }
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    var host = canvas.parentElement;
    host.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2; mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    host.addEventListener('mouseleave', function () { mouse.x = 0; mouse.y = 0; });
  }
  raf = requestAnimationFrame(tick);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
      else { cancelAnimationFrame(raf); raf = null; }
    }).observe(canvas);
  }
})();
