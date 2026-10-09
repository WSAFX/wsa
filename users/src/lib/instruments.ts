/**
 * Instruments for the pip calculator: the ~50 most traded FX pairs (ranked per the
 * BIS 2025 Triennial Survey and market liquidity), plus USD/NGN and metals.
 *
 * pipSize / contractSize follow common retail-broker conventions; brokers differ for
 * some exotics and metals, so the calculator lets traders override both.
 */
export type InstrumentGroup = 'Majors & top USD pairs' | 'Popular crosses' | 'More liquid pairs' | 'Naira & metals';

export interface Instrument {
  symbol: string;
  base: string;
  quote: string;
  pipSize: number;
  contractSize: number;
  group: InstrumentGroup;
}

// Quote currencies that trade at large numbers, where a pip is the 2nd decimal.
const TWO_DECIMAL_QUOTES = new Set(['JPY', 'INR', 'KRW', 'TWD', 'THB', 'IDR', 'PHP', 'CZK', 'NGN']);

const fx = (pair: string, group: InstrumentGroup): Instrument => {
  const [base, quote] = pair.split('/');
  return {
    symbol: pair,
    base,
    quote,
    pipSize: TWO_DECIMAL_QUOTES.has(quote) ? 0.01 : 0.0001,
    contractSize: 100_000,
    group,
  };
};

const MAJORS = [
  'EUR/USD', 'USD/JPY', 'USD/CNY', 'GBP/USD', 'USD/CAD', 'AUD/USD', 'USD/CHF', 'USD/HKD', 'NZD/USD', 'USD/SGD',
  'USD/INR', 'USD/KRW', 'USD/MXN', 'USD/SEK', 'USD/NOK', 'USD/TRY', 'USD/ZAR', 'USD/BRL', 'USD/TWD', 'USD/PLN',
];
const CROSSES = [
  'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'AUD/JPY', 'EUR/AUD', 'EUR/CHF', 'GBP/AUD', 'EUR/CAD', 'AUD/NZD', 'GBP/CHF',
  'CAD/JPY', 'CHF/JPY', 'AUD/CAD', 'EUR/NZD', 'GBP/CAD', 'NZD/JPY', 'AUD/CHF', 'CAD/CHF', 'GBP/NZD', 'NZD/CAD',
];
const MORE = ['EUR/SEK', 'EUR/NOK', 'GBP/SEK', 'AUD/SGD', 'USD/THB', 'USD/IDR', 'EUR/TRY', 'USD/PHP', 'EUR/PLN', 'USD/CZK'];

export const INSTRUMENTS: Instrument[] = [
  ...MAJORS.map((p) => fx(p, 'Majors & top USD pairs')),
  ...CROSSES.map((p) => fx(p, 'Popular crosses')),
  ...MORE.map((p) => fx(p, 'More liquid pairs')),
  fx('USD/NGN', 'Naira & metals'),
  // Gold: 100 oz per lot, pip = $0.10 → $10 per pip per lot. Silver: 5,000 oz, pip = $0.01 → $50.
  { symbol: 'XAU/USD', base: 'XAU', quote: 'USD', pipSize: 0.1, contractSize: 100, group: 'Naira & metals' },
  { symbol: 'XAG/USD', base: 'XAG', quote: 'USD', pipSize: 0.01, contractSize: 5_000, group: 'Naira & metals' },
];

export const GROUPS: InstrumentGroup[] = ['Majors & top USD pairs', 'Popular crosses', 'More liquid pairs', 'Naira & metals'];

export const ACCOUNT_CURRENCIES = ['USD', 'NGN', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NZD', 'ZAR'];

export const LOT_PRESETS = [
  { label: 'Standard', lots: 1 },
  { label: 'Mini', lots: 0.1 },
  { label: 'Micro', lots: 0.01 },
];

export const findInstrument = (symbol: string) => INSTRUMENTS.find((i) => i.symbol === symbol) ?? INSTRUMENTS[0];
