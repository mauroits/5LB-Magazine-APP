import { GOOGLE_NOTEBOOK_URL } from '../config/navigation';

/**
 * Apre Google NotebookLM:
 * - Su Android: forza l'apertura ESCLUSIVA nel Chrome di sistema integrato (package=com.android.chrome),
 *   eliminando la finestra di dialogo del sistema "Apri con Chrome, Opera, ecc.".
 *   Se l'app / PWA di NotebookLM è gestita da Chrome, si avvia direttamente; altrimenti si apre
 *   nella sessione integrata di Chrome.
 * - Su iOS: apre direttamente nel sistema integrato di iOS (Safari / WebKit In-App)
 *   senza alcuna richiesta o conflitto.
 * - Su Desktop / altri sistemi: apre una scheda/finestra dedicata senza blocchi iframe.
 */
export function openNotebookWithPriority(): void {
  const url = GOOGLE_NOTEBOOK_URL;
  if (typeof window === 'undefined') return;

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isAndroid) {
    // Intent Android esplicito con `package=com.android.chrome`:
    // Questo vincola l'azione esclusivamente a Google Chrome (browser integrato di Android),
    // impedendo al sistema operativo di mostrare il selettore "Apri con... Chrome, Opera, ecc.".
    const chromeIntentUrl = `intent://notebook.google.com/notebook/47913756-695d-4076-b64a-be74986cfdf8#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(url)};end;`;

    let fallbackHandled = false;
    const triggerWebFallback = () => {
      if (fallbackHandled) return;
      fallbackHandled = true;
      if (!document.hidden) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    // Avvio dell'intent mirato a Chrome tramite click sintetico e fallback su location.href
    try {
      const link = document.createElement('a');
      link.href = chromeIntentUrl;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      try {
        window.location.href = chromeIntentUrl;
      } catch {
        triggerWebFallback();
        return;
      }
    }

    // Safety fallback: se Chrome non dovesse rispondere entro 1200ms
    const safetyTimer = window.setTimeout(() => {
      triggerWebFallback();
    }, 1200);

    const handleVisibility = () => {
      if (document.hidden) {
        clearTimeout(safetyTimer);
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility, { once: true });
    return;
  }

  if (isIOS) {
    // Su iOS, apre direttamente nel browser integrato di sistema (Safari / In-App Safari)
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Desktop / altri sistemi:
  window.open(url, '_blank', 'noopener,noreferrer');
}
