// Connector: Thaifly (thaifly.com/service/hot-deal) — ทัวร์ไฟไหม้.
//
// Observed list markup (after tag-strip), one card each (content precedes the
// detail link at the end of the card):
//   ### ทัวร์<country> … 4วัน 3คืน บิน FD
//   รหัสทัวร์ THFY228740 | ระยะเวลา 4 คืน 3 วัน | 🔥ลดราคา ฿334
//   …price table…  เริ่ม 8,888 บาท
//   [ดูรายละเอียด](https://thaifly.com/tour/THFY228740)
//
// Sale price = "เริ่ม X บาท" (lowest). Savings = "ลดราคา ฿N". Original = sale+savings.

import { getHtml } from '../lib/scrape.js';
import { detectCountry } from '../lib/normalize.js';

const BASE = 'https://thaifly.com';
const LIST_URLS = ['https://thaifly.com/service/hot-deal'];

function parse(html) {
  const out = [];
  const re = /\/tour\/(THFY\d+)/g;
  const hits = [];
  let m;
  while ((m = re.exec(html)) !== null) hits.push({ id: m[1], at: m.index, end: re.lastIndex });
  // first occurrence of each distinct id, in order
  const firsts = [];
  const seen = new Set();
  for (const h of hits) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    firsts.push(h);
  }
  for (let i = 0; i < firsts.length; i++) {
    const id = firsts[i].id;
    // card content sits BEFORE the detail link → slice from prev link to this one
    const start = i > 0 ? firsts[i - 1].end : 0;
    const end = firsts[i].end;
    const chunk = html.slice(start, end);
    const text = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    const saleM = text.match(/เริ่ม\s*([\d,]{4,})\s*บาท/);
    const saveM = text.match(/ลดราคา\s*฿?\s*([\d,]{2,})/);
    let priceSale = saleM ? parseInt(saleM[1].replace(/,/g, ''), 10) : null;
    let priceOriginal = null;
    if (priceSale && saveM) priceOriginal = priceSale + parseInt(saveM[1].replace(/,/g, ''), 10);
    if (!priceSale) {
      // fallback: first comma price pair in the table (original then sale)
      const nums = [...text.matchAll(/([\d,]{4,})/g)]
        .map((x) => parseInt(x[1].replace(/,/g, ''), 10))
        .filter((n) => n >= 3000 && n <= 500000);
      if (nums.length >= 2) { priceOriginal = Math.max(nums[0], nums[1]); priceSale = Math.min(nums[0], nums[1]); }
    }
    if (!priceSale) continue;

    // title: "ทัวร์… NวันNคืน บิน XX"
    let title = '';
    const tm = text.match(/(ทัวร์[^]{4,110}?\d+\s*วัน\s*\d+\s*คืน\s*บิน\s+[A-Z0-9]+)/);
    if (tm) title = tm[1].replace(/\s+/g, ' ').trim();
    if (!title) {
      const t2 = text.match(/ทัวร์[^|]{4,90}/);
      title = t2 ? t2[0].trim() : `ทัวร์ ${id}`;
    }

    const country = detectCountry(title) || detectCountry(text);
    const durMatch = text.match(/(\d+)\s*วัน\s*(\d+)\s*คืน/);
    const img = chunk.match(new RegExp(`https?:\\/\\/[^"'\\s)]*thaifly\\.com\\/image\\/[^"'\\s)]*${id}[^"'\\s)]+`));

    out.push({
      id: `thaifly-${id}`,
      source: 'thaifly',
      sourceName: 'ไทยฟลาย',
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
      url: `${BASE}/tour/${id}`,
      currency: 'THB',
    });
  }
  return out;
}

export async function fetchThaifly({ fetchImpl = fetch } = {}) {
  const out = [];
  for (const url of LIST_URLS) {
    const html = await getHtml(url, fetchImpl);
    if (!html) continue;
    out.push(...parse(html));
  }
  return out;
}

export default { id: 'thaifly', name: 'ไทยฟลาย', fetch: fetchThaifly };
