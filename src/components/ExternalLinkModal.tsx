import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Maximize2,
  Minimize2,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { NavItem } from '../types';

interface ExternalLinkModalProps {
  item: NavItem | null;
  onClose: () => void;
}

export const ExternalLinkModal: React.FC<ExternalLinkModalProps> = ({
  item,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  if (!item || !item.targetUrl) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(item.targetUrl || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs">
      <div
        className={`relative w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden transition-all ${
          isFullscreen
            ? 'h-full w-full rounded-none'
            : 'h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-3xl border border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="bg-[#0e1838] px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold truncate">
                {item.label}
              </h2>
              <p className="text-xs text-slate-300 font-mono truncate max-w-sm sm:max-w-lg">
                {item.targetUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Copia link negli appunti"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <a
              href={item.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs shadow-sm transition active:scale-95"
              title="Apri pagina web in nuova scheda"
            >
              <span>Apri pagina</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title={isFullscreen ? 'Riduci' : 'Schermo intero'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Container with graceful preview */}
        <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-950 flex flex-col">
          {!loadError ? (
            <iframe
              src={item.targetUrl}
              title={item.label}
              className="w-full flex-1 border-none"
              onError={() => setLoadError(true)}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Globe className="w-12 h-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Visualizzazione integrata non disponibile per questo sito
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Il server di destinazione potrebbe non consentire l'incorporamento diretto tramite iframe. Puoi comunque aprire la pagina direttamente nel browser con un clic.
              </p>
              <a
                href={item.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-md transition"
              >
                <span>Apri {item.label} nel browser</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Quick bar at bottom to launch external browser */}
          <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>
              {item.description || 'Collegamento esterno alle risorse 5LB'}
            </span>
            <a
              href={item.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
            >
              Apri a pagina intera <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
