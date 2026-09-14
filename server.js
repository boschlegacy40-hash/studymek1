// StudyMek backend — serves the static site AND proxies the "Live News" feature
// to Anthropic's API, so the API key never has to sit in browser-visible code.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(express.json());

// Serve the site's static files (index.html, etc.) from this same folder
app.use(express.static(path.join(__dirname)));

// A tiny in-memory cache so a burst of clicks doesn't burn API calls —
// news doesn't change minute to minute, so 15 minutes is plenty fresh.
let cachedNews = null;
let cachedAt = 0;
const CACHE_MS = 15 * 60 * 1000;

const NEWS_SYSTEM_PROMPT = `You are a news researcher for StudyMek, a study app for Guyanese NGSA and CXC students. Use web search to find 4 to 6 REAL, CURRENT news stories (ideally from the last 30 days) about: (1) CXC/CSEC exam results, registration windows, syllabus or policy changes, and (2) Guyana education or education-technology developments relevant to students. After searching, respond with ONLY a raw JSON array and nothing else — no markdown fences, no preamble, no explanation. Each array item must be an object with exactly these keys: tag (a short 1-3 word uppercase label like RESULTS, REGISTRATION, DIGITAL LEARNING), category (either "cxc" or "tech"), title (a short punchy headline, under 12 words), summary (2 to 3 sentences, WRITTEN ENTIRELY IN YOUR OWN WORDS — never copy sentences from the source), source (the publication name), and url (the real article URL from your search results). If you cannot find enough real current stories, return fewer items rather than inventing any.`;

app.post('/api/news', async (req, res) => {
  try {
    // Serve from cache if it's fresh, so repeated clicks are instant and cheap
    if (cachedNews && (Date.now() - cachedAt) < CACHE_MS) {
      return res.json({ items: cachedNews, cached: true });
    }

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Set it in your Render service\'s Environment settings.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: NEWS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: 'Find the latest real CXC exam news and Guyana education/tech news for students right now.' }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').filter(Boolean).join('\n').trim();
    const cleaned = text.replace(/^```json\s*|^```\s*|```$/gm, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const items = JSON.parse(match ? match[0] : cleaned);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(502).json({ error: 'No stories returned' });
    }

    cachedNews = items;
    cachedAt = Date.now();
    res.json({ items, cached: false });
  } catch (err) {
    console.error('News proxy error:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Any other route falls through to index.html (single-page app behaviour)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`StudyMek server running on port ${PORT}`);
});
