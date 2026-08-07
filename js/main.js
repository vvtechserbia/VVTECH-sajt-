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

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

// Interaktivna mreža čestica u hero sekciji
const canvas = document.getElementById('net');
if (canvas && !reduceMotion) {
  const ctx = canvas.getContext('2d');
  const mouse = { x: -9999, y: -9999 };
  let W, H, pts, raf;

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = r.width;
    H = canvas.height = r.height;
    const count = Math.min(90, Math.floor((W * H) / 16000));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    const LINK = 130;

    for (const p of pts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      // blagi beg od miša
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        p.x += (dx / d) * 0.6;
        p.y += (dy / d) * 0.6;
      }
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(61, 165, 255, ${0.16 * (1 - d / LINK)})`;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(111, 194, 255, 0.6)';
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(tick);
  }

  const hero = canvas.parentElement;
  hero.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

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
