import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Info,
  AlertTriangle,
  Sparkles,
  Download,
  BookOpen,
  Heart,
  Compass,
  Star,
  Smartphone,
  Newspaper,
  ArrowRight,
  ExternalLink,
  X,
  Share2,
} from 'lucide-react';
import { RemoteBannerConfig, BannerIconType, BannerThemeColor } from '../types';
import {
  fetchRemoteBannerConfig,
  isBannerDismissed,
  dismissBanner,
  getCachedBannerConfig,
} from '../services/remoteBannerService';
import { openExternalBrowser } from "../utils/browserLauncher";
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallGuideModal, PWAInstallModalMode } from './PWAInstallGuideModal';

interface RemoteAnnouncementBannerProps {
  onOpenUrl: (url: string) => void;
  onOpenArticle?: (urlOrId: string) => void;
  customGistUrl?: string;
}

const ICON_MAP: Record<BannerIconType, React.ComponentType<{ className?: string }>> = {
  bell: Bell,
  info: Info,
  alert: AlertTriangle,
  sparkles: Sparkles,
  download: Download,
  book: BookOpen,
  heart: Heart,
  compass: Compass,
  star: Star,
  smartphone: Smartphone,
  newspaper: Newspaper,
};

const THEME_STYLES: Record<
  BannerThemeColor,
  {
    containerBg: string;
    containerBorder: string;
    badge: string;
    iconBg: string;
    iconText: string;
    button: string;
  }
> = {
  blue: {
    containerBg: 'bg-white dark:bg-slate-900',
    containerBorder: 'border-blue-200/90 dark:border-blue-800/70 ring-1 ring-blue-500/10 dark:ring-blue-400/10',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80',
    iconBg: 'bg-blue-50 dark:bg-blue-950/70 border-blue-200/80 dark:border-blue-800/70',
    iconText: 'text-blue-600 dark:text-blue-400',
    button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20',
  },
  amber: {
    containerBg: 'bg-white dark:bg-slate-900',
    containerBorder: 'border-amber-200/90 dark:border-amber-800/70 ring-1 ring-amber-500/10 dark:ring-amber-400/10',
    badge: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
    iconBg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200/80 dark:border-amber-800/70',
    iconText: 'text-amber-600 dark:text-amber-400',
    button: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-amber-500/20',
  },
  emerald: {
    containerBg: 'bg-white dark:bg-slate-900',
    containerBorder: 'border-emerald-200/90 dark:border-emerald-800/70 ring-1 ring-emerald-500/10 dark:ring-emerald-400/10',
    badge: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200/80 dark:border-emerald-800/70',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    button: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20',
  },
  purple: {
    containerBg: 'bg-white dark:bg-slate-900',
    containerBorder: 'border-purple-200/90 dark:border-purple-800/70 ring-1 ring-purple-500/10 dark:ring-purple-400/10',
    badge: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
    iconBg: 'bg-purple-50 dark:bg-purple-950/70 border-purple-200/80 dark:border-purple-800/70',
    iconText: 'text-purple-600 dark:text-purple-400',
    button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20',
  },
  orange: {
    containerBg: 'bg-white dark:bg-slate-900',
    containerBorder: 'border-orange-200/90 dark:border-orange-800/70 ring-1 ring-orange-500/10 dark:ring-orange-400/10',
    badge: 'bg-orange-500/10 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/80',
    iconBg: 'bg-orange-50 dark:bg-orange-950/70 border-orange-200/80 dark:border-orange-800/70',
    iconText: 'text-orange-600 dark:text-orange-400',
    button: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-500/20',
  },
};

/**
 * Renderizza il testo del messaggio consentendo link cliccabili inline
 * formato markdown [testo](url) o plain https://...
 */
function renderMessageWithLinks(text: string, onLinkClick: (url: string) => void) {
  if (!text) return null;

  // Pattern per [etichetta](url) oppure URL plain
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Aggiungi il testo precedente al match
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Formato markdown [testo](url)
      const label = match[1];
      const url = match[2];
      elements.push(
        <button
          key={`md-link-${match.index}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLinkClick(url);
          }}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 font-medium cursor-pointer"
        >
          {label}
        </button>
      );
    } else if (match[3]) {
      // URL diretto
      const url = match[3];
      elements.push(
        <button
          key={`plain-link-${match.index}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLinkClick(url);
          }}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 font-medium cursor-pointer"
        >
          {url}
        </button>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : text;
}

