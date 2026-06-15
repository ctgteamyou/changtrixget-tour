// Config-driven connectors for the listed agencies.
//
// Each entry below is turned into a connector { id, name, fetch } that runs the
// shared scrapeListing() framework. The framework already enforces the country
// allowlist (จีน/ไต้หวัน/ฮ่องกง/เกาหลี/ญี่ปุ่น/เวียดนาม) and fails soft.
//
// IMPORTANT — these are CONFIGURED SCAFFOLDS. The list URLs are the real
// hot-deal pages, but the link/id/image regexes are best-effort: third-party
// markup changes and some grids are JS-rendered (so they may yield 0 on first
// run and fall back to cached/sample data). Confirm each against the live page
// — e.g. `curl -A '<UA>' '<listUrl>' | grep -o '<pattern>'` — and adjust.
// Always respect each site's robots.txt and terms of use.

import { scrapeListing } from '../lib/scrape.js';

export const SOURCE_CONFIGS = [
  {
    id: 'nidnoi',
    name: 'นิดหน่อย',
    listUrls: ['https://www.nidnoitravel.com/promotion-hot/'],
    // cards anchor on the product image; tour code lives in the filename (nidnXXXXX)
    linkRe: 'https?://[^"\\s]*nidnoitravel\\.com/wow/upload/[^"\\s)]+nidn(\\d+)[^"\\s)]*',
    idRe: /nidn(\d+)/,
    imageRe: /https?:\/\/[^"'\s)]*nidnoitravel\.com\/wow\/upload\/[^"'\s)]+/,
    makeUrl: (href) => href,
  },
  {
    id: 'thaifly',
    name: 'ไทยฟลาย',
    listUrls: ['https://thaifly.com/service/hot-deal'],
    linkRe: '(https?://(?:www\\.)?thaifly\\.com/tour/[A-Za-z0-9-]+|/tour/[A-Za-z0-9-]+)',
    idRe: /(\d{3,})/,
    imageRe: /https?:\/\/[^"'\s)]*thaifly\.com\/[^"'\s)]+\.(?:jpg|jpeg|png|webp)/i,
  },
  {
    id: 'mushroom',
    name: 'มัชรูมทราเวล',
    listUrls: ['https://www.mushroomtravel.com/tour/promotion'],
    linkRe: '(https?://(?:www\\.)?mushroomtravel\\.com/tour/[A-Za-z0-9-]+|/tour/[A-Za-z0-9-]+)',
    idRe: /(\d{3,})/,
    imageRe: /https?:\/\/[^"'\s)]*mushroomtravel\.com\/[^"'\s)]+\.(?:jpg|jpeg|png|webp)/i,
  },
  {
    id: 'thaitravelcenter',
    name: 'ไทยทราเวลเซ็นเตอร์',
    listUrls: ['https://www.thaitravelcenter.com/tour/discounted/'],
    linkRe: '(https?://(?:www\\.)?thaitravelcenter\\.com/[a-z]{2}/tour-program/[A-Za-z0-9-]+|/tour-program/[A-Za-z0-9-]+)',
    idRe: /(\d{3,})/,
    imageRe: /https?:\/\/[^"'\s)]*thaitravelcenter\.com\/[^"'\s)]+\.(?:jpg|jpeg|png|webp)/i,
  },
  {
    id: 'besttour',
    name: 'เบสท์ทัวร์ฮอลิเดย์',
    listUrls: ['https://www.besttourholidays.com/promotion/hot-deal'],
    linkRe: '(https?://(?:www\\.)?besttourholidays\\.com/tour/[A-Za-z0-9-]+|/tour/[A-Za-z0-9-]+)',
    idRe: /(\d{3,})/,
    imageRe: /https?:\/\/[^"'\s)]*besttourholidays\.com\/[^"'\s)]+\.(?:jpg|jpeg|png|webp)/i,
  },
];

export const GENERIC_CONNECTORS = SOURCE_CONFIGS.map((cfg) => ({
  id: cfg.id,
  name: cfg.name,
  fetch: (opts = {}) => scrapeListing(cfg, opts),
}));
