# CLAUDE.md — Girona Activa Web

Context complet del projecte per a Claude Code. Aquest fitxer es carrega automàticament a l'inici de cada sessió.

---

## Visió general del projecte

**Client:** Girona Activa S.L. — centre d'entrenament personal i fisioteràpia a Girona.
**Web:** `gironaactiva.com` (producció) / `dev--gironaactiva.netlify.app` (dev)
**Tipus:** Web de màrqueting estàtica (HTML + CSS + JS vanilla). Una sola pàgina principal amb smooth scroll.
**Idioma:** Català (el castellà és un toggle planificat per a futures versions).

---

## Stack tècnic

| Capa | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Fonts | Google Fonts: **Outfit** (substitut de Mont, la font oficial de la marca) |
| Hosting | **Netlify** (auto-deploy des de GitHub) |
| Formularis | **Netlify Forms** (`data-netlify="true"`) |
| Serverless | **Netlify Functions** (Node.js) |
| Base de dades | **Notion API** (emmagatzematge de leads del formulari) |
| Control de versions | Git → GitHub (`deepanshidrone/gironaactiva`) |

---

## Estructura de fitxers

```
gironaactiva/
├── index.html                          # Pàgina principal (single-page)
├── avis-legal.html                     # Avís legal
├── politica-privacitat.html            # Política de privacitat
├── politica-xarxes-socials.html        # Política de privacitat XXSS
├── styles.css                          # Full stylesheet (únic fitxer CSS)
├── netlify.toml                        # Configuració Netlify (funcions, Node 18)
├── netlify/functions/
│   └── submission-created.js          # Funció: formulari → Notion API
├── images/
│   ├── cropped-gironaactivalog.png    # Logo circular (navbar + footer)
│   ├── header_image_GironaActiva.png  # Imatge hero (fons)
│   ├── entrenament-individual.png     # Imatge servei 1
│   ├── fisioterapia-esportiva.png     # Imatge servei 2
│   ├── rehabilitacio.png              # Imatge servei 3
│   ├── nutricio.png                   # Imatge servei 4
│   ├── valoracio-inicial.jpg          # Imatge targeta matrícula inicial
│   ├── Presentacio-Eze.mp4            # Vídeo presentació Ezequiel
│   ├── Presentacio-Brian.mp4          # Vídeo presentació Brian
│   ├── Presentacio-Alvaro.mp4         # Vídeo presentació Álvaro
│   ├── Presentacio-Olivia.mp4         # Vídeo presentació Olivia
│   ├── thumb-Eze.jpg                  # Thumbnail vídeo Eze (primer frame)
│   ├── thumb-Brian.jpg                # Thumbnail vídeo Brian
│   ├── thumb-Alvaro.jpg               # Thumbnail vídeo Álvaro
│   ├── thumb-Olivia.jpg               # Thumbnail vídeo Olivia
│   ├── logo-nextgeneration.png        # Logo NextGenerationEU
│   └── logo-plan-recuperacion.png     # Logo Plan de Recuperación Govern Espanya
└── CLAUDE.md                          # Aquest fitxer
```

---

## Identitat de marca

### Colors (variables CSS)
```css
--orange: #FF914D;   /* Taronja oficial (PANTONE P-1635C) */
--dark:   #1C1C1C;   /* Negre corporatiu */
--gray:   #666666;   /* Gris text secundari */
--light:  #F5F5F5;   /* Gris clar fons */
--white:  #ffffff;
--border: #E5E5E5;
```

### Tipografia
- **Outfit** (Google Fonts) — substitut de **Mont** (font oficial, de pagament, Fontfabric)
  - Titulars / headings: `font-weight: 700`
  - Cos de text: `font-weight: 400`
  - "GIRONA ACTIVA" (navbar + hero): `font-weight: 600`, `text-transform: uppercase`, `transform: skewX(-12deg)`

### Logo
- Fitxer: `images/cropped-gironaactivalog.png`
- Es mostra circular al navbar: `border-radius: 50%`, `height: 52px`, `width: 52px`

---

## Estructura de la pàgina principal (index.html)

Seccions en ordre, totes amb `id` per al smooth scroll del navbar:

