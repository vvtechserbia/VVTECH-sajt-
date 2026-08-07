# VVTECH sajt

Prezentacioni sajt firme **VVTECH — Information Technology**.

Statički sajt (HTML + CSS + JS), bez build koraka — može da se hostuje bilo gde
(VPS/nginx, GitHub Pages, Cloudflare Pages...).

## Struktura

```
index.html        — početna (SR)
usluge/  projekti/  o-nama/  kontakt/       — podstranice (SR)
en/       — početna (EN)
en/services/  en/projects/  en/about/  en/contact/ — podstranice (EN)
css/style.css     — stilovi (dark tema, animacije)
js/main.js        — animacije, mreža čestica, meni, nazad-na-vrh
assets/           — logo, favicon, og-image
robots.txt, sitemap.xml — SEO
CNAME             — domen za GitHub Pages (vvtech-serbia.com)
.github/workflows/pages.yml — automatski deploy na GitHub Pages pri push-u na main
```

## Lokalni pregled

Otvoriti `index.html` u browseru, ili:

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## Deploy — GitHub Pages + vvtech-serbia.com (bez VPS-a)

Hosting je **GitHub Pages** (besplatno, ne dira PGT VPS). Podešava se JEDNOM:

1. **Repo mora biti javan** (GitHub Pages na besplatnom planu ne radi za privatne
   repoe): repo → Settings → General → Danger Zone → **Change visibility → Public**.
   Sajt je ionako javna prezentacija — u repou nema tajni.
2. Repo → Settings → **Pages** → Source: **GitHub Actions**.
3. Isto tamo, **Custom domain**: upiši `vvtech-serbia.com` → Save,
   i štikliraj **Enforce HTTPS** (kad DNS proradi).
4. **DNS kod registrara domena** (gde je kupljen vvtech-serbia.com) — dodaj zapise:

   | Tip   | Ime (host) | Vrednost              |
   |-------|-----------|------------------------|
   | A     | `@`       | `185.199.108.153`      |
   | A     | `@`       | `185.199.109.153`      |
   | A     | `@`       | `185.199.110.153`      |
   | A     | `@`       | `185.199.111.153`      |
   | CNAME | `www`     | `vvtechserbia.github.io` |

   (DNS propagacija traje od par minuta do par sati.)

Posle toga svaki push na `main` automatski objavljuje sajt
(workflow `.github/workflows/pages.yml`).

## TODO

- [ ] Uneti stvarne kontakt podatke (email, telefon, adresa) u sekciju „Kontakt"
- [ ] Fotografije realnih projekata/mašina u sekciji „Izdvojeni projekti"
- [x] Engleska verzija sajta (`/en/`)
- [x] Uključiti GitHub Pages + DNS (koraci iznad)
