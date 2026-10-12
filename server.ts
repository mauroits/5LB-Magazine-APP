import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface CachedTts {
  buffer: Buffer;
  contentType: string;
}

// In-memory cache for generated TTS audio buffers (max 300 items)
const ttsCache = new Map<string, CachedTts>();


app.use(express.json());

// Blogger Feed Proxy endpoint
app.get('/api/feed', async (req, res) => {
  try {
    const maxResults = req.query['max-results'] || '15';
    const startIndex = req.query['start-index'] || '1';
    const category = req.query['category'] as string | undefined;
    const q = req.query['q'] as string | undefined;

    let targetUrl = `https://magazine.5lb.eu/feeds/posts/default?alt=json&max-results=${maxResults}&start-index=${startIndex}`;
    if (category) {
      targetUrl = `https://magazine.5lb.eu/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=${maxResults}&start-index=${startIndex}`;
    }
    if (q) {
      targetUrl += `&q=${encodeURIComponent(q)}`;
    }

    const ifModifiedSince = req.headers['if-modified-since'];
    const fetchHeaders: Record<string, string> = {
      'User-Agent': '5LB-Magazine-PWA/1.0 (+https://5lb.eu)',
      Accept: 'application/json',
    };
    if (ifModifiedSince) {
      fetchHeaders['If-Modified-Since'] = ifModifiedSince;
    }

    const response = await fetch(targetUrl, { headers: fetchHeaders });

    if (response.status === 304) {
      return res.status(304).end();
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Blogger feed returned ${response.status}: ${response.statusText}`,
      });
    }

    const data = await response.json();

    // 2-hour delay filter to ensure the author has finalized the publication URL
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    if (Array.isArray(data.feed?.entry)) {
      data.feed.entry = data.feed.entry.filter((entry: any) => {
        const pubStr = entry.published?.$t;
        if (!pubStr) return true;
        const pubTime = new Date(pubStr).getTime();
        return isNaN(pubTime) || pubTime <= cutoff;
      });
    }

    // Cache for 300 seconds (5 min) on client, 900 seconds (15 min) on CDN to prevent excessive Blogger requests
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900');
    return res.json(data);
  } catch (error: any) {
    console.error('Error fetching Blogger feed:', error);
    return res.status(500).json({ error: error.message || 'Internal feed error' });
  }
});

// Check for updates endpoint (used by Periodic Sync & background polling with conditional If-Modified-Since)
app.get('/api/check-updates', async (req, res) => {
  try {
    const ifModifiedSince = req.headers['if-modified-since'];
    const fetchHeaders: Record<string, string> = {
      'User-Agent': '5LB-Magazine-PWA/1.0 (+https://5lb.eu)',
      Accept: 'application/json',
    };
    if (ifModifiedSince) {
      fetchHeaders['If-Modified-Since'] = ifModifiedSince;
    }

    const targetUrl = 'https://magazine.5lb.eu/feeds/posts/default?alt=json&max-results=5';
    const response = await fetch(targetUrl, { headers: fetchHeaders });

    if (response.status === 304) {
      return res.status(304).end();
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch latest post' });
    }

    const data = await response.json();
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const entries = (data.feed?.entry || []).filter((entry: any) => {
      const pubStr = entry.published?.$t;
      if (!pubStr) return true;
      const pubTime = new Date(pubStr).getTime();
      return isNaN(pubTime) || pubTime <= cutoff;
    });

    const entry = entries[0];
    if (!entry) {
      return res.json({ hasNew: false });
    }

    const postDate = new Date(entry.updated?.$t || entry.published?.$t).getTime();
    if (ifModifiedSince) {
      const sinceTime = new Date(ifModifiedSince).getTime();
      if (!isNaN(sinceTime) && postDate <= sinceTime) {
        return res.status(304).end();
      }
    }

    let link = 'https://magazine.5lb.eu';
    if (Array.isArray(entry.link)) {
      const altLink = entry.link.find((l: any) => l.rel === 'alternate' && l.type === 'text/html');
      if (altLink && altLink.href) link = altLink.href;
    }

    const rawContent = entry.summary?.$t || entry.content?.$t || '';
    const summary = rawContent.replace(/<[^>]+>/g, ' ').slice(0, 150).trim();
    const lastModified = new Date(postDate).toUTCString();

    res.setHeader('Last-Modified', lastModified);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900');

    return res.json({
      hasNew: true,
      id: entry.id?.$t,
      title: entry.title?.$t,
      summary,
      link,
      published: entry.published?.$t,
      updated: entry.updated?.$t,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Telegram in-app view proxy endpoint to bypass X-Frame-Options: SAMEORIGIN
app.get('/api/telegram-view', async (req, res) => {
  try {
    const response = await fetch('https://t.me/s/magazine5LB', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send('Errore nel caricamento del canale Telegram.');
    }

    let html = await response.text();

    // Inject <base href="https://t.me/"> and ensure external links open in new tab
    html = html.replace(
      '<head>',
      '<head><base href="https://t.me/"><style>body{background-color:#f8fafc;}@media(prefers-color-scheme:dark){body{background-color:#020617;}}</style>'
    );

    // Remove frame headers so iframe renders perfectly inside app
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300');
    return res.send(html);
  } catch (error: any) {
    console.error('Error proxying Telegram:', error);
    return res.status(500).send('Impossibile caricare il canale Telegram al momento.');
  }
});

// Helper to send audio response with HTTP Range (206 Partial Content) support for mobile media players
function sendAudioResponse(
  req: express.Request,
  res: express.Response,
  buffer: Buffer,
  contentType: string
) {
  const totalLength = buffer.length;
  const rangeHeader = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalLength - 1;

      if (start >= totalLength || end >= totalLength || start > end) {
        res.setHeader('Content-Range', `bytes */${totalLength}`);
        return res.status(416).end();
      }

      const chunk = buffer.subarray(start, end + 1);
      res.status(206);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLength}`);
      res.setHeader('Content-Length', chunk.length.toString());
      return res.end(chunk);
    }
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', totalLength.toString());
  return res.end(buffer);
}

// Helper to generate natural Italian speech audio via Google TTS stream with parallel fetching
async function generateGoogleTtsAudio(text: string): Promise<Buffer> {
  const subChunks: string[] = [];
  const words = text.split(/\s+/).filter(Boolean);
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).length <= 180) {
      current = current ? `${current} ${w}` : w;
    } else {
      if (current) subChunks.push(current);
      current = w;
    }
  }
  if (current) subChunks.push(current);

  const promises = subChunks.map(async (chunk) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=it&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });
    if (!response.ok) {
      throw new Error(`Google TTS failed with status ${response.status}`);
    }
    const arrayBuf = await response.arrayBuffer();
    return Buffer.from(arrayBuf);
  });

  const buffers = await Promise.all(promises);
  return Buffer.concat(buffers);
}

