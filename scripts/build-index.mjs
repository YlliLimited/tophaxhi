// =====================================================================
// build-index.mjs
// Rigjeneron data/products-index.json, data/reviews-index.json dhe sitemap.xml
// nga skedarët burimorë në /data. Ekzekutohet nga GitHub Action (Node 20).
// Mund të ekzekutohet edhe lokalisht:  node scripts/build-index.mjs
// =====================================================================
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

async function readJsonDir(dir) {
  let files = [];
  try { files = await readdir(dir); } catch { return []; }
  const out = [];
  for (const f of files.filter((f) => f.endsWith('.json'))) {
    try {
      const raw = await readFile(path.join(dir, f), 'utf8');
      const obj = JSON.parse(raw);
      // Emri i skedarit është ID-ja kanonike (kështu pronari nuk shkruan kurrë ID me dorë).
      obj.id = f.replace(/\.json$/, '');
      out.push(obj);
    } catch (e) {
      console.warn(`U anashkalua ${f}: ${e.message}`);
    }
  }
  return out;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}

const today = new Date().toISOString().slice(0, 10);

// ---- Products ----
const products = (await readJsonDir(path.join(DATA, 'products')))
  .filter((p) => p && p.id && p.name)
  .sort((a, b) => String(b.dateAdded || '').localeCompare(String(a.dateAdded || '')));

await writeFile(
  path.join(DATA, 'products-index.json'),
  JSON.stringify({
    _generated: 'Gjenerohet automatikisht nga GitHub Action prej /data/products/*.json. MOS e ndrysho me dorë.',
    updated: today,
    products
  }, null, 2) + '\n'
);
console.log(`products-index.json: ${products.length} produkte`);

// ---- Reviews ----
const reviews = (await readJsonDir(path.join(DATA, 'reviews')))
  .filter((r) => r && r.id)
  .sort((a, b) => (a.order || 99) - (b.order || 99));

await writeFile(
  path.join(DATA, 'reviews-index.json'),
  JSON.stringify({
    _generated: 'Gjenerohet automatikisht nga GitHub Action prej /data/reviews/*.json. MOS e ndrysho me dorë.',
    updated: today,
    reviews
  }, null, 2) + '\n'
);
console.log(`reviews-index.json: ${reviews.length} vlerësime`);

// ---- Sitemap ----
const settings = await readJson(path.join(DATA, 'settings.json'), {});
const base = (settings.siteUrl || 'https://tophaxhi.com').replace(/\/+$/, '');

const staticPages = [
  { loc: '/', pri: '1.0', freq: 'daily' },
  { loc: '/atletet.html', pri: '0.9', freq: 'daily' },
  { loc: '/si-te-porosisesh.html', pri: '0.6', freq: 'monthly' },
  { loc: '/rreth-nesh.html', pri: '0.5', freq: 'monthly' },
  { loc: '/dergesa-kthimet.html', pri: '0.5', freq: 'monthly' },
  { loc: '/kontakti.html', pri: '0.5', freq: 'monthly' }
];

const urls = [
  ...staticPages.map((p) => ({ loc: base + p.loc, pri: p.pri, freq: p.freq, lastmod: today })),
  ...products.map((p) => ({
    loc: `${base}/product.html?id=${encodeURIComponent(p.id)}`,
    pri: '0.8', freq: 'weekly', lastmod: p.dateAdded || today
  }))
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) =>
    `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n` +
    `    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`
  ).join('\n') +
  '\n</urlset>\n';

await writeFile(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URL`);
