import type { NewsArticle } from '../types';
import { api, ApiError } from '../lib/api';

/**
 * WallBot client. The OpenRouter + NewsAPI keys live on the backend
 * (POST /api/public/chat, GET /api/public/news) — nothing secret ships to the browser.
 * If the backend reports the assistant isn't configured (503), we fall back to the
 * built-in demo answers below.
 */

let assistantAvailable = true;

// Check if a question is forex-related
const isForexRelated = (message: string): boolean => {
  const forexKeywords = [
    'forex', 'trading', 'currency', 'pair', 'eur', 'usd', 'gbp', 'jpy', 'ngn',
    'chart', 'technical', 'fundamental', 'analysis', 'indicator', 'rsi', 'macd',
    'moving average', 'candlestick', 'support', 'resistance', 'trend', 'breakout',
    'pip', 'lot', 'leverage', 'margin', 'spread', 'broker', 'exchange', 'market',
    'buy', 'sell', 'long', 'short', 'position', 'order', 'stop loss', 'tp', 'sl', 'take profit',
    'risk', 'reward', 'management', 'psychology', 'strategy', 'scalp', 'swing',
    'day trade', 'central bank', 'interest rate', 'inflation', 'gdp', 'employment',
    'economic', 'news', 'volatility', 'liquidity', 'session', 'london', 'new york',
    'tokyo', 'dollar', 'euro', 'pound', 'yen', 'naira', 'gold', 'xau', 'price',
    'action', 'pattern', 'fibonacci', 'elliott', 'wave', 'academy', 'course',
    'learn', 'study', 'wallstreet', 'trade', 'profit', 'loss', 'account', 'demo',
    'live', 'capital', 'investment', 'invest', 'money', 'financial', 'finance',
    'beginner', 'advanced', 'intermediate', 'strategy', 'plan', 'journal',
    'backtest', 'forward test', 'drawdown', 'equity', 'balance', 'hedge'
  ];

  const lowerMessage = message.toLowerCase();
  return forexKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Latest forex headlines (cached server-side)
export const fetchForexNews = async (): Promise<NewsArticle[]> => {
  try {
    return await api.get<NewsArticle[]>('/news');
  } catch {
    return [];
  }
};

// False once the backend says the assistant isn't configured — the UI then shows demo mode.
export const isApiConfigured = (): boolean => assistantAvailable;

const OFF_TOPIC_REPLY = `I appreciate your question, but I'm WallBot, a specialized forex trading assistant for Wallstreet Forex Academy. I can only help with forex-related topics like:

• Currency pair analysis (EUR/USD, GBP/USD, etc.)
• Technical and fundamental analysis
• Trading strategies and risk management
• Market news and insights
• Our academy's courses and programs

Is there anything about forex trading I can help you with today? 📈`;

// Main chat function
export const sendMessage = async (
  message: string,
  conversationHistory: { role: string; content: string }[]
): Promise<string> => {
  // Cheap client-side guard so obviously off-topic questions don't cost an API call.
  if (!isForexRelated(message) && conversationHistory.length > 0) {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'what can you do', 'help'];
    if (!greetings.some((g) => message.toLowerCase().includes(g))) return OFF_TOPIC_REPLY;
  }

  if (!assistantAvailable) return getSimulatedResponse(message);

  const messages = [
    ...conversationHistory
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content.trim())
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 4000) })),
    { role: 'user' as const, content: message.slice(0, 4000) },
  ];

  try {
    const { reply } = await api.post<{ reply: string }>('/chat', { messages });
    return reply;
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      assistantAvailable = false;
      return getSimulatedResponse(message);
    }
    throw error;
  }
};

