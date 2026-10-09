import { BloggerPost } from '../types';
import { postMatchesExactPhrase } from '../utils/searchUtils';
import { PUBLICATION_DELAY_HOURS } from '../config/navigation';

const FEED_CACHE_KEY = '5lb_magazine_posts_cache_v1';
const READ_POSTS_KEY = '5lb_read_posts_v1';
const FAVORITE_POSTS_KEY = '5lb_favorite_posts_v1';

/**
 * Upgrade low-resolution thumbnails to high-definition:
 * - YouTube: upgrades /default.jpg (120x90) and /mqdefault.jpg to /hqdefault.jpg (480x360)
 * - Blogger / Google User Content: upgrades /s72-c/ or =s72-c to /w800-h450-c/
 */
export function upgradeThumbnailUrl(url?: string): string | undefined {
  if (!url) return undefined;

  // 1. YouTube thumbnails
  if (url.includes('youtube.com') || url.includes('ytimg.com')) {
    return url
      .replace(/\/default\.jpg/i, '/hqdefault.jpg')
      .replace(/\/mqdefault\.jpg/i, '/hqdefault.jpg')
      .replace(/\/sddefault\.jpg/i, '/hqdefault.jpg');
  }

  // 2. Google User Content / Blogger photos
  let upgraded = url;
  // Upgrade slash pattern e.g. /s72-c/ or /s200/
  upgraded = upgraded.replace(/\/s\d+(-[a-zA-Z0-9_-]+)?\//g, '/w800-h450-c/');
  // Upgrade query param / dimension pattern e.g. =s72-c or =w72-h72
  upgraded = upgraded.replace(/=s\d+(-[a-zA-Z0-9_-]+)?/g, '=w800-h450-c');
  upgraded = upgraded.replace(/=w\d+(-h\d+)?(-[a-zA-Z0-9_-]+)?/g, '=w800-h450-c');

  return upgraded;
}

// Extract first image or embedded YouTube thumbnail from HTML content
function extractFirstImage(html: string): string | undefined {
  if (!html) return undefined;

  // Check for embedded YouTube iframe or video ID
  const ytMatch = html.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=)|youtu\.be\/)([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) {
    return upgradeThumbnailUrl(match[1]);
  }
  return undefined;
}

// Clean HTML to generate a neat plain-text snippet
function cleanTextSnippet(html: string, maxLength = 180): string {
  if (!html) return '';
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getReadPostIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_POSTS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {
    console.error(e);
  }
  return new Set();
}

export function saveReadPostIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_POSTS_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error(e);
  }
}

export function getFavoritePostIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITE_POSTS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {
    console.error(e);
  }
  return new Set();
}

export function saveFavoritePostIds(ids: Set<string>) {
  try {
    localStorage.setItem(FAVORITE_POSTS_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error(e);
  }
}

export const DEFAULT_PAGE_SIZE = 15;

export interface FetchBloggerPostsResult {
  posts: BloggerPost[];
  totalResults: number;
  hasMore: boolean;
}

export function getCachedPosts(): BloggerPost[] {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Errore lettura cache post:', e);
  }
  return [];
}

/**
 * Fetch feed using Google Blogger's official JSONP protocol (alt=json-in-script).
 * Avoids browser CORS restrictions on static deployments (e.g. app.5lb.eu or GitHub Pages).
 */
function fetchBloggerJsonp(maxResults: number, startIndex: number = 1, category?: string, q?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const cbName = `blogger_cb_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const script = document.createElement('script');

    let fullUrl = category
      ? `https://magazine.5lb.eu/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json-in-script&callback=${cbName}&max-results=${maxResults}&start-index=${startIndex}`
      : `https://magazine.5lb.eu/feeds/posts/default?alt=json-in-script&callback=${cbName}&max-results=${maxResults}&start-index=${startIndex}`;

    if (q) {
      fullUrl += `&q=${encodeURIComponent(q)}`;
    }

    script.src = fullUrl;
    script.async = true;

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout durante il download dei feed da Blogger (JSONP)'));
    }, 15000);

    const cleanup = () => {
      clearTimeout(timer);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      try {
        delete (window as any)[cbName];
      } catch (e) {
        (window as any)[cbName] = undefined;
      }
    };

    (window as any)[cbName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Errore di rete durante il caricamento del feed Blogger'));
    };

    document.head.appendChild(script);
  });
}

