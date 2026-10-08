import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Check
} from 'lucide-react';
import { BloggerPost } from '../types';
import { formatItalianDate } from '../services/bloggerFeed';

interface ArticleModalProps {
  post: BloggerPost | null;
  onClose: () => void;
  onToggleFavorite: (postId: string) => void;
  isFavorite: boolean;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  post,
  onClose,
  onToggleFavorite,
  isFavorite,
}) => {
  const [fontSize, setFontSize] = useState<number>(17); // base px
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs for mobile speech stability (prevent GC & buffer timeouts)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Stop speech synthesis on unmount or when modal closes or post changes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isPlayingRef.current = false;
      setIsSpeaking(false);
    };
  }, [post]);

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
    setIsSpeaking(false);
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    utteranceRef.current = null;
  }, []);

  const speakNextChunk = useCallback(() => {
    if (!isPlayingRef.current || !('speechSynthesis' in window)) return;

    if (chunkIndexRef.current >= chunksRef.current.length) {
      stopSpeech();
      return;
    }

    const chunk = chunksRef.current[chunkIndexRef.current];
    if (!chunk || !chunk.trim()) {
      chunkIndexRef.current++;
      speakNextChunk();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk.trim());
    utterance.lang = 'it-IT';
    utterance.rate = 1.0;

    // Pick Italian voice if available on iOS/Android
    const voices = window.speechSynthesis.getVoices();
    const itVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('it') || v.lang.toLowerCase().includes('it')
    );
    if (itVoice) {
      utterance.voice = itVoice;
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        chunkIndexRef.current++;
        speakNextChunk();
      }
    };

    utterance.onerror = (e) => {
      // If user paused/canceled, ignore
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      if (isPlayingRef.current) {
        chunkIndexRef.current++;
        speakNextChunk();
      }
    };

    // Keep reference alive on window to prevent garbage collection on mobile
    utteranceRef.current = utterance;
    (window as any).__5lbActiveUtterance = utterance;

    window.speechSynthesis.speak(utterance);
  }, [stopSpeech]);

  if (!post) return null;

  // Web Speech API text-to-speech with mobile sentence chunking
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('La sintesi vocale non è supportata dal tuo browser.');
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    // Prepare text: strip html, decode entities, split into chunks
    const rawText = post.title + '. ' + post.content.replace(/<[^>]+>/g, ' ');
    const cleanText = rawText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    // Split into sentences / manageable chunks of max ~160 chars for mobile stability
    const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    const chunks: string[] = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if (trimmed.length <= 160) {
        chunks.push(trimmed);
      } else {
        // Subdivide long sentences by commas or colons
        const parts = trimmed.split(/([,;:]\s+)/);
        let current = '';
        for (const p of parts) {
          if ((current + p).length <= 160) {
            current += p;
          } else {
            if (current) chunks.push(current.trim());
            current = p;
          }
        }
        if (current) chunks.push(current.trim());
      }
    }

    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    isPlayingRef.current = true;
    setIsSpeaking(true);

    window.speechSynthesis.cancel();
    // 60ms delay ensures iOS/Android WebKit clears audio pipeline before starting
    setTimeout(() => {
      speakNextChunk();
    }, 60);
  };

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
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          {/* Left: Close button */}
          <button
            onClick={() => {
              stopSpeech();
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
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
              title="Riduci dimensione testo"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-200 px-1">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
              title="Aumenta dimensione testo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right actions: TTS, Favorite, Share, External Link */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-xl transition ${
                isSpeaking
                  ? 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 animate-pulse'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isSpeaking ? 'Ferma lettura vocale' : 'Ascolta articolo (Sintesi vocale)'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onToggleFavorite(post.id)}
              className={`p-2 rounded-xl transition ${
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
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Condividi articolo"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>

            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Apri articolo originale su magazine.5lb.eu"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-6">
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
            className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 text-justify [text-align:justify] hyphens-auto [&_p]:text-justify [&_p]:[text-align:justify] [&_p]:hyphens-auto [&>p]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-6 [&>h3]:text-lg [&>h3]:font-semibold [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-4 [&>blockquote]:border-orange-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>img]:rounded-2xl [&>img]:max-w-full [&>img]:h-auto [&>img]:my-4 [&>a]:text-orange-600 [&>a]:underline"
            style={{ fontSize: `${fontSize}px`, textAlign: 'justify', hyphens: 'auto' }}
            dangerouslySetInnerHTML={{ __html: post.content }}
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
