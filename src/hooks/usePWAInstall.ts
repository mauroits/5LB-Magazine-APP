import { useEffect, useState, useCallback } from 'react';
import {
  isRunningStandalone,
  clearLegacyInstalledFlags,
  detectInstalledRelatedApps,
  launchInstalledApp,
} from '../utils/pwaLauncher';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function getBrowserEnv() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isStandalone: false,
      isIOS: false,
      isAndroid: false,
      isOpera: false,
      isFirefox: false,
      isUnsupported: false,
      browserName: '',
    };
  }

  const isStandalone = isRunningStandalone();
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isOpera = /opr\/|opera/i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);

  // Chrome / Edge / Chromium based check
  const isChromium = (/chrome|crios|edg\//i.test(ua) || Boolean((window as any).chrome)) && !isOpera;

  let isUnsupported = false;
  let browserName = '';

  if (isOpera) {
    isUnsupported = true;
    browserName = 'Opera';
  } else if (isFirefox) {
    isUnsupported = true;
    browserName = 'Firefox';
  } else if (!isIOS && !isChromium) {
    isUnsupported = true;
    browserName = 'questo browser';
  }

  return {
    isStandalone,
    isIOS,
    isAndroid,
    isOpera,
    isFirefox,
    isUnsupported,
    browserName,
  };
}

export function usePWAInstall() {
  const initial = getBrowserEnv();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(initial.isStandalone);
  const [isInstalledOnDevice, setIsInstalledOnDevice] = useState(false);
  const [isIOS, setIsIOS] = useState(initial.isIOS);
  const [isAndroid, setIsAndroid] = useState(initial.isAndroid);
  const [isOpera, setIsOpera] = useState(initial.isOpera);
  const [isFirefox, setIsFirefox] = useState(initial.isFirefox);
  const [isUnsupportedBrowser, setIsUnsupportedBrowser] = useState(initial.isUnsupported);
  const [unsupportedBrowserName, setUnsupportedBrowserName] = useState(initial.browserName);

  useEffect(() => {
    // Clear any obsolete localStorage flags that previously caused false "installed" status
    clearLegacyInstalledFlags();

    const env = getBrowserEnv();
    setIsStandalone(env.isStandalone);
    setIsIOS(env.isIOS);
    setIsAndroid(env.isAndroid);
    setIsOpera(env.isOpera);
    setIsFirefox(env.isFirefox);
    setIsUnsupportedBrowser(env.isUnsupported);
    setUnsupportedBrowserName(env.browserName);

    // Check Chrome/Android installed related apps API
    detectInstalledRelatedApps().then((installed) => {
      if (installed) {
        setIsInstalledOnDevice(true);
      }
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // If beforeinstallprompt fired, the browser confirms the app is NOT installed
      setIsInstalledOnDevice(false);
    };

    const handleAppInstalled = () => {
      setIsInstalledOnDevice(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalledOnDevice(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const launchApp = useCallback(() => {
    launchInstalledApp();
  }, []);

  // When beforeinstallprompt is active, the app is definitely installable
  const isInstallable = Boolean(deferredPrompt);

  // If in standalone mode, the app is running as an installed PWA
  // If not standalone, isInstalled reflects verified OS installation (related apps or recent install)
  const isInstalled = isStandalone || (!isInstallable && isInstalledOnDevice);

  return {
    isInstallable,
    isStandalone,
    isInstalled,
    isInstalledOnDevice,
    isIOS,
    isAndroid,
    isOpera,
    isFirefox,
    isUnsupportedBrowser,
    unsupportedBrowserName,
    install,
    launchApp,
  };
}