export async function fetchBloggerPosts(options?: {
  maxResults?: number;
  startIndex?: number;
  category?: string;
  q?: string;
  forceRefresh?: boolean;
}): Promise<FetchBloggerPostsResult> {
  const maxResults = options?.maxResults || DEFAULT_PAGE_SIZE;
  const startIndex = options?.startIndex || 1;
  const category = options?.category;
  const q = options?.q;
  const forceRefresh = options?.forceRefresh || false;

  // Check cached data
  let cachedPosts: BloggerPost[] = getCachedPosts();

  // If offline and have cache, return cache immediately
  if (!navigator.onLine && cachedPosts.length > 0) {
    let filtered = applyFilter(cachedPosts, category);
    if (q) {
      filtered = filtered.filter((p) => postMatchesExactPhrase(p, q));
    }
    return {
      posts: filtered.slice(startIndex - 1, startIndex - 1 + maxResults),
      totalResults: filtered.length,
      hasMore: startIndex + maxResults - 1 < filtered.length,
    };
  }

  // If forceRefresh is requested on general feed, clear cache entry
  if (forceRefresh && !category && !q && startIndex === 1) {
    try {
      localStorage.removeItem(FEED_CACHE_KEY);
      cachedPosts = [];
    } catch (e) {
      // ignore
    }
  }

  let jsonResult: any = null;

  // Method 1: Try local backend proxy /api/feed (fast on full-stack dev/server)
  try {
    let proxyUrl = category
      ? `/api/feed?max-results=${maxResults}&start-index=${startIndex}&category=${encodeURIComponent(category)}`
      : `/api/feed?max-results=${maxResults}&start-index=${startIndex}`;

    if (q) {
      proxyUrl += `&q=${encodeURIComponent(q)}`;
    }

    const res = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      jsonResult = await res.json();
    }
  } catch (e) {
    // Proxy not available (static hosting like app.5lb.eu or GitHub Pages)
  }

  // Method 2: If proxy not available or failed, use native Blogger JSONP (100% CORS-free client side)
  if (!jsonResult || !jsonResult.feed) {
    try {
      jsonResult = await fetchBloggerJsonp(maxResults, startIndex, category, q);
    } catch (errJsonp) {
      console.warn('Blogger JSONP fetch failed, trying direct fetch:', errJsonp);
    }
  }

  // Method 3: Fallback to direct fetch
  if (!jsonResult || !jsonResult.feed) {
    try {
      let directBloggerUrl = category
        ? `https://magazine.5lb.eu/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=${maxResults}&start-index=${startIndex}`
        : `https://magazine.5lb.eu/feeds/posts/default?alt=json&max-results=${maxResults}&start-index=${startIndex}`;

      if (q) {
        directBloggerUrl += `&q=${encodeURIComponent(q)}`;
      }

      const res = await fetch(directBloggerUrl);
      if (res.ok) {
        jsonResult = await res.json();
      }
    } catch (errDirect) {
      console.warn('Direct Blogger fetch failed:', errDirect);
    }
  }

  // If network failed but we have cache, fallback gracefully
  if (!jsonResult || !jsonResult.feed) {
    if (cachedPosts.length > 0) {
      let filtered = applyFilter(cachedPosts, category);
      if (q) {
        filtered = filtered.filter((p) => postMatchesExactPhrase(p, q));
      }
      return {
        posts: filtered.slice(startIndex - 1, startIndex - 1 + maxResults),
        totalResults: filtered.length,
        hasMore: startIndex + maxResults - 1 < filtered.length,
      };
    }
    throw new Error('Impossibile scaricare i post del magazine. Verifica la connessione internet.');
  }

  const rawTotal = jsonResult.feed?.openSearch$totalResults?.$t;
  const entries: any[] = Array.isArray(jsonResult.feed?.entry) ? jsonResult.feed.entry : [];
  const totalResults = rawTotal ? parseInt(rawTotal, 10) : entries.length;

  const readIds = getReadPostIds();
  const favIds = getFavoritePostIds();

  // Filter entries based on PUBLICATION_DELAY_HOURS to give author time to finalize URLs
  const now = Date.now();
  const delayMs = (PUBLICATION_DELAY_HOURS || 0) * 60 * 60 * 1000;
  const cutoffTime = now - delayMs;

  const validEntries = entries.filter((entry) => {
    if (!delayMs) return true;
    const pubStr = entry.published?.$t;
    if (!pubStr) return true;
    const pubTime = new Date(pubStr).getTime();
    if (isNaN(pubTime)) return true;
    return pubTime <= cutoffTime;
  });

  const parsedPosts: BloggerPost[] = validEntries.map((entry) => {
    const id = entry.id?.$t || Math.random().toString();
    const title = entry.title?.$t || 'Senza titolo';
    const published = entry.published?.$t || new Date().toISOString();
    const updated = entry.updated?.$t || published;
    const content = entry.content?.$t || entry.summary?.$t || '';
    const summary = cleanTextSnippet(content);

    const categories: string[] = Array.isArray(entry.category)
      ? entry.category.map((c: any) => c.term || '').filter(Boolean)
      : [];

    let link = 'https://magazine.5lb.eu';
    if (Array.isArray(entry.link)) {
      const altLink = entry.link.find((l: any) => l.rel === 'alternate' && l.type === 'text/html');
      if (altLink && altLink.href) {
        link = altLink.href;
      }
    }

    const authorName = entry.author?.[0]?.name?.$t || 'Redazione 5LB';

    // Upgrade thumbnail resolution (including YouTube video thumbnails)
    let thumbnail: string | undefined = undefined;
    if (entry.media$thumbnail?.url) {
      thumbnail = upgradeThumbnailUrl(entry.media$thumbnail.url);
    } else {
      thumbnail = extractFirstImage(content);
    }

    return {
      id,
      title,
      published,
      updated,
      content,
      summary,
      categories,
      link,
      author: { name: authorName },
      thumbnail,
      isRead: readIds.has(id),
      isFavorite: favIds.has(id),
    };
  });

  // Merge and update cached posts in localStorage for general feed
  if (!category) {
    try {
      let merged = [...cachedPosts];
      for (const post of parsedPosts) {
        const existingIdx = merged.findIndex((p) => p.id === post.id);
        if (existingIdx >= 0) {
          merged[existingIdx] = post;
        } else {
          merged.push(post);
        }
      }
      // Keep sorted by publication date descending
      merged.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
      localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(merged.slice(0, 300)));
    } catch (e) {
      console.warn('LocalStorage pieno per la cache dei post:', e);
    }
  }

  const hasMore = totalResults > 0
    ? (startIndex + validEntries.length - 1 < totalResults)
    : (validEntries.length >= maxResults);

  return {
    posts: parsedPosts,
    totalResults: totalResults || parsedPosts.length,
    hasMore,
  };
}

// Search the entire online Blogger archive by query
export async function searchBloggerArchive(
  query: string,
  maxResults = 30
): Promise<FetchBloggerPostsResult> {
  return fetchBloggerPosts({
    q: query.trim(),
    maxResults,
    startIndex: 1,
  });
}

function applyFilter(posts: BloggerPost[], category?: string): BloggerPost[] {
  if (!category) return posts;
  const target = category.toLowerCase().trim();
  return posts.filter((p) =>
    p.categories.some((c) => c.toLowerCase().includes(target) || target.includes(c.toLowerCase()))
  );
}

// Compute badge counts for all categories from current posts list
export function computeCategoryCounts(posts: BloggerPost[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const post of posts) {
    for (const cat of post.categories) {
      counts[cat] = (counts[cat] || 0) + 1;
    }
  }
  return counts;
}

// Format relative date Italian style e.g. "5 gg fa", "28 Set", "Oggi"
export function formatItalianDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours <= 1) return 'Poco fa';
      return `${diffHours} ore fa`;
    }
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} gg fa`;

    const months = [
      'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
      'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch (e) {
    return dateStr;
  }
}
