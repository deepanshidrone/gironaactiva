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
| Formularis | **Netlify Forms** (`data-netlify="true"`, Akismet + camp trampa `bot-field`) |
| Serverless | **Netlify Functions** (Node.js **22**) |
| Leads | **BrotaFit** (`POST /api/leads`, CRM fase 1) i **Notion API** (doble enviament mentre no es retiri Notion) |
| Control de versions | Git → GitHub (`deepanshidrone/gironaactiva`) |

**Directori local:** `C:\Users\deepa\Documents\BROTAAI\girona-activa-web` (PC Windows; abans era una ruta de Mac).

---

## Estructura de fitxers

```
girona-activa-web/
├── index.html                          # Pàgina principal (single-page)
├── avis-legal.html                     # Avís legal
├── politica-privacitat.html            # Política de privacitat
├── politica-cookies.html               # Política de cookies
├── politica-xarxes-socials.html        # Política de privacitat XXSS
├── styles.css                          # Full stylesheet (únic fitxer CSS)
├── netlify.toml                        # Configuració Netlify (funcions, Node 22)
├── netlify/functions/
│   └── submission-created.js          # Funció: formulari → Notion + BrotaFit
├── netlify/lib/
│   └── brotafit.js                    # Mòdul compartit: contracte v1, signatura i reintents
├── scripts/
│   └── reenviar-leads.mjs             # Reenviament manual de leads a BrotaFit
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
7. **Contacte** (`#contacte`) — targeta "Valoració inicial" (50€) + formulari 9 camps + casella RGPD + info sidebar
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

A més: casella obligatòria `rgpd` (consentiment) i camp trampa `bot-field` (amagat fora de la pantalla amb la classe `.form-hp`; el `<form>` porta `netlify-honeypot="bot-field"`). Si un bot omple el camp trampa, Netlify descarta l'enviament i la funció no s'executa.

**Flux:**
```
Navegador ──POST──▶ Netlify Forms ──(Akismet + honeypot)──▶ submission-created.js
                       │  guarda l'enviament (còpia)             ├─▶ Notion (com sempre)
                       │                                         └─▶ BrotaFit POST /api/leads (signat)
                       └──── scripts/reenviar-leads.mjs ──▶ BrotaFit (a mà, si alguna cosa ha fallat)
```

Especificació completa (aprovada): `brotafit/docs/spec-crm.md` (§5, §6.1, §6.3 i §9).

---

## Netlify Function — submission-created.js

- **Trigger:** automàtic en cada enviament vàlid de Netlify Forms.
- **Doble enviament (D2):** Notion i BrotaFit en paral·lel i independents (`Promise.allSettled`). La funció només retorna 500 si fallen tots dos; un destí omès (falten variables) no compta com a fallada. Es manté fins que el propietari decideixi retirar Notion.
- **Notion:** `https` natiu. "Com ens ha conegut" es desa amb el text visible del `<select>` (Notion no admet comes a les opcions select: `Recomanació (amic/ga o familiar)`). Inversió amb les opcions que ja existeixen a Notion (`50 – 100€`…).
- **BrotaFit:** el mòdul `netlify/lib/brotafit.js` construeix el JSON, el signa i l'envia (`fetch` de Node 22). Viu fora de `netlify/functions` perquè tot el que hi ha en aquella carpeta es publica com a funció.
- **Sense consentiment** (`rgpd` buit) no s'envia a BrotaFit.
- **Logs sense dades personals:** només l'id de l'enviament i el resultat de cada destí. Si BrotaFit falla del tot: `LEAD NO ENTREGADO <id>` (es pot recuperar amb el script de reenviament).
- **Columnes Notion:** Nom (title), Edat (number), Telèfon (phone), Email (email), Com ens ha conegut (select), Objectiu (rich_text), Situació actual (rich_text), Disponibilitat (rich_text), Inversió mensual (select)

### Variables d'entorn a Netlify

| Variable | Ús |
|---|---|
| `NOTION_TOKEN` | Token de la integració de Notion (es retira quan es deixi Notion) |
| `NOTION_DATABASE_ID` | `37f904fab35880de88a5c3cbada10b24` (es retira quan es deixi Notion) |
| `BROTAFIT_LEADS_URL` | URL de `/api/leads`. Fins al go-live, el preview de `dev` de BrotaFit (`https://girona-activa-app-git-dev-brota-ai.vercel.app/api/leads`), també des de producció (D12) |
| `BROTAFIT_LEADS_SECRET` | Secret compartit (≥ 32 bytes), el mateix que `LEADS_WEBHOOK_SECRET` a Vercel |
| `BROTAFIT_VERCEL_BYPASS` | Opcional: valor del *Protection Bypass for Automation* de Vercel, si els previews estan protegits |

