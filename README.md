# 📊 Curve Glicemiche & Insulinemiche

**Sistema di refertazione per Curve da Carico Orale di Glucosio (OGTT)**
con grafici interattivi, generazione PDF e archivio pazienti.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=flat&logo=chart.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Funzionalità

### Configurazione & Preset
- **8 preset predefiniti**: glicemica 3/4/5/6 punti, gravidanza IADPSG, insulinemica, combinata 5+5 e 6+6
- Valori di riferimento personalizzabili per ogni tempo di prelievo
- Supporto unità: mg/dL, mmol/L (glicemia) — µUI/mL, pmol/L (insulinemia)
- Toggle gravidanza con criteri IADPSG/WHO
- Tempi di prelievo personalizzabili (minuti separati da virgola)

### Inserimento Dati
- Tabelle dinamiche con validazione in tempo reale
- Badge colorati: ✅ Normale, ⚠️ Basso, 🔴 Alto
- Intervalli di riferimento visibili per ogni punto

### Grafici Interattivi
- Curve smooth con interpolazione cubica monotona (Chart.js)
- Area di riferimento min/max ombreggiata
- Grafici separati per glicemia (verde) e insulinemia (arancione)
- Tooltip con valori e unità

### Interpretazione Diagnostica Automatica
- **Glicemia adulti**: Normale / IGT (pre-diabete) / Diabete Mellito
- **Gravidanza**: Criteri IADPSG per diabete gestazionale
- **Insulinemia**: Analisi picco, picco ritardato, insulino-resistenza
- Toggle per mostrare/nascondere l'interpretazione

### Generazione PDF
- Report professionale su **singola pagina A4**
- Header personalizzabile con logo/intestazione
- Tabelle risultati con valori di riferimento
- **Grafici in riquadri quadrati affiancati**
- Interpretazione diagnostica
- Note e metodica
- Footer con data generazione e numerazione pagine

### 🗃️ Archivio Pazienti e Referti
- Database locale (localStorage) per pazienti e referti
- Ricerca per cognome, nome, codice fiscale, data
- Statistiche: totale referti, pazienti unici, esami gravidanza
- Caricamento rapido di referti salvati
- **Esportazione/importazione JSON** per backup e portabilità
- Download PDF dalla cache

### Impostazioni Persistenti
- Salvataggio header, titolo, metodica, unità tra sessioni
- Ripristino automatico all'apertura

---

## 🚀 Utilizzo

### Metodo 1: Apertura diretta (consigliato)
```
Clona la repo → Apri index.html nel browser
```

### Metodo 2: Servire con un server locale
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```
Poi aprire `http://localhost:8080` nel browser.

### Metodo 3: GitHub Pages
1. Vai su **Settings → Pages** nella tua repo
2. Seleziona il branch `main` e la cartella root `/`
3. Il sito sarà disponibile su `https://tuoutente.github.io/nome-repo/`

---

## 📁 Struttura Progetto

```
├── index.html              # Pagina principale
├── css/
│   └── styles.css          # Stili UI completi
├── js/
│   ├── state.js            # Stato globale, valori riferimento, preset
│   ├── presets.js           # Rendering e selezione preset
│   ├── config.js            # Configurazione, interpolazione, editor riferimenti
│   ├── navigation.js        # Navigazione sezioni
│   ├── data-entry.js        # Tabelle inserimento e validazione
│   ├── charts.js            # Grafici Chart.js (screen + PDF)
│   ├── results.js           # Riepilogo risultati e interpretazione
│   ├── storage.js           # Persistenza impostazioni (localStorage)
│   ├── database.js          # Archivio pazienti e referti
│   ├── pdf-generator.js     # Generazione PDF (jsPDF)
│   └── init.js              # Inizializzazione e bootstrap
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🔧 Dipendenze Esterne (CDN)

| Libreria | Versione | Utilizzo |
|----------|----------|----------|
| [Chart.js](https://www.chartjs.org/) | 4.4.1 | Grafici interattivi |
| [jsPDF](https://github.com/parallax/jsPDF) | 2.5.1 | Generazione PDF |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | — | Tipografia UI |
| [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) | — | Titoli |

> **Nota**: Le librerie vengono caricate da CDN. Per uso offline, è possibile scaricarle localmente.

---

## 📋 Valori di Riferimento

### Glicemia adulti (OGTT 75g)
| Tempo | Minimo | Massimo |
|-------|--------|---------|
| Basale | 60 mg/dL | 100 mg/dL |
| 120 min | — | < 140 (normale), 140-199 (IGT), ≥ 200 (diabete) |

### Glicemia gravidanza (IADPSG)
| Tempo | Limite |
|-------|--------|
| Basale | < 92 mg/dL |
| 60 min | < 180 mg/dL |
| 120 min | < 153 mg/dL |

> Un singolo valore fuori range → Diabete gestazionale

### Insulinemia
| Tempo | Minimo | Massimo |
|-------|--------|---------|
| Basale | 2 µUI/mL | 25 µUI/mL |
| 30-60 min (picco) | 20 µUI/mL | 120 µUI/mL |
| 120 min | 6 µUI/mL | 56 µUI/mL |

---

## 🛡️ Privacy e Dati

- **Nessun dato viene trasmesso a server esterni**
- Tutti i dati restano nel browser (localStorage)
- L'applicazione funziona completamente offline
- L'archivio può essere esportato/importato come file JSON

---

## 📄 Licenza

[MIT License](LICENSE) — Libero utilizzo, modifica e distribuzione.

---

## 👨‍💻 Sviluppo

Per contribuire:

1. Fork della repo
2. Crea un branch: `git checkout -b feature/nome-feature`
3. Commit: `git commit -m 'Aggiunta funzionalità X'`
4. Push: `git push origin feature/nome-feature`
5. Apri una Pull Request

---

*Sviluppato per uso clinico-laboratoristico. I risultati devono essere sempre interpretati dal medico nel contesto clinico del paziente.*
