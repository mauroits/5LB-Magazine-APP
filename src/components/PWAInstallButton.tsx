import React, { useState } from 'react';
import { Download, Share2, X, Check, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isOpera, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showOperaGuide, setShowOperaGuide] = useState(false);

  // If already running as an installed standalone PWA, render a subtle indicator or nothing
  if (isInstalled) {
    if (compact) return null;
    return (
      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
        <Check className="w-3.5 h-3.5" /> PWA Installata
      </span>
    );
  }

  // Chromium / Android / Desktop flow (standard beforeinstallprompt)
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition active:scale-95 cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
        }`}
        title="Installa l'app 5LB Magazine sul dispositivo"
      >
        <Download className="w-4 h-4" />
        <span>Installa App</span>
      </button>
    );
  }

  // Opera Mobile flow (Opera disables beforeinstallprompt, requiring manual menu selection)
  if (isOpera) {
    return (
      <>
        <button
          onClick={() => setShowOperaGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition active:scale-95 cursor-pointer ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
          }`}
          title="Istruzioni per installare su Opera"
        >
          <Download className="w-4 h-4" />
          <span>Installa App</span>
        </button>

        {showOperaGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-orange-500" />
                  Installa su Opera Mobile
                </h3>
                <button
                  onClick={() => setShowOperaGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    1
                  </span>
                  <p>
                    Tocca il pulsante menu con i <strong className="text-slate-900 dark:text-white">tre puntini (⋮)</strong> in alto a destra oppure l'icona rossa <strong className="text-slate-900 dark:text-white">"O"</strong> di Opera in basso.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    2
                  </span>
                  <p>
                    Nel menu tocca <strong className="text-slate-900 dark:text-white">"Schermata iniziale"</strong> (o "Aggiungi a schermata Home").
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    3
                  </span>
                  <p>
                    L'icona di <strong className="text-slate-900 dark:text-white">5LB Mag</strong> verrà installata sulla Home come un'app nativa!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOperaGuide(false)}
                className="mt-6 w-full rounded-xl bg-orange-600 hover:bg-orange-700 py-2.5 text-sm font-medium text-white transition shadow-sm cursor-pointer"
              >
                Ho capito
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-orange-500/30 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 dark:text-orange-400 font-medium transition active:scale-95 cursor-pointer ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
          }`}
          title="Istruzioni per installare su iPhone/iPad"
        >
          <Share2 className="w-4 h-4" />
          <span>Installa (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-orange-500" />
                  Installa su iPhone o iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    1
                  </span>
                  <p>
                    Tocca il pulsante <strong className="text-slate-900 dark:text-white">Condividi</strong> (l'icona del quadrato con la freccia verso l'alto ⎋) nella barra inferiore di Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    2
                  </span>
                  <p>
                    Scorri le opzioni verso il basso e seleziona <strong className="text-slate-900 dark:text-white">"Aggiungi alla schermata Home"</strong> ⊞.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                    3
                  </span>
                  <p>
                    Conferma cliccando <strong className="text-slate-900 dark:text-white">Aggiungi</strong> in alto a destra. L'icona apparirà sulla tua Home come un'app nativa!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-orange-600 hover:bg-orange-700 py-2.5 text-sm font-medium text-white transition shadow-sm cursor-pointer"
              >
                Ho capito
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
