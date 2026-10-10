import React, { useState } from 'react';
import { Download, X, Smartphone, AlertTriangle, ArrowRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

export const PWAInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isStandalone,
    isDeviceInstalled,
    isIOS,
    isUnsupportedBrowser,
    unsupportedBrowserName,
    install,
    launchApp,
  } = usePWAInstall();

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('5lb_dismiss_pwa_banner') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [activeModal, setActiveModal] = useState<'unsupported' | 'ios' | 'launch' | null>(null);

  // If already running in standalone PWA, never show banner
  if (isStandalone || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('5lb_dismiss_pwa_banner', 'true');
    } catch (e) {
      // ignore
    }
  };

  // Case 1: App is already installed on the system, but user opened the URL in a browser tab
  if (isDeviceInstalled) {
    return (
      <>
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-md bg-[#0e1838] text-white p-4 rounded-3xl shadow-2xl border border-blue-500/40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/25 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                App 5LB Magazine installata
              </h4>
              <p className="text-[11px] text-slate-300 truncate">
                Tocca per aprire l’app a schermo intero
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={launchApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition active:scale-95 cursor-pointer"
            >
              <span>Apri l’App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Continua nel browser"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <PWAInstallGuideModal
          isOpen={activeModal !== null}
          onClose={() => setActiveModal(null)}
          mode={activeModal || 'launch'}
          browserName={unsupportedBrowserName}
        />
      </>
    );
  }

  // Case 2: Not yet installed on device, but eligible for installation
  if (!isInstallable && !isIOS && !isUnsupportedBrowser) return null;

  const handleInstallClick = () => {
    if (isIOS) {
      setActiveModal('ios');
    } else if (isUnsupportedBrowser && !isInstallable) {
      setActiveModal('unsupported');
    } else {
      install();
    }
  };

  return (
    <>
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-md bg-[#0e1838] text-white p-4 rounded-3xl shadow-2xl border border-orange-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center shrink-0">
            {isUnsupportedBrowser ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Smartphone className="w-5 h-5 text-orange-400" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {isUnsupportedBrowser
                ? `Installazione da ${unsupportedBrowserName}`
                : 'Installa 5LB Magazine'}
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              {isUnsupportedBrowser
                ? 'Usa un browser compatibile per la vera PWA'
                : 'Aggiungi alla Home per consultare anche offline'}
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Non ora"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PWAInstallGuideModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        mode={activeModal || 'unsupported'}
        browserName={unsupportedBrowserName}
      />
    </>
  );
};
