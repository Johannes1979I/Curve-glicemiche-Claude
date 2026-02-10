/* pdf-generator.js — Professional Single-Page PDF Layout
   Layout order: Header → Title → Patient → Exam → Glyc Table (full-width) →
   Ins Table (full-width) → Methodology → Charts (side-by-side) →
   Extended Interpretation → Sources → Notes → Footer */

async function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => { if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF); else reject(new Error('jsPDF class not found')); };
    s.onerror = () => reject(new Error('Failed to load jsPDF'));
    document.head.appendChild(s);
  });
}

async function generatePDF() {
  const btn = document.getElementById('btn-gen-pdf');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Generazione in corso...'; btn.disabled = true;

  try {
    const JsPDF = await loadJsPDF();
    const doc = new JsPDF('p', 'mm', 'a4');
    const W = 210, H = 297, M = 10;
    const usable = W - M * 2;
    let y = M;
    const glycUnit = document.getElementById('cfg-glyc-unit').value;
    const insUnit = document.getElementById('cfg-ins-unit').value;
    const hasGlyc = state.glycTimes.length > 0;
    const hasIns = state.insTimes.length > 0;
    const bothCurves = hasGlyc && hasIns;
    const includeInterp = document.getElementById('pdf-include-interp').checked;
    const includeGraph = document.getElementById('pdf-include-graph').checked;

    // ═══════════════════════════════════════
    //  HEADER IMAGE
    // ═══════════════════════════════════════
    if (state.headerImage) {
      try {
        const img = new Image(); img.src = state.headerImage;
        await new Promise((ok, no) => { img.onload = ok; img.onerror = no; setTimeout(no, 3000); });
        const aspect = img.width / img.height;
        const imgW = usable, imgH = Math.min(imgW / aspect, 26);
        const fmt = state.headerImage.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(state.headerImage, fmt, M, y, imgW, imgH);
        y += imgH + 5;
      } catch(e) { console.warn('Header image error:', e); }
    }

    // ═══════════════════════════════════════
    //  TITLE
    // ═══════════════════════════════════════
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(45, 90, 61);
    const title = document.getElementById('pdf-title').value || 'Referto Curva da Carico Orale di Glucosio';
    doc.text(title, W / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(45, 90, 61); doc.setLineWidth(0.4); doc.line(M, y, W - M, y);
    y += 3.5;

    // ═══════════════════════════════════════
    //  PATIENT DATA (2 columns, compact)
    // ═══════════════════════════════════════
    doc.setFontSize(7); doc.setTextColor(30, 30, 30);
    const ptPairs = [
      ['Cognome', document.getElementById('pt-cognome').value || '\u2014', 'Nome', document.getElementById('pt-nome').value || '\u2014'],
      ['Data nascita', document.getElementById('pt-dob').value || '\u2014', 'Sesso', document.getElementById('pt-sesso').value === 'M' ? 'M' : 'F'],
      ['Cod. Fiscale', (document.getElementById('pt-cf').value || '\u2014').toUpperCase(), 'Data esame', document.getElementById('pt-data-esame').value || '\u2014'],
      ['Medico', document.getElementById('pt-medico').value || '\u2014', 'Accettaz.', document.getElementById('pt-accettazione').value || '\u2014'],
    ];
    const c2 = M + usable / 2 + 2;
    ptPairs.forEach(r => {
      doc.setFont('helvetica', 'bold'); doc.text(r[0] + ':', M, y);
      doc.setFont('helvetica', 'normal'); doc.text(r[1], M + 20, y);
      doc.setFont('helvetica', 'bold'); doc.text(r[2] + ':', c2, y);
      doc.setFont('helvetica', 'normal'); doc.text(r[3], c2 + 20, y);
      y += 3.8;
    });
    y += 1.5;

    // ═══════════════════════════════════════
    //  EXAM INFO BAR
    // ═══════════════════════════════════════
    const preset = state.preset ? PRESETS.find(p => p.id === state.preset) : null;
    doc.setFillColor(45, 90, 61); doc.rect(M, y, usable, 5.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
    let examText = 'ESAME: ' + (preset ? preset.name : 'Curva Personalizzata') + '   |   Carico: ' + document.getElementById('cfg-glucose-load').value + 'g glucosio';
    if (state.isPregnant) examText += '   |   Criteri IADPSG/ADA 2026 (Gravidanza)';
    doc.text(examText, M + 2, y + 3.8);
    y += 7.5;

    // ═══════════════════════════════════════
    //  FULL-WIDTH DATA TABLES
    // ═══════════════════════════════════════
    const colPosT = [0, 0.15, 0.35, 0.58, 0.82]; // tempo, risultato, rif, esito
    const rowH = 4.5;
    const headerH = 5;

    function drawFullWidthTable(times, values, refs, unit, label, accentColor) {
      // Section label
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...accentColor);
      doc.text(label, M, y); y += 2.5;

      // Header row with accent background
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(M, y, usable, headerH, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(255, 255, 255);
      const hy = y + 3.5;
      doc.text('Tempo', M + usable * colPosT[0] + 2, hy);
      doc.text('Risultato', M + usable * colPosT[1] + 2, hy);
      doc.text('Val. Riferimento', M + usable * colPosT[2] + 2, hy);
      doc.text('Esito', M + usable * colPosT[4] + 2, hy);
      y += headerH + 0.5;

      // Data rows
      times.forEach((t, i) => {
        const v = values[i]; const ref = refs[t] || { min: 0, max: 999 };
        let statusTxt = 'Normale', statusCol = [39, 174, 96];
        if (v !== undefined && v !== null && v !== '') {
          if (v < ref.min) { statusTxt = 'Inferiore'; statusCol = [212, 160, 23]; }
          if (v > ref.max) { statusTxt = 'Superiore'; statusCol = [192, 57, 43]; }
        }

        // Alternating row background
        if (i % 2 === 0) { doc.setFillColor(247, 248, 250); doc.rect(M, y, usable, rowH, 'F'); }

        const ry = y + 3.2; // text baseline inside row
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(30, 30, 30);
        doc.text(t === 0 ? 'Basale' : t + "'", M + usable * colPosT[0] + 2, ry);

        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
        doc.text(String(v !== undefined && v !== null && v !== '' ? v : '\u2014'), M + usable * colPosT[1] + 2, ry);

        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(100, 100, 100);
        doc.text(ref.min + ' \u2013 ' + ref.max + ' ' + unit, M + usable * colPosT[2] + 2, ry);

        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...statusCol);
        doc.text(statusTxt, M + usable * colPosT[4] + 2, ry);

        y += rowH;
      });

      // Bottom line
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.15); doc.line(M, y + 0.5, W - M, y + 0.5);
      y += 2.5;
    }

    if (hasGlyc) {
      drawFullWidthTable(state.glycTimes, state.glycValues, state.glycRefs, glycUnit, 'CURVA GLICEMICA', [45, 90, 61]);
    }
    if (hasIns) {
      drawFullWidthTable(state.insTimes, state.insValues, state.insRefs, insUnit, 'CURVA INSULINEMICA', [196, 86, 58]);
    }

    // ═══════════════════════════════════════
    //  METHODOLOGY (compact, one line)
    // ═══════════════════════════════════════
    const meth = document.getElementById('methodology').value;
    if (meth) {
      doc.setFontSize(5.5); doc.setTextColor(130, 130, 130); doc.setFont('helvetica', 'italic');
      const mLines = doc.splitTextToSize('Metodica: ' + meth.replace(/\n/g, ' \u2014 '), usable);
      mLines.slice(0, 2).forEach(l => { doc.text(l, M, y); y += 2.3; });
      y += 1.5;
    }

    // ═══════════════════════════════════════
    //  CHARTS (side-by-side, below tables)
    // ═══════════════════════════════════════
    if (includeGraph) {
      const chartH = bothCurves ? 62 : 68;
      const chartW = bothCurves ? (usable - 4) / 2 : usable * 0.65;
      const chartGap = 4;

      if (y + chartH + 6 > H - 18) { doc.addPage(); y = M; }

      doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.1); doc.line(M, y, W - M, y); y += 3;

      let cx = M;
      if (hasGlyc && state.glycValues.some(v => v > 0)) {
        try {
          if (!bothCurves) cx = M + (usable - chartW) / 2;
          const glycImg = await renderChartToImage(state.glycTimes, state.glycValues, state.glycRefs,
            { label: 'Glicemia', unit: glycUnit, color: '#2d5a3d', refColor: 'rgba(45,90,61,0.15)', borderRef: 'rgba(45,90,61,0.4)' }, 'pdfGlycCanvas');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(45, 90, 61);
          doc.text('CURVA GLICEMICA', cx + chartW / 2, y, { align: 'center' });
          doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.15);
          doc.rect(cx, y + 1.5, chartW, chartH, 'S');
          doc.addImage(glycImg, 'PNG', cx + 0.3, y + 1.8, chartW - 0.6, chartH - 0.6);
          cx += chartW + chartGap;
        } catch(e) { console.warn('Glyc chart error:', e); }
      }
      if (hasIns && state.insValues.some(v => v > 0)) {
        try {
          if (!hasGlyc) cx = M + (usable - chartW) / 2;
          const insImg = await renderChartToImage(state.insTimes, state.insValues, state.insRefs,
            { label: 'Insulinemia', unit: insUnit, color: '#c4563a', refColor: 'rgba(196,86,58,0.12)', borderRef: 'rgba(196,86,58,0.35)' }, 'pdfInsCanvas');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(196, 86, 58);
          doc.text('CURVA INSULINEMICA', cx + chartW / 2, y, { align: 'center' });
          doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.15);
          doc.rect(cx, y + 1.5, chartW, chartH, 'S');
          doc.addImage(insImg, 'PNG', cx + 0.3, y + 1.8, chartW - 0.6, chartH - 0.6);
        } catch(e) { console.warn('Ins chart error:', e); }
      }
      y += chartH + 5;
    }

    // ═══════════════════════════════════════
    //  EXTENDED DIAGNOSTIC INTERPRETATION
    // ═══════════════════════════════════════
    if (includeInterp) {
      doc.setDrawColor(45, 90, 61); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 3.5;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(45, 90, 61);
      doc.text('INTERPRETAZIONE DIAGNOSTICA', M, y); y += 4.5;

      const t0i = state.glycTimes.indexOf(0);
      const t60i = state.glycTimes.indexOf(60);
      const t120i = state.glycTimes.indexOf(120);
      const v0 = t0i >= 0 ? state.glycValues[t0i] : null;
      const v60 = t60i >= 0 ? state.glycValues[t60i] : null;
      const v120 = t120i >= 0 ? state.glycValues[t120i] : null;

      // Helper: draw a colored interpretation box
      function drawInterpBox(text, level) {
        // level: 'normal'=green, 'warning'=amber, 'danger'=red
        const colors = {
          normal:  { bg: [235, 248, 240], border: [39, 174, 96], text: [20, 80, 40] },
          warning: { bg: [255, 248, 230], border: [212, 160, 23], text: [120, 90, 0] },
          danger:  { bg: [255, 235, 235], border: [192, 57, 43], text: [140, 30, 20] },
        };
        const c = colors[level] || colors.normal;

        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, usable - 10);
        const lineH = 2.8;
        const boxH = lines.length * lineH + 3.5;

        if (y + boxH > H - 18) { doc.addPage(); y = M; }

        // Box background
        doc.setFillColor(...c.bg); doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
        doc.roundedRect(M, y, usable, boxH, 1.2, 1.2, 'FD');

        // Left accent bar
        doc.setFillColor(...c.border); doc.rect(M, y, 1.5, boxH, 'F');

        // Text
        doc.setTextColor(...c.text);
        lines.forEach((l, i) => {
          doc.text(l, M + 4, y + 2.5 + i * lineH);
        });
        y += boxH + 2;
      }

      // ── Glycemic interpretation ──
      if (hasGlyc) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(45, 90, 61);
        doc.text('Curva Glicemica:', M, y); y += 3.5;

        if (state.isPregnant) {
          // GDM — IADPSG / ADA 2026
          const alerts = [];
          if (v0 !== null && v0 >= DIAG.gdm_fasting) alerts.push('glicemia basale ' + v0 + ' mg/dL (soglia: >=' + DIAG.gdm_fasting + ')');
          if (v60 !== null && v60 >= DIAG.gdm_60) alerts.push("glicemia 60' " + v60 + ' mg/dL (soglia: >=' + DIAG.gdm_60 + ')');
          if (v120 !== null && v120 >= DIAG.gdm_120) alerts.push("glicemia 120' " + v120 + ' mg/dL (soglia: >=' + DIAG.gdm_120 + ')');

          if (alerts.length > 0) {
            drawInterpBox('DIABETE GESTAZIONALE (criteri IADPSG/ADA 2026) - Almeno un valore supera i limiti diagnostici per GDM su OGTT 75g: ' + alerts.join('; ') + '. E sufficiente un singolo valore alterato per la diagnosi. Si raccomanda invio a valutazione diabetologica/endocrinologica per inquadramento terapeutico (intervento nutrizionale, eventuale terapia insulinica) e monitoraggio ostetrico.', 'danger');
          } else {
            drawInterpBox('Screening per Diabete Gestazionale NEGATIVO (criteri IADPSG/ADA 2026) - Tutti i valori glicemici rientrano nei limiti diagnostici previsti per OGTT 75g in gravidanza: basale <' + DIAG.gdm_fasting + " mg/dL, 60' <" + DIAG.gdm_60 + " mg/dL, 120' <" + DIAG.gdm_120+ ' mg/dL.', 'normal');
          }
        } else {
          // Non-pregnancy: ADA 2026 + IDF 2024

          // Fasting
          if (v0 !== null) {
            if (v0 >= DIAG.fasting_diabetes) {
              drawInterpBox('GLICEMIA A DIGIUNO: ' + v0 + ' mg/dL (>=' + DIAG.fasting_diabetes + ' mg/dL) - Valore indicativo per Diabete Mellito secondo criteri ADA Standards of Care 2026. E necessaria conferma diagnostica con secondo test (HbA1c, OGTT ripetuto o glicemia random >=200 mg/dL con sintomi). Si consiglia invio a valutazione diabetologica.', 'danger');
            } else if (v0 >= DIAG.fasting_ifg) {
              drawInterpBox('GLICEMIA A DIGIUNO: ' + v0 + ' mg/dL (' + DIAG.fasting_ifg + '-125 mg/dL) - Alterata Glicemia a Digiuno (IFG, Impaired Fasting Glucose). Condizione di pre-diabete secondo ADA 2026. Rischio aumentato di progressione a diabete tipo 2. Si raccomandano: modifiche dello stile di vita (dieta, attivita fisica), monitoraggio glicemico periodico.', 'warning');
            }
          }

          // 60' — IDF 2024
          if (v60 !== null) {
            if (v60 >= DIAG.t60_diabetes) {
              drawInterpBox("GLICEMIA A 60': " + v60 + ' mg/dL (>=' + DIAG.t60_diabetes + " mg/dL) - Valore indicativo per Diabete Tipo 2 secondo il nuovo criterio IDF 2024 basato sulla glicemia a 1 ora (1-h PG). Questo criterio, validato dall'IDF Position Statement 2024 (presentato al 17mo ATTD Congress, Firenze), consente una diagnosi piu precoce rispetto alla glicemia a 2 ore.", 'danger');
            } else if (v60 >= DIAG.t60_ih) {
              drawInterpBox("GLICEMIA A 60': " + v60 + ' mg/dL (>=' + DIAG.t60_ih + " mg/dL) - Iperglicemia Intermedia (IH) secondo criteri IDF 2024 (1-h PG). Rischio significativamente aumentato di progressione a diabete tipo 2, complicanze micro/macrovascolari e sindrome metabolica. Raccomandate modifiche dello stile di vita e inserimento in programma di prevenzione del diabete.", 'warning');
            }
          }

          // 120' — ADA 2026
          if (v120 !== null) {
            if (v120 >= DIAG.t120_diabetes) {
              drawInterpBox("GLICEMIA A 120': " + v120 + ' mg/dL (>=' + DIAG.t120_diabetes + " mg/dL) - Valore indicativo per Diabete Mellito (ADA 2026). E necessaria conferma diagnostica. Si raccomanda valutazione diabetologica per inquadramento completo (HbA1c, profilo lipidico, funzionalita renale, screening complicanze).", 'danger');
            } else if (v120 >= DIAG.t120_igt) {
              drawInterpBox("GLICEMIA A 120': " + v120 + ' mg/dL (' + DIAG.t120_igt + "-199 mg/dL) - Ridotta Tolleranza al Glucosio (IGT, Impaired Glucose Tolerance). Condizione di pre-diabete secondo ADA 2026. Rischio annuo di progressione a diabete: 5-10%. Interventi sullo stile di vita (dieta mediterranea, 150 min/sett attivita aerobica) riducono il rischio del 58%.", 'warning');
            } else {
              drawInterpBox("GLICEMIA A 120': " + v120 + ' mg/dL (<' + DIAG.t120_igt + " mg/dL) - Tolleranza glucidica nella norma secondo criteri ADA Standards of Care 2026.", 'normal');
            }
          }

          // If no specific time points were available
          if (v0 === null && v60 === null && v120 === null) {
            drawInterpBox('Tutti i valori glicemici rientrano nei range di riferimento previsti per i tempi analizzati.', 'normal');
          }
        }
      }

      // ── Insulin interpretation ──
      if (hasIns && state.insValues.some(v => v > 0)) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(196, 86, 58);
        doc.text('Curva Insulinemica:', M, y); y += 3.5;

        const t0ins = state.insValues[0] || 0;
        const peakVal = Math.max(...state.insValues);
        const peakIdx = state.insValues.indexOf(peakVal);
        const peakTime = state.insTimes[peakIdx];
        const t120idx = state.insTimes.indexOf(120);
        const v120ins = t120idx >= 0 ? state.insValues[t120idx] : null;

        // Fasting hyperinsulinemia
        if (t0ins > 25) {
          drawInterpBox('IPERINSULINEMIA BASALE: insulinemia a digiuno ' + t0ins + ' uUI/mL (>25 uUI/mL). Indicativa per insulino-resistenza. Si suggerisce calcolo indice HOMA-IR e valutazione sindrome metabolica.', 'warning');
        }

        // Peak analysis
        if (peakTime <= 60) {
          if (v120ins !== null && v120ins > t0ins * 3) {
            drawInterpBox("PICCO INSULINEMICO a " + peakTime + "' (" + peakVal + " uUI/mL) - Picco nei tempi fisiologici, tuttavia l'insulinemia a 120' (" + v120ins + " uUI/mL) resta elevata rispetto al basale. Pattern suggestivo per iperinsulinismo compensatorio con lento ritorno ai valori basali.", 'warning');
          } else {
            drawInterpBox("PICCO INSULINEMICO a " + peakTime + "' (" + peakVal + " uUI/mL) - Pattern insulinemico nella norma con picco entro 60' e adeguato ritorno verso valori basali. Risposta beta-cellulare conservata.", 'normal');
          }
        } else if (peakTime <= 120) {
          drawInterpBox("PICCO INSULINEMICO RITARDATO a " + peakTime + "' (" + peakVal + " uUI/mL) - Il picco fisiologico atteso e entro 30-60'. Un picco ritardato suggerisce insulino-resistenza periferica e/o ridotta risposta beta-cellulare precoce. Si raccomanda valutazione metabolica completa.", 'warning');
        } else {
          drawInterpBox("PICCO INSULINEMICO MARCATAMENTE RITARDATO a " + peakTime + "' (" + peakVal + " uUI/mL) - Pattern patologico (Kraft pattern IV) indicativo per significativa insulino-resistenza e disfunzione beta-cellulare. Rischio elevato di progressione a diabete tipo 2.", 'danger');
        }

        // Excessive peak
        if (peakVal > 150) {
          drawInterpBox("IPERINSULINISMO REATTIVO: picco " + peakVal + " uUI/mL (>150). Risposta insulinica compensatoria eccessiva, indice di marcata resistenza insulinica periferica. Rischio di ipoglicemia reattiva tardiva.", 'warning');
        }
      }
    }

    // ═══════════════════════════════════════
    //  SOURCES / REFERENCES
    // ═══════════════════════════════════════
    if (includeInterp) {
      if (y + 12 > H - 14) { doc.addPage(); y = M; }
      y += 2;
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.1); doc.line(M, y, W - M, y); y += 2.5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(100, 100, 100);
      doc.text('FONTI E RIFERIMENTI BIBLIOGRAFICI', M, y); y += 2.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(5); doc.setTextColor(130, 130, 130);
      const sources = [
        '1. ADA Standards of Care in Diabetes 2026 - Section 2: Diagnosis and Classification. Diabetes Care 2026; 49(Suppl 1): S27. doi: 10.2337/dc26-S002',
        '2. IDF Position Statement on the 1-hour post-load plasma glucose (1-h PG) for diagnosis of intermediate hyperglycaemia and type 2 diabetes.',
        '   Diabetes Research and Clinical Practice, March 2024. Presented at 17th ATTD Congress, Florence, Italy.',
        '3. IADPSG Consensus Panel. Diabetes Care 2010; 33(3):676-682. Criteri confermati in ADA Standards of Care 2026.',
      ];
      sources.forEach(s => {
        doc.splitTextToSize(s, usable).forEach(l => { doc.text(l, M, y); y += 2.2; });
      });
    }

    // ═══════════════════════════════════════
    //  NOTES
    // ═══════════════════════════════════════
    const notes = document.getElementById('pdf-notes').value;
    if (notes) {
      if (y + 6 > H - 14) { doc.addPage(); y = M; }
      y += 1;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(90, 90, 90);
      doc.text('NOTE:', M, y); y += 2.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.splitTextToSize(notes, usable).forEach(l => { doc.text(l, M, y); y += 2.2; });
    }

    // ═══════════════════════════════════════
    //  FOOTER (all pages)
    // ═══════════════════════════════════════
    const tp = doc.internal.getNumberOfPages();
    for (let p = 1; p <= tp; p++) {
      doc.setPage(p); doc.setFontSize(5); doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'italic');
      doc.text('Generato il ' + new Date().toLocaleDateString('it-IT') + ' \u2014 I risultati devono essere interpretati dal medico nel contesto clinico del paziente.', W / 2, H - 5, { align: 'center' });
      doc.text('Pag. ' + p + '/' + tp, W - M, H - 5, { align: 'right' });
    }

    // ═══════════════════════════════════════
    //  SAVE & PREVIEW
    // ═══════════════════════════════════════
    const cognome = document.getElementById('pt-cognome').value || 'Paziente';
    const nome = document.getElementById('pt-nome').value || '';
    const dataEs = document.getElementById('pt-data-esame').value || '';
    const filename = 'Referto_Curva_' + cognome + '_' + nome + '_' + dataEs + '.pdf';
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); showPdfPreview(url, filename); }, 500);

    autoSaveReport(doc.output('datauristring'));

    btn.innerHTML = 'PDF generato!';
    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
  } catch(err) {
    console.error('PDF Error:', err);
    btn.innerHTML = originalText; btn.disabled = false;
    showPdfError(err.message);
  }
}

