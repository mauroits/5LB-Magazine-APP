/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GA_MEASUREMENT_ID = 'G-F8YBSNXCDW';
export const COOKIE_CONSENT_KEY = '5lb_cookie_consent_v1';

export interface CookieConsentSettings {
  necessary: boolean; // Always true
  analytics: boolean;
  hasChosen: boolean;
  timestamp: string;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Legge le preferenze di consenso salvate nel localStorage
 */
export function getStoredCookieConsent(): CookieConsentSettings | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.hasChosen === 'boolean') {
      return {
        necessary: true,
        analytics: Boolean(parsed.analytics),
        hasChosen: parsed.hasChosen,
        timestamp: parsed.timestamp || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Errore lettura consenso cookie:', err);
  }
  return null;
}

/**
 * Salva le impostazioni di consenso ed aggiorna Google Consent Mode v2
 */
export function saveCookieConsent(analyticsGranted: boolean): CookieConsentSettings {
  const settings: CookieConsentSettings = {
    necessary: true,
    analytics: analyticsGranted,
    hasChosen: true,
    timestamp: new Date().toISOString(),
  };

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Errore salvataggio consenso cookie:', err);
  }

  // Aggiorna Google Consent Mode v2
  applyConsentToGtag(analyticsGranted);

  return settings;
}

/**
 * Applica lo stato di consenso al dataLayer di Google Analytics (Consent Mode v2)
 */
export function applyConsentToGtag(analyticsGranted: boolean): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  const consentState = analyticsGranted ? 'granted' : 'denied';

  window.gtag('consent', 'update', {
    analytics_storage: consentState,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  if (analyticsGranted) {
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  }
}

/**
 * Inizializza Google Analytics e applica il consenso memorizzato all'avvio dell'applicazione
 */
export function initAnalyticsWithSavedConsent(): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  const saved = getStoredCookieConsent();

  // Imposta lo stato iniziale di Consent Mode
  if (saved && saved.hasChosen) {
    const consentState = saved.analytics ? 'granted' : 'denied';
    window.gtag('consent', 'default', {
      analytics_storage: consentState,
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });

    if (saved.analytics) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true,
      });
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    }
  } else {
    // Di default tutto negato finché l'utente non esprime una scelta
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }
}

/**
 * Traccia un evento personalizzato se il consenso per i cookie analitici è attivo
 */
export function trackEvent(eventName: string, eventParams: Record<string, any> = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  const consent = getStoredCookieConsent();
  if (consent && consent.analytics) {
    window.gtag('event', eventName, eventParams);
  }
}
