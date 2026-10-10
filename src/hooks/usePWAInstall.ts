import { useEffect, useState, useCallback } from 'react';
import {
  isRunningStandalone,
  isAppInstalledOnDevice,
  setAppInstalledOnDevice,
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
      isInstalledOnDevice: false,
      isIOS: false,
      isAndroid: false,
      isOpera: false,
      isFirefox: false,
      isUnsupported: false,
      browserName: '',
    };
  }

  const isStandalone = isRunningStandalone();
  const isInstalledOnDevice = isAppInstalledOnDevice();

  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isOpera = /opr\/|opera/i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);

  // Chrome / Edge / Chromium based check (Opera also has chrome in UA, so exclude Opera)
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
    isInstalledOnDevice,
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
  const [isDeviceInstalled, setIsDeviceInstalled] = useState(initial.isInstalledOnDevice);
  const [isIOS, setIsIOS] = useState(initial.isIOS);
  const [isAndroid, setIsAndroid] = useState(initial.isAndroid);
  const [isOpera, setIsOpera] = useState(initial.isOpera);
  const [isFirefox, setIsFirefox] = useState(initial.isFirefox);
  const [isUnsupportedBrowser, setIsUnsupportedBrowser] = useState(initial.isUnsupported);
  const [unsupportedBrowserName, setUnsupportedBrowserName] = useState(initial.browserName);

  const refreshState = useCallback(() => {
    const env = getBrowserEnv();
    setIsStandalone(env.isStandalone);
    setIsDeviceInstalled(env.isInstalledOnDevice);
    setIsIOS(env.isIOS);
    setIsAndroid(env.isAndroid);
    setIsOpera(env.isOpera);
    setIsFirefox(env.isFirefox);
    setIsUnsupportedBrowser(env.isUnsupported);
    setUnsupportedBrowserName(env.browserName);
  }, []);

  useEffect(() => {
    refreshState();

    // Check getInstalledRelatedApps asynchronously
    detectInstalledRelatedApps().then((installed) => {
      if (installed) {
        setIsDeviceInstalled(true);
      }
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setAppInstalledOnDevice(true);
      setIsDeviceInstalled(true);
      setDeferredPrompt(null);
    };

    const handleStatusChanged = (e: any) => {
      if (e.detail?.isInstalled !== undefined) {
        setIsDeviceInstalled(e.detail.isInstalled);
      } else {
        refreshState();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('5lb:pwa-installed-status-changed', handleStatusChanged);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('5lb:pwa-installed-status-changed', handleStatusChanged);
    };
  }, [refreshState]);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setAppInstalledOnDevice(true);
      setIsDeviceInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const markAsInstalled = useCallback(() => {
    setAppInstalledOnDevice(true);
    setIsDeviceInstalled(true);
  }, []);

  const launchApp = useCallback(() => {
    launchInstalledApp();
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isStandalone,
    // Considered installed if running in standalone or marked/detected as installed on device
    isInstalled: isStandalone || isDeviceInstalled,
    isDeviceInstalled,
    isIOS,
    isAndroid,
    isOpera,
    isFirefox,
    isUnsupportedBrowser,
    unsupportedBrowserName,
    install,
    markAsInstalled,
    launchApp,
  };
}
