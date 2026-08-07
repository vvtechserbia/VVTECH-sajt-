// Mobilni meni
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

links.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

// Tekuća godina u footeru
document.getElementById('year').textContent = new Date().getFullYear();

// Header senka + dugme za vrh + progres traka
const header = document.querySelector('.site-header');
const toTop = document.querySelector('.to-top');
const progress = document.querySelector('.scroll-progress');

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 10);
  toTop.classList.toggle('show', y > 600);
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Nazad na vrh — eksplicitan scroll (anchor na sticky header ne radi pouzdano)
function scrollTop(e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
toTop.addEventListener('click', scrollTop);
document.querySelectorAll('.to-top-link, .brand').forEach((el) => el.addEventListener('click', scrollTop));

// Reveal animacije pri skrolu
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Namerno ne pratimo prefers-reduced-motion: sajt izgleda isto
// i kada je na telefonu ukljucena stednja baterije.
const reduceMotion = false;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// Spotlight na karticama — prati poziciju miša (CSS var za radial gradient)
if (finePointer) {
  document.querySelectorAll('.card, .step').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });
}

// Hero naslov — otkrivanje reč po reč
const heroH1 = document.querySelector('.hero h1');
if (heroH1) {
  function wrapWords(node) {
    [...node.childNodes].forEach((ch) => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const outer = document.createElement('span');
          outer.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        node.replaceChild(frag, ch);
      } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
        wrapWords(ch);
      }
    });
  }
  wrapWords(heroH1);
  heroH1.querySelectorAll('.w > span').forEach((s, i) => {
    s.style.transitionDelay = `${(0.09 * i + 0.15).toFixed(2)}s`;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => heroH1.classList.add('words-in')));
}

// Parallax hero sadržaja pri skrolu (tekst klizi sporije i bledi)
const heroInner = document.querySelector('.hero .hero-inner');
if (heroInner) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    if (y <= vh) {
      heroInner.style.transform = `translateY(${(y * 0.22).toFixed(1)}px)`;
      heroInner.style.opacity = String(Math.max(0, 1 - y / (vh * 0.85)));
    }
  }, { passive: true });
}

// Magnetna dugmad — blago prate kursor (samo desktop)
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.btn').forEach((b) => {
    b.addEventListener('mousemove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.18;
      const dy = (e.clientY - r.top - r.height / 2) * 0.35;
      b.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    });
    b.addEventListener('mouseleave', () => { b.style.translate = ''; });
  });
}

