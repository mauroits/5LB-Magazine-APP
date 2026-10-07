import { BloggerPost } from '../types';
import { PUBLICATION_DELAY_HOURS } from '../config/navigation';

const FEED_CACHE_KEY = '5lb_magazine_posts_cache_v1';
const READ_POSTS_KEY = '5lb_read_posts_v1';
const FAVORITE_POSTS_KEY = '5lb_favorite_posts_v1';

// Extract first image from HTML content if thumbnail is missing
function extractFirstImage(html: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) {
    // Upgrade low-res blogger thumbnail (s72-c or s200) to higher res if applicable
    return match[1].replace(/\/s\d+(-c)?\//, '/w600-h340-c/');
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

export async function fetchBloggerPosts(options?: {
  maxResults?: number;
  category?: string;
  forceRefresh?: boolean;
}): Promise<BloggerPost[]> {
  const maxResults = options?.maxResults || 80;
  const category = options?.category;

  // Check cached data if offline or not forced refresh
  const cachedRaw = localStorage.getItem(FEED_CACHE_KEY);
  let cachedPosts: BloggerPost[] = [];
  if (cachedRaw) {
    try {
      cachedPosts = JSON.parse(cachedRaw);
    } catch (e) {
      // ignore
    }
  }

  // If offline and have cache, return cache immediately
  if (!navigator.onLine && cachedPosts.length > 0) {
    return applyFilter(cachedPosts, category);
  }

  // Determine endpoints: try backend proxy /api/feed first, fallback to Blogger direct URL
  const proxyUrl = category
    ? `/api/feed?max-results=${maxResults}&category=${encodeURIComponent(category)}`
    : `/api/feed?max-results=${maxResults}`;

  const directBloggerUrl = category
    ? `https://magazine.5lb.eu/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=${maxResults}`
    : `https://magazine.5lb.eu/feeds/posts/default?alt=json&max-results=${maxResults}`;

  let jsonResult: any = null;

  try {
    // Attempt 1: proxy endpoint
    const res = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      jsonResult = await res.json();
    }
  } catch (e) {
    // Proxy not reachable (e.g. static host on GitHub Pages)
  }

  if (!jsonResult) {
    try {
      // Attempt 2: direct Blogger feed with alt=json
      const res = await fetch(directBloggerUrl);
      if (res.ok) {
        jsonResult = await res.json();
      }
    } catch (err) {
      console.warn('Direct Blogger fetch failed, trying cached data:', err);
    }
  }

  if (!jsonResult || !jsonResult.feed || !Array.isArray(jsonResult.feed.entry)) {
    if (cachedPosts.length > 0) {
      return applyFilter(cachedPosts, category);
    }
    throw new Error('Impossibile caricare i post del magazine al momento.');
  }

  const readIds = getReadPostIds();
  const favIds = getFavoritePostIds();

  const entries: any[] = jsonResult.feed.entry;

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

    let thumbnail: string | undefined = undefined;
    if (entry.media$thumbnail?.url) {
      thumbnail = entry.media$thumbnail.url.replace(/\/s\d+(-c)?\//, '/w600-h340-c/');
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

  // If this was an unfiltered query, save to local cache for offline reading
  if (!category && parsedPosts.length > 0) {
    try {
      localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(parsedPosts));
    } catch (e) {
      console.warn('LocalStorage pieno per la cache dei post:', e);
    }
  }

  return parsedPosts;
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
