// Connector: Mushroom Travel (mushroomtravel.com/tour/promotion) — โปรไฟไหม้.
//
// Detail links look like:
//   /tour/outbound/<country>/mush260061-china-4d2n-by-3u
// Card text shows:  <original?>  เริ่ม <sale>
// Country comes from the <country> path segment; duration from the "Nd Mn" slug.

import { getHtml } from '../lib/scrape.js';
import { COUNTRY_ALIASES, detectCountry } from '../lib/normalize.js';

const BASE = 'https://www.mushroomtravel.com';
const LIST_URLS = ['https://www.mushroomtravel.com/tour/promotion'];

function parse(html) {
  const out = [];
  const re = /\/tour\/(?:outbound|domestic)\/([a-z0-9-]+)\/(mush\d+)([a-z0-9-]*)/gi;
  const hits = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    hits.push({ country: m[1], id: m[2], slug: m[3], path: m[0], at: m.index });
  }
  const firsts = [];
  const seen = new Set();
  for (const h of hits) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    firsts.push(h);
  }
  for (let i = 0; i < firsts.length; i++) {
    const h = firsts[i];
    const start = h.at;
    const end = i + 1 < firsts.length ? firsts[i + 1].at : Math.min(start + 1600, html.length);
    const text = html.slice(start, end).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    const saleM = text.match(/เริ่ม\s*([\d,]{4,})/);
    let priceSale = saleM ? parseInt(saleM[1].replace(/,/g, ''), 10) : null;
    let priceOriginal = null;
    // original = a comma number right before "เริ่ม"
    const origM = text.match(/([\d,]{4,})\s*เริ่ม/);
    if (origM) priceOriginal = parseInt(origM[1].replace(/,/g, ''), 10);
    if (!priceSale) continue;
    if (priceOriginal && priceOriginal <= priceSale) priceOriginal = null;

    // country from URL slug, fallback to title text
    let country = COUNTRY_ALIASES[h.country] || null;
    const titleM = text.match(/ทัวร์[^|]{4,90}/);
    let title = titleM ? titleM[0].replace(/\s+/g, ' ').trim() : `ทัวร์ ${h.id}`;
    // drop trailing travel date (e.g. "… 26 มิ.ย. 69")
    title = title.split(/\s\d{1,2}\s*[ก-ฮ]\.[ก-ฮ]\./)[0].trim() || title;
    if (!country) country = detectCountry(title);

    // duration from the "Nd Mn" pattern in the slug, or title
    let durationDays = null;
    const dSlug = (h.slug || '').match(/(\d+)d\d+/i);
    if (dSlug) durationDays = parseInt(dSlug[1], 10);
    else { const dt = text.match(/(\d+)\s*วัน/); if (dt) durationDays = parseInt(dt[1], 10); }

    out.push({
      id: `mushroom-${h.id}`,
      source: 'mushroom',
      sourceName: 'มัชรูมทราเวล',
      title,
      country,
      city: null,
      airline: null,
      durationDays,
      departDate: null,
      returnDate: null,
      priceOriginal,
      priceSale,
      discountPct: 0,
      image: null, // mushroom lazy-loads images (data: placeholders in HTML)
      url: `${BASE}${h.path}`,
      currency: 'THB',
    });
  }
  return out;
}

export async function fetchMushroom({ fetchImpl = fetch } = {}) {
  const out = [];
  for (const url of LIST_URLS) {
    const html = await getHtml(url, fetchImpl);
    if (!html) continue;
    out.push(...parse(html));
  }
  return out;
}

export default { id: 'mushroom', name: 'มัชรูมทราเวล', fetch: fetchMushroom };
