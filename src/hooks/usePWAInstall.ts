import { useEffect, useState } from 'react';

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

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

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
  const [isInstalled, setIsInstalled] = useState(initial.isStandalone);
  const [isIOS, setIsIOS] = useState(initial.isIOS);
  const [isAndroid, setIsAndroid] = useState(initial.isAndroid);
  const [isOpera, setIsOpera] = useState(initial.isOpera);
  const [isFirefox, setIsFirefox] = useState(initial.isFirefox);
  const [isUnsupportedBrowser, setIsUnsupportedBrowser] = useState(initial.isUnsupported);
  const [unsupportedBrowserName, setUnsupportedBrowserName] = useState(initial.browserName);

  useEffect(() => {
    // Re-verify standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const env = getBrowserEnv();
    setIsIOS(env.isIOS);
    setIsAndroid(env.isAndroid);
    setIsOpera(env.isOpera);
    setIsFirefox(env.isFirefox);
    setIsUnsupportedBrowser(env.isUnsupported);
    setUnsupportedBrowserName(env.browserName);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
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
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isOpera,
    isFirefox,
    isUnsupportedBrowser,
    unsupportedBrowserName,
    install,
  };
}
