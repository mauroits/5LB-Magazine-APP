import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { IconNotebookLM } from './CustomIcons';
import { GOOGLE_NOTEBOOK_URL } from '../config/navigation';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotebookModal: React.FC<NotebookModalProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Initialize zoom level from localStorage or sensible responsive default (65% on mobile, 75% on desktop)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('5lb_notebook_zoom');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.4 && val <= 1.5) return val;
      }
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 0.65; // Mobile-friendly default to prevent oversized view
    }
    return 0.75;
  });

  const notebookUrl = GOOGLE_NOTEBOOK_URL;

  if (!isOpen) return null;

  const updateZoom = (newVal: number) => {
    const clamped = Math.max(0.4, Math.min(1.4, Math.round(newVal * 100) / 100));
    setZoomLevel(clamped);
    try {
      localStorage.setItem('5lb_notebook_zoom', clamped.toString());
    } catch (e) {
      // ignore
    }
  };

  const handleZoomIn = () => {
    updateZoom(zoomLevel + 0.05);
  };

  const handleZoomOut = () => {
    updateZoom(zoomLevel - 0.05);
  };

  const handleResetZoom = () => {
    const def = typeof window !== 'undefined' && window.innerWidth < 640 ? 0.65 : 0.75;
    updateZoom(def);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-6 bg-black/75 backdrop-blur-sm">
      <div
        className={`relative w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'h-full w-full rounded-none'
            : 'h-full sm:h-[94vh] sm:max-w-6xl sm:rounded-3xl border border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-[#0e1838] px-4 py-3 text-white flex items-center justify-between gap-2 shadow-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <IconNotebookLM className="w-6 h-6 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold truncate">
                  Ricerca semantica con Gemini
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <ShieldCheck className="w-3 h-3" /> Accesso Google
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Assistente IA addestrato su 5LB Magazine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Interactive User Zoom Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-1.5 sm:px-2 py-1 text-xs shadow-xs">
              <button
                onClick={handleZoomOut}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                title="Riduci zoom vista"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-1 sm:px-1.5 font-mono text-[11px] font-bold text-orange-400 hover:text-orange-300 transition cursor-pointer"
                title="Ripristina zoom ottimale (80%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                title="Aumenta zoom vista"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Refresh iframe button */}
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Ricarica Notebook"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Direct Open in New Tab Button */}
            <a
              href={notebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition active:scale-95 cursor-pointer"
              title="Apri direttamente sul portale Google Notebook in una nuova finestra"
            >
              <span>Apri in Google</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title={isFullscreen ? 'Riduci finestra' : 'Schermo intero'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info banner explaining Google Login & Zoom Tip */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">
              Zoom vista regolabile: usa i tasti <strong className="text-orange-600 dark:text-orange-400">[-] [+]</strong> o i preset <strong className="text-orange-600 dark:text-orange-400">50% • 65% • 80%</strong> per rimpicciolire NotebookLM sul tuo schermo.
            </span>
          </div>
          <a
            href={notebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 shrink-0"
          >
            Apri fuori <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Embedded Web View Container with User-Adjustable Zoom Scaling */}
        <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-950 flex flex-col overflow-auto">
          <div
            className="flex-1 w-full h-full flex flex-col transition-transform duration-150"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              width: `${100 / zoomLevel}%`,
              height: `${100 / zoomLevel}%`,
              minWidth: `${100 / zoomLevel}%`,
              minHeight: `${100 / zoomLevel}%`,
            }}
          >
            <iframe
              key={iframeKey}
              src={notebookUrl}
              title="Google NotebookLM 5LB"
              className="w-full h-full flex-1 border-none"
              allow="clipboard-write; clipboard-read; camera; microphone"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            />
          </div>

          {/* Floating User Zoom Controller Toolbar (Bottom Left on desktop, centered bottom on mobile) */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 pointer-events-auto">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#0e1838]/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl">
              <span className="text-[11px] font-semibold text-slate-300 pl-1.5 hidden sm:inline">Zoom:</span>
              
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Riduci zoom vista (-5%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetZoom}
                className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 font-mono text-xs font-bold text-orange-400 hover:text-orange-300 transition cursor-pointer border border-slate-700/60"
                title="Tocca per ripristinare zoom consigliato"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Aumenta zoom vista (+5%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Quick Preset Zoom Chips */}
              <div className="hidden xs:flex items-center gap-1 pl-1 border-l border-slate-700/80">
                {[
                  { label: '50%', val: 0.5 },
                  { label: '65%', val: 0.65 },
                  { label: '80%', val: 0.8 },
                  { label: '100%', val: 1.0 },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => updateZoom(chip.val)}
                    className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                      Math.abs(zoomLevel - chip.val) < 0.03
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick float fallback bar if user needs full Google login in separate tab */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 pointer-events-auto">
            <a
              href={notebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0e1838]/95 backdrop-blur-md hover:bg-slate-800 text-white font-medium text-xs shadow-xl border border-slate-700/80 transition active:scale-95 group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Difficoltà di accesso? Apri in scheda Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
