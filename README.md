# VVTECH sajt

Sajt firme VVTECH — https://vvtech-serbia.com

Statički sajt (HTML, CSS i malo JavaScript-a), bez koraka izgradnje.

## Struktura

```
index.html                              početna (SR)
o-nama/  usluge/  projekti/  kontakt/   unutrašnje strane (SR)
en/                                     početna (EN)
en/about/  en/services/  en/projects/  en/contact/   unutrašnje strane (EN)
404.html                                strana za nepostojeće adrese
css/style.css  js/main.js               stil i meni
assets/                                 logo, fotografije uređaja, snimci softvera
robots.txt  sitemap.xml
CNAME                                   domen za GitHub Pages
```

## Lokalni pregled

```bash
python -m http.server 8080
# http://localhost:8080
```

## Objavljivanje

Svako slanje na granu `main` objavljuje sajt preko GitHub Pages
(`.github/workflows/pages.yml`).

Podešavanje je urađeno jednom: Settings → Pages → Source: GitHub Actions,
Custom domain: `vvtech-serbia.com`, Enforce HTTPS. DNS zapisi domena:

| Tip   | Ime   | Vrednost                 |
|-------|-------|--------------------------|
| A     | `@`   | `185.199.108.153`        |
| A     | `@`   | `185.199.109.153`        |
| A     | `@`   | `185.199.110.153`        |
| A     | `@`   | `185.199.111.153`        |
| CNAME | `www` | `vvtechserbia.github.io` |
