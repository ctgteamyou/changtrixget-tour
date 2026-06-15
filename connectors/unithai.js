// Connector: Unithai Travel (unithaitravel.com) — ทัวร์ไฟไหม้.
//
// Observed list markup (after tag-strip), one card each:
//   รหัส 50170: <a href="…trip_detail2.php?route_id=50170">CODE : <title> BY VZ</a>
//   ~~16,888~~ **10,888**     (original, then sale — both comma-formatted)
// Country isn't printed, so we infer it from city/keywords in the title.

import { getHtml } from '../lib/scrape.js';
import { detectCountry } from '../lib/normalize.js';

const BASE = 'https://www.unithaitravel.com';
const LIST_URLS = ['https://www.unithaitravel.com/th/trip_profiremai.php'];

function parse(html) {
  const out = [];
  const re = /trip_detail2?\.php\?route_id=(\d+)/g;
  const hits = [];
  let m;
  while ((m = re.exec(html)) !== null) hits.push({ id: m[1], at: m.index });
  const firsts = [];
  const seen = new Set();
  for (const h of hits) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    firsts.push(h);
  }
  for (let i = 0; i < firsts.length; i++) {
    const id = firsts[i].id;
    // forward-only: title is the anchor's inner text (after the href), prices follow
    const start = firsts[i].at;
    const end = i + 1 < firsts.length ? firsts[i + 1].at : Math.min(firsts[i].at + 1000, html.length);
    const chunk = html.slice(start, end);
    const text = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    // comma-formatted prices only → avoids the tour code digits
    const nums = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)/g)]
      .map((x) => parseInt(x[1].replace(/,/g, ''), 10))
      .filter((n) => n >= 3000 && n <= 300000);
    let priceOriginal = null;
    let priceSale = null;
    if (nums.length >= 2) {
      priceOriginal = Math.max(nums[0], nums[1]);
      priceSale = Math.min(nums[0], nums[1]);
    } else if (nums.length === 1) {
      priceSale = nums[0];
    }
    if (!priceSale) continue;

    // title: between the tour code "XXX :" and "BY <airline>" (fallbacks below)
    let title = '';
    const tm = text.match(/[:：]\s*([^:：]{6,90}?)\s*BY\s/i);
    if (tm) title = tm[1].replace(/\s+/g, ' ').trim();
    if (!title || title.length < 6) {
      const t2 = text.match(/รหัส\s*\d+\s*[:：]?\s*([^~|]{6,80})/);
      title = t2 ? t2[1].replace(/\s+/g, ' ').trim() : `ทัวร์ ${id}`;
    }

    const country = detectCountry(title) || detectCountry(text);

    const durMatch = text.match(/(\d+)\s*วัน\s*(\d+)\s*คืน/);
    const img = chunk.match(/https?:\/\/[^"'\s)]*unithaitravel\.com\/__files\/[^"'\s)]+/);

    out.push({
      id: `unithai-${id}`,
      source: 'unithai',
      sourceName: 'ยูนิไทย',
      title,
      country,
      city: null,
      airline: null,
      durationDays: durMatch ? parseInt(durMatch[1], 10) : null,
      departDate: null,
      returnDate: null,
      priceOriginal,
      priceSale,
      discountPct: 0,
      image: img ? img[0] : null,
      url: `${BASE}/th/trip_detail2.php?route_id=${id}`,
      currency: 'THB',
    });
  }
  return out;
}

export async function fetchUnithai({ fetchImpl = fetch } = {}) {
  const out = [];
  for (const url of LIST_URLS) {
    const html = await getHtml(url, fetchImpl);
    if (!html) continue;
    out.push(...parse(html));
  }
  return out;
}

export default { id: 'unithai', name: 'ยูนิไทย', fetch: fetchUnithai };
