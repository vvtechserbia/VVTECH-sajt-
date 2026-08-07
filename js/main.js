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

// Senka na headeru posle skrola
const header = document.querySelector('.site-header');
const toTop = document.querySelector('.to-top');

function onScroll() {
  header.classList.toggle('scrolled', window.scrollY > 10);
  toTop.classList.toggle('show', window.scrollY > 600);
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