export const RemoteAnnouncementBanner: React.FC<RemoteAnnouncementBannerProps> = ({
  onOpenUrl,
  onOpenArticle,
  customGistUrl,
}) => {
  const [config, setConfig] = useState<RemoteBannerConfig | null>(() => getCachedBannerConfig());
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<PWAInstallModalMode | null>(null);

  // Hook per supporto nativo installazione PWA (se configurato come azione)
  const {
    isInstallable,
    isStandalone,
    isInstalled,
    isIOS,
    isIPad,
    isIOSSafari,
    isIOSOtherBrowser,
    isUnsupportedBrowser,
    unsupportedBrowserName,
    install,
  } = usePWAInstall();

  // Caricamento configurazione remota all'avvio e ad ogni cambio finestra attiva
  const loadConfig = useCallback(async () => {
    try {
      const remoteData = await fetchRemoteBannerConfig(customGistUrl);
      setConfig(remoteData);

      // Verifica se l'ID specifico è già stato chiuso dall'utente
      if (remoteData.id && isBannerDismissed(remoteData.id)) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch (err) {
      console.warn('Errore refresh remote banner:', err);
    }
  }, [customGistUrl]);

  useEffect(() => {
    loadConfig();

    // Ricarica la configurazione quando la tab torna visibile in primo piano
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadConfig();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadConfig]);

  // Se non c'è config, o è disabilitato dal programmatore, o è già stato chiuso con questo ID, non mostrare nulla
  if (!config || !config.enabled || isDismissed) {
    return null;
  }

  // Gestione chiusura banner da parte dell'utente
  const handleDismiss = () => {
    if (config.id) {
      dismissBanner(config.id);
    }
    setIsDismissed(true);
  };

  // Gestione click sul pulsante d'azione
  const handleActionClick = async () => {
    const action = config.action;
    if (!action) return;

    if (action.type === 'pwa_install') {
      if (isInstalled && !isInstallable) {
        setActiveModal('launch');
      } else if (isIOS && isIOSOtherBrowser) {
        setActiveModal('ios-redirect');
      } else if (isIOS && isIOSSafari) {
        setActiveModal('ios');
      } else if (isInstallable) {
        const ok = await install();
        if (!ok && !isStandalone) {
          setActiveModal('chrome');
        }
      } else if (isUnsupportedBrowser) {
        setActiveModal('unsupported');
      } else {
        const ok = await install();
        if (!ok) {
          setActiveModal('chrome');
        }
      }
      return;
    }

    if (action.type === 'article' && action.url) {
      if (onOpenArticle) {
        onOpenArticle(action.url);
      } else {
        onOpenUrl(action.url);
      }
      return;
    }

    // Default: link web (apre nel browser integrato dell'app)
    if (action.url) {
      if (onOpenUrl) {
        onOpenUrl(action.url);
      } else {
        openExternalBrowser(action.url);
      }
    }
  };

  const themeKey = config.theme && THEME_STYLES[config.theme] ? config.theme : 'blue';
  const theme = THEME_STYLES[themeKey];

  const IconComponent =
    config.icon && ICON_MAP[config.icon] ? ICON_MAP[config.icon] : Bell;

  const action = config.action;
  const hasAction = Boolean(action && action.label);

  return (
    <>
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pt-4 sm:pt-5 pb-1">
        <div
          role="region"
          aria-label="Avviso in evidenza"
          className={`w-full ${theme.containerBg} p-4 sm:py-4 sm:px-5 rounded-2xl sm:rounded-3xl shadow-md sm:shadow-lg border ${theme.containerBorder} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-md transition-all`}
        >
          {/* Blocco Icona e Testo */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${theme.iconBg} border flex items-center justify-center shrink-0 ${theme.iconText} shadow-xs mt-0.5 sm:mt-0`}
            >
              <IconComponent className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Micro-badge tematico */}
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-2xs backdrop-blur-xs ${theme.badge}`}
                >
                  Avviso
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
                {config.title}
              </h4>
              <div className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mt-0.5">
                {renderMessageWithLinks(config.message, (url) => {
                  if (action?.type === 'article' && onOpenArticle) {
                    onOpenArticle(url);
                  } else {
                    onOpenUrl(url);
                  }
                })}
              </div>
            </div>
          </div>

          {/* Pulsanti Azione e Chiusura */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {hasAction && (
              <button
                type="button"
                onClick={handleActionClick}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition active:scale-95 cursor-pointer shadow-xs ${theme.button}`}
              >
                <span>{action!.label}</span>
                {action?.type === 'pwa_install' ? (
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : action?.openIn === 'external' ? (
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            )}

            {/* Pulsante Chiusura X ad Alto Contrasto e Design Pulito */}
            {config.canDismiss !== false && (
              <button
                type="button"
                onClick={handleDismiss}
                title="Chiudi avviso"
                aria-label="Chiudi avviso"
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modale guida installazione PWA se attivata tramite azione pwa_install */}
      <PWAInstallGuideModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        mode={activeModal || 'chrome'}
        browserName={unsupportedBrowserName}
        isIPad={isIPad}
        onRetryInstall={install}
      />
    </>
  );
};
