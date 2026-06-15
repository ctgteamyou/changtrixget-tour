// Connector: Curated deals — hand-added tours (e.g. TrueWorld) that don't have
// a scrapable website. You add rows to data/curated.csv on GitHub; the server
// fetches the RAW file live each refresh, so new rows appear within ~15 min
// WITHOUT a redeploy.
//
// CSV is pipe-delimited (so Thai titles with commas are fine). Header row:
//   source|title|country|city|priceOriginal|priceSale|departDate|durationDays|airline|image|url
// Only `title` and `priceSale` are required; leave others blank if unknown.

import { getHtml } from '../lib/scrape.js';
import { detectCountry } from '../lib/normalize.js';

// Live raw URL of data/curated.csv on the repo's main branch.
// Override with env CURATED_CSV_URL (e.g. a published Google Sheet CSV).
const CSV_URL =
  process.env.CURATED_CSV_URL ||
  'https://raw.githubusercontent.com/ctgteamyou/changtrixget-tour/main/data/curated.csv';

const COLS = ['source', 'title', 'country', 'city', 'priceOriginal', 'priceSale', 'departDate', 'durationDays', 'airline', 'image', 'url'];

function num(v) {
  if (!v) return null;
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  // drop header if present
  if (/^source\s*\|/i.test(lines[0])) lines.shift();
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split('|');
    const row = {};
    COLS.forEach((c, idx) => (row[c] = (parts[idx] || '').trim()));
    if (!row.title || !num(row.priceSale)) continue;
    const country = row.country || detectCountry(row.title);
    out.push({
      id: `curated-${row.source || 'x'}-${i}`,
      source: 'curated',
      sourceName: row.source || 'คัดพิเศษ',
      title: row.title,
      country,
      city: row.city || null,
      airline: row.airline || null,
      durationDays: num(row.durationDays),
      departDate: row.departDate || null,
      returnDate: null,
      priceOriginal: num(row.priceOriginal),
      priceSale: num(row.priceSale),
      discountPct: 0,
      image: row.image || null,
      url: row.url || null,
      currency: 'THB',
    });
  }
  return out;
}

export async function fetchCurated({ fetchImpl = fetch } = {}) {
  const text = await getHtml(CSV_URL, fetchImpl);
  if (!text) return [];
  try {
    return parseCsv(text);
  } catch {
    return [];
  }
}

export default { id: 'curated', name: 'คัดพิเศษ', fetch: fetchCurated };