Si falten `BROTAFIT_LEADS_URL` o `BROTAFIT_LEADS_SECRET`, la funció omet BrotaFit amb un avís al log i Notion continua. Les claus **mai** van al codi ni al repo.

### Contracte de l'enviament (v1)

`POST` amb `Content-Type: application/json`:

```json
{
  "version": 1, "source": "web", "form": "contacte",
  "external_id": "<payload.id de Netlify>",
  "submitted_at": "<payload.created_at>",
  "page_url": "<data.referrer o null>",
  "contact": { "full_name": "<nom>", "email": "<email>", "phone": "<telefon>" },
  "channel": { "key": "recomanacio-amic", "label": "Recomanació (amic/ga, familiar)" },
  "message": null,
  "answers": [
    { "key": "edat", "label": "Edat", "value": "35" },
    { "key": "objectiu", "label": "Què vols aconseguir?", "value": "…" },
    { "key": "obstacle", "label": "Per què creus que no ho estàs aconseguint fins ara?", "value": "…" },
    { "key": "disponibilitat", "label": "Quina és la teva disponibilitat horària?", "value": "…" },
    { "key": "inversio", "label": "Quina inversió estàs disposat/da a fer en la teva salut?", "value": "Entre 50€ i 100€/mes" }
  ],
  "consent": { "accepted": true, "text": "<text exacte de la casella RGPD>", "policy_url": "https://gironaactiva.com/politica-privacitat.html" }
}
```

- **Els textos viuen a `netlify/lib/brotafit.js`** i han de coincidir amb `index.html`: si es canvia una pregunta, una opció o el text de la casella RGPD a la web, s'ha de canviar també allà.
- **Signatura:** capçaleres `X-Brotafit-Timestamp` (segons Unix) i `X-Brotafit-Signature: sha256=<hex>`, HMAC-SHA256 amb `BROTAFIT_LEADS_SECRET` de `<timestamp>.<cos exacte>`. BrotaFit rebutja desviacions de més de 5 minuts. Si hi ha `BROTAFIT_VERCEL_BYPASS`, s'afegeix `x-vercel-protection-bypass`.
- **Reintents (D11):** 3 intents (esperes de 0 s, 1 s i 3 s), 2 s màxim per intent i pressupost total de 9 s (la funció té un límit de 10 s). Només es reintenta amb errors de xarxa, `429` o `5xx`.
- **Respostes:** `201` creat, `200` ja existia (compta com a èxit), `400` dades no vàlides (p. ex. un telèfon amb punts; no es reintenta), `401` signatura incorrecta, `413` massa gran.

### Reenviament manual — `scripts/reenviar-leads.mjs`

Llegeix els enviaments verificats del formulari `contacte` dels últims N dies amb l'API de Netlify i els envia a BrotaFit amb el mateix mòdul. Els que BrotaFit ja té responen `200` i no es toquen, així que es pot repetir.

```powershell
# Variables només per a aquesta execució (mai en fitxers)
$env:NETLIFY_AUTH_TOKEN = '...'; $env:NETLIFY_SITE_ID = '63e43069-355b-4018-bc44-4435e3646a87'
$env:BROTAFIT_LEADS_URL = '...'; $env:BROTAFIT_LEADS_SECRET = '...'   # + BROTAFIT_VERCEL_BYPASS si cal
node scripts/reenviar-leads.mjs --dry-run           # només ids i dates, sense dades personals
node scripts/reenviar-leads.mjs --days 14           # envia; per defecte, 7 dies
```

Al final mostra un resum: creats (201), ja existents (200), sense consentiment i errors (amb els ids). Els enviaments sense la casella RGPD (els anteriors a la casella) no s'envien.

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

**Autenticació GitHub:** HTTPS amb GitHub CLI (`gh auth login`, compte `deepanshidrone`) com a gestor de credencials. No es posen tokens a les URL dels remots.

**Commit i push:** només quan ho demana el propietari. Res a `main` sense aprovació.

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

## Projecte relacionat: BrotaFit (app de gestió d'entrenaments)

**Estat:** MVP en desenvolupament (rama `dev`, preview a Vercel). Domini previst: `app.gironaactiva.com`.
**Stack:** Next.js 16 + Supabase + Vercel
**Directori local:** `C:\Users\deepa\Documents\BROTAAI\brotafit`
**Repo GitHub:** `deepanshidrone/girona-activa-app`
**Relació amb aquesta web:** rep els leads del formulari a `/api/leads` (CRM fase 1, vegeu més amunt).