// 3D tilt na karticama usluga/projekata
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${py * -7}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// 3D globus sa orbitama i satelitima u hero sekciji (čist canvas, bez biblioteka)
// Uz prefers-reduced-motion crta se JEDNA statična slika umesto animacije.
const canvas = document.getElementById('net');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const mouse = { x: 0, y: 0 }; // -1..1 parallax
  let W, H, R, CX, CY, raf;
  let t = 0;

  // tačke na sferi (fibonačijeva sfera — ravnomeran raspored)
  const N = 480;
  const sphere = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.399963229728653;
    sphere.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
  }

  // zvezde u pozadini
  let stars = [];

  // orbite: poluprečnik (u R), nagib ravni, brzina, faza
  const ORBITS = [
    { r: 1.45, tilt: 0.5, speed: 0.55, phase: 0 },
    { r: 1.7, tilt: -0.85, speed: 0.38, phase: 2.1 },
    { r: 1.95, tilt: 0.18, speed: 0.27, phase: 4.4 },
  ];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    // ostro crtanje na retina/mobilnim ekranima: canvas u punoj gustini piksela
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const desktop = W > 900;
    CX = desktop ? W * 0.72 : W * 0.5;
    CY = desktop ? H * 0.5 : H * 0.34;
    R = desktop ? Math.min(W * 0.2, H * 0.34) : Math.min(W * 0.4, H * 0.26);
    stars = Array.from({ length: 110 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() * 1.3 + 0.4,
      p: Math.random() * Math.PI * 2,
    }));
  }

  // rotacija oko Y (spin) pa oko X (nagib), perspektivna projekcija
  function project(p, spin, tiltX) {
    const cy = Math.cos(spin), sy = Math.sin(spin);
    let x = p.x * cy + p.z * sy;
    let z = -p.x * sy + p.z * cy;
    const cx = Math.cos(tiltX), sx = Math.sin(tiltX);
    let y = p.y * cx - z * sx;
    z = p.y * sx + z * cx;
    const persp = 1 / (1 + z * 0.22);
    return { sx: CX + x * R * persp, sy: CY + y * R * persp, z, persp };
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    const spin = t + mouse.x * 0.35;
    const tilt = 0.42 + mouse.y * 0.18;
    const mobileDim = W > 900 ? 1 : 0.55; // na telefonu diskretnije, iza teksta

    // zvezde (blago trepere)
    for (const s of stars) {
      const a = 0.25 + 0.25 * Math.sin(t * 2 + s.p);
      ctx.fillStyle = `rgba(200, 225, 255, ${a * mobileDim})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    // oreol iza planete
    const halo = ctx.createRadialGradient(CX, CY, R * 0.6, CX, CY, R * 2.1);
    halo.addColorStop(0, `rgba(30, 90, 168, ${0.22 * mobileDim})`);
    halo.addColorStop(1, 'rgba(30, 90, 168, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(CX - R * 2.2, CY - R * 2.2, R * 4.4, R * 4.4);

    // planeta od tačaka
    for (const p of sphere) {
      const q = project(p, spin, tilt);
      const front = (1 - q.z) / 2; // 1 = ka posmatraču
      const a = (0.1 + front * 0.72) * mobileDim;
      const size = (0.8 + front * 1.5) * q.persp;
      ctx.fillStyle = `rgba(111, 194, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(q.sx, q.sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // orbite + sateliti
    for (const o of ORBITS) {
      // putanja orbite
      ctx.beginPath();
      for (let i = 0; i <= 90; i++) {
        const ang = (i / 90) * Math.PI * 2;
        const p = { x: Math.cos(ang) * o.r, y: 0, z: Math.sin(ang) * o.r };
        // nagib ravni orbite
        const pt = { x: p.x, y: p.z * Math.sin(o.tilt), z: p.z * Math.cos(o.tilt) };
        const q = project(pt, spin * 0.25, tilt);
        if (i === 0) ctx.moveTo(q.sx, q.sy);
        else ctx.lineTo(q.sx, q.sy);
      }
      ctx.strokeStyle = `rgba(61, 165, 255, ${0.16 * mobileDim})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // satelit + trag
      for (let k = 0; k < 14; k++) {
        const ang = t * o.speed * 2 + o.phase - k * 0.035;
        const p = { x: Math.cos(ang) * o.r, y: 0, z: Math.sin(ang) * o.r };
        const pt = { x: p.x, y: p.z * Math.sin(o.tilt), z: p.z * Math.cos(o.tilt) };
        const q = project(pt, spin * 0.25, tilt);
        const head = k === 0;
        const a = (head ? 0.95 : 0.5 * (1 - k / 14)) * mobileDim;
        ctx.fillStyle = `rgba(${head ? '168, 220, 255' : '61, 165, 255'}, ${a})`;
        ctx.beginPath();
        ctx.arc(q.sx, q.sy, (head ? 2.6 : 1.4) * q.persp, 0, Math.PI * 2);
        ctx.fill();
        if (head) {
          const glow = ctx.createRadialGradient(q.sx, q.sy, 0, q.sx, q.sy, 12);
          glow.addColorStop(0, `rgba(111, 194, 255, ${0.5 * mobileDim})`);
          glow.addColorStop(1, 'rgba(111, 194, 255, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(q.sx, q.sy, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function tick() {
    t += 0.005;
    frame();
    raf = requestAnimationFrame(tick);
  }

  if (reduceMotion) {
    // statična slika globusa — bez animacije, ali se vidi
    window.addEventListener('resize', () => { resize(); t = 2.2; frame(); });
    resize();
    t = 2.2;
    frame();
  } else {
    const hero = canvas.parentElement;
    if (finePointer) {
      hero.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      hero.addEventListener('mouseleave', () => { mouse.x = 0; mouse.y = 0; });
    }

    window.addEventListener('resize', resize);
    resize();
    tick();

    // pauziraj animaciju kad hero nije u kadru (štedi bateriju)
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          if (!raf) tick();
        } else {
          cancelAnimationFrame(raf);
          raf = null;
        }
      });
    }).observe(canvas);
  }
}
