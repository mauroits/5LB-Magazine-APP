import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Share2,
  Heart,
  Volume2,
  VolumeX,
  Minus,
  Plus,
  Calendar,
  User,
  Tag,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square
} from 'lucide-react';
import { BloggerPost } from '../types';
import { formatItalianDate } from '../services/bloggerFeed';
import { highlightHtmlContent } from '../utils/searchUtils';
import { trackEvent } from '../services/analytics';

export function parseArticleParagraphs(title: string, contentHtml: string): string[] {
  const result: string[] = [];
  const cleanTitle = (title || '').trim();
  if (cleanTitle) {
    result.push(cleanTitle);
  }

  if (!contentHtml) return result;

  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(contentHtml, 'text/html');

      // Strip unwanted elements
      doc.querySelectorAll('script, style, iframe, noscript, svg, audio, video').forEach((el) => el.remove());

      const blocks = doc.querySelectorAll('p, h2, h3, h4, li, blockquote');
      blocks.forEach((el) => {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (text && text.length > 5) {
          if (text.length > 550) {
            // Split long paragraphs by sentence boundaries for smooth playback
            const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
            let current = '';
            for (const s of sentences) {
              if ((current + ' ' + s).length <= 380) {
                current = current ? `${current} ${s.trim()}` : s.trim();
              } else {
                if (current.trim()) result.push(current.trim());
                current = s.trim();
              }
            }
            if (current.trim()) result.push(current.trim());
          } else {
            result.push(text);
          }
        }
      });
    }

    if (result.length <= 1) {
      const stripped = contentHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      const sentences = stripped.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [stripped];
      let current = '';
      for (const s of sentences) {
        if ((current + ' ' + s).length <= 320) {
          current = current ? `${current} ${s.trim()}` : s.trim();
        } else {
          if (current.trim()) result.push(current.trim());
          current = s.trim();
        }
      }
      if (current.trim()) result.push(current.trim());
    }
  } catch {
    const raw = (title + '. ' + contentHtml.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (raw) result.push(raw);
  }

  return result.length > 0 ? result : [title];
}

