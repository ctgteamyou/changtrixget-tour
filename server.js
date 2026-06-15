// changtrixget-tour — aggregator server (zero npm dependencies, Node >= 18).
//
//   node server.js           # serves frontend + /api/deals on :3000
//   PORT=8080 node server.js
//   LIVE=1 node server.js     # try live source fetch on boot (default: sample)
//
// Data strategy:
//   1. On boot (and every REFRESH_MS) try to fetch live deals from connectors.
//   2. If live fetch yields nothing (sources down, no network, or LIVE unset),
//      serve data/sample-deals.json so the site is never empty.
// This makes local dev work offline while production stays real-time.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchAll } from './connectors/index.js';
import { flagFor } from './lib/normalize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const LIVE = process.env.LIVE === '1';
const REFRESH_MS = Number(process.env.REFRESH_MS || 15 * 60 * 1000); // 15 min

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

let cache = { deals: [], perSource: {}, fetchedAt: null, mode: 'starting' };

async function loadSample() {
  const raw = await readFile(path.join(__dirname, 'data', 'sample-deals.json'), 'utf8');
  const deals = JSON.parse(raw).map((d) => ({ ...d, flag: flagFor(d.country) }));
  return { deals, perSource: {}, fetchedAt: new Date().toISOString(), mode: 'sample' };
}

async function refresh() {
  if (LIVE) {
    try {
      const live = await fetchAll({ pages: 3 });
      if (live.deals.length > 0) {
        cache = { ...live, mode: 'live' };
        console.log(`[refresh] live: ${live.deals.length} deals`,
          Object.fromEntries(Object.entries(live.perSource).map(([k, v]) => [k, v.count])));
        return;
      }
      // Live fetch produced nothing — serve sample data but KEEP the per-source
      // diagnostics so /api/deals can show why each connector returned 0.
      const sample = await loadSample();
      cache = { ...sample, mode: 'sample', perSource: live.perSource, liveTried: true };
      console.warn('[refresh] live fetch returned 0 deals, using sample. per-source:',
        JSON.stringify(live.perSource));
      return;
    } catch (e) {
      console.warn('[refresh] live fetch failed, using sample:', e.message);
    }
  }
  cache = await loadSample();
  console.log(`[refresh] sample: ${cache.deals.length} deals`);
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

async function serveStatic(res, urlPath) {
  const rel = urlPath === '/' ? '/index.html' : urlPath;
  const file = path.join(__dirname, 'public', path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/deals') {
    return sendJSON(res, 200, {
      mode: cache.mode,
      fetchedAt: cache.fetchedAt,
      sources: cache.perSource,
      count: cache.deals.length,
      deals: cache.deals,
    });
  }
  if (url.pathname === '/api/health') {
    return sendJSON(res, 200, { ok: true, mode: cache.mode, count: cache.deals.length });
  }
  if (url.pathname === '/api/sources') {
    // compact per-source diagnostics (counts + one sample), no full deal list
    const sources = {};
    for (const [k, v] of Object.entries(cache.perSource || {})) {
      sources[k] = { name: v.name, count: v.count, ok: v.ok, sample: (v.sample || [])[0] || null };
    }
    return sendJSON(res, 200, { mode: cache.mode, fetchedAt: cache.fetchedAt, total: cache.deals.length, sources });
  }
  return serveStatic(res, url.pathname);
});

await refresh();
setInterval(refresh, REFRESH_MS).unref?.();

server.listen(PORT, () => {
  console.log(`changtrixget-tour running → http://localhost:${PORT}  (mode: ${cache.mode}${LIVE ? ', LIVE' : ''})`);
});
