/**
 * ============================================================================
 * TESTI DELLA PAGINA INFORMAZIONI E DEL BANNER IA
 * ============================================================================
 * 
 * Puoi modificare facilmente tutti i testi di seguito.
 * Le modifiche avranno effetto immediato nella pagina Informazioni e nel banner IA.
 */

// 1. Configurazione del Banner IA (mostrato in cima alla lista degli articoli)
export const AI_BANNER_CONFIG = {
  badge: 'Google NotebookLM',
  title: 'Assistente IA sulle 5 Leggi Biologiche',
  description:
    'Interroga le fonti, sintetizza le leggi biologiche e poni quesiti con il tuo account Google.',
  buttonText: 'Apri NotebookLM',
};

// 2. Testi della Pagina Informazioni (accessibile dall'icona ℹ️)
export const INFO_PAGE_CONTENT = {
  headerSubtitle: 'Guida & Informazioni',

  // Scheda: Funzioni
  funzioni: {
    title: 'Panoramica delle Funzionalità',
    intro:
      'Questa Progressive Web App (PWA) è l’hub integrato per i contenuti di 5LB Magazine (magazine.5lb.eu), progettata per la consultazione fluida su smartphone, tablet e desktop.',
    cards: [
      {
        title: 'Aggregatore Feed RSS Live',
        description:
          'Collegamento diretto alle pubblicazioni del magazine su Blogger, organizzate per sezioni informative e filtri eziologici (apparati biologici).',
      },
      {
        title: 'Assistente IA con Google NotebookLM',
        description:
          'Accesso diretto al Notebook pubblico delle 5LB. Puoi porre domande e ottenere risposte sintetizzate sulle fonti autentiche con il tuo account Google.',
      },
      {
        title: 'Notifiche Push in Tempo Reale',
        description:
          'Avviso immediato su smartphone e computer ad ogni nuova pubblicazione, con segnale acustico e centro notifiche integrato.',
      },
      {
        title: 'Modalità Offline & Installazione PWA',
        description:
          'Installabile sulla schermata home come applicazione nativa. Tutti gli articoli consultati vengono salvati in cache per la lettura anche senza connessione.',
      },
    ],
  },

  // Scheda: Ultimi Aggiornamenti (Changelog)
  aggiornamenti: {
    title: 'Registro delle Versioni & Miglioramenti',
    releases: [
      {
        version: 'v1.2.0 (Attuale)',
        date: 'Ottobre 2026',
        isCurrent: true,
        notes: [
          'Integrazione dell’immagine ufficiale Rivista-logo-1024x500-NoNeon.png sia nella Home che nel menu laterale.',
          'Creazione del file di configurazione centrale per la modifica dei testi (pagina info e banner IA).',
          'Gestione dei link e dell’ordine delle voci di navigazione direttamente nel backend e nei file di progetto.',
          'Aggiunta della schermata informativa con funzioni, contatti e privacy.',
        ],
      },
      {
        version: 'v1.1.0',
        date: 'Ottobre 2026',
        isCurrent: false,
        notes: [
          'Integrazione del Google Notebook pubblico con supporto all’account Google dell’utente.',
          'Conformità PWA con Service Worker, iconografia ad alta definizione e supporto offline.',
          'Modalità lettore con regolazione della dimensione dei caratteri e sintesi vocale (TTS).',
        ],
      },
      {
        version: 'v1.0.0',
        date: 'Settembre 2026',
        isCurrent: false,
        notes: [
          'Prima release dell’aggregatore per magazine.5lb.eu.',
          'Menu laterale a fisarmonica con sezioni Informazione, Formazione, Laboratorio, Consulenza, Framework ed Eziologia.',
        ],
      },
    ],
  },

  // Scheda: Contatti
  contatti: {
    title: 'Contatti & Riferimenti Ufficiali',
    intro:
      'Per chiarimenti editoriali, consulenze o supporto sull’applicazione puoi fare riferimento ai canali ufficiali della redazione:',
    email: 'mauro.sartorio@5lb.eu',
    magazineUrl: 'https://magazine.5lb.eu',
    mainWebsiteUrl: 'https://5lb.eu',
  },

  // Scheda: Privacy Policy
  privacy: {
    title: 'Informativa sulla Privacy & Gestione Dati',
    intro:
      'La presente webapp è progettata secondo i principi di Privacy by Design e minimizzazione dei dati:',
    points: [
      {
        title: 'Dati Memorizzati in Locale (Local Storage)',
        text: 'Lo stato degli articoli letti, gli articoli contrassegnati nei preferiti ("Ti piace") e le preferenze delle notifiche sono memorizzati esclusivamente nella memoria locale del tuo browser. Nessun dato personale o cronologia di lettura viene trasmesso a server esterni o terze parti.',
      },
      {
        title: 'Accesso a Google NotebookLM',
        text: 'L’integrazione di Google NotebookLM si appoggia direttamente all’infrastruttura di Google. Quando utilizzi il tuo account Google all’interno del notebook, l’autenticazione e la gestione delle credenziali avvengono direttamente sui server sicuri di Google nel rispetto delle policy di Google.',
      },
      {
        title: 'Notifiche Push',
        text: 'Le notifiche push avvengono mediante le API standard del browser (Web Notifications API) previa esplicita autorizzazione dell’utente, senza richiedere la raccolta di numeri telefonici o indirizzi email.',
      },
    ],
    fullPrivacyUrl: 'https://5lb.eu/privacy',
  },
};
