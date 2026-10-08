import React, { useState } from 'react';
import { Download, X, Smartphone, Share2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isOpera, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('5lb_dismiss_pwa_banner') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showOperaGuide, setShowOperaGuide] = useState(false);

  // If already installed, or user dismissed during this session, do not show
  if (isInstalled || isDismissed) return null;

  // Only show if installable on Chromium/Android or if on iOS Safari or Opera Mobile
  if (!isInstallable && !isIOS && !isOpera) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('5lb_dismiss_pwa_banner', 'true');
    } catch (e) {
      // ignore
    }
  };

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (isOpera && !isInstallable) {
      setShowOperaGuide(true);
    } else {
      install();
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-md bg-[#0e1838] text-white p-4 rounded-2xl shadow-2xl border border-orange-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-orange-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              Installa 5LB Magazine
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              Aggiungi alla Home per leggere anche offline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installa</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Non ora"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Opera Modal Guide */}
      {showOperaGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
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
                  Tocca il pulsante con i <strong className="text-slate-900 dark:text-white">tre puntini (⋮)</strong> in alto a destra oppure l'icona rossa <strong className="text-slate-900 dark:text-white">"O"</strong> in basso.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                  2
                </span>
                <p>
                  Nel menu seleziona <strong className="text-slate-900 dark:text-white">"Schermata iniziale"</strong> (o "Aggiungi a schermata Home").
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                  3
                </span>
                <p>
                  L'icona dell'app verrà creata sulla Home del tuo telefono!
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

      {/* iOS Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
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
                  Tocca il pulsante <strong className="text-slate-900 dark:text-white">Condividi</strong> (icona del quadrato con la freccia in alto ⎋) nella barra di Safari.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                  2
                </span>
                <p>
                  Scorri e seleziona <strong className="text-slate-900 dark:text-white">"Aggiungi alla schermata Home"</strong> ⊞.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs shrink-0 dark:bg-orange-950 dark:text-orange-300">
                  3
                </span>
                <p>
                  Premi <strong className="text-slate-900 dark:text-white">Aggiungi</strong> in alto a destra. L'icona apparirà sulla tua Home come un'app nativa!
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
};
