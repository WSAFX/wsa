import { useState } from 'react';
import { Calculator, RefreshCw, Settings2, Target, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ACCOUNT_CURRENCIES, GROUPS, INSTRUMENTS, LOT_PRESETS, findInstrument } from '../lib/instruments';
import {
  conversion,
  crossPrice,
  floorToStep,
  formatMoney,
  formatNumber,
  pipValueInQuote,
  pipsBetween,
  positionSize,
  priceDecimals,
  type Rates,
} from '../lib/pipMath';

type Mode = 'pip' | 'position' | 'pnl';

const MODES: { id: Mode; label: string; icon: typeof Calculator }[] = [
  { id: 'pip', label: 'Pip value', icon: Calculator },
  { id: 'position', label: 'Position size', icon: Target },
  { id: 'pnl', label: 'Profit / loss', icon: TrendingUp },
];

const QUICK_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'GBP/JPY', 'USD/NGN'];

const num = (s: string) => {
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

interface RatesResponse {
  rates: Rates;
  updated_at: string | null;
  source: string;
}

function Field({
  label,
  value,
  onChange,
  suffix,
  hint,
  step = 'any',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-adaptive-secondary">{label}</span>
      <span className="relative block">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-adaptive bg-adaptive-secondary px-4 py-3 text-adaptive placeholder-adaptive-muted transition-all focus:border-primary-500 focus:outline-none input-glow"
        />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-adaptive-muted">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-xs text-adaptive-muted">{hint}</span>}
    </label>
  );
}

function Result({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'good' | 'bad' | 'main' }) {
  const color =
    accent === 'good' ? 'text-green-500' : accent === 'bad' ? 'text-red-500' : accent === 'main' ? 'gradient-text-gold' : 'text-adaptive';
  return (
    <div className="rounded-2xl border border-adaptive bg-adaptive-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-adaptive-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-adaptive-muted">{sub}</p>}
    </div>
  );
}

