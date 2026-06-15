// Connector: Travelzeed (travelzeed.com/fire) — โปรไฟไหม้.
//
// Observed list markup (after tag-strip): each card is a link to
//   /tour/detail/<id>   with text "promotion <save>฿ ทัวร์<country> …"
// followed by:  เริ่มต้น  <original> ฿  <sale> ฿
// The leading "promotion 3,600฿" is the SAVINGS amount (not a price), so we
// read the two prices that come right after "เริ่มต้น".

import { getHtml, UA } from '../lib/scrape.js';

const BASE = 'https://www.travelzeed.com';
const LIST_URLS = ['https://www.travelzeed.com/fire'];

const ALLOWED = /ทัวร์(จีน|เกาหลี|ญี่ปุ่น|เวียดนาม|ไต้หวัน|ฮ่องกง)/;
const URL_COUNTRY = { china: 'จีน', korea: 'เกาหลี', japan: 'ญี่ปุ่น', vietnam: 'เวียดนาม', taiwan: 'ไต้หวัน', hongkong: 'ฮ่องกง', 'hong-kong': 'ฮ่องกง' };

function parse(html) {
  const out = [];
  const re = /\/tour\/detail\/(\d+)/g;
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
    const end = i + 1 < firsts.length ? firsts[i + 1].at : Math.min(start + 1200, html.length);
    const chunk = html.slice(start, end);
    const text = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    // prices after "เริ่มต้น": original ฿ then sale ฿
    let priceOriginal = null;
    let priceSale = null;
    const pm = text.match(/เริ่มต้น\s*([\d,]{4,})\s*฿\s*([\d,]{4,})\s*฿/);
    if (pm) {
      const a = parseInt(pm[1].replace(/,/g, ''), 10);
      const b = parseInt(pm[2].replace(/,/g, ''), 10);
      priceOriginal = Math.max(a, b);
      priceSale = Math.min(a, b);
    } else {
      const one = text.match(/([\d,]{4,})\s*฿/);
      if (one) priceSale = parseInt(one[1].replace(/,/g, ''), 10);
    }
    if (!priceSale) continue;

    const cm = text.match(ALLOWED);
    let country = cm ? cm[1] : null;
    if (!country) {
      const low = (text + ' ').toLowerCase();
      for (const k of Object.keys(URL_COUNTRY)) if (low.includes(k)) { country = URL_COUNTRY[k]; break; }
    }

    const durMatch = text.match(/(\d+)\s*วัน\s*(\d+)\s*คืน/);

    // title: text after "promotion <save>฿ " up to the price area
    let title = '';
    const tm = text.match(/promotion\s*[\d,]+\s*฿\s*(ทัวร์[^]{4,90}?)(?:เริ่มต้น|รหัส|\d+\s*วัน|$)/);
    if (tm) title = tm[1].replace(/\s+/g, ' ').trim();
    if (!title || title.length < 6) {
      const t2 = text.match(/ทัวร์[^|]{4,80}/);
      title = t2 ? t2[0].trim() : `ทัวร์${country || ''} ${id}`;
    }

    const imgMatch = html.slice(start - 1200 < 0 ? 0 : start - 1200, end).match(
      new RegExp(`https?:\\/\\/[^"'\\s)]*travelzeed\\.com\\/images\\/tour\\/${id}\\/[^"'\\s)]+`),
    );

    out.push({
      id: `travelzeed-${id}`,
      source: 'travelzeed',
      sourceName: 'ทราเวลซี้ด',
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
      image: imgMatch ? imgMatch[0] : null,
      url: `${BASE}/tour/detail/${id}`,
      currency: 'THB',
    });
  }
  return out;
}

export async function fetchTravelzeed({ fetchImpl = fetch } = {}) {
  const out = [];
  for (const url of LIST_URLS) {
    const html = await getHtml(url, fetchImpl);
    if (!html) continue;
    out.push(...parse(html));
  }
  return out;
}

export default { id: 'travelzeed', name: 'ทราเวลซี้ด', fetch: fetchTravelzeed };
