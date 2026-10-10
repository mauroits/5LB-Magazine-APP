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

  // Aggiorna Google Consent Mode v2 (senza disabilitare lo script, consentendo modellazione e cookieless ping)
  applyConsentToGtag(analyticsGranted);

  return settings;
}

/**
 * Applica lo stato di consenso al dataLayer di Google Analytics (Consent Mode v2)
 * Se l'utente rifiuta ('denied'), lo script NON viene bloccato:
 * Google Analytics riceverà i ping anonimi privi di cookie permettendo la modellazione comportamentale.
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
  const consentState = (saved && saved.hasChosen && saved.analytics) ? 'granted' : 'denied';

  // Assicura l'aggiornamento dello stato di consenso in Consent Mode v2
  window.gtag('consent', 'update', {
    analytics_storage: consentState,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

/**
 * Invia un evento di visualizzazione pagina (page_view) a Google Analytics.
 * Funziona sempre con Consent Mode v2:
 * - Se consenso concesso: tracciamento standard con cookie.
 * - Se consenso negato: cookieless ping anonimo per tracciamento modellato GA4.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  const title = pageTitle || document.title;
  const location = window.location.origin + pagePath;

  // Aggiorna configurazione attiva di GA4
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: title,
    page_location: location,
  });

  // Notifica l'evento page_view per i report tempo reale e pagine/schermate
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: title,
    page_location: location,
  });
}

/**
 * Traccia un evento personalizzato in Google Analytics.
 * NON blocca mai la chiamata: la Consent Mode v2 di Google gestisce nativamente
 * la conformità privacy rimuovendo i cookie quando il consenso è negato.
 */
export function trackEvent(eventName: string, eventParams: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  window.gtag('event', eventName, eventParams);
}
