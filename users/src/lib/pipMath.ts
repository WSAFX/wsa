/**
 * Pip calculator maths. Pure functions, no React.
 *
 * rates: units of each currency per 1 USD (e.g. { USD: 1, NGN: 1500, JPY: 150 }).
 * Pip values are first computed in the pair's QUOTE currency, then converted to the
 * account currency: value_acc = value_quote / rates[quote] * rates[account].
 */
export type Rates = Record<string, number>;

/** How many account-currency units one unit of `from` is worth. null if a rate is missing. */
export function conversion(from: string, to: string, rates: Rates | null): number | null {
  if (from === to) return 1;
  const a = rates?.[from];
  const b = rates?.[to];
  if (!a || !b) return null;
  return b / a;
}

/** Live mid price of BASE/QUOTE from USD-based rates (null for metals / missing). */
export function crossPrice(base: string, quote: string, rates: Rates | null): number | null {
  const b = rates?.[base];
  const q = rates?.[quote];
  if (!b || !q) return null;
  return q / b;
}

/** Value of one pip, in the quote currency, for the given lot size. */
export const pipValueInQuote = (pipSize: number, contractSize: number, lots: number) => pipSize * contractSize * lots;

/** Pips between two prices (positive = in the trade's favour). */
export function pipsBetween(entry: number, exit: number, pipSize: number, direction: 'buy' | 'sell') {
  const raw = (exit - entry) / pipSize;
  return direction === 'buy' ? raw : -raw;
}

/** Lots to trade so that hitting the stop loses exactly `riskAmount` (account currency). */
export function positionSize(riskAmount: number, stopPips: number, pipValuePerLotInAccount: number) {
  if (stopPips <= 0 || pipValuePerLotInAccount <= 0) return 0;
  return riskAmount / (stopPips * pipValuePerLotInAccount);
}

/** Round lots down to the broker step (default 0.01) so risk never exceeds the target. */
export const floorToStep = (lots: number, step = 0.01) => Math.floor(lots / step + 1e-9) * step;

/** Decimal places that make sense for a pip size (0.0001 → 5 for fractional pips). */
export const priceDecimals = (pipSize: number) => Math.max(0, Math.round(-Math.log10(pipSize)) + 1);

export function formatMoney(value: number, currency: string) {
  if (!Number.isFinite(value)) return '–';
  const abs = Math.abs(value);
  const digits = abs !== 0 && abs < 1 ? 4 : 2;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency}`;
  }
}

export const formatNumber = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toLocaleString('en-NG', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '–';
