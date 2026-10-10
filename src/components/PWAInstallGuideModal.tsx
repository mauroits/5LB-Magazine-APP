import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Share2,
  X,
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
  Smartphone,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { launchInstalledApp, setAppInstalledOnDevice } from '../utils/pwaLauncher';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'unsupported' | 'ios' | 'launch';
  browserName?: string;
  onInstalledMarked?: () => void;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
  mode,
  browserName,
  onInstalledMarked,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenChromeAndroid = () => {
    const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
  };

  const handleDirectLaunchApp = () => {
    setAppInstalledOnDevice(true);
    if (onInstalledMarked) onInstalledMarked();
    launchInstalledApp();
    onClose();
  };

  const handleMarkAsAlreadyInstalled = () => {
    setAppInstalledOnDevice(true);
    if (onInstalledMarked) onInstalledMarked();
    onClose();
  };

  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overscroll-contain animate-in fade-in">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Dialog Card: strictly capped in height with flex column structure */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        className="relative w-full max-w-lg max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95"
      >
        {/* 1. FIXED HEADER: X button and Title are ALWAYS visible and clickable */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {mode === 'unsupported' && (
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            {mode === 'ios' && (
              <div className="p-2 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/70 dark:text-orange-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
            )}
            {mode === 'launch' && (
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
            )}

            <h3
              id="pwa-install-title"
              className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate"
            >
              {mode === 'unsupported' && `Installazione da ${browserName || 'questo browser'}`}
              {mode === 'ios' && 'Installa su iPhone / iPad'}
              {mode === 'launch' && 'Apri l’App 5LB Magazine'}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Chiudi finestra"
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE BODY: Even on large browser font sizes, content scrolls smoothly */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 overscroll-contain">
          {mode === 'unsupported' && (
            <>
              {/* Highlight Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                <strong>Attenzione:</strong> Questo browser ({browserName || 'il browser attuale'}) non supporta l'installazione nativa delle PWA. L'opzione standard &ldquo;Aggiungi a schermata iniziale&rdquo; in questo browser crea solo un <em>semplice preferito/collegamento web</em> privo di avvio autonomo a schermo intero, consultazione offline e notifiche push.
              </div>

              {/* Already installed quick action */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-blue-950 dark:text-blue-200 text-xs sm:text-sm">
                    Hai già installato l'app sul dispositivo?
                  </h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                    Aprila subito senza doverla reinstallare in questo browser.
                  </p>
                </div>
                <button
                  onClick={handleDirectLaunchApp}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Apri l'app</span>
                </button>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2">
                  Procedura corretta per installare la vera App:
                </h4>
                <ol className="space-y-2.5 list-decimal list-inside text-xs leading-relaxed">
                  <li>
                    <strong>Copia il link</strong> dell'app premendo il pulsante arancione in basso.
                  </li>
                  <li>
                    <strong>Apri un browser pienamente compatibile:</strong>
                    <ul className="list-disc list-inside pl-4 mt-1.5 space-y-1 text-slate-500 dark:text-slate-400">
                      <li>Su <strong>Android, PC o Mac</strong>: usa <strong>Google Chrome</strong> (consigliato) oppure <strong>Microsoft Edge</strong>.</li>
                      <li>Su <strong>iPhone o iPad</strong>: usa <strong>Safari</strong> (Condividi ⎋ &rarr; Aggiungi a schermata Home).</li>
                    </ul>
                  </li>
                  <li>
                    Nel browser compatibile comparirà il pulsante per installare con un tocco la <strong>vera App ufficiale</strong> con lettura offline e notifiche push attive.
                  </li>
                </ol>
              </div>
            </>
          )}

          {mode === 'ios' && (
            <>
              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-900 dark:text-orange-200 text-xs leading-relaxed">
                Su iOS (iPhone e iPad) l'installazione è gestita dal menu nativo di condivisione di Apple Safari.
              </div>

              {/* Already installed quick action */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-blue-950 dark:text-blue-200 text-xs">
                    L'hai già aggiunta alla Home?
                  </h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                    Aprila direttamente dall'icona sul tuo iPhone o tocca qui.
                  </p>
                </div>
                <button
                  onClick={handleDirectLaunchApp}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm active:scale-95 shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Apri</span>
                </button>
              </div>

              <div className="space-y-3.5 pt-1">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    1
                  </span>
                  <p className="text-xs sm:text-sm">
                    Tocca il pulsante <strong className="text-slate-900 dark:text-white">Condividi</strong> (l'icona con il quadrato e la freccia verso l'alto ⎋) nella barra inferiore o superiore di Safari.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    2
                  </span>
                  <p className="text-xs sm:text-sm">
                    Scorri le opzioni del foglio di condivisione e seleziona <strong className="text-slate-900 dark:text-white">&ldquo;Aggiungi alla schermata Home&rdquo;</strong> ⊞.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    3
                  </span>
                  <p className="text-xs sm:text-sm">
                    Tocca <strong className="text-slate-900 dark:text-white">Aggiungi</strong> in alto a destra. L'icona 5LB Magazine apparirà sulla tua schermata Home e si avvierà come app a schermo intero!
                  </p>
                </div>
              </div>
            </>
          )}

          {mode === 'launch' && (
            <div className="space-y-3 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shadow-inner">
                <Smartphone className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                App 5LB Magazine installata
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                Hai già l'applicazione installata su questo dispositivo. Puoi avviarla direttamente a schermo intero con un tocco.
              </p>
            </div>
          )}
        </div>

        {/* 3. FIXED FOOTER: Buttons are ALWAYS visible and clickable */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-col gap-2">
          {mode === 'unsupported' && (
            <>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 py-2.5 px-4 text-xs font-semibold text-white transition shadow-sm cursor-pointer active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Link copiato! Ora incollalo in Chrome</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copia link per Chrome o Edge</span>
                  </>
                )}
              </button>

              {isAndroid && (
                <button
                  onClick={handleOpenChromeAndroid}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 px-4 text-xs font-semibold text-white transition shadow-sm cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Apri direttamente con Google Chrome</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAsAlreadyInstalled}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  L'ho già installata
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            </>
          )}

          {mode === 'ios' && (
            <>
              <button
                onClick={handleDirectLaunchApp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Apri l'app installata</span>
              </button>

              <button
                onClick={onClose}
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 py-2.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer active:scale-95"
              >
                Ho capito le istruzioni
              </button>
            </>
          )}

          {mode === 'launch' && (
            <>
              <button
                onClick={handleDirectLaunchApp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-2.5 text-xs font-semibold text-white transition shadow-md cursor-pointer active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Apri subito l'App</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                Continua nel browser
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
