# Tophaxhi Sneakers — Faqja (Udhëzues për pronarin)

Faqe katalogu **e shpejtë, e pastër dhe 100% në shqip** për Tophaxhi Sneakers.
Pa bazë të dhënash, pa pagesa online — klientët shfletojnë atletet dhe porosisin
në **Instagram, WhatsApp ose në formën e faqes**, me **pagesë në dorë**.

Pritet (hostohet) **falas në GitHub Pages**. Ti i menaxhon atletet, çmimet dhe fotot
nga një panel i thjeshtë te **`/admin`** — pa prekur kod.

> **Rri top.**

---

## 0. Çfarë ke këtu (struktura)

```
index.html            → Ballina
atletet.html          → Katalogu (filtra, kërkim, renditje)
product.html          → Faqja e një produkti (ngarkohet me ?id=...)
porosia.html          → Forma e porosisë në faqe
si-te-porosisesh.html, rreth-nesh.html, dergesa-kthimet.html, kontakti.html, 404.html
/admin/               → Paneli (Sveltia CMS) — KËTU i menaxhon gjërat
/data/                → "Baza e të dhënave" (skedarë JSON) — i ndryshon paneli
/assets/brand/        → Logo, favicon, foto për ndarje (OG)
/assets/products/     → Fotot e atleteve (i ngarkon paneli)
/assets/fonts/        → Fontet (Anton + Inter) — mos i prek
/css/styles.css       → Dizajni i tërë faqes
/js/                  → Logjika (mos e prek pa nevojë)
```

**ÇKA NUK DUHET TA PREKËSH** (përveç nëse di çfarë po bën):
`/js/`, `/css/`, `/assets/fonts/`, skedarët `*-index.json` te `/data/`
(gjenerohen vetë), dhe `.nojekyll`.

---

## 1. Si ta vësh online (GitHub Pages)