// Universal TTS Handler supporting both GET and POST requests
async function handleTtsRequest(req: express.Request, res: express.Response) {
  try {
    const rawText = (req.method === 'POST' ? req.body?.text : req.query?.text) as string | undefined;
    const voice = (req.method === 'POST' ? req.body?.voice : req.query?.voice) as string | undefined;

    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'Testo mancante o non valido.' });
    }

    const trimmed = rawText.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Testo vuoto.' });
    }

    const safeText = trimmed.slice(0, 1200);
    const voiceName = voice || 'default';
    const cacheKey = `tts:v3:${voiceName}:${safeText}`;

    // 1. Check in-memory cache
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      return sendAudioResponse(req, res, cached.buffer, cached.contentType);
    }

    let audioBuffer: Buffer | null = null;
    let contentType = 'audio/mpeg';

    // 2. Primary engine: Google Italian TTS (ultra-fast ~300ms, MP3 format, universally supported by Android and iOS)
    try {
      audioBuffer = await generateGoogleTtsAudio(safeText);
      contentType = 'audio/mpeg';
    } catch (googleError) {
      console.warn('Google TTS service issue, trying Gemini fallback:', googleError);
    }

    // 3. Fallback engine: Gemini TTS if Google TTS fails or if configured
    if (!audioBuffer && ai && process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [{ text: safeText }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice === 'default' ? 'Kore' : (voice || 'Kore') },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          audioBuffer = Buffer.from(base64Audio, 'base64');
          contentType = 'audio/wav';
        }
      } catch (geminiError: any) {
        console.warn('Gemini TTS error:', geminiError?.message || geminiError);
      }
    }

    if (!audioBuffer) {
      return res.status(503).json({ error: 'Sintesi vocale temporaneamente non disponibile.' });
    }

    // Cache the result with its exact content type
    if (ttsCache.size > 300) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) ttsCache.delete(firstKey);
    }
    ttsCache.set(cacheKey, { buffer: audioBuffer, contentType });

    return sendAudioResponse(req, res, audioBuffer, contentType);
  } catch (error: any) {
    console.error('Error in /api/tts endpoint:', error);
    return res.status(500).json({ error: error.message || 'Errore nella generazione vocale.' });
  }
}


