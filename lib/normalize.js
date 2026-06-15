// Shared helpers to turn raw agency data into one common "deal" shape.
// Every connector must output objects matching this schema:
//
//   {
//     id, source, sourceName, title,
//     country, city, airline,
//     durationDays, departDate (YYYY-MM-DD), returnDate (YYYY-MM-DD|null),
//     priceOriginal, priceSale, discountPct,
//     image, url, currency
//   }

// Only these destinations are shown. Anything else is dropped during cleanup.
export const ALLOWED_COUNTRIES = ['จีน', 'ไต้หวัน', 'ฮ่องกง', 'เกาหลี', 'ญี่ปุ่น', 'เวียดนาม'];

// Helps connectors map English route/url keywords to the Thai country name.
export const COUNTRY_ALIASES = {
  china: 'จีน', taiwan: 'ไต้หวัน', hongkong: 'ฮ่องกง', 'hong-kong': 'ฮ่องกง',
  korea: 'เกาหลี', 'south-korea': 'เกาหลี', japan: 'ญี่ปุ่น', vietnam: 'เวียดนาม',
};

export function isAllowedCountry(c) {
  return ALLOWED_COUNTRIES.includes(c);
}

export const COUNTRY_FLAGS = {
  'จีน': '🇨🇳', 'เกาหลี': '🇰🇷', 'ญี่ปุ่น': '🇯🇵', 'เวียดนาม': '🇻🇳',
  'ไต้หวัน': '🇹🇼', 'ฮ่องกง': '🇭🇰', 'มาเก๊า': '🇲🇴', 'สิงคโปร์': '🇸🇬',
  'มาเลเซีย': '🇲🇾', 'ลาว': '🇱🇦', 'พม่า': '🇲🇲', 'กัมพูชา': '🇰🇭',
  'มัลดีฟส์': '🇲🇻', 'อียิปต์': '🇪🇬', 'ตุรกี': '🇹🇷', 'จอร์เจีย': '🇬🇪',
  'อินเดีย': '🇮🇳', 'เนปาล': '🇳🇵', 'ภูฏาน': '🇧🇹', 'ดูไบ': '🇦🇪',
};

// Rough lat/lng for the popular cities, used by the map view.
export const CITY_COORDS = {
  'ฉงชิ่ง': [29.563, 106.551], 'เฉิงตู': [30.572, 104.066], 'อู่หลง': [29.323, 107.76],
  'เซี่ยงไฮ้': [31.230, 121.473], 'ปักกิ่ง': [39.904, 116.407], 'จางเจียเจี้ย': [29.117, 110.479],
  'ชิงเต่า': [36.067, 120.382], 'คุนหมิง': [25.045, 102.710], 'ต้าหลี่': [25.606, 100.267],
  'ลี่เจียง': [26.855, 100.227], 'กวางเจา': [23.129, 113.264], 'จูไห่': [22.271, 113.577],
  'หางโจว': [30.274, 120.155], 'มองโกเลียใน': [40.842, 111.749], 'เออร์ดอส': [39.609, 109.781],
  'โซล': [37.566, 126.978], 'ปูซาน': [35.179, 129.075],
  'โตเกียว': [35.689, 139.692], 'โอซาก้า': [34.694, 135.502],
  'ดานัง': [16.054, 108.202], 'ฮอยอัน': [15.880, 108.338], 'ฟูก๊วก': [10.227, 103.964],
  'ฮานอย': [21.028, 105.804], 'ไทเป': [25.033, 121.565], 'ฮ่องกง': [22.319, 114.169],
  'มาเก๊า': [22.199, 113.544], 'สิงคโปร์': [1.352, 103.820],
};

export function flagFor(country) {
  return COUNTRY_FLAGS[country] || '🏳️';
}

