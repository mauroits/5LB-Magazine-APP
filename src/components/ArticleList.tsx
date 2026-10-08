import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Heart,
  Share2,
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  X,
  CheckCheck
} from 'lucide-react';
import { BloggerPost, ActiveFilter } from '../types';
import { formatItalianDate } from '../services/bloggerFeed';
import { AI_BANNER_CONFIG } from '../config/infoContent';

interface ArticleListProps {
  posts: BloggerPost[];
  isLoading: boolean;
  activeFilter: ActiveFilter;
  filterTitle: string;
  onSelectPost: (post: BloggerPost) => void;
  onToggleFavorite: (postId: string, e: React.MouseEvent) => void;
  onToggleRead: (postId: string, e: React.MouseEvent) => void;
  onResetFilter: () => void;
  onOpenNotebook: () => void;
  onMarkAllAsRead?: () => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  posts,
  isLoading,
  activeFilter,
  filterTitle,
  onSelectPost,
  onToggleFavorite,
  onToggleRead,
  onResetFilter,
  onOpenNotebook,
  onMarkAllAsRead,
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const [isAiBannerDismissed, setIsAiBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('5lb_dismiss_ai_banner_v1') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleDismissAiBanner = () => {
    setIsAiBannerDismissed(true);
    try {
      localStorage.setItem('5lb_dismiss_ai_banner_v1', 'true');
    } catch (e) {
      // ignore
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-12 px-4 text-center">
        <div className="max-w-sm sm:max-w-md w-full mb-6 rounded-2xl overflow-hidden shadow-2xl border border-blue-900/40 bg-[#000732]">
          <img
            src="/logoBLU_APP.jpg"
            alt="5LB Magazine - Evidence Based News"
            className="w-full h-auto object-contain"
          />
        </div>
        <div className="w-9 h-9 rounded-full border-3 border-orange-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
          Caricamento delle pubblicazioni da magazine.5lb.eu...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Subheader Toolbar: Filter badge & view switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {filterTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {posts.length} {posts.length === 1 ? 'articolo trovato' : 'articoli trovati'}
            </p>
          </div>

          {(activeFilter.type === 'rss' || (activeFilter.type === 'quick' && activeFilter.id !== 'all')) && (
            <button
              onClick={onResetFilter}
              className="ml-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Mostra tutte
            </button>
          )}
        </div>

        {/* Right side controls: Mark all as read + View toggle */}
        <div className="flex items-center gap-2">
          {activeFilter.type === 'quick' && activeFilter.id === 'unread' && posts.length > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Segna tutti gli articoli non letti come già letti"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Segna tutto come letto</span>
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl">
          <button
            onClick={() => setViewMode('card')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'card'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Vista Schede"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'compact'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Vista Compatta Elenco"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

      {/* AI banner highlight (Dismissible) */}
      {!isAiBannerDismissed && (
        <div className="relative mb-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 p-4 pr-11 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          {/* Dismiss button */}
          <button
            onClick={handleDismissAiBanner}
            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
            title="Chiudi banner IA"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {AI_BANNER_CONFIG.title}
                <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {AI_BANNER_CONFIG.badge}
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {AI_BANNER_CONFIG.description}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenNotebook}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition active:scale-95 shrink-0 self-end sm:self-auto cursor-pointer"
          >
            {AI_BANNER_CONFIG.buttonText}
          </button>
        </div>
      )}

      {/* Empty State */}
      {posts.length === 0 && !isLoading && (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Nessun articolo trovato in questa sezione
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Non ci sono articoli per i filtri attuali. Puoi aggiornare i feed o tornare alla sezione Ultime.
          </p>
          <button
            onClick={onResetFilter}
            className="mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition"
          >
            Torna a tutti gli articoli
          </button>
        </div>
      )}

      {/* Grid or Compact List View */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post)}
              className={`group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                post.isRead
                  ? 'border-slate-200 dark:border-slate-800 opacity-90'
                  : 'border-orange-200/80 dark:border-orange-950/60 shadow-sm ring-1 ring-orange-500/10'
              }`}
            >
              {/* Thumbnail image if available */}
              {post.thumbnail && (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Top meta row */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          post.isRead ? 'bg-slate-300 dark:bg-slate-700' : 'bg-orange-500 ring-2 ring-orange-200 dark:ring-orange-950'
                        }`}
                        title={post.isRead ? 'Letto' : 'Non letto'}
                      />
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {formatItalianDate(post.published)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Read toggle */}
                      <button
                        onClick={(e) => onToggleRead(post.id, e)}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        title={post.isRead ? 'Segna come non letto' : 'Segna come già letto'}
                      >
                        {post.isRead ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Favorite toggle */}
                      <button
                        onClick={(e) => onToggleFavorite(post.id, e)}
                        className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                          post.isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title={post.isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi a Ti piace'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            post.isFavorite ? 'fill-current text-red-500' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-base sm:text-lg font-bold leading-snug line-clamp-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors ${
                    post.isRead ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {post.title}
                  </h3>

                  {/* Snippet */}
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {post.summary}
                  </p>
                </div>

                {/* Categories Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 items-center">
                  {post.categories.slice(0, 3).map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {cat}
                    </span>
                  ))}
                  {post.categories.length > 3 && (
                    <span className="text-[10px] text-slate-400">
                      +{post.categories.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Compact List View */
        <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className={`flex items-start sm:items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer gap-3 ${
                post.isRead ? 'opacity-85' : 'bg-orange-50/20'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={(e) => onToggleRead(post.id, e)}
                  className="mt-1 sm:mt-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
                >
                  {post.isRead ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-orange-500 fill-orange-500" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {formatItalianDate(post.published)}
                    </span>
                    {post.categories[0] && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                        {post.categories[0]}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-sm sm:text-base font-semibold truncate ${
                    post.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100 font-bold'
                  }`}>
                    {post.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => onToggleFavorite(post.id, e)}
                  className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    post.isFavorite ? 'text-red-500' : 'text-slate-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