function showPdfPreview(url, filename) {
  let ex = document.getElementById('pdf-preview-panel'); if (ex) ex.remove();
  const p = document.createElement('div'); p.id = 'pdf-preview-panel';
  p.style.cssText = 'margin-top:16px;background:white;border:2px solid var(--primary);border-radius:12px;padding:16px;';
  p.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
    <h3 style="font-size:14px;font-weight:600;color:var(--primary)">${filename}</h3>
    <div><a href="${url}" download="${filename}" class="btn btn-primary btn-sm" style="text-decoration:none;margin-right:8px">Scarica</a><a href="${url}" target="_blank" class="btn btn-outline btn-sm" style="text-decoration:none">Apri</a></div>
  </div><iframe src="${url}" style="width:100%;height:500px;border:1px solid var(--border);border-radius:8px;"></iframe>`;
  document.getElementById('section-pdf').appendChild(p); p.scrollIntoView({ behavior: 'smooth' });
}

function showPdfError(msg) {
  let ex = document.getElementById('pdf-error-panel'); if (ex) ex.remove();
  const p = document.createElement('div'); p.id = 'pdf-error-panel';
  p.style.cssText = 'margin-top:16px;background:var(--danger-pale);border:1.5px solid var(--danger);border-radius:12px;padding:16px;';
  p.innerHTML = `<h3 style="font-size:14px;font-weight:600;color:var(--danger);margin-bottom:8px">Errore generazione PDF</h3>
    <p style="font-size:13px;color:var(--text-secondary)">${msg}</p>`;
  document.getElementById('section-pdf').appendChild(p);
}