// Simulated response for demo mode (when no API key is provided)
export const getSimulatedResponse = async (message: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  const lowerMessage = message.toLowerCase();

  // Check for non-forex topics
  if (!isForexRelated(message)) {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(g => lowerMessage.includes(g))) {
      return `Hello! 👋 Welcome to Wallstreet Forex Academy's AI assistant. I'm WallBot, your forex trading companion!

I'm here to help you with:
• Forex trading concepts and strategies
• Technical and fundamental analysis
• Market insights and news
• Information about our courses

What would you like to learn about today? 📈`;
    }

    return `I appreciate your question, but I'm WallBot, a specialized forex trading assistant. I can only help with forex-related topics.

Here are some things I can help you with:
• Currency pair analysis
• Trading strategies
• Technical indicators
• Risk management
• Our academy's programs

How can I assist you with forex trading? 📊`;
  }

  // Forex-related responses
  if (lowerMessage.includes('eur/usd') || lowerMessage.includes('eurusd')) {
    return `**EUR/USD Analysis** 📊

The EUR/USD is the most traded currency pair in the world, representing about 28% of daily forex volume.

**Key Points:**
• Current major support: 1.0800
• Current major resistance: 1.0950
• The pair is influenced by ECB and Fed monetary policies

**Trading Tips:**
1. Watch for ECB interest rate decisions
2. US Non-Farm Payrolls heavily impact this pair
3. London and New York session overlaps offer the best liquidity

Would you like to learn more about trading EUR/USD at our academy? We cover this pair extensively in our Technical Analysis Mastery course! 📚`;
  }

  if (lowerMessage.includes('strategy') || lowerMessage.includes('strategies')) {
    return `**Forex Trading Strategies** 🎯

Here are popular strategies we teach at Wallstreet Forex Academy:

**1. Trend Following**
• Identify the trend using moving averages
• Enter in the direction of the trend
• Best for: Patient traders

**2. Breakout Trading**
• Wait for price to break key levels
• Confirm with volume
• Best for: Active traders

**3. Support & Resistance**
• Buy at support, sell at resistance
• Use multiple timeframes
• Best for: All skill levels

**4. Price Action**
• Trade based on candlestick patterns
• No indicators needed
• Best for: Intermediate traders

Want to master these strategies? Our Professional Trading Program covers all of them in depth! 🚀`;
  }

  if (lowerMessage.includes('risk') || lowerMessage.includes('management')) {
    return `**Risk Management - The Key to Long-Term Success** ⚠️

At Wallstreet Forex Academy, we emphasize that risk management is MORE important than entry strategies.

**The Golden Rules:**
1. **Never risk more than 1-2%** of your account per trade
2. **Always use stop losses** - No exceptions!
3. **Risk-Reward Ratio:** Aim for at least 1:2 (risk $1 to make $2)
4. **Position Sizing Formula:**
   Position Size = (Account × Risk%) ÷ Stop Loss in Pips

**Example:**
• Account: $10,000
• Risk per trade: 1% ($100)
• Stop Loss: 50 pips
• Position Size: $100 ÷ 50 = $2/pip = 0.2 lots

This is covered extensively in all our courses. Would you like more details? 📈`;
  }

  if (lowerMessage.includes('course') || lowerMessage.includes('learn') || lowerMessage.includes('academy')) {
    return `**Wallstreet Forex Academy Courses** 🎓

We offer three comprehensive programs:

**1. Forex Fundamentals (₦150,000)**
• Duration: 4 weeks
• Perfect for: Complete beginners
• Learn: Basics, demo trading, market mechanics

**2. Technical Analysis Mastery (₦300,000)**
• Duration: 8 weeks
• Perfect for: Intermediate traders
• Learn: Chart patterns, indicators, live trading

**3. Professional Trading Program (₦500,000)**
• Duration: 12 weeks
• Perfect for: Serious traders
• Includes: 1-on-1 mentorship, funded account opportunity

**Our CEO, Chukwuma Cornelius Chibuike**, personally oversees all programs with 15+ years of experience.

Visit us in Enugu or contact us to enroll! 🚀`;
  }

  if (lowerMessage.includes('news') || lowerMessage.includes('market')) {
    return `**Current Market Insights** 📰

**Key Factors Affecting Markets:**

1. **Central Bank Policies**
   • Fed, ECB, and BOJ decisions drive major pairs
   • Watch for rate decision announcements

2. **Economic Indicators**
   • Non-Farm Payrolls (USD)
   • CPI/Inflation data
   • GDP releases

3. **Geopolitical Events**
   • Trade tensions
   • Political elections
   • Global conflicts

**Pro Tip:** Use an economic calendar to track upcoming events!

Want to learn how to trade the news? Our Technical Analysis Mastery course covers this! 📈`;
  }

  // Default response
  return `Great question about forex trading! 📈

At Wallstreet Forex Academy, we believe in practical, hands-on education. Here's what I can help you with:

• **Analysis:** Technical and fundamental analysis techniques
• **Strategies:** Day trading, swing trading, scalping
• **Risk:** Position sizing and money management
• **Psychology:** Developing the right trading mindset
• **Courses:** Information about our programs

Our CEO, **Chukwuma Cornelius Chibuike**, has over 15 years of trading experience and has trained 5,000+ successful traders.

What specific aspect of forex trading would you like to explore? 🎯`;
};
