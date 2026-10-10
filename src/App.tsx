/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ArticleList } from './components/ArticleList';
import { ArticleModal } from './components/ArticleModal';
import { InfoModal } from './components/InfoModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { NotebookModal } from './components/NotebookModal';
import { ExternalLinkModal } from './components/ExternalLinkModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { CookieConsentModal } from './components/CookieConsentModal';
import {
  BloggerPost,
  ActiveFilter,
  NavItem,
  NotificationItem
} from './types';
import {
  initAnalyticsWithSavedConsent,
  getStoredCookieConsent,
  trackEvent
} from './services/analytics';
import { postMatchesExactPhrase } from './utils/searchUtils';
import {
  fetchBloggerPosts,
  getCachedPosts,
  searchBloggerArchive,
  getReadPostIds,
  saveReadPostIds,
  getFavoritePostIds,
  saveFavoritePostIds,
  computeCategoryCounts
} from './services/bloggerFeed';
import {
  checkForNewPostsAndNotify,
  getStoredNotifications,
  markNotificationAsRead
} from './services/notificationService';
import { NAV_SECTIONS, GOOGLE_NOTEBOOK_URL } from './config/navigation';
import { openNotebookWithPriority } from './utils/notebookLauncher';
import { useTheme } from './hooks/useTheme';
import { Bell, ArrowRight, X } from 'lucide-react';

interface CategoryFeedState {
  posts: BloggerPost[];
  hasMore: boolean;
  totalResults: number;
}

