import React, { useState } from 'react';
import { Download, Share2, Check, AlertTriangle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const {
    isInstallable,
    isStandalone,
    isInstalled,
    isIOS,
    isUnsupportedBrowser,
    unsupportedBrowserName,
    install,
    launchApp,
  } = usePWAInstall();

  const [activeModal, setActiveModal] = useState<'unsupported' | 'ios' | 'launch' | null>(null);

  // 1. Running inside the installed native PWA window (Standalone)
  if (isStandalone) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <Check className="w-3.5 h-3.5" />
        <span>PWA Attiva</span>
      </div>
    );
  }

  // 2. Running in a browser, but the app is verified as already installed on the system
  if (isInstalled && !isInstallable) {
    return (
      <>
        <button
          onClick={() => setActiveModal('launch')}
          className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-sm transition active:scale-95 cursor-pointer ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm w-full justify-center'
          }`}
          title="Apri l'app 5LB Magazine installata sul dispositivo"
        >
          <Smartphone className="w-4 h-4" />
          <span>Apri App</span>
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

  // 3. Chromium / Android / Desktop flow (Standard beforeinstallprompt)
  if (isInstallable) {
    return (
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
    );
  }

  // 4. Unsupported Browser flow (Opera, Firefox, etc.)
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

  // 5. iOS Safari flow
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
