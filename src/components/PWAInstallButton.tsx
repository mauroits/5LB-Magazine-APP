import React, { useState } from 'react';
import { Download, Share2, X, Check, AlertTriangle, Copy } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isUnsupportedBrowser,
    unsupportedBrowserName,
    install,
  } = usePWAInstall();

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // If already running as an installed standalone PWA, render a subtle indicator or nothing
  if (isInstalled) {
    if (compact) return null;
    return (
      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
        <Check className="w-3.5 h-3.5" /> PWA Installata
      </span>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

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

  // Unsupported Browser flow (Opera, Firefox, etc.)
  if (isUnsupportedBrowser) {
    const handleOpenChromeAndroid = () => {
      const url = window.location.href;
      // Android Intent to open Chrome directly
      const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
    };

    return (
      <>
        <button
          onClick={() => setShowUnsupportedModal(true)}
          className={`flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition active:scale-95 cursor-pointer ${
            compact ? 'px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
          }`}
          title={`Avviso installazione PWA su ${unsupportedBrowserName || 'questo browser'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Installa App</span>
        </button>

        {showUnsupportedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Avviso installazione ({unsupportedBrowserName || 'Browser non supportato'})</span>
                </h3>
                <button
                  onClick={() => setShowUnsupportedModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                  <strong>Attenzione:</strong> Questo browser ({unsupportedBrowserName || 'il browser attuale'}) non supporta la vera installazione PWA. L'opzione &ldquo;Aggiungi a schermata iniziale&rdquo; in questo browser crea solo un <em>semplice collegamento/link web</em> (falsa installazione), privo di avvio autonomo a schermo intero, consultazione offline e notifiche push.
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2">
                    Procedura corretta per installare la vera App:
                  </h4>
                  <ol className="space-y-2 list-decimal list-inside text-xs leading-relaxed">
                    <li>
                      <strong>Copia il link</strong> di questa app premendo il tasto arancione qui sotto.
                    </li>
                    <li>
                      <strong>Apri un browser pienamente compatibile:</strong>
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-500 dark:text-slate-400">
                        <li>Su <strong>Android, PC o Mac</strong>: usa <strong>Google Chrome</strong> (consigliato) oppure <strong>Microsoft Edge</strong>.</li>
                        <li>Su <strong>iPhone o iPad</strong>: usa <strong>Safari</strong> (Condividi ⎋ &rarr; Aggiungi a schermata Home).</li>
                      </ul>
                    </li>
                    <li>
                      In Google Chrome o Edge comparirà il pulsante per installare con un tocco la <strong>vera App ufficiale</strong> con lettura offline e notifiche attive!
                    </li>
                  </ol>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
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
                      <span>Copia link dell'app per Chrome</span>
                    </>
                  )}
                </button>

                {/android/i.test(navigator.userAgent) && (
                  <button
                    onClick={handleOpenChromeAndroid}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2 px-4 text-xs font-semibold text-white transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <span>Apri direttamente con Google Chrome</span>
                  </button>
                )}

                <button
                  onClick={() => setShowUnsupportedModal(false)}
                  className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
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
