// Connector registry + aggregator.
// Add a new source by writing a connector module that default-exports
// { id, name, fetch(opts) -> Promise<deal[]> } and importing it here.

import tourkrub from './tourkrub.js';
import unithai from './unithai.js';
import { GENERIC_CONNECTORS } from './sources.js';
import { cleanDeals, flagFor } from '../lib/normalize.js';

// tourkrub + unithai are hand-written; the rest are config-driven scaffolds.
export const CONNECTORS = [tourkrub, unithai, ...GENERIC_CONNECTORS];

// Fetch every source in parallel. A failing source contributes [] instead of
// blowing up the whole refresh.
export async function fetchAll(opts = {}) {
  const results = await Promise.allSettled(
    CONNECTORS.map((c) =>
      c.fetch(opts).then((deals) => ({ id: c.id, name: c.name, deals })),
    ),
  );

  const perSource = {};
  let all = [];
  for (let i = 0; i < results.length; i++) {
    const c = CONNECTORS[i];
    if (results[i].status === 'fulfilled') {
      const { deals } = results[i].value;
      // keep a couple of raw (pre-clean) samples for debugging via /api/deals
      perSource[c.id] = { name: c.name, count: deals.length, ok: true, sample: deals.slice(0, 2) };
      all = all.concat(deals);
    } else {
      perSource[c.id] = { name: c.name, count: 0, ok: false, error: String(results[i].reason) };
    }
  }

  const deals = cleanDeals(all).map((d) => ({ ...d, flag: flagFor(d.country) }));
  return { deals, perSource, fetchedAt: new Date().toISOString() };
}
