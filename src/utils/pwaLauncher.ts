/**
 * PWA Launcher & Installation State Manager for 5LB Magazine
 * Manages cross-browser PWA detection, custom protocols, deep-linking,
 * and automatic launch of the installed app when accessed from alternative browsers.
 */

const STORAGE_KEY_INSTALLED = '5lb_app_installed_on_device';
const SESSION_KEY_AUTO_LAUNCHED = '5lb_auto_launch_attempted';
const COOKIE_NAME = '5lb_pwa_installed';

/**
 * Checks if the current window is executing inside a standalone PWA display mode.
 */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const isMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isNavStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const hasStandaloneParam =
    new URLSearchParams(window.location.search).get('standalone') === 'true' ||
    new URLSearchParams(window.location.search).get('launch_pwa') === '1';

  return isMediaStandalone || isNavStandalone || hasStandaloneParam;
}

/**
 * Reads persistent status indicating whether the app is installed on this device.
 */
export function isAppInstalledOnDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // If running in standalone mode right now, it is definitely installed
  if (isRunningStandalone()) {
    setAppInstalledOnDevice(true);
    return true;
  }

  // Check localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY_INSTALLED);
    if (stored === 'true') return true;
  } catch (e) {
    // ignore
  }

  // Check document.cookie as a secondary fallback
  try {
    if (document.cookie.includes(`${COOKIE_NAME}=1`)) {
      return true;
    }
  } catch (e) {
    // ignore
  }

  return false;
}

/**
 * Persists installation state across browser sessions and notifies listeners.
 */
export function setAppInstalledOnDevice(installed: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_INSTALLED, installed ? 'true' : 'false');
  } catch (e) {
    // ignore
  }

  try {
    document.cookie = `${COOKIE_NAME}=${installed ? '1' : '0'}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    // ignore
  }

  // Dispatch event so hooks and UI update immediately
  window.dispatchEvent(
    new CustomEvent('5lb:pwa-installed-status-changed', {
      detail: { isInstalled: installed },
    })
  );
}

/**
 * Asynchronously inspects navigator.getInstalledRelatedApps (supported on Chromium / Android)
 */
export async function detectInstalledRelatedApps(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const nav = navigator as unknown as {
    getInstalledRelatedApps?: () => Promise<Array<{ platform: string; url?: string; id?: string }>>;
  };

  if (typeof nav.getInstalledRelatedApps === 'function') {
    try {
      const apps = await nav.getInstalledRelatedApps();
      if (apps && apps.length > 0) {
        setAppInstalledOnDevice(true);
        return true;
      }
    } catch (e) {
      // ignore
    }
  }

  return false;
}

/**
 * Launches the installed app on the system using custom protocol handler or platform intents.
 */
export function launchInstalledApp(targetUrl?: string): void {
  if (typeof window === 'undefined') return;

  // Mark device as having the app installed
  setAppInstalledOnDevice(true);

  const destination = targetUrl || window.location.href;
  const protocolUrl = `web+magazine5lb://open?url=${encodeURIComponent(destination)}`;
  const ua = window.navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(ua);

  if (isAndroid) {
    // Android supports Chrome/PWA intent or direct protocol launch
    const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;

    // Attempt protocol first; if not registered by OS, fallback to intent
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = protocolUrl;
    document.body.appendChild(iframe);

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {
        // ignore
      }
      window.location.href = intentUrl;
    }, 450);
  } else {
    // iOS Safari or desktop Windows/Mac/Linux with protocol registered
    window.location.href = protocolUrl;
  }
}

/**
 * Automatically attempts to trigger the installed app when user visits or types the URL in a browser.
 * Only attempts once per browser session to prevent disruptive redirect loops.
 */
export function attemptAutoLaunchOnLoad(): boolean {
  if (typeof window === 'undefined') return false;

  // Never redirect if already running in standalone PWA
  if (isRunningStandalone()) {
    setAppInstalledOnDevice(true);
    return false;
  }

  // Only auto-launch if we know the app is installed on this system
  if (!isAppInstalledOnDevice()) {
    return false;
  }

  // Check if auto-launch was already tried in this session
  try {
    if (sessionStorage.getItem(SESSION_KEY_AUTO_LAUNCHED) === 'true') {
      return false;
    }
    sessionStorage.setItem(SESSION_KEY_AUTO_LAUNCHED, 'true');
  } catch (e) {
    return false;
  }

  // Attempt to launch the installed app directly
  launchInstalledApp();
  return true;
}
