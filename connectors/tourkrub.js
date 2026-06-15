// Connector: Tourkrub (tourkrub.co) — "ทัวร์ไฟไหม้" / last-minute deals.
//
// Tourkrub is a Next.js site that server-renders its deal cards, so we can
// parse them straight out of the HTML. Each card exposes: tour code, title,
// country, route/city, duration, original price, sale price and a cover image.
//
// NOTE: HTML structure on third-party sites changes without warning. Keep the
// regexes here in one place and treat a zero-result parse as "source down"
// (the aggregator will fall back to cached / sample data).

const BASE = 'https://tourkrub.co';
const LIST_URL = (page) => `${BASE}/last-minute-deals?page=${page}`;
const MAX_PAGES = 13;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Map Tourkrub's "ทัวร์จีน" style label to a bare country name.
function countryFromLabel(label = '') {
  const m = label.replace('ทัวร์', '').trim();
  return m || null;
}

// Pull every <a href="/tours/....html"> ... </a> card block.
function splitCards(html) {
  const blocks = [];
  const re = /href="(\/tours\/[^"]+\.html)"/g;
  let m;
  const indices = [];
  while ((m = re.exec(html)) !== null) indices.push({ href: m[1], at: m.index });
  // group by unique href, take the slice of html around the first occurrence
  const seen = new Set();
  for (let i = 0; i < indices.length; i++) {
    const { href, at } = indices[i];
    if (seen.has(href)) continue;
    seen.add(href);
    const end = i + 1 < indices.length ? indices[i + 1].at : Math.min(at + 4000, html.length);
    blocks.push({ href, html: html.slice(at, end) });
  }
  return blocks;
}

function parseCard(block) {
  const { href, html } = block;
  const idMatch = href.match(/\/tours\/(\d+)/);
  if (!idMatch) return null;
  const id = idMatch[1];

  // prices appear as "16,990 ... เริ่มต้น 9,990"
  const nums = [...html.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,6})/g)].map((x) =>
    parseInt(x[1].replace(/,/g, ''), 10),
  );
  const priceCandidates = nums.filter((n) => n >= 3000 && n <= 300000);
  let priceOriginal = null;
  let priceSale = null;
  if (priceCandidates.length >= 2) {
    priceOriginal = Math.max(priceCandidates[0], priceCandidates[1]);
    priceSale = Math.min(priceCandidates[0], priceCandidates[1]);
  } else if (priceCandidates.length === 1) {
    priceSale = priceCandidates[0];
  }

  const durMatch = html.match(/(\d+)\s*วัน\s*(\d+)\s*คืน/);
  const durationDays = durMatch ? parseInt(durMatch[1], 10) : null;

  const countryMatch = html.match(/ทัวร์(จีน|เกาหลี|ญี่ปุ่น|เวียดนาม|ไต้หวัน|ฮ่องกง|มาเก๊า|สิงคโปร์|มาเลเซีย|ลาว|พม่า|กัมพูชา)/);
  const country = countryMatch ? countryMatch[1] : null;

  const imgMatch = html.match(/https?:\/\/cdn\.tourkrub\.co\/tours\/[^"'\s)]+/);
  const image = imgMatch ? imgMatch[0] : null;

  // Tourkrub prints the discount explicitly, e.g. "ลดสูงสุด41%"
  const discMatch = html.match(/ลด(?:สูงสุด)?\s*(\d{1,2})\s*%/);
  const discountPct = discMatch ? parseInt(discMatch[1], 10) : 0;

  const titleMatch = html.match(/รหัส\s*\d+[^<]*?\d+\s*คืน\s*([^<]+?)\s*\d*\s*บิน/);
  const title = titleMatch ? titleMatch[1].trim() : `ทัวร์${country || ''} ${id}`;

  return {
    id: `tourkrub-${id}`,
    source: 'tourkrub',
    sourceName: 'ทัวร์ครับ',
    title,
    country,
    city: null, // route text on Tourkrub is freeform; left null, frontend tolerates it
    airline: null,
    durationDays,
    departDate: null, // not reliably exposed on the list card
    returnDate: null,
    priceOriginal,
    priceSale,
    discountPct,
    image,
    url: BASE + href,
    currency: 'THB',
  };
}

export async function fetchTourkrub({ pages = 3, fetchImpl = fetch } = {}) {
  const out = [];
  for (let p = 1; p <= Math.min(pages, MAX_PAGES); p++) {
    let res;
    try {
      res = await fetchImpl(LIST_URL(p), { headers: { 'User-Agent': UA } });
    } catch (e) {
      break; // network/source failure -> stop, let aggregator fall back
    }
    if (!res || !res.ok) break;
    const html = await res.text();
    const cards = splitCards(html).map(parseCard).filter(Boolean);
    if (cards.length === 0) break;
    out.push(...cards);
  }
  return out;
}

export default { id: 'tourkrub', name: 'ทัวร์ครับ', fetch: fetchTourkrub };
