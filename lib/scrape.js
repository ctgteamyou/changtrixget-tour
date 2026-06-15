// Generic listing scraper shared by the agency connectors.
//
// Most Thai tour sites render a grid of deal cards where each card has:
//   - a link to the tour detail page (linkRe)
//   - a cover image (imageRe)
//   - two prices: original (strikethrough) + sale  -> two numbers in 3,000..300,000
//   - a "X วัน Y คืน" duration string
//   - a Thai country word somewhere in the title
//
// A connector supplies the per-site config; this module does the heavy lifting
// and always fails soft (returns [] on any error) so the aggregator can fall
// back to cached / sample data instead of crashing.

import { COUNTRY_ALIASES, ALLOWED_COUNTRIES } from './normalize.js';
export { pickTitle as defaultTitle };

export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const ALLOWED_RE = new RegExp(`ทัวร์?(${ALLOWED_COUNTRIES.join('|')})`);

export async function getHtml(url, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res || !res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function pickPrices(text) {
  const nums = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+|\b[0-9]{4,6}\b)/g)]
    .map((m) => parseInt(m[1].replace(/,/g, ''), 10))
    .filter((n) => n >= 3000 && n <= 300000);
  if (nums.length >= 2) {
    return { priceOriginal: Math.max(nums[0], nums[1]), priceSale: Math.min(nums[0], nums[1]) };
  }
  if (nums.length === 1) return { priceOriginal: null, priceSale: nums[0] };
  return { priceOriginal: null, priceSale: null };
}

export function pickTitle(text, country, id) {
  // grab the first reasonable "ทัวร์…" phrase, stripped of markup and prices
  const cleaned = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const m = cleaned.match(/ทัวร์[^฿|·\n<]{4,90}/);
  if (m) {
    // cut at a duration token's tail or trailing noise, cap length
    let t = m[0].split(/\s{2,}/)[0].trim();
    if (t.length > 80) t = t.slice(0, 80).trim();
    return t;
  }
  return `ทัวร์${country || ''} ${id}`.trim();
}

export function pickDuration(text) {
  const m = text.match(/(\d+)\s*วัน\s*(\d+)\s*คืน/);
  return m ? parseInt(m[1], 10) : null;
}

export function pickCountry(text, url = '') {
  const m = text.match(ALLOWED_RE);
  if (m) return m[1];
  const low = (url + ' ' + text).toLowerCase();
  for (const [k, v] of Object.entries(COUNTRY_ALIASES)) {
    if (low.includes(k)) return v;
  }
  return null;
}

// Split an HTML document into per-card chunks anchored on detail-link matches.
// Forward-only slicing: card i owns [link_i, link_{i+1}) so neighbouring cards
// never bleed into each other. (If a site puts the title/image BEFORE the link,
// anchor linkRe on the image URL instead — see the nidnoi config.)
export function splitOnLinks(html, linkRe) {
  const re = new RegExp(linkRe, 'g');
  const hits = [];
  let m;
  while ((m = re.exec(html)) !== null) hits.push({ href: m[1] || m[0], at: m.index, end: re.lastIndex });
  // Keep only the first occurrence of each distinct href, then slice from one
  // distinct card to the next so each slice holds a whole card (a card often
  // links to the same detail page several times).
  const firsts = [];
  const seen = new Set();
  for (const h of hits) {
    if (seen.has(h.href)) continue;
    seen.add(h.href);
    firsts.push(h);
  }
  const cards = [];
  for (let i = 0; i < firsts.length; i++) {
    const start = firsts[i].at;
    const end = i + 1 < firsts.length ? firsts[i + 1].at : Math.min(firsts[i].end + 3500, html.length);
    cards.push({ href: firsts[i].href, html: html.slice(start, end) });
  }
  return cards;
}

// config: { source, sourceName, listUrls:[...], linkRe, idRe, imageRe, makeUrl, makeTitle }
export async function scrapeListing(config, { fetchImpl = fetch } = {}) {
  const { listUrls, linkRe, idRe, imageRe, makeUrl, makeTitle } = config;
  const source = config.source || config.id;
  const sourceName = config.sourceName || config.name;
  const out = [];
  for (const listUrl of listUrls) {
    const html = await getHtml(listUrl, fetchImpl);
    if (!html) continue;
    for (const card of splitOnLinks(html, linkRe)) {
      const idm = card.href.match(idRe);
      if (!idm) continue;
      const id = idm[1];
      const country = pickCountry(card.html, card.href);
      if (!country) continue; // also enforces allowlist via ALLOWED_RE / aliases
      const { priceOriginal, priceSale } = pickPrices(card.html);
      if (!priceSale) continue;
      const img = imageRe ? card.html.match(imageRe) : null;
      out.push({
        id: `${source}-${id}`,
        source,
        sourceName,
        title: makeTitle ? makeTitle(card, country, id) : pickTitle(card.html, country, id),
        country,
        city: null,
        airline: null,
        durationDays: pickDuration(card.html),
        departDate: null,
        returnDate: null,
        priceOriginal,
        priceSale,
        discountPct: 0,
        image: img ? img[0] : null,
        url: makeUrl ? makeUrl(card.href, id) : card.href,
        currency: 'THB',
      });
    }
  }
  return out;
}
