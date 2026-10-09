import React, { useState } from 'react';
import { Download, X, Smartphone, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isUnsupportedBrowser,
    unsupportedBrowserName,
    install,
  } = usePWAInstall();

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('5lb_dismiss_pwa_banner') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // If already installed, or user dismissed during this session, do not show
  if (isInstalled || isDismissed) return null;

  // Show if installable, or if on iOS Safari, or on Opera/Firefox unsupported browsers
  if (!isInstallable && !isIOS && !isUnsupportedBrowser) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('5lb_dismiss_pwa_banner', 'true');
    } catch (e) {
      // ignore
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (isUnsupportedBrowser && !isInstallable) {
      setShowUnsupportedModal(true);
    } else {
      install();
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-md bg-[#0e1838] text-white p-4 rounded-2xl shadow-2xl border border-orange-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center shrink-0">
            {isUnsupportedBrowser ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Smartphone className="w-5 h-5 text-orange-400" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {isUnsupportedBrowser ? `Installazione su ${unsupportedBrowserName}` : 'Installa 5LB Magazine'}
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              {isUnsupportedBrowser
                ? 'Usa un browser compatibile per la vera PWA'
                : 'Aggiungi alla Home per leggere anche offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer ${
              isUnsupportedBrowser
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isUnsupportedBrowser ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Info</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Installa</span>
              </>
            )}
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

      {/* Unsupported Browser (Opera, Firefox, etc.) Modal */}
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
                <strong>Attenzione:</strong> Questo browser ({unsupportedBrowserName || 'il browser attuale'}) non supporta l'installazione di questa app. L'opzione &ldquo;Aggiungi a schermata iniziale&rdquo; in questo browser crea solo un <em>semplice collegamento/link web</em> privo di avvio autonomo a schermo intero, consultazione offline e notifiche push.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2">
                  Procedura per installare:
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
                  onClick={() => {
                    const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
                    window.location.href = intentUrl;
                  }}
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
                  Scorri e seleziona <strong className="text-slate-900 dark:text-white">&ldquo;Aggiungi alla schermata Home&rdquo;</strong> ⊞.
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
