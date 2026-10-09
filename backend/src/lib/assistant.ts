import { env } from './env';
import { HttpError } from '../middleware/error';
import { logger } from './logger';
import { sql } from './db';

/**
 * Server-side proxy for the WallBot assistant + market news.
 * The OpenRouter / NewsAPI keys live only here — the public site never sees them.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

const SYSTEM_PROMPT = `You are WallBot, the official AI assistant for Wallstreet Forex Academy based in Enugu, Nigeria. You are an expert forex trading assistant with comprehensive knowledge about:

1. **Currency Trading**: All major, minor, and exotic currency pairs
2. **Technical Analysis**: Chart patterns, indicators (RSI, MACD, Moving Averages, Bollinger Bands, etc.), candlestick patterns
3. **Fundamental Analysis**: Economic indicators, central bank policies, GDP, inflation, employment data
4. **Risk Management**: Position sizing, stop-loss strategies, risk-reward ratios
5. **Trading Psychology**: Emotional control, discipline, trading plans
6. **Market Sessions**: London, New York, Tokyo, Sydney sessions and their characteristics
7. **Trading Strategies**: Day trading, swing trading, scalping, position trading

**IMPORTANT RULES:**
- You ONLY answer questions related to forex trading, currency markets, and financial education
- If asked about topics outside forex (like cooking, sports, general knowledge, programming unrelated to trading), politely decline and redirect to forex topics
- Always be helpful, educational, and professional
- When providing market insights, mention that this is educational content, not financial advice
- Promote Wallstreet Forex Academy's courses when relevant
- Be conversational and encouraging to students learning forex

**About Wallstreet Forex Academy:**
- CEO: Chukwuma Cornelius Chibuike (15+ years trading experience)
- Secretary: Chukwuma Kamsi Cynthia
- Location: Enugu, Nigeria

When you receive news data, incorporate it naturally into your response about current market conditions.`;

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage?: string;
}

// News changes slowly and NewsAPI's free tier is rate-limited, so cache briefly in memory.
let newsCache: { at: number; items: NewsArticle[] } | null = null;
const NEWS_TTL_MS = 10 * 60 * 1000;

export async function fetchForexNews(): Promise<NewsArticle[]> {
  if (!env.newsApiKey) return [];
  if (newsCache && Date.now() - newsCache.at < NEWS_TTL_MS) return newsCache.items;

  const url = `${NEWS_API_URL}?q=forex+OR+currency+OR+trading&language=en&sortBy=publishedAt&pageSize=5`;
  const res = await fetch(url, { headers: { 'X-Api-Key': env.newsApiKey } });
  if (!res.ok) {
    logger.warn('news fetch failed', { status: res.status });
    return newsCache?.items ?? [];
  }

  const data = (await res.json()) as {
    articles?: Array<{
      title: string;
      description: string;
      url: string;
      source?: { name?: string };
      publishedAt: string;
      urlToImage?: string;
    }>;
  };
  const items = (data.articles ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    url: a.url,
    source: a.source?.name ?? '',
    publishedAt: a.publishedAt,
    urlToImage: a.urlToImage,
  }));
  newsCache = { at: Date.now(), items };
  return items;
}

function wantsNews(message: string): boolean {
  const m = message.toLowerCase();
  return ['news', 'market', 'today', 'current'].some((k) => m.includes(k));
}

export function isAssistantConfigured(): boolean {
  return Boolean(env.openRouterApiKey);
}

export async function chat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  if (!env.openRouterApiKey) throw new HttpError(503, 'Assistant is not configured');

  const last = messages[messages.length - 1];
  let systemPrompt = SYSTEM_PROMPT;

  // Live course list from the admin, so prices/durations quoted by WallBot stay current.
  const courses = await sql`
    SELECT title, level, duration, price FROM public.courses WHERE active = true ORDER BY sort_order ASC
  `.catch(() => []);
  if (courses.length) {
    const lines = courses.map((c) => {
      const details = [c.level, c.duration, c.price].filter(Boolean).join(', ');
      return `- ${c.title} (${details})`;
    });
    systemPrompt += `\n\n**Current courses:**\n${lines.join('\n')}`;
  }
  if (last?.role === 'user' && wantsNews(last.content)) {
    const news = await fetchForexNews().catch(() => []);
    if (news.length) {
      systemPrompt += `\n\n**Latest Forex News (for context):**\n${news
        .map((n, i) => `${i + 1}. ${n.title} - ${n.source}`)
        .join('\n')}`;
    }
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openRouterApiKey}`,
      'HTTP-Referer': env.siteUrl,
      'X-Title': 'Wallstreet Forex Academy',
    },
    body: JSON.stringify({
      model: env.openRouterModel,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    logger.error('openrouter request failed', { status: res.status });
    throw new HttpError(502, 'The assistant is unavailable right now. Please try again.');
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
}