1. Hap një llogari në [github.com](https://github.com) (falas).
2. Krijo një **repository** të ri, p.sh. `tophaxhi` (publik).
3. Ngarko të gjithë skedarët e kësaj dosjeje në repo
   (ose përdor "Add file → Upload files" dhe tërhiqi të gjithë).
4. Te repo: **Settings → Pages**.
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / dosja `/ (root)` → **Save**.
5. Pas 1–2 minutash, faqja del live në `https://PERDORUESI.github.io/tophaxhi/`.

> Skedari `CNAME` është gati me `tophaxhi.com`. Nëse **ende nuk ke domen**, fshije
> skedarin `CNAME` derisa ta blesh (përndryshe Pages mund të ankohet).

---

## 2. Domeni yt (tophaxhi.com) + HTTPS

Domeni personal ndërton **besim dhe SEO**. Hapat:

1. Ble domenin `tophaxhi.com` (p.sh. te Namecheap, GoDaddy, etj.).
2. Te ofruesi i domenit, shto këto rekorde DNS:
   - 4 rekorde **A** për `@` → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - 1 rekord **CNAME** për `www` → `PERDORUESI.github.io`
3. Te GitHub: **Settings → Pages → Custom domain** → shkruaj `tophaxhi.com` → **Save**.
   (Skedari `CNAME` në repo tashmë e ka këtë vlerë.)
4. Prit DNS-in, pastaj aktivizo **"Enforce HTTPS"** (kutiza te Pages). Gati.

> Nëse ndryshon domenin, përditësoje edhe `siteUrl` te **Konfigurimet** në `/admin`
> dhe vlerën te `CNAME`.

---

## 3. Hyrja në panel (`/admin`) — një herë e të mbaruar

Paneli është **Sveltia CMS**. Për të ruajtur ndryshimet, ai duhet të lidhet me GitHub.
Ke dy rrugë — **e para s'kërkon asgjë shtesë:**

### Rruga A (më e lehtë) — me Access Token (pa server)
1. Te repo, hap `admin/config.yml` dhe te `backend → repo` vendos
   `PERDORUESI/tophaxhi` (emrin tënd). Ruaje.
2. Krijo një token në GitHub: **Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new**.
   - **Repository access:** vetëm repo `tophaxhi`.
   - **Permissions → Contents: Read and write**. Krijoje dhe **kopjo token-in**.
3. Hap `https://tophaxhi.com/admin/` → kliko **"Sign In Using Access Token"** →
   ngjite token-in. Gati — tani mund të shtosh atlete.

### Rruga B (opsionale, më e bukur) — butoni "Sign in with GitHub"
Kërkon një "relay" falas (Cloudflare Worker), që GitHub Pages s'mund ta bëjë vetë:
1. Krijo një **GitHub OAuth App** (Settings → Developer settings → OAuth Apps),
   callback `https://OAUTH-WORKER.workers.dev/callback`.
2. Deplo falas projektin **`sveltia-cms-auth`** te Cloudflare Workers (udhëzime te
   faqja e tij), me Client ID/Secret të OAuth App-it.
3. Vendos URL-në e worker-it te `admin/config.yml` → `backend → base_url`.
4. Tani te `/admin` punon butoni **"Sign in with GitHub"**.

> Çdo ndryshim që ruan në panel **commit-ohet në GitHub** dhe faqja **përditësohet
> vetë** për 1–2 minuta.

---

## 4. Si t'i bësh gjërat e përditshme (në panel)

### ➕ Shto një atlete
**Atletet → New Atlete**, plotëso:
- **Emri i modelit** (p.sh. *Adidas Campus 00s*) — mbaje unik.
- **Ngjyra, Marka, Tieri** (Të përditshme / Mainstream / Hype).
- **Çmimi** — vetëm numri (p.sh. `120`). **Çmimi i vjetër** vetëm nëse ka ulje.
- **Madhësitë** — shto numrat EU; hiq shenjën "Në dispozicion" për ato që s'i ke.
- **Fotot** — ngarko foto **4:5 (portret)**, p.sh. **1000×1250px**. Sfond i bardhë
  duket më premium. Foto e parë është kryesorja.
- Ruaje (**Publish**). Gati.

### 💶 Ndrysho një çmim
**Atletet** → hap produktin → ndrysho **Çmimi** → **Publish**.

### ⚡ Bëje "Bomba e javës"
Dy mënyra: te produkti aktivizo **"Bomba e javës?"**, ose te
**Konfigurimet → Faqja & Kontaktet → Bomba e javës (produktet)** zgjedh produktet.

### ⭐ Shto një vlerësim (social proof)
**Vlerësimet → New** — emri, qyteti, yjet, teksti dhe (opsionale) një foto.

### 🏷️ Shto një markë të re
**Konfigurimet → Markat → Add** — `slug` (p.sh. `asics`) dhe emri. Pastaj del te
lista e markave kur shton një atlete.

---

## 5. Ku janë kontaktet & porosia (i ndryshon te paneli)

**Konfigurimet → Faqja & Kontaktet:**
- **Instagram** (pa `@`) dhe **Numri i WhatsApp** — formati ndërkombëtar pa `+`
  dhe pa hapësira, p.sh. `38344123456`.
- **Porosia → Mënyra:**
  - `WhatsApp` (parazgjedhje) — forma hapet në WhatsApp me gjithçka të parambushur.
    **S'kërkon asgjë shtesë.**
  - `Formspree` — nëse do email për çdo porosi: krijo formë falas te
    [formspree.io](https://formspree.io), kopjo endpoint-in te fusha **Formspree endpoint**.

---

## 6. Si përditësohet faqja vetë

Te `/data/products/` ka një skedar për çdo atlete (burimi që ndryshon paneli).
Një **GitHub Action** rindërton automatikisht `products-index.json`,
`reviews-index.json` dhe `sitemap.xml` sa herë që publikon — kështu ti vetëm klikon
**Publish** dhe pjesa tjetër bëhet vetë.

---

## 7. TODO — fakte reale që duhet t'i vendosësh

- [ ] **Logo zyrtare:** zëvendëso `assets/brand/mark.svg` dhe `favicon.svg` me markën reale.
      (Tani është një vendmbajtëse e pastër.) Pastaj rigjenero `og-image.png` nëse don.
- [ ] **Fotot reale** të atleteve (tani janë vendmbajtëse "Foto së shpejti").
- [ ] **Numri i WhatsApp** dhe **handle-i i Instagramit** te Konfigurimet.
- [ ] **Çmimi & afati i dërgesës** (faqja *Dërgesa & Kthimet* dhe Konfigurimet).
- [ ] **Politika e kthimit/ndërrimit** (faqja *Dërgesa & Kthimet*).
- [ ] **Historia reale** te *Rreth nesh* dhe lokacioni te *Kontakti*.
- [ ] (Opsionale) Aktivizo "Provo para se të paguash" te trust bar nëse e ofron.

Kërko fjalën **`TODO`** nëpër skedarë për t'i gjetur të gjitha.

---

## 8. Provo lokalisht (opsionale, për zhvilluesin)

Faqja është statike. Me çdo server statik, p.sh.:
```
php -S 127.0.0.1:8123          # ose:  npx serve
```
Pastaj hap `http://127.0.0.1:8123`.
Për të rindërtuar index-et lokalisht: `node scripts/build-index.mjs`.

---

## 9. Shënime teknike (English summary)

- **Stack:** plain HTML/CSS/vanilla JS. No framework, no backend, no DB. Static on GitHub Pages.
- **Data:** flat JSON in `/data`. Public site reads combined `products-index.json`
  (one request); a GitHub Action regenerates it + `sitemap.xml` from the per-item files.
- **Ordering:** 3 channels (IG DM with copy-to-clipboard, WhatsApp pre-fill, on-site
  form with WhatsApp hand-off by default / Formspree optional). No checkout, COD only.
- **Admin:** Sveltia CMS (`/admin`), GitHub backend. Auth via Access Token (no server)
  or an optional Cloudflare Worker OAuth relay.
- **SEO:** per-page title/description/OG, JSON-LD (Store, Product, BreadcrumbList),
  canonical tags, `sitemap.xml`, `robots.txt`, `lang="sq"`, self-hosted fonts.
- **Brand safety:** brand names are text only; the sole logo asset is the Tophaxhi mark.
- **A11y/perf:** semantic HTML, visible focus, alt text, lazy images, `prefers-reduced-motion`.

Rri top.