export default function App() {
  const { themeMode, cycleTheme } = useTheme();
  const sections = NAV_SECTIONS;

  // Stale-While-Revalidate: Initialize immediately from cached articles for 0ms load
  const [posts, setPosts] = useState<BloggerPost[]>(() => getCachedPosts());
  const [isLoading, setIsLoading] = useState<boolean>(() => getCachedPosts().length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mainFeedHasMore, setMainFeedHasMore] = useState(true);
  const [isMainFeedLoadingMore, setIsMainFeedLoadingMore] = useState(false);

  // Category RSS feeds (lazy loaded on first click, 15 articles at a time)
  const [categoryFeeds, setCategoryFeeds] = useState<Record<string, CategoryFeedState>>({});
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isCategoryLoadingMore, setIsCategoryLoadingMore] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchResults, setOnlineSearchResults] = useState<Record<string, BloggerPost[]>>({});

  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({
    type: 'quick',
    id: 'all',
  });

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BloggerPost | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [selectedExternalLink, setSelectedExternalLink] = useState<NavItem | null>(null);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isCookieManageMode, setIsCookieManageMode] = useState(false);

  // Active in-app Toast Notification
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);

  // Unread notifications count
  const [notifications, setNotifications] = useState<NotificationItem[]>(getStoredNotifications());
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Stale-While-Revalidate: background load & revalidation of main feed (15 items)
  const loadFeed = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetchBloggerPosts({
        maxResults: 15,
        startIndex: 1,
        forceRefresh: isManualRefresh,
      });

      setPosts((prev) => {
        // Detect newly published articles compared to previous cache
        if (res.posts.length > 0 && prev.length > 0) {
          const newestNetwork = res.posts[0];
          const newestCached = prev[0];
          if (
            newestNetwork.id !== newestCached.id &&
            new Date(newestNetwork.published).getTime() > new Date(newestCached.published).getTime()
          ) {
            // New article found! Trigger notification
            const notifItem: NotificationItem = {
              id: 'notif-' + Date.now(),
              title: 'Nuovo articolo: ' + newestNetwork.title,
              body: newestNetwork.summary.slice(0, 110) + '...',
              date: new Date().toISOString(),
              read: false,
              postId: newestNetwork.id,
              url: newestNetwork.link,
            };
            setToastNotification(notifItem);
            checkForNewPostsAndNotify(res.posts);
          }
        } else if (res.posts.length > 0 && prev.length === 0) {
          checkForNewPostsAndNotify(res.posts);
        }

        // Merge network posts with existing posts preserving user read/fav status
        const map = new Map<string, BloggerPost>();
        for (const p of prev) map.set(p.id, p);
        for (const p of res.posts) {
          const existing = map.get(p.id);
          map.set(
            p.id,
            existing ? { ...p, isRead: existing.isRead, isFavorite: existing.isFavorite } : p
          );
        }
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
        return merged;
      });

      setMainFeedHasMore(res.hasMore);
    } catch (err) {
      console.error('Errore caricamento feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    initAnalyticsWithSavedConsent();

    // Mostra il banner del consenso prima dell'uso se l'utente non ha ancora espresso una scelta
    const savedConsent = getStoredCookieConsent();
    if (!savedConsent || !savedConsent.hasChosen) {
      setIsCookieModalOpen(true);
      setIsCookieManageMode(false);
    }

    loadFeed();

    // Background polling for push updates every 75 seconds
    const interval = setInterval(() => {
      loadFeed();
    }, 75000);

    return () => clearInterval(interval);
  }, [loadFeed]);

  // On-demand category loading: populate category list only when selected for the first time
  useEffect(() => {
    let isCancelled = false;

    if (activeFilter.type === 'rss' && activeFilter.category) {
      const catKey = activeFilter.category.trim();

      // Only fetch if not already populated
      if (!categoryFeeds[catKey]) {
        setIsCategoryLoading(true);
        fetchBloggerPosts({
          category: catKey,
          startIndex: 1,
          maxResults: 15,
        })
          .then((res) => {
            if (!isCancelled) {
              setCategoryFeeds((prev) => ({
                ...prev,
                [catKey]: {
                  posts: res.posts,
                  hasMore: res.hasMore,
                  totalResults: res.totalResults,
                },
              }));

              // Merge into global posts for search index and badge counts
              setPosts((prev) => {
                const map = new Map<string, BloggerPost>();
                for (const p of prev) map.set(p.id, p);
                for (const p of res.posts) {
                  const existing = map.get(p.id);
                  map.set(
                    p.id,
                    existing ? { ...p, isRead: existing.isRead, isFavorite: existing.isFavorite } : p
                  );
                }
                const merged = Array.from(map.values());
                merged.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
                return merged;
              });
            }
          })
          .catch((e) => {
            console.warn('Errore nel caricamento del feed della categoria:', e);
          })
          .finally(() => {
            if (!isCancelled) setIsCategoryLoading(false);
          });
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [activeFilter, categoryFeeds]);

  // Pagination: "Carica altri articoli" handler
  const handleLoadMore = useCallback(async () => {
    if (activeFilter.type === 'quick' && activeFilter.id === 'all') {
      if (isMainFeedLoadingMore || !mainFeedHasMore) return;
      setIsMainFeedLoadingMore(true);
      try {
        const startIndex = posts.length + 1;
        const res = await fetchBloggerPosts({
          maxResults: 15,
          startIndex,
        });
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPosts = res.posts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
        setMainFeedHasMore(res.hasMore);
      } catch (err) {
        console.error('Errore caricamento altri post:', err);
      } finally {
        setIsMainFeedLoadingMore(false);
      }
    } else if (activeFilter.type === 'rss') {
      const catKey = activeFilter.category.trim();
      const currentFeed = categoryFeeds[catKey];
      if (!currentFeed || isCategoryLoadingMore || !currentFeed.hasMore) return;
      setIsCategoryLoadingMore(true);
      try {
        const startIndex = currentFeed.posts.length + 1;
        const res = await fetchBloggerPosts({
          category: catKey,
          maxResults: 15,
          startIndex,
        });
        setCategoryFeeds((prev) => {
          const existing = prev[catKey]?.posts || [];
          const existingIds = new Set(existing.map((p) => p.id));
          const newPosts = res.posts.filter((p) => !existingIds.has(p.id));
          return {
            ...prev,
            [catKey]: {
              posts: [...existing, ...newPosts],
              hasMore: res.hasMore,
              totalResults: res.totalResults,
            },
          };
        });
        // Also merge into global posts
        setPosts((prev) => {
          const map = new Map<string, BloggerPost>();
          for (const p of prev) map.set(p.id, p);
          for (const p of res.posts) {
            if (!map.has(p.id)) map.set(p.id, p);
          }
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()
          );
        });
      } catch (err) {
        console.error('Errore caricamento altri post categoria:', err);
      } finally {
        setIsCategoryLoadingMore(false);
      }
    }
  }, [
    activeFilter,
    isMainFeedLoadingMore,
    mainFeedHasMore,
    posts.length,
    categoryFeeds,
    isCategoryLoadingMore,
  ]);

  // Listen for custom notification events
  useEffect(() => {
    const handleNewNotif = (e: any) => {
      setNotifications(getStoredNotifications());
      if (e.detail) {
        setToastNotification(e.detail);
        setTimeout(() => setToastNotification(null), 8000);
      }
    };

    const handleNotifsUpdated = () => {
      setNotifications(getStoredNotifications());
    };

    const handleOpenPost = (e: any) => {
      const targetId = e.detail;
      const found = posts.find((p) => p.id === targetId);
      if (found) {
        setSelectedPost(found);
      }
    };

    window.addEventListener('5lb:new-notification', handleNewNotif);
    window.addEventListener('5lb:notifications-updated', handleNotifsUpdated);
    window.addEventListener('5lb:open-post', handleOpenPost);

    return () => {
      window.removeEventListener('5lb:new-notification', handleNewNotif);
      window.removeEventListener('5lb:notifications-updated', handleNotifsUpdated);
      window.removeEventListener('5lb:open-post', handleOpenPost);
    };
  }, [posts]);

  // Derived counts
  const unreadCount = useMemo(() => posts.filter((p) => !p.isRead).length, [posts]);
  const favoritesCount = useMemo(() => posts.filter((p) => p.isFavorite).length, [posts]);

  const todayCount = useMemo(() => {
    const now = new Date();
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    return posts.filter((p) => new Date(p.published).getTime() > oneDayAgo).length;
  }, [posts]);

  const categoryCounts = useMemo(() => computeCategoryCounts(posts), [posts]);

  // Active view posts & pagination state
  const { currentViewPosts, currentViewHasMore, isCurrentViewLoading, isCurrentViewLoadingMore } = useMemo(() => {
    let basePosts: BloggerPost[] = [];
    let baseHasMore = false;
    let baseIsLoading = false;
    let baseIsLoadingMore = false;

    // Active category RSS filter
    if (activeFilter.type === 'rss') {
      const catKey = activeFilter.category.trim();
      const feed = categoryFeeds[catKey];
      basePosts = feed ? feed.posts : [];
      baseHasMore = feed ? feed.hasMore : false;
      baseIsLoading = !feed && isCategoryLoading;
      baseIsLoadingMore = isCategoryLoadingMore;
    } else if (activeFilter.type === 'quick') {
      // Active quick filters
      if (activeFilter.id === 'all') {
        const q = searchQuery.toLowerCase().trim();
        const onlinePosts = q ? (onlineSearchResults[q] || []) : [];
        const onlineIdSet = new Set(onlinePosts.map((p) => p.id));
        basePosts = [...onlinePosts, ...posts.filter((p) => !onlineIdSet.has(p.id))];
        baseHasMore = mainFeedHasMore;
        baseIsLoading = isLoading;
        baseIsLoadingMore = isMainFeedLoadingMore;
      } else if (activeFilter.id === 'unread') {
        basePosts = posts.filter((p) => !p.isRead);
      } else if (activeFilter.id === 'favorites') {
        basePosts = posts.filter((p) => p.isFavorite);
      } else if (activeFilter.id === 'today') {
        const now = new Date();
        const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
        basePosts = posts.filter((p) => new Date(p.published).getTime() > oneDayAgo);
      }
    } else {
      basePosts = posts;
    }

    // Search query filter (applies within current view/category with exact word/phrase matching)
    if (searchQuery.trim()) {
      const filtered = basePosts.filter((p) => postMatchesExactPhrase(p, searchQuery));

      return {
        currentViewPosts: filtered,
        currentViewHasMore: false,
        isCurrentViewLoading: baseIsLoading,
        isCurrentViewLoadingMore: false,
      };
    }

    return {
      currentViewPosts: basePosts,
      currentViewHasMore: baseHasMore,
      isCurrentViewLoading: baseIsLoading,
      isCurrentViewLoadingMore: baseIsLoadingMore,
    };
  }, [
    posts,
    searchQuery,
    onlineSearchResults,
    activeFilter,
    categoryFeeds,
    isCategoryLoading,
    isCategoryLoadingMore,
    mainFeedHasMore,
    isLoading,
    isMainFeedLoadingMore,
  ]);

  // Filter Title label
  const filterTitle = useMemo(() => {
    if (searchQuery.trim()) return `Risultati per "${searchQuery}"`;
    if (activeFilter.type === 'quick') {
      if (activeFilter.id === 'all') return 'Ultime Pubblicazioni';
      if (activeFilter.id === 'unread') return 'Articoli Non Letti';
      if (activeFilter.id === 'favorites') return 'Articoli che Ti Piacciono';
      if (activeFilter.id === 'today') return 'Pubblicati Oggi';
    } else if (activeFilter.type === 'rss') {
      return activeFilter.label || activeFilter.category;
    }
    return '5LB Magazine';
  }, [activeFilter, searchQuery]);

  // Post Actions
  const handleSelectPost = (post: BloggerPost) => {
    const currentRead = getReadPostIds();
    currentRead.add(post.id);
    saveReadPostIds(currentRead);

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, isRead: true } : p))
    );

    setCategoryFeeds((prev) => {
      const updated = { ...prev };
      for (const k of Object.keys(updated)) {
        updated[k] = {
          ...updated[k],
          posts: updated[k].posts.map((p) => (p.id === post.id ? { ...p, isRead: true } : p)),
        };
      }
      return updated;
    });

    setSelectedPost({ ...post, isRead: true });
    trackEvent('select_content', {
      content_type: 'article',
      item_id: post.id,
      item_name: post.title,
    });
  };

  const handleToggleFavorite = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentFavs = getFavoritePostIds();
    const isNowFav = !currentFavs.has(postId);
    if (isNowFav) currentFavs.add(postId);
    else currentFavs.delete(postId);
    saveFavoritePostIds(currentFavs);

    trackEvent('favorite_article', {
      item_id: postId,
      is_favorite: isNowFav,
    });

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isFavorite: isNowFav } : p))
    );

    setCategoryFeeds((prev) => {
      const updated = { ...prev };
      for (const k of Object.keys(updated)) {
        updated[k] = {
          ...updated[k],
          posts: updated[k].posts.map((p) => (p.id === postId ? { ...p, isFavorite: isNowFav } : p)),
        };
      }
      return updated;
    });

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({ ...selectedPost, isFavorite: isNowFav });
    }
  };

  const handleToggleRead = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentRead = getReadPostIds();
    const isNowRead = !currentRead.has(postId);
    if (isNowRead) currentRead.add(postId);
    else currentRead.delete(postId);
    saveReadPostIds(currentRead);

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isRead: isNowRead } : p))
    );

    setCategoryFeeds((prev) => {
      const updated = { ...prev };
      for (const k of Object.keys(updated)) {
        updated[k] = {
          ...updated[k],
          posts: updated[k].posts.map((p) => (p.id === postId ? { ...p, isRead: isNowRead } : p)),
        };
      }
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    const currentRead = getReadPostIds();
    for (const p of posts) {
      currentRead.add(p.id);
    }
    saveReadPostIds(currentRead);
    setPosts((prev) => prev.map((p) => ({ ...p, isRead: true })));
    setCategoryFeeds((prev) => {
      const updated = { ...prev };
      for (const k of Object.keys(updated)) {
        updated[k] = {
          ...updated[k],
          posts: updated[k].posts.map((p) => ({ ...p, isRead: true })),
        };
      }
      return updated;
    });
  };

  const handleOpenNotebook = () => {
    openNotebookWithPriority();
  };

  const handleOpenTelegram = () => {
    window.open('https://t.me/s/magazine5LB', '_blank', 'noopener,noreferrer');
  };

  // Online archive search handler: calls Blogger API and imports found articles into local state
  const handleSearchOnline = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isSearchingOnline) return;
    setIsSearchingOnline(true);
    trackEvent('search', { search_term: trimmed });
    try {
      const res = await searchBloggerArchive(trimmed, 30);
      if (res.posts.length > 0) {
        // Save in online search results map for instant view access
        setOnlineSearchResults((prev) => ({
          ...prev,
          [trimmed.toLowerCase()]: res.posts,
        }));

        setPosts((prev) => {
          const map = new Map<string, BloggerPost>();
          for (const p of prev) map.set(p.id, p);
          for (const p of res.posts) {
            const existing = map.get(p.id);
            map.set(
              p.id,
              existing ? { ...p, isRead: existing.isRead, isFavorite: existing.isFavorite } : p
            );
          }
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

          // Persist merged cache to localStorage
          try {
            localStorage.setItem('5lb_magazine_posts_cache_v1', JSON.stringify(merged));
          } catch (e) {
            // ignore
          }

          return merged;
        });

        setToastNotification({
          id: 'search-success-' + Date.now(),
          title: 'Articoli importati dall’archivio',
          body: `Trovati e importati ${res.posts.length} articoli per "${trimmed}".`,
          date: new Date().toISOString(),
          read: false,
        });
      } else {
        // Nessun articolo trovato online: mostra fumetto e torna in home
        setToastNotification({
          id: 'search-empty-' + Date.now(),
          title: 'Nessun risultato online',
          body: `Nessun articolo trovato nell'archivio online per "${trimmed}".`,
          date: new Date().toISOString(),
          read: false,
        });

        // Torna in home
        setSearchQuery('');
        setActiveFilter({ type: 'quick', id: 'all' });
      }
    } catch (err) {
      console.warn('Errore durante la ricerca online:', err);
      setToastNotification({
        id: 'search-error-' + Date.now(),
        title: 'Ricerca online non riuscita',
        body: `Impossibile completare la ricerca per "${trimmed}". Riprova più tardi.`,
        date: new Date().toISOString(),
        read: false,
      });

      // Torna in home
      setSearchQuery('');
      setActiveFilter({ type: 'quick', id: 'all' });
    } finally {
      setIsSearchingOnline(false);
    }
  }, [isSearchingOnline]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenNotebook={handleOpenNotebook}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentFilterLabel={filterTitle}
      />

      {/* Main Body (Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Drawer / Tablet Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sections={sections}
          activeFilter={activeFilter}
          onSelectFilter={(f) => {
            setActiveFilter(f);
            setSearchQuery('');
          }}
          onSelectLink={(item) => {
            if (item.targetUrl) {
              window.open(item.targetUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          onOpenNotebook={handleOpenNotebook}
          onOpenTelegram={handleOpenTelegram}
          onOpenInfo={() => setIsInfoOpen(true)}
          onOpenCookieSettings={() => {
            setIsCookieManageMode(true);
            setIsCookieModalOpen(true);
          }}
          unreadCount={unreadCount}
          totalCount={posts.length}
          favoritesCount={favoritesCount}
          todayCount={todayCount}
          categoryCounts={categoryCounts}
          themeMode={themeMode}
          onCycleTheme={cycleTheme}
        />

        {/* Article Feed Area */}
        <main className="flex-1 overflow-y-auto">
          <ArticleList
            posts={currentViewPosts}
            isLoading={isCurrentViewLoading}
            isLoadingMore={isCurrentViewLoadingMore}
            hasMore={currentViewHasMore}
            onLoadMore={handleLoadMore}
            activeFilter={activeFilter}
            filterTitle={filterTitle}
            searchQuery={searchQuery}
            isSearchingOnline={isSearchingOnline}
            onSearchOnline={handleSearchOnline}
            onSearchAllArticles={() => {
              setActiveFilter({ type: 'quick', id: 'all' });
            }}
            onSelectPost={handleSelectPost}
            onToggleFavorite={handleToggleFavorite}
            onToggleRead={handleToggleRead}
            onResetFilter={() => {
              setActiveFilter({ type: 'quick', id: 'all' });
              setSearchQuery('');
            }}
            onMarkAllAsRead={handleMarkAllAsRead}
            onOpenNotebook={handleOpenNotebook}
          />
        </main>
      </div>

      {/* Floating Toast Notification when new post push arrives */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-[#0e1838] text-white rounded-2xl p-4 shadow-2xl border border-orange-500/30 flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <div className="p-2 rounded-xl bg-orange-600 text-white shrink-0 mt-0.5">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                Nuova Notifica Push
              </span>
              <button
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h5 className="text-sm font-bold mt-0.5 truncate">
              {toastNotification.title}
            </h5>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {toastNotification.body}
            </p>
            {toastNotification.postId && (
              <button
                onClick={() => {
                  const p = posts.find((it) => it.id === toastNotification.postId);
                  if (p) handleSelectPost(p);
                  markNotificationAsRead(toastNotification.id);
                  setToastNotification(null);
                }}
                className="mt-2 text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <span>Leggi subito</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ArticleModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedPost ? selectedPost.isFavorite || false : false}
        initialSearchQuery={searchQuery}
      />

      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        onRefreshFeed={() => loadFeed(true)}
        isRefreshing={isRefreshing}
        onOpenCookieSettings={() => {
          setIsCookieManageMode(true);
          setIsCookieModalOpen(true);
        }}
      />

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectPostId={(postId) => {
          const p = posts.find((it) => it.id === postId);
          if (p) handleSelectPost(p);
        }}
      />

      {/* Google NotebookLM In-App Modal with User-Adjustable Zoom Controls */}
      <NotebookModal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
      />

      {/* External / Webview Modal */}
      <ExternalLinkModal
        item={selectedExternalLink}
        onClose={() => setSelectedExternalLink(null)}
      />

      {/* PWA Offline indicator */}
      <OfflineIndicator />

      {/* Proactive PWA Install Banner */}
      <PWAInstallBanner />

      {/* Cookie Consent Modal / Banner (Informativa sui Cookie) */}
      <CookieConsentModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        isManageMode={isCookieManageMode}
      />
    </div>
  );
}
