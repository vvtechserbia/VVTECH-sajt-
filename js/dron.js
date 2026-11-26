/* Animirani dron u pojasu "Uredjaji i softver" (canvas, bez biblioteka).
   Elise se okrecu, letelica lebdi i polako se okrece; van kadra animacija stoji. */
(function () {
  var canvas = document.getElementById('dron');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, S = 1, CX = 0, CY = 0, OY = 0, DPR = 1, raf = null, t = 0, last = 0;
  var mouse = { x: 0, y: 0 }, stars = [], glow = null;
  var A = 0.36, RR = 0.25, MOT = [[A, A], [-A, A], [-A, -A], [A, -A]], body = [], i, j;
  for (i = 0; i < 11; i++) {                      /* trup: tacke na elipsoidu */
    var v = -1 + 2 * (i + 0.5) / 11, rr = Math.sqrt(1 - v * v), n = Math.max(6, Math.round(30 * rr));
    for (j = 0; j < n; j++) { var a0 = j * 6.283 / n + i * 0.3; body.push([Math.cos(a0) * rr * 0.215, v * 0.075, Math.sin(a0) * rr * 0.15]); }
  }

  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = r.width; H = r.height;
    DPR = Math.min(window.devicePixelRatio || 1, W <= 700 ? 2 : 2.5);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    S = Math.min(W * 0.54, H * 1.12); CX = W * 0.50; CY = H * 0.55;
    stars = [];
    for (var k = 0; k < (W <= 700 ? 45 : 80); k++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.2 + 0.4, p: Math.random() * 6.283 });
    var g = 40 * DPR;
    glow = document.createElement('canvas'); glow.width = glow.height = g;
    var c = glow.getContext('2d'), gr = c.createRadialGradient(g / 2, g / 2, 0, g / 2, g / 2, g / 2);
    gr.addColorStop(0, 'rgba(210, 235, 255, 0.9)'); gr.addColorStop(0.35, 'rgba(120, 195, 255, 0.3)'); gr.addColorStop(1, 'rgba(111, 194, 255, 0)');
    c.fillStyle = gr; c.fillRect(0, 0, g, g);
  }

  var cr, sr, cp, sp, cw, sw, ct, st;
  function proj(x, y, z) {                         /* valjanje, propinjanje, skretanje, pogled odozgo, perspektiva */
    var x1 = x * cr - y * sr, y1 = x * sr + y * cr;
    var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
    var x3 = x1 * cw + z2 * sw, z3 = -x1 * sw + z2 * cw;
    var y4 = y2 * ct - z3 * st, z4 = y2 * st + z3 * ct, k = 1 / (1 - z4 * 0.4);
    return { x: CX + x3 * S * k, y: CY + OY - y4 * S * k, z: z4, k: k };
  }
  function line(a, b, alpha, w) {
    ctx.strokeStyle = 'rgba(140, 205, 255, ' + alpha + ')'; ctx.lineWidth = w || 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  function dot(p, alpha, r) {
    ctx.fillStyle = 'rgba(150, 208, 255, ' + alpha + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, r * p.k * (S / 420), 0, 6.283); ctx.fill();
  }

  function rotor(m, idx) {
    var mx = m[0], mz = m[1], c0 = proj(mx, 0.055, mz), near = (c0.z + 0.45) / 0.9, al = 0.25 + 0.6 * Math.max(0, Math.min(1, near)), k, a, p, q;
    line(proj(mx * 0.34, 0.012, mz * 0.34), proj(mx, 0.012, mz), al * 0.9, 2.2);       /* ruka */
    line(proj(mx * 0.34, -0.012, mz * 0.34), proj(mx, -0.012, mz), al * 0.55, 1.2);
    for (k = 1; k <= 5; k++) dot(proj(mx * (0.30 + 0.14 * k), 0.0, mz * (0.30 + 0.14 * k)), al, 1.3);
    for (k = 0; k < 8; k++) {                                                          /* motor */
      a = k * 0.785; p = proj(mx + Math.cos(a) * 0.042, -0.02, mz + Math.sin(a) * 0.042); q = proj(mx + Math.cos(a) * 0.042, 0.05, mz + Math.sin(a) * 0.042);
      line(p, q, al * 0.75, 1.3); dot(q, al, 1.3); dot(p, al * 0.7, 1.1);
    }
    ctx.strokeStyle = 'rgba(111, 194, 255, ' + (al * 0.6) + ')'; ctx.fillStyle = 'rgba(111, 194, 255, ' + (al * 0.07) + ')'; ctx.lineWidth = 1.2; ctx.beginPath();   /* disk elise */
    for (k = 0; k <= 40; k++) { a = k * 6.283 / 40; p = proj(mx + Math.cos(a) * RR, 0.058, mz + Math.sin(a) * RR); if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
    ctx.fill(); ctx.stroke();
    var ph = t * (reduce ? 9 : 17) * (idx % 2 ? -1 : 1) + idx;                          /* lopatice sa tragom */
    for (k = 0; k < 4; k++) {
      a = ph - k * 0.22 * (idx % 2 ? -1 : 1);
      p = proj(mx + Math.cos(a) * RR, 0.058, mz + Math.sin(a) * RR); q = proj(mx - Math.cos(a) * RR, 0.058, mz - Math.sin(a) * RR);
      line(p, q, al * (0.85 - k * 0.22), k ? 1.2 : 2.2);
    }
    var gsz = 26 * c0.k * (S / 420); ctx.globalAlpha = al * (idx === 0 || idx === 3 ? 0.9 : 0.45); ctx.drawImage(glow, c0.x - gsz / 2, c0.y - gsz / 2, gsz, gsz); ctx.globalAlpha = 1;
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    var k, p, q;
    for (k = 0; k < stars.length; k++) {
      p = stars[k]; ctx.fillStyle = 'rgba(200, 225, 255, ' + (0.22 + 0.22 * Math.sin(t * 1.6 + p.p)) + ')'; ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    var roll = (reduce ? 0.03 : 0.07) * Math.sin(t * 0.9), pitch = (reduce ? 0.03 : 0.06) * Math.sin(t * 0.7 + 1), yaw = t * (reduce ? 0.22 : 0.34) + mouse.x * 0.35, tilt = 0.50 + mouse.y * 0.12;
    cr = Math.cos(roll); sr = Math.sin(roll); cp = Math.cos(pitch); sp = Math.sin(pitch); cw = Math.cos(yaw); sw = Math.sin(yaw); ct = Math.cos(tilt); st = Math.sin(tilt);
    OY = reduce ? 0 : Math.sin(t * 1.3) * H * 0.014;
    var order = [0, 1, 2, 3].sort(function (a, b) { return proj(MOT[a][0], 0, MOT[a][1]).z - proj(MOT[b][0], 0, MOT[b][1]).z; });
    rotor(MOT[order[0]], order[0]); rotor(MOT[order[1]], order[1]);
    for (var s = -1; s <= 1; s += 2) {                                                  /* stajni trap */
      p = proj(-0.21, -0.16, s * 0.15); q = proj(0.21, -0.16, s * 0.15); line(p, q, 0.7, 2);
      line(proj(-0.10, -0.04, s * 0.09), proj(-0.13, -0.16, s * 0.15), 0.55, 1.4); line(proj(0.10, -0.04, s * 0.09), proj(0.13, -0.16, s * 0.15), 0.55, 1.4);
    }
    for (k = 0; k < body.length; k++) {                                                 /* trup */
      p = proj(body[k][0], body[k][1], body[k][2]);
      var f = Math.max(0, Math.min(1, (p.z + 0.2) / 0.4)); dot(p, 0.12 + f * f * 0.85, 0.8 + f * 1.3);
    }
    for (k = 0; k < 10; k++) { var a = k * 0.628; dot(proj(0.14 + Math.cos(a) * 0.036, -0.10, Math.sin(a) * 0.036), 0.7, 1.2); }   /* kamera */
    rotor(MOT[order[2]], order[2]); rotor(MOT[order[3]], order[3]);
  }

  function tick(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; t += dt;
    frame(); raf = requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize);
  resize();
  if (!reduce && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    var host = canvas.parentElement;
    host.addEventListener('mousemove', function (e) { var r = canvas.getBoundingClientRect(); mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2; mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2; });
    host.addEventListener('mouseleave', function () { mouse.x = 0; mouse.y = 0; });
  }
  raf = requestAnimationFrame(tick);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } } else { cancelAnimationFrame(raf); raf = null; }
    }).observe(canvas);
  }
})();
