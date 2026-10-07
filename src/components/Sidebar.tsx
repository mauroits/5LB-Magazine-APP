import React, { useState } from 'react';
import {
  Clock,
  Mail,
  Heart,
  Send,
  ArrowRightCircle,
  Newspaper,
  ZoomIn,
  RotateCw,
  ListCheck,
  AlertTriangle,
  GitFork,
  BookOpen,
  MessageCircle,
  Hash,
  Bookmark,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  Sparkles,
  X
} from 'lucide-react';
import { NavItem, NavSection, ActiveFilter } from '../types';
import {
  IconDEX,
  IconNeofiti,
  IconCognitivo,
  IconApplicativo,
  IconOperatori,
  IconPresenzaLab,
  IconPresencingCircle,
  IconConsulenza,
  IconFramework,
  IconHameriano,
  IconAndrogyne,
  IconCovid19,
  IconNotebookLM
} from './CustomIcons';
import { Logo5LB } from './Logo5LB';
import { ThemeMode } from '../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sections: NavSection[];
  activeFilter: ActiveFilter;
  onSelectFilter: (filter: ActiveFilter) => void;
  onSelectLink: (item: NavItem) => void;
  onOpenNotebook: () => void;
  onOpenTelegram: () => void;
  onOpenInfo: () => void;
  unreadCount: number;
  totalCount: number;
  favoritesCount: number;
  todayCount: number;
  categoryCounts: Record<string, number>;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sections,
  activeFilter,
  onSelectFilter,
  onSelectLink,
  onOpenNotebook,
  onOpenTelegram,
  onOpenInfo,
  unreadCount,
  totalCount,
  favoritesCount,
  todayCount,
  categoryCounts,
  themeMode,
  onCycleTheme,
}) => {
  // Collapsed states for macrosections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'clock':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'mail':
        return <Mail className="w-5 h-5 text-emerald-500" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-slate-800 dark:text-slate-200 fill-current" />;
      case 'send':
        return <Send className="w-5 h-5 text-slate-800 dark:text-slate-200 fill-current" />;
      case 'arrow-right-circle':
        return <ArrowRightCircle className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      case 'newspaper':
        return <Newspaper className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      case 'search-plus':
        return <ZoomIn className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      case 'repeat':
        return <RotateCw className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      case 'message-square-check':
        return <ListCheck className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      case 'alert-triangle':
        return <AlertTriangle className="w-5 h-5 text-slate-800 dark:text-slate-200 fill-current" />;
      case 'git-fork':
        return <GitFork className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      case 'book-open':
        return <BookOpen className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      case 'message-circle':
        return <MessageCircle className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      case 'hash-7':
        return (
          <div className="w-5 h-5 border-2 border-slate-800 dark:border-slate-200 rounded flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200">
            7
          </div>
        );
      case 'bookmark':
        return <Bookmark className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[1.75]" />;
      case 'custom-dex':
        return <IconDEX className="w-6 h-6" />;
      case 'custom-neofiti':
        return <IconNeofiti className="w-6 h-5" />;
      case 'custom-cognitivo':
        return <IconCognitivo className="w-6 h-5" />;
      case 'custom-applicativo':
        return <IconApplicativo className="w-6 h-5" />;
      case 'custom-operatori':
        return <IconOperatori className="w-6 h-5" />;
      case 'custom-presenzalab':
        return <IconPresenzaLab className="w-5 h-5" />;
      case 'custom-presencing-circle':
        return <IconPresencingCircle className="w-5 h-5" />;
      case 'custom-consulenza':
        return <IconConsulenza className="w-6 h-6" />;
      case 'custom-framework':
        return <IconFramework className="w-8 h-5" />;
      case 'custom-hameriano':
        return <IconHameriano className="w-5 h-5" />;
      case 'custom-androgyne':
        return <IconAndrogyne className="w-5 h-5" />;
      case 'custom-covid19':
        return <IconCovid19 className="w-5 h-5" />;
      default:
        return <Bookmark className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
    }
  };

  // Check if item is currently active
  const isItemActive = (item: NavItem) => {
    if (item.type === 'filter') {
      if (item.id === 'filter-ultime') return activeFilter.type === 'quick' && activeFilter.id === 'all';
      if (item.id === 'filter-non-letto') return activeFilter.type === 'quick' && activeFilter.id === 'unread';
      if (item.id === 'filter-ti-piace') return activeFilter.type === 'quick' && activeFilter.id === 'favorites';
      if (item.id === 'filter-accade-oggi') return activeFilter.type === 'quick' && activeFilter.id === 'today';
    }
    if (item.type === 'rss' && item.rssCategory) {
      return activeFilter.type === 'rss' && activeFilter.category === item.rssCategory;
    }
    return false;
  };

  const handleItemClick = (item: NavItem) => {
    if (item.id === 'filter-accade-oggi') {
      onOpenTelegram();
      onClose();
      return;
    }

    if (item.type === 'filter') {
      if (item.id === 'filter-ultime') onSelectFilter({ type: 'quick', id: 'all' });
      else if (item.id === 'filter-non-letto') onSelectFilter({ type: 'quick', id: 'unread' });
      else if (item.id === 'filter-ti-piace') onSelectFilter({ type: 'quick', id: 'favorites' });
      onClose();
    } else if (item.type === 'rss') {
      onSelectFilter({
        type: 'rss',
        category: item.rssCategory || item.label,
        label: item.label,
      });
      onClose();
    } else if (item.type === 'link') {
      onSelectLink(item);
    }
  };

  // Get badge count for RSS item
  const getItemBadge = (item: NavItem) => {
    if (item.id === 'filter-ultime') return totalCount || undefined;
    if (item.id === 'filter-non-letto') return unreadCount || undefined;
    if (item.id === 'filter-ti-piace') return favoritesCount || undefined;
    if (item.id === 'filter-accade-oggi') return todayCount || undefined;

    if (item.type === 'rss' && item.rssCategory) {
      const target = item.rssCategory.toLowerCase();
      for (const [catName, count] of Object.entries(categoryCounts)) {
        if (catName.toLowerCase() === target || catName.toLowerCase().includes(target)) {
          return count;
        }
      }
    }
    return undefined;
  };

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:static lg:z-10 lg:w-72 xl:w-80'
        }`}
      >
        {/* Drawer Header (Official 5LB Logo from user image) */}
        <div className="relative bg-[#0b1226] px-5 pt-6 pb-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            {/* Official Logo rendered clean without redundant text */}
            <Logo5LB className="h-8 sm:h-9" />

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenInfo}
                title="Informazioni sull'App"
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick AI NotebookLM button in header banner */}
          <button
            onClick={() => {
              onOpenNotebook();
              onClose();
            }}
            className="mt-4 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm transition group"
          >
            <div className="flex items-center gap-2">
              <IconNotebookLM className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold tracking-wide">Google NotebookLM 5LB</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 select-none pb-6">
          {/* Quick Filters Section */}
          <div className="py-2">
            {[
              { id: 'filter-ultime', label: 'Ultime', icon: 'clock', color: 'text-orange-600' },
              { id: 'filter-non-letto', label: 'Non letto', icon: 'mail', color: 'text-emerald-600' },
              { id: 'filter-ti-piace', label: 'Ti piace', icon: 'heart', color: 'text-slate-900 dark:text-white' },
              { id: 'filter-accade-oggi', label: 'Accade oggi', icon: 'send', color: 'text-slate-900 dark:text-white' },
            ].map((f) => {
              const item: NavItem = {
                id: f.id,
                label: f.label,
                type: 'filter',
                iconName: f.icon,
              };
              const active = isItemActive(item);
              const badge = getItemBadge(item);

              return (
                <button
                  key={f.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    active ? 'bg-orange-50/80 dark:bg-orange-950/30 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 flex items-center justify-center shrink-0">
                      {renderIcon(f.icon)}
                    </span>
                    <span
                      className={`text-[15px] font-medium ${
                        active ? 'text-orange-600 dark:text-orange-400 font-semibold' : f.color
                      }`}
                    >
                      {f.label}
                    </span>
                  </div>
                  {f.id === 'filter-accade-oggi' ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      Telegram
                    </span>
                  ) : typeof badge === 'number' && badge > 0 ? (
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        f.id === 'filter-ultime'
                          ? 'text-orange-600 dark:text-orange-400'
                          : f.id === 'filter-non-letto'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Macrosections (Accordion collapsible) */}
          {sections.map((section) => {
            const isCollapsed = !!collapsedSections[section.id];

            return (
              <div key={section.id} className="py-2">
                {/* Section Header with toggle */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-5 py-2.5 text-left text-xs font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                >
                  <span className="tracking-widest font-extrabold">{section.title}</span>
                  <span className="p-0.5 rounded text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isItemActive(item);
                      const badge = getItemBadge(item);

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`w-full flex items-center justify-between px-5 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 group ${
                            active
                              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold border-r-4 border-orange-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <span className="w-6 flex items-center justify-center shrink-0">
                              {renderIcon(item.iconName)}
                            </span>
                            <span className="text-[14.5px] truncate font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {item.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* If external link, display subtle link indicator */}
                            {item.type === 'link' && (
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                            )}
                            {/* RSS badge count */}
                            {typeof badge === 'number' && badge > 0 && (
                              <span className="text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                                {badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Drawer Footer: Info page link + Theme switch */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 gap-2">
          <button
            onClick={() => {
              onOpenInfo();
              onClose();
            }}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer truncate"
          >
            <Info className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="truncate">Informazioni & Privacy</span>
          </button>

          <button
            onClick={onCycleTheme}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
            title={
              themeMode === 'system'
                ? 'Tema: Sistema'
                : themeMode === 'light'
                ? 'Tema: Chiaro'
                : 'Tema: Scuro'
            }
          >
            {themeMode === 'system' ? (
              <Monitor className="w-4 h-4" />
            ) : themeMode === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