// City / keyword → country, for sites that don't print the country directly.
export const CITY_COUNTRY = {
  // จีน
  จีน: 'จีน', ปักกิ่ง: 'จีน', เฉิงตู: 'จีน', ฉงชิ่ง: 'จีน', จางเจียเจี้ย: 'จีน', หางโจว: 'จีน',
  เซี่ยงไฮ้: 'จีน', ชิงเต่า: 'จีน', คุนหมิง: 'จีน', กวางเจา: 'จีน', จูไห่: 'จีน', เออร์ดอส: 'จีน',
  ออร์ดอส: 'จีน', มองโกเลีย: 'จีน', หยีชาง: 'จีน', อี๋ชาง: 'จีน', ซีหนิง: 'จีน', ตุนหวง: 'จีน',
  จางเย่: 'จีน', หยานไถ: 'จีน', เว่ยไห่: 'จีน', ลี่เจียง: 'จีน', ต้าหลี่: 'จีน', กุ้ยหลิน: 'จีน',
  เซินเจิ้น: 'จีน', ซีอาน: 'จีน', หนานจิง: 'จีน', อู่ฮั่น: 'จีน', เอินซือ: 'จีน', ฝูหรงเจิ้น: 'จีน',
  ซานย่า: 'จีน', อู่หลง: 'จีน', หวงซาน: 'จีน', อู่ฮั่น2: 'จีน', ทิเบต: 'จีน', ลาซา: 'จีน',
  // เกาหลี
  เกาหลี: 'เกาหลี', โซล: 'เกาหลี', ปูซาน: 'เกาหลี', เชจู: 'เกาหลี', ซกโช: 'เกาหลี',
  // ญี่ปุ่น
  ญี่ปุ่น: 'ญี่ปุ่น', โตเกียว: 'ญี่ปุ่น', โอซาก้า: 'ญี่ปุ่น', ฮอกไกโด: 'ญี่ปุ่น', ฟุกุโอกะ: 'ญี่ปุ่น',
  นาโกย่า: 'ญี่ปุ่น', เกียวโต: 'ญี่ปุ่น', โอกินาว่า: 'ญี่ปุ่น', ทาคายาม่า: 'ญี่ปุ่น', เซนได: 'ญี่ปุ่น',
  // เวียดนาม
  เวียดนาม: 'เวียดนาม', ดานัง: 'เวียดนาม', ฮานอย: 'เวียดนาม', ฮอยอัน: 'เวียดนาม', ซาปา: 'เวียดนาม',
  ฟูก๊วก: 'เวียดนาม', โฮจิมินห์: 'เวียดนาม', ญาจาง: 'เวียดนาม', ดาลัด: 'เวียดนาม', ฮาลอง: 'เวียดนาม',
  // ไต้หวัน
  ไต้หวัน: 'ไต้หวัน', ไทเป: 'ไต้หวัน', เกาสง: 'ไต้หวัน', ไทจง: 'ไต้หวัน',
  // ฮ่องกง
  ฮ่องกง: 'ฮ่องกง',
};

// Try to detect an allowed country from free text (city names, "ทัวร์จีน", etc.)
export function detectCountry(text = '') {
  const t = String(text);
  // direct "ทัวร์<country>"
  const m = t.match(/ทัวร์\s*(จีน|เกาหลี|ญี่ปุ่น|เวียดนาม|ไต้หวัน|ฮ่องกง)/);
  if (m) return m[1];
  // longest keyword first so "ฮ่องกง" wins over short fragments
  const keys = Object.keys(CITY_COUNTRY).sort((a, b) => b.length - a.length);
  for (const k of keys) if (t.includes(k)) return CITY_COUNTRY[k];
  return null;
}

export function coordsFor(city) {
  return CITY_COORDS[city] || null;
}

// "9,999" / "฿9,999" / "9999" -> 9999
export function parsePrice(raw) {
  if (raw == null) return null;
  const n = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

export function discountPct(original, sale) {
  if (!original || !sale || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export function durationFromNights(days, nights) {
  if (Number.isFinite(days)) return days;
  if (Number.isFinite(nights)) return nights + 1;
  return null;
}

// De-duplicate by (source,id), keep only allowed countries, drop non-discounts.
export function cleanDeals(deals, { minDiscount = 1, countries = ALLOWED_COUNTRIES } = {}) {
  const seen = new Set();
  const out = [];
  for (const d of deals) {
    if (!d || !d.id) continue;
    if (countries && !countries.includes(d.country)) continue; // allowlist
    const key = `${d.source}:${d.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    d.discountPct = d.discountPct || discountPct(d.priceOriginal, d.priceSale);
    if (d.discountPct < minDiscount) continue;
    out.push(d);
  }
  // cheapest discount-adjusted first
  out.sort((a, b) => (a.priceSale || 1e9) - (b.priceSale || 1e9));
  return out;
}
