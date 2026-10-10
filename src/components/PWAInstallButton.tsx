import React, { useState } from 'react';
import { Download, Share2, Check, AlertTriangle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
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

  const [activeModal, setActiveModal] = useState<'unsupported' | 'ios' | 'launch' | null>(null);

  // If running right now inside standalone window
  if (isStandalone) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <Check className="w-3.5 h-3.5" />
        <span>PWA Attiva</span>
      </div>
    );
  }

  // If already installed on device, but opened in a browser tab
  if (isDeviceInstalled) {
    if (compact) return null;
    return (
      <>
        <button
          onClick={() => setActiveModal('launch')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          title="App già installata sulla schermata Home"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>App installata</span>
          </div>
          <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 underline">
            Info avvio
          </span>
        </button>

        <PWAInstallGuideModal
          isOpen={activeModal !== null}
          onClose={() => setActiveModal(null)}
          mode="launch"
          browserName={unsupportedBrowserName}
        />
      </>
    );
  }

  // Chromium / Android / Desktop flow (standard beforeinstallprompt)
  if (isInstallable) {
    return (
      <>
        <button
          onClick={install}
          className={`flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition active:scale-95 cursor-pointer ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm w-full justify-center'
          }`}
          title="Installa l'app 5LB Magazine sul dispositivo"
        >
          <Download className="w-4 h-4" />
          <span>Installa App</span>
        </button>

        <PWAInstallGuideModal
          isOpen={activeModal !== null}
          onClose={() => setActiveModal(null)}
          mode={activeModal || 'unsupported'}
          browserName={unsupportedBrowserName}
        />
      </>
    );
  }

  // Unsupported Browser flow (Opera, Firefox, etc.)
  if (isUnsupportedBrowser) {
    return (
      <>
        <button
          onClick={() => setActiveModal('unsupported')}
          className={`flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition active:scale-95 cursor-pointer ${
            compact ? 'px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm w-full justify-center'
          }`}
          title={`Istruzioni installazione PWA da ${unsupportedBrowserName || 'questo browser'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Installa App</span>
        </button>

        <PWAInstallGuideModal
          isOpen={activeModal === 'unsupported'}
          onClose={() => setActiveModal(null)}
          mode="unsupported"
          browserName={unsupportedBrowserName}
        />
      </>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setActiveModal('ios')}
          className={`flex items-center gap-1.5 rounded-xl border border-orange-500/30 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 dark:text-orange-400 font-medium transition active:scale-95 cursor-pointer ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm w-full justify-center'
          }`}
          title="Istruzioni per installare su iPhone/iPad"
        >
          <Share2 className="w-4 h-4" />
          <span>Installa (iOS)</span>
        </button>

        <PWAInstallGuideModal
          isOpen={activeModal === 'ios'}
          onClose={() => setActiveModal(null)}
          mode="ios"
          browserName="Safari"
        />
      </>
    );
  }

  return null;
};