/** Pip value, position size and profit/loss calculator across ~50 pairs + metals. */
const PipCalculator = ({ compact = false }: { compact?: boolean }) => {
  const { data: ratesData, error: ratesError } = useApi<RatesResponse>('/rates');
  const rates = ratesData?.rates ?? null;

  const [mode, setMode] = useState<Mode>('pip');
  const [symbol, setSymbol] = useState('EUR/USD');
  const [account, setAccount] = useState('USD');
  const [lots, setLots] = useState('1');
  // position size
  const [balance, setBalance] = useState('1000');
  const [balanceEdited, setBalanceEdited] = useState(false);
  const [riskPct, setRiskPct] = useState('1');
  const [stopPips, setStopPips] = useState('30');
  const [tpPips, setTpPips] = useState('60');
  // profit / loss
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  // advanced overrides
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pipOverride, setPipOverride] = useState('');
  const [contractOverride, setContractOverride] = useState('');
  const [rateOverride, setRateOverride] = useState('');

  const inst = findInstrument(symbol);
  const pipSize = num(pipOverride) > 0 ? num(pipOverride) : inst.pipSize;
  const contractSize = num(contractOverride) > 0 ? num(contractOverride) : inst.contractSize;
  const decimals = priceDecimals(pipSize);

  const liveConversion = conversion(inst.quote, account, rates);
  const quoteToAccount = num(rateOverride) > 0 ? num(rateOverride) : liveConversion;
  const livePrice = crossPrice(inst.base, inst.quote, rates);

  const perLot = quoteToAccount !== null ? pipValueInQuote(pipSize, contractSize, 1) * quoteToAccount : null;

  const pip = (() => {
    const l = num(lots);
    if (perLot === null || !(l > 0)) return null;
    return { value: perLot * l, ten: perLot * l * 10 };
  })();

  const position = (() => {
    const bal = num(balance);
    const risk = num(riskPct);
    const sl = num(stopPips);
    if (perLot === null || !(bal > 0) || !(risk > 0) || !(sl > 0)) return null;
    const riskAmount = (bal * risk) / 100;
    const exact = positionSize(riskAmount, sl, perLot);
    const lotsRounded = floorToStep(exact);
    const actualRisk = lotsRounded * sl * perLot;
    const tp = num(tpPips);
    return {
      riskAmount,
      exact,
      lots: lotsRounded,
      units: lotsRounded * contractSize,
      actualRisk,
      pipValue: lotsRounded * perLot,
      reward: tp > 0 ? lotsRounded * tp * perLot : null,
      rr: tp > 0 ? tp / sl : null,
      tooSmall: lotsRounded === 0,
    };
  })();

  const pnl = (() => {
    const e = num(entry);
    const x = num(exit);
    const l = num(lots);
    if (perLot === null || !(e > 0) || !(x > 0) || !(l > 0)) return null;
    const pips = pipsBetween(e, x, pipSize, direction);
    return { pips, profit: pips * perLot * l };
  })();

  function pickSymbol(s: string) {
    setSymbol(s);
    setPipOverride('');
    setContractOverride('');
    setRateOverride('');
    setEntry('');
    setExit('');
  }

  function useLivePrice() {
    if (livePrice === null) return;
    const p = livePrice.toFixed(decimals);
    setEntry(p);
    const move = 20 * pipSize * (direction === 'buy' ? 1 : -1);
    setExit((livePrice + move).toFixed(decimals));
  }

  const needsManualRate = quoteToAccount === null;
  const visibleModes = compact ? MODES.slice(0, 2) : MODES;

  return (
    <div className={`rounded-3xl border border-primary-500/20 bg-adaptive-card ${compact ? 'p-5 sm:p-6' : 'p-5 sm:p-8'} shadow-2xl shadow-primary-950/20`}>
      {/* Mode tabs */}
      <div role="tablist" aria-label="Calculator type" className="mb-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleModes.length}, minmax(0, 1fr))` }}>
        {visibleModes.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              mode === m.id
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                : 'border border-primary-500/20 bg-primary-500/10 text-adaptive-secondary hover:text-adaptive'
            }`}
          >
            <m.icon className="h-4 w-4" />
            <span className="truncate">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Instrument + account */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-adaptive-secondary">Currency pair</span>
          <select
            value={symbol}
            onChange={(e) => pickSymbol(e.target.value)}
            className="w-full rounded-xl border border-adaptive bg-adaptive-secondary px-4 py-3 font-mono text-adaptive focus:border-primary-500 focus:outline-none"
          >
            {GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {INSTRUMENTS.filter((i) => i.group === g).map((i) => (
                  <option key={i.symbol} value={i.symbol}>
                    {i.symbol}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-adaptive-secondary">Account currency</span>
          <select
            value={account}
            onChange={(e) => {
              const next = e.target.value;
              setAccount(next);
              setRateOverride('');
              // Until the user types a balance, keep the example at roughly $1,000 in the new currency.
              if (!balanceEdited) {
                const usdTo = conversion('USD', next, rates);
                if (usdTo) setBalance(String(Number((1000 * usdTo).toPrecision(2))));
              }
            }}
            className="w-full rounded-xl border border-adaptive bg-adaptive-secondary px-4 py-3 font-mono text-adaptive focus:border-primary-500 focus:outline-none"
          >
            {ACCOUNT_CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PAIRS.map((p) => (
            <button
              key={p}
              onClick={() => pickSymbol(p)}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs transition ${
                symbol === p ? 'bg-primary-500 text-white' : 'bg-primary-500/10 text-adaptive-secondary hover:text-adaptive'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-adaptive-muted">
        <span>
          1 pip = <span className="font-mono text-adaptive">{pipSize}</span>
        </span>
        <span>
          1 lot = <span className="font-mono text-adaptive">{contractSize.toLocaleString()}</span> {inst.base === 'XAU' || inst.base === 'XAG' ? 'oz' : inst.base}
        </span>
        {livePrice !== null && (
          <span>
            Indicative price <span className="font-mono text-adaptive">{livePrice.toFixed(decimals)}</span>
          </span>
        )}
      </p>

      {/* Mode inputs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {mode === 'pip' && (
          <>
            <Field label="Position size" value={lots} onChange={setLots} suffix="lots" step="0.01" />
            <div>
              <span className="mb-1.5 block text-sm font-medium text-adaptive-secondary">Quick lot size</span>
              <div className="grid grid-cols-3 gap-2">
                {LOT_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setLots(String(p.lots))}
                    className={`rounded-xl px-2 py-3 text-xs font-semibold transition ${
                      num(lots) === p.lots ? 'bg-primary-500 text-white' : 'border border-primary-500/20 bg-primary-500/10 text-adaptive-secondary'
                    }`}
                  >
                    {p.label}
                    <span className="block font-mono font-normal opacity-80">{p.lots}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === 'position' && (
          <>
            <Field
              label="Account balance"
              value={balance}
              onChange={(v) => {
                setBalance(v);
                setBalanceEdited(true);
              }}
              suffix={account}
            />
            <div>
              <Field label="Risk per trade" value={riskPct} onChange={setRiskPct} suffix="%" step="0.1" />
              <div className="mt-2 flex gap-2">
                {['0.5', '1', '2', '3'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskPct(r)}
                    className={`flex-1 rounded-lg py-1 text-xs font-semibold ${
                      riskPct === r ? 'bg-primary-500 text-white' : 'bg-primary-500/10 text-adaptive-secondary'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
            <Field label="Stop loss" value={stopPips} onChange={setStopPips} suffix="pips" step="1" />
            {!compact && <Field label="Take profit (optional)" value={tpPips} onChange={setTpPips} suffix="pips" step="1" />}
          </>
        )}

        {mode === 'pnl' && (
          <>
            <div className="sm:col-span-2 grid grid-cols-2 gap-2">
              {(['buy', 'sell'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold uppercase transition ${
                    direction === d
                      ? d === 'buy'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'border border-adaptive bg-adaptive-secondary text-adaptive-secondary'
                  }`}
                >
                  {d === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} {d}
                </button>
              ))}
            </div>
            <Field label="Entry price" value={entry} onChange={setEntry} step={String(pipSize / 10)} />
            <Field label="Exit price" value={exit} onChange={setExit} step={String(pipSize / 10)} />
            <Field label="Position size" value={lots} onChange={setLots} suffix="lots" step="0.01" />
            <div className="flex items-end">
              <button
                onClick={useLivePrice}
                disabled={livePrice === null}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-500/30 bg-primary-500/10 py-3 text-sm font-semibold text-primary-500 transition hover:bg-primary-500/20 disabled:opacity-40"
                title={livePrice === null ? 'No live price for this instrument; type the prices' : 'Fill in the current indicative price'}
              >
                <RefreshCw className="h-4 w-4" /> Use current price
              </button>
            </div>
          </>
        )}
      </div>

      {/* Conversion rate (manual when the live rate is missing) */}
      {(needsManualRate || showAdvanced) && (
        <div className="mt-4 rounded-2xl border border-accent-500/30 bg-accent-500/5 p-4">
          <Field
            label={`Exchange rate: 1 ${inst.quote} = ? ${account}`}
            value={rateOverride}
            onChange={setRateOverride}
            hint={
              needsManualRate
                ? `Live rates are unavailable${ratesError ? '' : ' for this currency'}. Enter the rate to convert ${inst.quote} into ${account}.`
                : liveConversion !== null
                  ? `Live: ${formatNumber(liveConversion, liveConversion < 0.01 ? 6 : 4)}. Leave empty to use it.`
                  : undefined
            }
          />
        </div>
      )}

      {/* Results */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2" aria-live="polite">
        {mode === 'pip' &&
          (pip ? (
            <>
              <Result label="Value per pip" value={formatMoney(pip.value, account)} accent="main" sub={`${formatNumber(num(lots), 2)} lot${num(lots) === 1 ? '' : 's'} of ${symbol}`} />
              <Result label="Value per 10 pips" value={formatMoney(pip.ten, account)} />
              {!compact && (
                <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-adaptive">
                  <table className="w-full text-sm">
                    <thead className="bg-primary-500/10 text-left text-xs uppercase tracking-wide text-adaptive-muted">
                      <tr>
                        <th className="px-4 py-2">Lot type</th>
                        <th className="px-4 py-2">Units</th>
                        <th className="px-4 py-2 text-right">Per pip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LOT_PRESETS.map((p) => (
                        <tr key={p.label} className="border-t border-adaptive">
                          <td className="px-4 py-2 text-adaptive">{p.label}</td>
                          <td className="px-4 py-2 font-mono text-adaptive-secondary">{(p.lots * contractSize).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right font-mono text-adaptive">{formatMoney(perLot! * p.lots, account)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className="sm:col-span-2 text-sm text-adaptive-muted">Enter a position size{needsManualRate ? ' and exchange rate' : ''} to see the pip value.</p>
          ))}

        {mode === 'position' &&
          (position ? (
            <>
              <Result
                label="Position size"
                value={`${formatNumber(position.lots, 2)} lots`}
                accent="main"
                sub={`${Math.round(position.units).toLocaleString()} units · exact ${formatNumber(position.exact, 4)}`}
              />
              <Result
                label="Amount at risk"
                value={formatMoney(position.actualRisk, account)}
                sub={`Target ${formatMoney(position.riskAmount, account)} (${riskPct}% of balance)`}
                accent="bad"
              />
              <Result label="Value per pip" value={formatMoney(position.pipValue, account)} />
              {position.reward !== null && !compact && (
                <Result
                  label="Profit at take profit"
                  value={formatMoney(position.reward, account)}
                  sub={`Risk : reward = 1 : ${formatNumber(position.rr ?? 0, 2)}`}
                  accent="good"
                />
              )}
              {position.tooSmall && (
                <p className="sm:col-span-2 flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-xs text-red-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" /> The risk is too small for even 0.01 lots with this stop loss. Widen the risk %, raise the balance or tighten the stop.
                </p>
              )}
            </>
          ) : (
            <p className="sm:col-span-2 text-sm text-adaptive-muted">Enter your balance, risk and stop loss.</p>
          ))}

        {mode === 'pnl' &&
          (pnl ? (
            <>
              <Result label="Pips" value={`${pnl.pips >= 0 ? '+' : ''}${formatNumber(pnl.pips, 1)}`} accent={pnl.pips >= 0 ? 'good' : 'bad'} />
              <Result
                label={pnl.profit >= 0 ? 'Profit' : 'Loss'}
                value={formatMoney(pnl.profit, account)}
                accent={pnl.profit >= 0 ? 'good' : 'bad'}
                sub={`${direction.toUpperCase()} ${formatNumber(num(lots), 2)} lots ${symbol}`}
              />
            </>
          ) : (
            <p className="sm:col-span-2 text-sm text-adaptive-muted">Enter entry and exit prices and a position size.</p>
          ))}
      </div>

      {/* Advanced */}
      {!compact && (
        <div className="mt-6">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className="flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-400"
          >
            <Settings2 className="h-4 w-4" /> {showAdvanced ? 'Hide' : 'Show'} broker settings
          </button>
          {showAdvanced && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Pip size" value={pipOverride} onChange={setPipOverride} hint={`Default ${inst.pipSize}. Some brokers use a different pip for exotics and metals.`} />
              <Field label="Contract size (1 lot)" value={contractOverride} onChange={setContractOverride} hint={`Default ${inst.contractSize.toLocaleString()}.`} />
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-adaptive-muted">
        {ratesData?.updated_at
          ? `Conversion uses ${ratesData.source} mid rates updated ${new Date(ratesData.updated_at).toLocaleString()}. `
          : ''}
        Results are estimates for education; your broker&apos;s prices, spreads and contract specs decide the final figures.
      </p>
    </div>
  );
};

export default PipCalculator;
