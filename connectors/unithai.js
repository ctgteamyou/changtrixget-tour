// Connector: Unithai Travel (unithaitravel.com) — "ทัวร์ไฟไหม้".
//
// Starter/best-effort connector. Unithai renders deal cards on
//   https://www.unithaitravel.com/th/trip_profiremai.php
// Image URLs follow the pattern https://www.unithaitravel.com/__files/t/ch/<code>-*.jpg
//
// This parser is intentionally conservative: if the page markup doesn't match,
// it returns [] so the aggregator falls back to cached / sample data rather
// than emitting garbage. Flesh out the regexes once you confirm the live DOM.

const LIST_URL = 'https://www.unithaitravel.com/th/trip_profiremai.php';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function parseCards(html) {
  const out = [];
  // Each product image encodes the tour code: __files/t/ch/<code>-XXXX.jpg
  const re = /__files\/t\/[a-z]{2}\/(\d+)-[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
  const seen = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const code = m[1];
    if (seen.has(code)) continue;
    seen.add(code);
    const around = html.slice(Math.max(0, m.index - 1500), m.index + 1500);

    const nums = [...around.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)/g)]
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

    const durMatch = around.match(/(\d+)\s*วัน\s*(\d+)\s*คืน/);
    const countryMatch = around.match(/ทัวร์(จีน|เกาหลี|ญี่ปุ่น|เวียดนาม|ไต้หวัน|ฮ่องกง|มาเก๊า)/);

    out.push({
      id: `unithai-${code}`,
      source: 'unithai',
      sourceName: 'ยูนิไทย',
      title: `ทัวร์${countryMatch ? countryMatch[1] : ''} ${code}`.trim(),
      country: countryMatch ? countryMatch[1] : null,
      city: null,
      airline: null,
      durationDays: durMatch ? parseInt(durMatch[1], 10) : null,
      departDate: null,
      returnDate: null,
      priceOriginal,
      priceSale,
      discountPct: 0,
      image: `https://www.unithaitravel.com/${m[0]}`,
      url: `https://www.unithaitravel.com/th/trip_detail.php?id=${code}`,
      currency: 'THB',
    });
  }
  return out;
}

export async function fetchUnithai({ fetchImpl = fetch } = {}) {
  let res;
  try {
    res = await fetchImpl(LIST_URL, { headers: { 'User-Agent': UA } });
  } catch (e) {
    return [];
  }
  if (!res || !res.ok) return [];
  const html = await res.text();
  return parseCards(html);
}

export default { id: 'unithai', name: 'ยูนิไทย', fetch: fetchUnithai };
