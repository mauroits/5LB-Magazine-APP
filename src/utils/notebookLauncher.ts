import { GOOGLE_NOTEBOOK_URL } from '../config/navigation';

/**
 * Apre Google NotebookLM dando PRIORITÀ all'app installata sul dispositivo.
 * Se l'app non è installata (o su desktop/iOS senza app), apre la webview / finestra
 * funzionante del portale Google Notebook, evitando qualsiasi schermata grigia
 * o blocco X-Frame-Options tipico degli iframe non supportati da Google.
 */
export function openNotebookWithPriority(): void {
  const url = GOOGLE_NOTEBOOK_URL;
  if (typeof window === 'undefined') return;

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);

  if (isAndroid) {
    // 1. Priorità all'app nativa / PWA installata su Android tramite Intent standard di Chrome.
    // Se l'app Google Notebook (o WebAPK/PWA di NotebookLM) è presente, Android l'avvia direttamente.
    // Se non è installata, il parametro S.browser_fallback_url avvia automaticamente la navigazione webview in Chrome.
    const intentUrl = `intent://notebook.google.com/notebook/47913756-695d-4076-b64a-be74986cfdf8#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(url)};end;`;

    let fallbackHandled = false;
    const triggerWebFallback = () => {
      if (fallbackHandled) return;
      fallbackHandled = true;
      if (!document.hidden) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    // Avvio intent
    try {
      window.location.href = intentUrl;
    } catch {
      triggerWebFallback();
      return;
    }

    // Safety fallback: se dopo 1200ms la pagina corrente è ancora visibile
    // (segno che nessuna app esterna ha preso il controllo), apriamo la webview funzionante
    const safetyTimer = window.setTimeout(() => {
      triggerWebFallback();
    }, 1200);

    const handleVisibility = () => {
      if (document.hidden) {
        // L'app installata si è aperta correttamente e la schermata è andata in background
        clearTimeout(safetyTimer);
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility, { once: true });
    return;
  }

  // iOS / Desktop:
  // window.open con l'Universal Link di Google Notebook:
  // - Su iOS, se l'app è installata la apre tramite Universal Links; altrimenti apre la pagina in Safari/Chrome.
  // - Su Desktop, apre una finestra/scheda dedicata dove NotebookLM funziona perfettamente con l'account Google dell'utente.
  window.open(url, '_blank', 'noopener,noreferrer');
}
