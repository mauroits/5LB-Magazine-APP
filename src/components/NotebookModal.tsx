import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw
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
  const notebookUrl = GOOGLE_NOTEBOOK_URL;

  if (!isOpen) return null;

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

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Refresh iframe button */}
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Ricarica Notebook"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Direct Open in New Tab Button */}
            <a
              href={notebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition active:scale-95"
              title="Apri direttamente sul portale Google Notebook in una nuova finestra"
            >
              <span>Apri in Google</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title={isFullscreen ? 'Riduci finestra' : 'Schermo intero'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info banner explaining Google Login & usage */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 px-4 py-2 flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Puoi porre domande, cercare articoli e ottenere sintesi basate sulle fonti di 5LB Magazine.
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

        {/* Embedded Web View Container */}
        <div className="relative flex-1 w-full bg-slate-50 dark:bg-slate-950 flex flex-col">
          <iframe
            key={iframeKey}
            src={notebookUrl}
            title="Google NotebookLM 5LB"
            className="w-full flex-1 border-none"
            allow="clipboard-write; clipboard-read; camera; microphone"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
          />

          {/* Quick float fallback bar if user needs full Google login in separate tab */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
            <a
              href={notebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0e1838] hover:bg-slate-800 text-white font-medium text-xs shadow-xl border border-slate-700/80 transition active:scale-95 group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Hai difficoltà di accesso con Google? Apri in scheda dedicata</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
