/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ArticleList } from './components/ArticleList';
import { ArticleModal } from './components/ArticleModal';
import { NotebookModal } from './components/NotebookModal';
import { ExternalLinkModal } from './components/ExternalLinkModal';
import { TelegramModal } from './components/TelegramModal';
import { InfoModal } from './components/InfoModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import {
  BloggerPost,
  ActiveFilter,
  NavItem,
  NotificationItem
} from './types';
import {
  fetchBloggerPosts,
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
import { NAV_SECTIONS } from './config/navigation';
import { useTheme } from './hooks/useTheme';
import { Bell, ArrowRight, X } from 'lucide-react';

export default function App() {
  const { themeMode, cycleTheme } = useTheme();
  const sections = NAV_SECTIONS;
  const [posts, setPosts] = useState<BloggerPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({
    type: 'quick',
    id: 'all',
  });

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BloggerPost | null>(null);
  const [selectedLinkItem, setSelectedLinkItem] = useState<NavItem | null>(null);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Active in-app Toast Notification
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);

  // Unread notifications count
  const [notifications, setNotifications] = useState<NotificationItem[]>(getStoredNotifications());
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Load feed
  const loadFeed = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const data = await fetchBloggerPosts({ maxResults: 100, forceRefresh: isManualRefresh });
      setPosts(data);
      // Check for newly published posts and trigger push notification
      checkForNewPostsAndNotify(data);
    } catch (err) {
      console.error('Errore caricamento feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();

    // Background polling for push updates every 75 seconds
    const interval = setInterval(() => {
      loadFeed();
    }, 75000);

    return () => clearInterval(interval);
  }, [loadFeed]);

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

  // Filtered posts list
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.categories.some((c) => c.toLowerCase().includes(q))
      );
    }

    // Active category/quick filter
    if (activeFilter.type === 'quick') {
      if (activeFilter.id === 'unread') {
        result = result.filter((p) => !p.isRead);
      } else if (activeFilter.id === 'favorites') {
        result = result.filter((p) => p.isFavorite);
      } else if (activeFilter.id === 'today') {
        const now = new Date();
        const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
        result = result.filter((p) => new Date(p.published).getTime() > oneDayAgo);
      }
    } else if (activeFilter.type === 'rss') {
      const targetCategory = activeFilter.category.toLowerCase().trim();
      result = result.filter((p) =>
        p.categories.some((c) => {
          const itemCat = c.toLowerCase().trim();
          return itemCat === targetCategory || itemCat.includes(targetCategory) || targetCategory.includes(itemCat);
        })
      );
    }

    return result;
  }, [posts, searchQuery, activeFilter]);

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

    setSelectedPost({ ...post, isRead: true });
  };

  const handleToggleFavorite = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentFavs = getFavoritePostIds();
    const isNowFav = !currentFavs.has(postId);
    if (isNowFav) currentFavs.add(postId);
    else currentFavs.delete(postId);
    saveFavoritePostIds(currentFavs);

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isFavorite: isNowFav } : p))
    );

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
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onRefreshFeed={() => loadFeed(true)}
        isRefreshing={isRefreshing}
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
          onSelectLink={(item) => setSelectedLinkItem(item)}
          onOpenNotebook={() => setIsNotebookOpen(true)}
          onOpenTelegram={() => setIsTelegramOpen(true)}
          onOpenInfo={() => setIsInfoOpen(true)}
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
            posts={filteredPosts}
            isLoading={isLoading}
            activeFilter={activeFilter}
            filterTitle={filterTitle}
            onSelectPost={handleSelectPost}
            onToggleFavorite={handleToggleFavorite}
            onToggleRead={handleToggleRead}
            onResetFilter={() => {
              setActiveFilter({ type: 'quick', id: 'all' });
              setSearchQuery('');
            }}
            onOpenNotebook={() => setIsNotebookOpen(true)}
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
      />

      <NotebookModal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
      />

      <TelegramModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
      />

      <ExternalLinkModal
        item={selectedLinkItem}
        onClose={() => setSelectedLinkItem(null)}
      />

      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        onRefreshFeed={() => loadFeed(true)}
        isRefreshing={isRefreshing}
      />

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectPostId={(postId) => {
          const p = posts.find((it) => it.id === postId);
          if (p) handleSelectPost(p);
        }}
      />

      {/* PWA Offline indicator */}
      <OfflineIndicator />

      {/* Proactive PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
