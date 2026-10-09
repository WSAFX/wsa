import { logger } from './logger';

/**
 * USD-based exchange rates for the pip calculator's currency conversion.
 * Source: ExchangeRate-API open access (no key, updates daily, includes NGN).
 * Cached in memory for an hour; serves the last good copy if the source is down.
 */
const SOURCE = 'https://open.er-api.com/v6/latest/USD';
const TTL_MS = 60 * 60 * 1000;

export interface Rates {
  base: 'USD';
  rates: Record<string, number>;
  updated_at: string | null;
  source: string;
}

let cache: { at: number; data: Rates } | null = null;

export async function getUsdRates(): Promise<Rates | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const res = await fetch(SOURCE);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const body = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
    if (body.result !== 'success' || !body.rates) throw new Error('bad payload');
    const data: Rates = {
      base: 'USD',
      rates: body.rates,
      updated_at: body.time_last_update_utc ? new Date(body.time_last_update_utc).toISOString() : null,
      source: 'ExchangeRate-API',
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (err) {
    logger.warn('rates fetch failed', { message: err instanceof Error ? err.message : String(err) });
    return cache?.data ?? null;
  }
}
