# Ottimizzazione Web Manifest per PWABuilder & Google Play Store (TWA)

Piano di aggiornamento del Web App Manifest e degli asset per soddisfare i requisiti avanzati di PWABuilder, massimizzare il punteggio di conformità e preparare l'applicazione alla pubblicazione su Google Play Store tramite Trusted Web Activity (TWA).

## Decisioni Confermate

> [!IMPORTANT]
> Sulla base delle risposte fornite, il piano è calibrato specificamente per la pubblicazione su Google Play Store tramite TWA senza appesantire il manifest con funzioni non pertinenti.

- **Destinazione principale**: Google Play Store via TWA (Trusted Web Activity) con pieno supporto al Rich Install Prompt dei browser Chromium.
- **Ambito di arricchimento**: Inclusione dei campi ad alto impatto approvati: `screenshots` (mobile e desktop), `categories`, `shortcuts` (scorciatoie rapide con pressione prolungata dell'icona), `orientation`, `dir` e `display_override`.
- **Strategia screenshot**: Generazione automatica di screenshot brandizzati ad alta risoluzione (desktop wide e mobile narrow) raffiguranti l'interfaccia reale di 5LB Magazine (articoli, categorie e rubrica Accade Oggi).

---

## 1. Panoramica & Obiettivo

PWABuilder valuta il manifest per determinare l'idoneità al packaging TWA per Android. Attualmente l'app soddisfa tutti i requisiti obbligatori (Required 4/4), ma manca degli elementi multimediali e descrittivi (Recommended & Optional) che abilitano:
1. La creazione del pacchetto APK / AAB per Google Play Store con schede grafiche conformi.
2. Il **Rich Install Prompt** di Chrome (la finestra di dialogo che mostra schermate d'anteprima e descrizione estesa anziché una semplice barra inferiore).
3. L'accesso rapido a sezioni chiave tramite il menu contestuale dell'icona dell'app su Android (App Shortcuts).

---

## 2. Esperienza Utente & Modifiche al Manifest

### Architettura del Flusso e Interazioni

```
┌────────────────────────────────────────────────────────┐
│             Web App Manifest Ottimizzato               │
├────────────────────────────────────────────────────────┤
│ • start_url, name, short_name, icons (192, 512, mask)  │
│ • orientation: "any" / dir: "ltr" / lang: "it"         │
│ • categories: ["news", "magazines", "education"]       │
│ • display_override: ["standalone", "window-controls"]  │
└───────────────────┬────────────────────────────────────┘
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│  Screenshots Preview │  │      App Shortcuts Menu      │
├──────────────────────┤  ├──────────────────────────────┤
│ 1. Mobile (Narrow)   │  │ • Ultimi Articoli            │
│    750 x 1334 px     │  │ • Accade Oggi                │
│ 2. Desktop (Wide)    │  │ • Cerca nella Rivista        │
│    1280 x 720 px     │  │                              │
│ (Attiva Rich Prompt  │  │ (Pressione prolungata icona  │
│  su Android & Store) │  │  su launcher Android)        │
└──────────────────────┘  └──────────────────────────────┘
```

### Dettaglio Campi Aggiunti al Manifest (`vite.config.ts`)

1. **`screenshots`**:
   - Screenshot Mobile (`form_factor: "narrow"`, `sizes: "750x1334"`, `type: "image/png"`): schermata home con articoli e testata della rivista.
   - Screenshot Desktop/Tablet (`form_factor: "wide"`, `sizes: "1280x720"`, `type: "image/png"`): vista completa a griglia con sidebar e navigazione.
   - Entrambi con label descrittive in italiano per l'accessibilità e gli store.

2. **`shortcuts`**:
   - **Ultimi Articoli**: link diretto all'elenco aggiornato degli articoli (`?tab=latest`).
   - **Accade Oggi**: accesso istantaneo al canale Telegram e archivio storico del giorno (`?tab=accade-oggi`).
   - **Cerca nella Rivista**: avvio con focus immediato sul motore di ricerca (`?action=search`).
   - Ciascuno corredato di icona specifica o icona standard PWA.

3. **`categories`**:
   - `["news", "magazines", "education", "health"]` (standard IANA/W3C riconosciuti da Google Play e Chrome).

4. **`orientation`**:
   - `"any"` (permette la rotazione fluida su tablet, dispositivi pieghevoli e smartphone garantendo fruibilità sia in verticale che in orizzontale).

5. **`dir`**:
   - `"ltr"` (left-to-right).

6. **`display_override`**:
   - `["standalone", "window-controls-overlay"]` (priorità all'interfaccia app nativa con supporto a controlli avanzati su desktop/Android).

---

## 3. Decisioni Tecniche & Generazione Asset

- **Generazione Asset Screenshot**:
  Verrà creato uno script leggero di generazione o rendering canvas Node/Vite per produrre immagini PNG pulite, fedeli all'identità grafica della rivista (palette `#000836`, logo 5LB, miniature articoli e badge), salvate in `public/screenshots/`.
- **Risoluzione percorsi dinamica (`base`)**:
  Come già implementato in `vite.config.ts`, ogni risorsa (`screenshots`, `shortcuts.icons`, `start_url`) utilizzerà il prefisso dinamico `${base}` per garantire il funzionamento perfetto sia in sviluppo locale, sia su GitHub Pages (`/5LB-Magazine-Experimental/` o root).
- **Gestione Deep Link Parametrici**:
  Verifica e aggiunta della gestione in `src/App.tsx` dei parametri `tab=latest`, `tab=accade-oggi` e `action=search` per gestire il salto rapido al click su una shortcut.

---

## 4. Fasi di Implementazione

1. **Generazione Asset Grafici**:
   - Creazione della cartella `public/screenshots/`.
   - Generazione di `screenshot-mobile.png` (750x1334 px) e `screenshot-desktop.png` (1280x720 px).
2. **Aggiornamento di `vite.config.ts`**:
   - Configurazione dei blocchi `screenshots`, `shortcuts`, `categories`, `orientation`, `dir` e `display_override` all'interno della configurazione `VitePWA`.
   - Inclusione dei nuovi file in `includeAssets`.
3. **Gestione Query Parameter Shortcuts**:
   - Verifica del routing/stato in `src/App.tsx` affinché l'apertura tramite shortcut selezioni la tab corretta o apra la ricerca.
4. **Verifica e Test Build**:
   - Esecuzione di `compile_applet` e verifica del file `dist/manifest.webmanifest`.
   - Validazione con i criteri PWABuilder (punteggio atteso > 35/46 con tutti i check verdi critici).
