import { Link } from 'react-router-dom';
import { Calculator, GraduationCap } from 'lucide-react';
import PipCalculator from '../components/PipCalculator';
import { usePageMeta } from '../hooks/usePageMeta';
import { INSTRUMENTS } from '../lib/instruments';

const FAQ = [
  {
    q: 'What is a pip?',
    a: 'A pip is the standard unit of price movement. For most pairs it is the 4th decimal (0.0001); for JPY pairs and high-value currencies like the naira it is the 2nd decimal (0.01). Gold usually moves in $0.10 pips.',
  },
  {
    q: 'Why does the pip value change with my account currency?',
    a: 'A pip is worth a fixed amount of the quote currency (the second currency in the pair). If your account is in another currency, that amount is converted at the current exchange rate, which is why a pip on EUR/USD is worth about $10 per standard lot but a different amount in naira.',
  },
  {
    q: 'How should I size my positions?',
    a: 'Decide how much of your balance you are willing to lose on one trade (many traders use 1–2%), set your stop loss in pips, and let the position-size tab work out the lot size. Never size a trade first and pick the stop afterwards.',
  },
];

const PipCalculatorPage = () => {
  usePageMeta(
    'Pip Calculator',
    'Free forex pip calculator: pip value, position size and profit/loss for the 50 most traded pairs, gold, silver and USD/NGN, in naira or dollars.',
  );

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-2 text-sm font-medium text-accent-600 dark:text-accent-400">
          <Calculator className="h-4 w-4" /> Free trader tool
        </span>
        <h1 className="font-display text-4xl font-bold text-adaptive sm:text-5xl">
          Forex <span className="gradient-text">Pip Calculator</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-adaptive-secondary">
          Pip value, position size and profit/loss for {INSTRUMENTS.length} instruments: the 50 most traded pairs, USD/NGN, gold and
          silver, in naira, dollars or eight other account currencies.
        </p>
      </header>

      <PipCalculator />

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {FAQ.map((f) => (
          <div key={f.q} className="rounded-2xl border border-adaptive bg-adaptive-card p-6">
            <h2 className="font-display text-lg font-bold text-adaptive">{f.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-adaptive-secondary">{f.a}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-900/40 to-primary-950/40 p-8 text-center sm:flex-row sm:text-left">
        <GraduationCap className="h-12 w-12 shrink-0 text-accent-500" />
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-adaptive">Want to master risk management?</h2>
          <p className="mt-1 text-adaptive-secondary">Position sizing is one of the first things we drill in every program.</p>
        </div>
        <Link to="/#courses" className="btn-primary inline-flex shrink-0">
          See our courses
        </Link>
      </section>
    </main>
  );
};

export default PipCalculatorPage;
