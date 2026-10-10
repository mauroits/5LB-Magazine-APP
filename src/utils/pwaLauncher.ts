/**
 * PWA Launcher & Installation State Manager for 5LB Magazine
 * Manages cross-browser PWA detection, deep-linking,
 * and reliable launching of the installed app without redirect loops or white screens.
 */

const STORAGE_KEY_INSTALLED = '5lb_app_installed_on_device';
const COOKIE_NAME = '5lb_pwa_installed';

/**
 * Checks if the current window is executing inside a standalone PWA display mode.
 */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const isMediaStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches;

  const isNavStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  const hasStandaloneParam =
    new URLSearchParams(window.location.search).get('standalone') === 'true' ||
    new URLSearchParams(window.location.search).get('launch_pwa') === '1' ||
    new URLSearchParams(window.location.search).get('utm_source') === 'homescreen';

  const isAndroidReferrer =
    typeof document !== 'undefined' && document.referrer.includes('android-app://');

  return isMediaStandalone || isNavStandalone || hasStandaloneParam || isAndroidReferrer;
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
 * Launches the installed app on the system using generic Android VIEW intent
 * or custom protocol handler, WITHOUT hardcoding com.android.chrome.
 */
export function launchInstalledApp(targetUrl?: string): void {
  if (typeof window === 'undefined') return;

  // If already running inside standalone app, do nothing to avoid white screens
  if (isRunningStandalone()) {
    return;
  }

  // Mark device as having the app installed
  setAppInstalledOnDevice(true);

  const destination = targetUrl || window.location.href;
  const ua = window.navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(ua);

  if (isAndroid) {
    // Use generic Android VIEW intent WITHOUT package=com.android.chrome
    // This allows Android OS to route directly to the installed 5LB WebAPK/PWA
    const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
    window.location.href = intentUrl;
  } else {
    // On iOS or desktop, attempt the registered protocol handler
    const protocolUrl = `web+magazine5lb://open?url=${encodeURIComponent(destination)}`;
    window.location.href = protocolUrl;
  }
}

/**
 * Deprecated / Disabled auto-launch on page load:
 * Automatic redirects on initial page load cause crashes/white screens in native webviews
 * and infinite loops in Chrome. Must return false without navigating.
 */
export function attemptAutoLaunchOnLoad(): boolean {
  // Completely disabled to prevent white-screen crashes and redirect loops
  return false;
}