app.post('/api/tts', handleTtsRequest);
app.get('/api/tts', handleTtsRequest);

// Full article audio cache (stores generated continuous MP3 buffers)
const articleTtsCache = new Map<string, { buffer: Buffer; contentType: string }>();
const inFlightArticleGeneration = new Map<string, Promise<{ buffer: Buffer; contentType: string }>>();

// Helper to generate full article continuous audio in batched parallel requests
async function generateFullArticleAudio(text: string): Promise<Buffer> {
  const subChunks: string[] = [];
  const words = text.split(/\s+/).filter(Boolean);
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).length <= 180) {
      current = current ? `${current} ${w}` : w;
    } else {
      if (current) subChunks.push(current);
      current = w;
    }
  }
  if (current) subChunks.push(current);

  const allBuffers: Buffer[] = [];
  for (let i = 0; i < subChunks.length; i += 15) {
    const batch = subChunks.slice(i, i + 15);
    const batchResults = await Promise.all(
      batch.map(async (chunk) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=it&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/',
          },
        });
        if (!response.ok) {
          throw new Error(`Google TTS failed with status ${response.status}`);
        }
        const arrayBuf = await response.arrayBuffer();
        return Buffer.from(arrayBuf);
      })
    );
    allBuffers.push(...batchResults);
  }

  return Buffer.concat(allBuffers);
}

// Prepare / pre-generate continuous article audio in background
app.post('/api/tts/prepare', async (req, res) => {
  try {
    const { id, text } = req.body || {};
    if (!id || !text) {
      return res.status(400).json({ error: 'ID o testo mancante' });
    }

    if (articleTtsCache.has(id)) {
      return res.json({ ready: true, id });
    }

    if (!inFlightArticleGeneration.has(id)) {
      const promise = (async () => {
        const buffer = await generateFullArticleAudio(text);
        const item = { buffer, contentType: 'audio/mpeg' };
        articleTtsCache.set(id, item);
        inFlightArticleGeneration.delete(id);
        return item;
      })();
      inFlightArticleGeneration.set(id, promise);
    }

    return res.json({ ready: false, id, message: 'Generazione avviata' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Stream continuous article audio supporting HTTP Range requests
app.get('/api/tts/article', async (req, res) => {
  try {
    const id = req.query.id as string;
    const directText = req.query.text as string | undefined;

    if (!id && !directText) {
      return res.status(400).json({ error: 'Parametro id mancante' });
    }

    const cacheKey = id || `custom:${directText?.slice(0, 50)}`;

    if (articleTtsCache.has(cacheKey)) {
      const cached = articleTtsCache.get(cacheKey)!;
      return sendAudioResponse(req, res, cached.buffer, cached.contentType);
    }

    if (inFlightArticleGeneration.has(cacheKey)) {
      const item = await inFlightArticleGeneration.get(cacheKey)!;
      return sendAudioResponse(req, res, item.buffer, item.contentType);
    }

    if (directText) {
      const buffer = await generateFullArticleAudio(directText);
      const item = { buffer, contentType: 'audio/mpeg' };
      articleTtsCache.set(cacheKey, item);
      return sendAudioResponse(req, res, buffer, 'audio/mpeg');
    }

    return res.status(404).json({ error: 'Audio articolo non ancora generato' });
  } catch (err: any) {
    console.error('Error in /api/tts/article:', err);
    return res.status(500).json({ error: err.message });
  }
});


async function startServer() {
  if (!isProduction) {
    // Development mode: Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 5LB Magazine PWA server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