interface ArticleModalProps {
  post: BloggerPost | null;
  onClose: () => void;
  onToggleFavorite: (postId: string) => void;
  isFavorite: boolean;
  initialSearchQuery?: string;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  post,
  onClose,
  onToggleFavorite,
  isFavorite,
  initialSearchQuery = '',
}) => {
  const [fontSize, setFontSize] = useState<number>(17); // base px
  const [copied, setCopied] = useState(false);

  // In-article word search state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(Boolean(initialSearchQuery.trim()));
  const [searchWord, setSearchWord] = useState<string>(initialSearchQuery.trim());
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isExactWord, setIsExactWord] = useState<boolean>(true);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync search query when post changes or initial query arrives:
  // Se la ricerca è vuota (ricerca resettata, uscita dalla ricerca, cambio categoria o home),
  // dimentica e azzera completamente qualsiasi parola cercata in precedenza.
  useEffect(() => {
    const trimmed = initialSearchQuery.trim();
    if (trimmed) {
      setSearchWord(trimmed);
      setIsSearchOpen(true);
      setActiveIndex(0);
    } else {
      setSearchWord('');
      setIsSearchOpen(false);
      setActiveIndex(0);
    }
  }, [post?.id, initialSearchQuery]);

  // Speech & Background playback state and refs
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);

  const paragraphs = useMemo(() => {
    if (!post) return [];
    return parseArticleParagraphs(post.title, post.content);
  }, [post?.title, post?.content]);

  // Audio elements & state refs
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);
  const keepAliveTimerRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioBlobCacheRef = useRef<Map<number, string>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const currentParagraphIndexRef = useRef<number>(0);
  const paragraphsRef = useRef<string[]>([]);
  paragraphsRef.current = paragraphs;

  // Screen Wake Lock API to prevent screen timeout while listening
  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch {
        // Wake lock may fail if battery saver is active or not allowed
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  // HTML5 Silent audio loop carrier to keep background audio pipeline alive on iOS & Android
  const startSilentAudio = useCallback(() => {
    try {
      if (!silentAudioRef.current) {
        const audio = new Audio(
          'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAAAAAAAAAAAAAAAA'
        );
        audio.loop = true;
        audio.volume = 0.01;
        silentAudioRef.current = audio;
      }
      silentAudioRef.current.play().catch(() => {});
    } catch {}
  }, []);

  const stopSilentAudio = useCallback(() => {
    if (silentAudioRef.current) {
      try {
        silentAudioRef.current.pause();
        silentAudioRef.current.currentTime = 0;
      } catch {}
    }
  }, []);

  const stopCurrentPlaybackOnly = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.onended = null;
      audioPlayerRef.current.onerror = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  const stopSpeech = useCallback(() => {
    isPlayingRef.current = false;
    isPausedRef.current = false;
    setIsSpeaking(false);
    setIsPaused(false);
    setIsLoadingAudio(false);
    currentParagraphIndexRef.current = 0;
    setCurrentParagraphIndex(0);

    stopCurrentPlaybackOnly();
    stopSilentAudio();
    releaseWakeLock();

    // Revoke cached blob URLs to prevent memory leaks
    audioBlobCacheRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    audioBlobCacheRef.current.clear();

    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }
  }, [stopCurrentPlaybackOnly, stopSilentAudio, releaseWakeLock]);

  // Stop speech synthesis on unmount or when modal closes or post changes
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [post?.id, stopSpeech]);

  const fallbackWebSpeech = useCallback((text: string, index: number) => {
    if (!isPlayingRef.current || !('speechSynthesis' in window)) return;

    startSilentAudio();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = 'it-IT';
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const itVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('it') || v.lang.toLowerCase().includes('it')
    );
    if (itVoice) {
      utterance.voice = itVoice;
    }

    utterance.onend = () => {
      if (isPlayingRef.current && !isPausedRef.current) {
        const next = index + 1;
        if (next < paragraphsRef.current.length) {
          playParagraph(next);
        } else {
          stopSpeech();
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      if (isPlayingRef.current && !isPausedRef.current) {
        const next = index + 1;
        if (next < paragraphsRef.current.length) {
          playParagraph(next);
        } else {
          stopSpeech();
        }
      }
    };

    utteranceRef.current = utterance;
    (window as any).__5lbActiveUtterance = utterance;

    window.speechSynthesis.speak(utterance);
  }, [startSilentAudio, stopSpeech]);

  const playParagraph = useCallback(async (index: number) => {
    if (!isPlayingRef.current) return;
    const all = paragraphsRef.current;
    if (index < 0 || index >= all.length) {
      stopSpeech();
      return;
    }

    currentParagraphIndexRef.current = index;
    setCurrentParagraphIndex(index);
    setIsPaused(false);
    isPausedRef.current = false;

    stopCurrentPlaybackOnly();

    const textToSpeak = all[index];
    if (!textToSpeak || !textToSpeak.trim()) {
      playParagraph(index + 1);
      return;
    }

    // Update MediaSession with current paragraph information
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: post ? post.title : '5LB Magazine',
          artist: `5LB Magazine • Paragrafo ${index + 1} di ${all.length}`,
          album: 'magazine.5lb.eu',
          artwork: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch {}
    }

    // Try HTML5 Audio via /api/tts first (guarantees native background playback on Android)
    let audioUrl = audioBlobCacheRef.current.get(index);
    if (!audioUrl) {
      setIsLoadingAudio(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSpeak, voice: 'Kore' }),
          signal: controller.signal,
        });
        if (res.ok) {
          const blob = await res.blob();
          audioUrl = URL.createObjectURL(blob);
          audioBlobCacheRef.current.set(index, audioUrl);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      } finally {
        setIsLoadingAudio(false);
      }
    }

    if (audioUrl && isPlayingRef.current) {
      try {
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        const audio = audioPlayerRef.current;
        audio.src = audioUrl;
        audio.onended = () => {
          if (isPlayingRef.current && !isPausedRef.current) {
            const next = index + 1;
            if (next < all.length) {
              playParagraph(next);
            } else {
              stopSpeech();
            }
          }
        };
        audio.onerror = () => {
          fallbackWebSpeech(textToSpeak, index);
        };
        await audio.play();

        // Pre-fetch next paragraph audio in the background for instant transition
        if (index + 1 < all.length && !audioBlobCacheRef.current.has(index + 1)) {
          fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: all[index + 1], voice: 'Kore' }),
          })
            .then((r) => (r.ok ? r.blob() : null))
            .then((b) => {
              if (b) {
                audioBlobCacheRef.current.set(index + 1, URL.createObjectURL(b));
              }
            })
            .catch(() => {});
        }
        return;
      } catch {}
    }

    // Fallback: Web Speech API
    fallbackWebSpeech(textToSpeak, index);
  }, [post, stopCurrentPlaybackOnly, stopSpeech, fallbackWebSpeech]);

  const handleTogglePlayPause = useCallback(() => {
    if (isPausedRef.current) {
      // Resume
      isPausedRef.current = false;
      setIsPaused(false);
      if (audioPlayerRef.current && audioPlayerRef.current.src && !audioPlayerRef.current.ended) {
        audioPlayerRef.current.play().catch(() => {});
      } else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        playParagraph(currentParagraphIndexRef.current);
      }
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      // Pause
      isPausedRef.current = true;
      setIsPaused(true);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [playParagraph]);

  const handleNextParagraph = useCallback(() => {
    const next = currentParagraphIndexRef.current + 1;
    if (next < paragraphsRef.current.length) {
      playParagraph(next);
    }
  }, [playParagraph]);

  const handlePrevParagraph = useCallback(() => {
    const prev = currentParagraphIndexRef.current - 1;
    if (prev >= 0) {
      playParagraph(prev);
    }
  }, [playParagraph]);

  const setupMediaSession = useCallback((articleTitle: string) => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: articleTitle,
          artist: '5LB Magazine — Lettura vocale',
          album: 'magazine.5lb.eu',
          artwork: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => {
          handleTogglePlayPause();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          handleTogglePlayPause();
        });

        navigator.mediaSession.setActionHandler('stop', () => {
          stopSpeech();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleNextParagraph();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handlePrevParagraph();
        });

        navigator.mediaSession.playbackState = 'playing';
      } catch {}
    }
  }, [handleTogglePlayPause, stopSpeech, handleNextParagraph, handlePrevParagraph]);

  const startSpeech = useCallback(() => {
    if (!post) return;
    const all = paragraphsRef.current;
    if (all.length === 0) return;

    isPlayingRef.current = true;
    isPausedRef.current = false;
    setIsSpeaking(true);
    setIsPaused(false);
    currentParagraphIndexRef.current = 0;
    setCurrentParagraphIndex(0);

    requestWakeLock();
    setupMediaSession(post.title);

    playParagraph(0);
  }, [post, requestWakeLock, setupMediaSession, playParagraph]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      startSpeech();
    }
  };

  // Keep background speech synthesis alive across screen lock / visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (isPlayingRef.current) {
        if (document.visibilityState === 'visible') {
          requestWakeLock();
          // If speech synthesis was interrupted by Android OS when backgrounded, resume current paragraph
          if (!isPausedRef.current) {
            if (audioPlayerRef.current && audioPlayerRef.current.paused && audioPlayerRef.current.src) {
              audioPlayerRef.current.play().catch(() => {});
            } else if ('speechSynthesis' in window && !window.speechSynthesis.speaking) {
              playParagraph(currentParagraphIndexRef.current);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requestWakeLock, playParagraph]);

  // Highlighted HTML content & match count computation
  const { highlightedHtml, totalMatches } = useMemo(() => {
    if (!post?.content) return { highlightedHtml: '', totalMatches: 0 };
    if (!isSearchOpen || !searchWord.trim()) {
      return { highlightedHtml: post.content, totalMatches: 0 };
    }
    return highlightHtmlContent(post.content, searchWord, activeIndex, isExactWord);
  }, [post?.content, isSearchOpen, searchWord, activeIndex, isExactWord]);

  // Jump to next match
  const handleNextMatch = useCallback(() => {
    if (totalMatches <= 0) return;
    setActiveIndex((prev) => (prev + 1) % totalMatches);
  }, [totalMatches]);

  // Jump to previous match
  const handlePrevMatch = useCallback(() => {
    if (totalMatches <= 0) return;
    setActiveIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
  }, [totalMatches]);

  // Toggle in-article search bar
  const handleToggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
      return next;
    });
  }, []);

  // Smooth scroll to active highlighted match
  useEffect(() => {
    if (isSearchOpen && totalMatches > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`article-match-${activeIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeIndex, isSearchOpen, totalMatches, searchWord]);

  if (!post) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.summary,
          url: post.link,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(post.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-3xl bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Sticky Reader Toolbar */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          {/* Left: Close button */}
          <button
            onClick={() => {
              stopSpeech();
              setSearchWord('');
              setIsSearchOpen(false);
              setActiveIndex(0);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Chiudi articolo"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Center: Font size adjuster & Speech */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs">
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 1))}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              title="Riduci dimensione testo"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-200 px-1">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              title="Aumenta dimensione testo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right actions: Cerca parola, TTS, Favorite, Share, External Link */}
          <div className="flex items-center gap-1">
            {/* Pulsante Cerca parola nel testo */}
            <button
              onClick={handleToggleSearch}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                isSearchOpen
                  ? 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 font-semibold ring-1 ring-orange-500/40'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Cerca parola nel testo"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Cerca parola</span>
            </button>

            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isSpeaking
                  ? 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 animate-pulse'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={
                isSpeaking
                  ? 'Ferma lettura vocale'
                  : 'Ascolta articolo (Lettura vocale)'
              }
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onToggleFavorite(post.id)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isFavorite
                  ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Condividi articolo"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>

            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Apri articolo originale su magazine.5lb.eu"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Active Speech Control Bar */}
        {isSpeaking && (
          <div className="bg-orange-50/95 dark:bg-slate-800/95 border-b border-orange-200 dark:border-slate-700 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-800 dark:text-slate-100 shadow-xs backdrop-blur-md animate-in fade-in">
            {/* Left: Indicator & Paragraph Count */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {!isPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPaused ? 'bg-amber-500' : 'bg-orange-500'}`}></span>
              </span>
              <span className="font-bold text-orange-950 dark:text-orange-200 truncate">
                Lettura vocale {isPaused ? 'in pausa' : 'attiva'}
              </span>
              {paragraphs.length > 0 && (
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-orange-100/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-full shrink-0">
                  {currentParagraphIndex === 0 ? 'Titolo' : `Paragrafo ${currentParagraphIndex} di ${paragraphs.length - 1}`}
                </span>
              )}
              {isLoadingAudio && (
                <span className="text-[10px] text-orange-600 dark:text-orange-400 animate-pulse hidden sm:inline">
                  • Caricamento audio...
                </span>
              )}
            </div>

            {/* Right: Controls (Salto Indietro, Play/Pausa, Salto Avanti, Ferma) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Salto paragrafo indietro */}
              <button
                type="button"
                onClick={handlePrevParagraph}
                disabled={currentParagraphIndex <= 0}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Paragrafo precedente"
                aria-label="Paragrafo precedente"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pausa */}
              <button
                type="button"
                onClick={handleTogglePlayPause}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title={isPaused ? 'Riprendi lettura vocale' : 'Metti in pausa'}
                aria-label={isPaused ? 'Riprendi lettura vocale' : 'Metti in pausa'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                <span className="text-[11px] font-bold">{isPaused ? 'Riprendi' : 'Pausa'}</span>
              </button>

              {/* Salto paragrafo avanti */}
              <button
                type="button"
                onClick={handleNextParagraph}
                disabled={currentParagraphIndex >= paragraphs.length - 1}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Paragrafo successivo"
                aria-label="Paragrafo successivo"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Ferma */}
              <button
                type="button"
                onClick={stopSpeech}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer ml-1"
                title="Ferma lettura vocale"
                aria-label="Ferma lettura vocale"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* Sticky In-Article Search Bar with Jump Arrows & Counter */}
        {isSearchOpen && (
          <div className="sticky top-[53px] z-20 bg-orange-50/95 dark:bg-slate-800/95 border-b border-orange-200 dark:border-slate-700 px-3 sm:px-5 py-2.5 flex flex-wrap items-center gap-2 text-xs backdrop-blur-md shadow-xs animate-in slide-in-from-top-2">
            <div className="relative flex-1 min-w-[170px]">
              <input
                ref={searchInputRef}
                type="text"
                value={searchWord}
                onChange={(e) => {
                  setSearchWord(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) handlePrevMatch();
                    else handleNextMatch();
                  } else if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                    setSearchWord('');
                    setActiveIndex(0);
                  }
                }}
                placeholder="Cerca parola nell'articolo..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchWord && (
                <button
                  onClick={() => {
                    setSearchWord('');
                    setActiveIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Cancella testo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Counter Badge */}
            {searchWord.trim() && (
              <div className="shrink-0 text-[11px] font-medium">
                {totalMatches > 0 ? (
                  <span className="bg-orange-200/80 dark:bg-orange-950/80 text-orange-950 dark:text-orange-200 px-2 py-1 rounded-lg font-bold">
                    {activeIndex + 1} di {totalMatches}
                  </span>
                ) : (
                  <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/40">
                    Nessun risultato
                  </span>
                )}
              </div>
            )}

            {/* Freccia successiva e precedente per saltare nel testo */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePrevMatch}
                disabled={totalMatches <= 1}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                title="Parola precedente (Shift+Invio)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleNextMatch}
                disabled={totalMatches <= 1}
                className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-35 disabled:cursor-not-allowed transition shadow-xs flex items-center gap-1 text-[11px] font-semibold cursor-pointer active:scale-95"
                title="Salta alla parola successiva (Invio)"
              >
                <span>Successiva</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Exact Word Toggle */}
            <button
              onClick={() => {
                setIsExactWord((v) => !v);
                setActiveIndex(0);
              }}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer shrink-0 ${
                isExactWord
                  ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                  : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
              title={isExactWord ? 'Ricerca parola esatta attiva' : 'Ricerca parziale attiva'}
            >
              {isExactWord ? 'Esatta' : 'Parziale'}
            </button>

            {/* Close button */}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchWord('');
                setActiveIndex(0);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-700 rounded-lg shrink-0 cursor-pointer"
              title="Chiudi barra di ricerca"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Article Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 sm:px-10 py-6">
          {/* Categories row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.categories.map((c, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight mb-4">
            {post.title}
          </h1>

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 pb-5 mb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{formatItalianDate(post.published)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              <span>{post.author.name}</span>
            </div>
            <div className="ml-auto text-xs font-medium text-slate-400">
              Fonte: magazine.5lb.eu
            </div>
          </div>

          {/* Article HTML Content formatted with custom typography */}
          <div
            className="article-content max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 text-justify [text-align:justify] hyphens-auto [&_p]:text-justify [&_p]:[text-align:justify] [&_p]:hyphens-auto [&_p]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-2xl [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4 [&_a]:text-orange-600 dark:[&_a]:text-orange-400 [&_a]:underline [&_a]:font-medium hover:[&_a]:text-orange-700 dark:hover:[&_a]:text-orange-300"
            style={{ fontSize: `${fontSize}px`, textAlign: 'justify', hyphens: 'auto' }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            onClick={(e) => {
              const target = (e.target as HTMLElement).closest('a');
              if (target) {
                const href = target.getAttribute('href');
                if (href && !href.startsWith('#')) {
                  e.preventDefault();
                  trackEvent('article_link_click', {
                    link_url: href,
                    link_text: target.innerText?.trim() || '',
                    article_title: post.title,
                    article_id: post.id,
                  });
                  window.open(href, '_blank', 'noopener,noreferrer');
                }
              }
            }}
          />

          {/* Original Source Link Banner */}
          <div className="mt-10 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Leggi l'articolo originale su 5LB Magazine
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta commenti, immagini e contenuti multimediali su Blogger.
              </p>
            </div>
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent('open_original_blogger_post', {
                  link_url: post.link,
                  article_title: post.title,
                  article_id: post.id,
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition shadow-xs"
            >
              <span>Vai a magazine.5lb.eu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