1. **Navbar** — fix, fosc, logo circular + "GIRONA ACTIVA" + links + botó "Reserva ara"
2. **Hero** (`#inici`) — fons `header_image_GironaActiva.png`, overlay fosc, brand "GIRONA ACTIVA" gran, h1 "Entrena. Recupera't. Millora.", 2 CTA buttons
3. **Per què nosaltres** — 5 targetes de motius
4. **Serveis** (`#serveis`) — 4 targetes (Entrenament, Fisioteràpia, Readaptació, Nutrició)
5. **Equip** (`#qui-som`) — 4 vídeos MP4 verticals (9/16) amb thumbnail poster, grid de 4 columnes
6. **FAQ** (`#faq`) — 8 preguntes, accordion JS
7. **Contacte** (`#contacte`) — targeta "Matrícula inicial" (75€) + formulari 9 camps + info sidebar
8. **Mapa** (`#ubicacio`) — iframe Google Maps, "Vine a veure'ns"
9. **Banner EU** — logos NextGenerationEU + Plan de Recuperación
10. **Footer** — logo + navegació + contacte + links legals

---

## Formulari de contacte

**9 camps:**
| name HTML | Tipus | Etiqueta |
|---|---|---|
| `nom` | text | Nom complet |
| `edat` | number | Edat |
| `telefon` | tel | Telèfon |
| `email` | email | Email |
| `com_conegut` | select | Com ens has conegut |
| `objectiu` | textarea | Objectiu |
| `obstacle` | textarea | Situació actual |
| `disponibilitat` | text | Disponibilitat horària |
| `inversio` | radio | Inversió mensual |

**Flux:** Netlify Forms captura → `submission-created.js` s'activa → Notion API crea entrada a la base de dades.

---

## Netlify Function — submission-created.js

- **Trigger:** automàtic en cada submission de Netlify Forms
- **Mètode:** `https` natiu de Node.js (compatible totes les versions, sense dependències)
- **Variables d'entorn necessàries a Netlify:**
  - `NOTION_TOKEN` — token de la integració de Notion
  - `NOTION_DATABASE_ID` — `37f904fab35880de88a5c3cbada10b24`
- **Columnes Notion:** Nom (title), Edat (number), Telèfon (phone), Email (email), Com ens ha conegut (select), Objectiu (rich_text), Situació actual (rich_text), Disponibilitat (rich_text), Inversió mensual (select)

---

## Animacions

- **Hero (càrrega):** CSS `@keyframes` amb delays escalonats: tag → brand → h1 → p → botons
- **Scroll reveal:** `IntersectionObserver` JS, classe `.reveal` + `.visible`, `threshold: 0.15`
- **Delays escalonats:** `.reveal-delay-1` a `.reveal-delay-4` (0.1s, 0.2s, 0.3s, 0.4s)
- **Missatge èxit formulari:** `@keyframes successIn` amb `cubic-bezier(0.34, 1.56, 0.64, 1)` (efecte pop)

---

## Git workflow

```
main    → producció (gironaactiva.com)
dev     → preview (dev--gironaactiva.netlify.app)
```

**Procés estàndard:**
```bash
# Treballar sempre a dev primer
git add [fitxers]
git commit -m "feat/fix/chore: descripció"
git push origin dev

# Quan aprovats → pujar a producció
git checkout main
git merge dev
git push origin main
git checkout dev

# Versionar si cal
git tag v1.x
git push origin v1.x
```

**Autenticació GitHub:** HTTPS amb PAT (token personal d'accés).
`https://deepanshidrone:TOKEN@github.com/deepanshidrone/gironaactiva.git`

---

## Convencions de codi

- **Noms de fitxers d'imatge:** sempre en minúscules, sense accents ni espais (ex: `valoracio-inicial.jpg`). Netlify corre sobre Linux (case-sensitive).
- **CSS:** BEM lleugera (`.bloc__element--modificador`). Variables CSS a `:root`.
- **JS:** Vanilla, tot en un `<script>` inline al final del `<body>`.
- **Optimització imatges:** `sips -Z 840 -s format jpeg -s formatOptions 75` per a imatges web.
- **Thumbnails vídeo:** `ffmpeg -i video.mp4 -vframes 1 -q:v 3 thumb.jpg` + optimització amb `sips`.

---

## Pàgines legals

Totes amb navbar + footer complets, CSS classe `.politica__content`:
- `avis-legal.html`
- `politica-privacitat.html`
- `politica-xarxes-socials.html`

Empresa: **GIRONA ACTIVA S.L.**, NIF B26689876, C/ Rutlla 15-17 baixos, Girona, info@gironaactiva.com

---

## Projecte relacionat: App de planificació d'entrenaments

**Estat:** Planificació inicial. Projecte separat a `app.gironaactiva.com`.
**Stack previst:** Next.js + Supabase (auth + DB) + Vercel
**Directori local:** `/Users/deepansh.dhawan/girona-activa-app/` (pendent de crear)
**Repo GitHub:** `deepanshidrone/girona-activa-app` (pendent de crear)
