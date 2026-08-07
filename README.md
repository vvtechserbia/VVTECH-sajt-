# VVTECH sajt

Prezentacioni sajt firme **VVTECH — Information Technology**.

Statički sajt (HTML + CSS + JS), bez build koraka — može da se hostuje bilo gde
(VPS/nginx, GitHub Pages, Cloudflare Pages...).

## Struktura

```
index.html        — jedina stranica (sekcije: usluge, proces, projekti, o nama, kontakt)
css/style.css     — stilovi (svetla tema u bojama logotipa)
js/main.js        — mobilni meni + sitnice
assets/           — logo i favicon
```

## Lokalni pregled

Otvoriti `index.html` u browseru, ili:

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## TODO

- [ ] Uneti stvarne kontakt podatke (email, telefon, adresa) u sekciju „Kontakt"
- [ ] Fotografije realnih projekata/mašina u sekciji „Izdvojeni projekti"
- [ ] Engleska verzija sajta (po potrebi)
- [ ] Domen i hosting
