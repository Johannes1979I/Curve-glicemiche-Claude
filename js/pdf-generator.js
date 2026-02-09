/* pdf-generator.js — Single-Page PDF with Side-by-Side Square Charts */

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
  btn.innerHTML = '⏳ Generazione in corso...'; btn.disabled = true;

  try {
    const JsPDF = await loadJsPDF();
    const doc = new JsPDF('p', 'mm', 'a4');
    const W = 210, H = 297, M = 12;
    const usable = W - M * 2;
    let y = M;
    const glycUnit = document.getElementById('cfg-glyc-unit').value;
    const insUnit = document.getElementById('cfg-ins-unit').value;
    const hasGlyc = state.glycTimes.length > 0;
    const hasIns = state.insTimes.length > 0;
    const bothCurves = hasGlyc && hasIns;

    // ── Header image ──
    if (state.headerImage) {
      try {
        const img = new Image(); img.src = state.headerImage;
        await new Promise((ok, no) => { img.onload = ok; img.onerror = no; setTimeout(no, 3000); });
        const aspect = img.width / img.height;
        const imgW = usable, imgH = Math.min(imgW / aspect, 28);
        const fmt = state.headerImage.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(state.headerImage, fmt, M, y, imgW, imgH);
        y += imgH + 2;
      } catch(e) { console.warn('Header image error:', e); }
    }

    // ── Title ──
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(45, 90, 61);
    const title = document.getElementById('pdf-title').value || 'Referto Curva da Carico Orale di Glucosio';
    doc.text(title, W / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(45, 90, 61); doc.setLineWidth(0.4); doc.line(M, y, W - M, y);
    y += 3.5;

    // ── Patient data (2-col compact) ──
    doc.setFontSize(7.5); doc.setTextColor(30, 30, 30);
    const ptPairs = [
      ['Cognome', document.getElementById('pt-cognome').value || '—', 'Nome', document.getElementById('pt-nome').value || '—'],
      ['Data nascita', document.getElementById('pt-dob').value || '—', 'Sesso', document.getElementById('pt-sesso').value === 'M' ? 'M' : 'F'],
      ['Cod. Fiscale', (document.getElementById('pt-cf').value || '—').toUpperCase(), 'Data esame', document.getElementById('pt-data-esame').value || '—'],
      ['Medico', document.getElementById('pt-medico').value || '—', 'Accettaz.', document.getElementById('pt-accettazione').value || '—'],
    ];
    const c2 = M + usable / 2 + 2;
    ptPairs.forEach(r => {
      doc.setFont('helvetica', 'bold'); doc.text(r[0] + ':', M, y);
      doc.setFont('helvetica', 'normal'); doc.text(r[1], M + 22, y);
      doc.setFont('helvetica', 'bold'); doc.text(r[2] + ':', c2, y);
      doc.setFont('helvetica', 'normal'); doc.text(r[3], c2 + 22, y);
      y += 3.5;
    });
    y += 1;

    // ── Exam info ──
    const preset = state.preset ? PRESETS.find(p => p.id === state.preset) : null;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(45, 90, 61);
    doc.text('ESAME: ' + (preset ? preset.name : 'Personalizzato') + '   |   Carico: ' + document.getElementById('cfg-glucose-load').value + 'g glucosio', M, y);
    y += 3;
    if (state.isPregnant) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(180, 120, 0);
      doc.text('Valori di riferimento per donna in gravidanza (criteri IADPSG/WHO)', M, y); y += 3;
    }
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.15); doc.line(M, y, W - M, y); y += 3;

    // ── Results tables (side-by-side if both) ──
    const tblW = bothCurves ? (usable - 4) / 2 : usable;

    function drawTable(x, w, times, values, refs, unit, label, color) {
      const sy = y;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...color);
      doc.text(label, x, sy); let ty = sy + 3.5;
      // Header row
      doc.setFillColor(240, 238, 234); doc.rect(x, ty - 2.5, w, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(80, 80, 80);
      doc.text('Tempo', x + 1, ty); doc.text('Risultato', x + w * 0.30, ty);
      doc.text('Rif.', x + w * 0.55, ty); doc.text('Esito', x + w * 0.80, ty);
      ty += 3;
      // Data rows
      doc.setFontSize(6.5);
      times.forEach((t, i) => {
        const v = values[i]; const ref = refs[t] || { min: 0, max: 999 };
        let st = 'OK', sc = [39, 174, 96];
        if (v < ref.min) { st = '↓'; sc = [212, 160, 23]; }
        if (v > ref.max) { st = '↑'; sc = [192, 57, 43]; }
        if (i % 2 === 0) { doc.setFillColor(250, 249, 247); doc.rect(x, ty - 2.3, w, 3.5, 'F'); }
        doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
        doc.text(t === 0 ? 'Basale' : t + "'", x + 1, ty);
        doc.setFont('helvetica', 'bold'); doc.text(String(v || '—'), x + w * 0.30, ty);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
        doc.text(ref.min + '-' + ref.max + ' ' + unit, x + w * 0.55, ty);
        doc.setTextColor(...sc); doc.setFont('helvetica', 'bold'); doc.text(st, x + w * 0.80, ty);
        ty += 3.5;
      });
      return ty;
    }

    let endY = y;
    if (hasGlyc) endY = drawTable(M, tblW, state.glycTimes, state.glycValues, state.glycRefs, glycUnit, 'CURVA GLICEMICA', [45, 90, 61]);
    if (hasIns) {
      const ix = bothCurves ? M + tblW + 4 : M;
      const iw = bothCurves ? tblW : usable;
      const ey = drawTable(ix, iw, state.insTimes, state.insValues, state.insRefs, insUnit, 'CURVA INSULINEMICA', [196, 86, 58]);
      endY = Math.max(endY, ey);
    }
    y = endY + 1;

    // ── Methodology (compact) ──
    const meth = document.getElementById('methodology').value;
    if (meth) {
      doc.setFontSize(5.5); doc.setTextColor(120, 120, 120); doc.setFont('helvetica', 'italic');
      const mLines = doc.splitTextToSize('Metodica: ' + meth.replace(/\n/g, ' — '), usable);
      mLines.slice(0, 2).forEach(l => { doc.text(l, M, y); y += 2.3; });
      y += 1;
    }

    // ── Interpretation ──
    if (document.getElementById('pdf-include-interp').checked) {
      doc.setDrawColor(200, 200, 200); doc.line(M, y, W - M, y); y += 2.5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(45, 90, 61);
      doc.text('INTERPRETAZIONE DIAGNOSTICA', M, y); y += 3;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(30, 30, 30);

      if (hasGlyc) {
        const t120i = state.glycTimes.indexOf(120);
        if (t120i >= 0) {
          const v120 = state.glycValues[t120i]; let txt = '';
          if (state.isPregnant) {
            const v0 = state.glycTimes.indexOf(0) >= 0 ? state.glycValues[state.glycTimes.indexOf(0)] : 0;
            const v60 = state.glycTimes.indexOf(60) >= 0 ? state.glycValues[state.glycTimes.indexOf(60)] : 0;
            txt = (v0 >= 92 || v60 >= 180 || v120 >= 153)
              ? 'Almeno un valore supera i limiti IADPSG → Diabete gestazionale. Valutazione specialistica raccomandata.'
              : 'Screening negativo per diabete gestazionale (criteri IADPSG).';
          } else {
            if (v120 < 140) txt = 'Tolleranza glucidica nella norma (120 min < 140 mg/dL).';
            else if (v120 < 200) txt = 'Ridotta tolleranza al glucosio - IGT (120 min: 140-199 mg/dL). Pre-diabete.';
            else txt = 'Indicativo per Diabete Mellito (120 min ≥ 200 mg/dL). Conferma raccomandata.';
          }
          doc.splitTextToSize('Glicemia: ' + txt, usable).forEach(l => { doc.text(l, M, y); y += 2.5; });
        }
      }
      if (hasIns && state.insValues.some(v => v > 0)) {
        const pk = Math.max(...state.insValues); const pt = state.insTimes[state.insValues.indexOf(pk)];
        let txt = 'Picco a ' + pt + "' (" + pk + ' ' + insUnit + ').';
        if (pt > 60) txt += ' Picco ritardato — possibile insulino-resistenza.';
        doc.splitTextToSize('Insulinemia: ' + txt, usable).forEach(l => { doc.text(l, M, y); y += 2.5; });
      }
      y += 1;
    }

    // ── Charts: side-by-side square boxes ──
    if (document.getElementById('pdf-include-graph').checked) {
      const chartSize = bothCurves ? 82 : 88;
      const chartGap = 4;
      if (y + chartSize + 8 > H - 12) { doc.addPage(); y = M; }
      doc.setDrawColor(200, 200, 200); doc.line(M, y, W - M, y); y += 3;
      let cx = M;

      if (hasGlyc && state.glycValues.some(v => v > 0)) {
        try {
          if (!bothCurves) cx = M + (usable - chartSize) / 2;
          const glycImg = await renderChartToImage(state.glycTimes, state.glycValues, state.glycRefs,
            { label: 'Glicemia', unit: glycUnit, color: '#2d5a3d', refColor: 'rgba(45,90,61,0.15)', borderRef: 'rgba(45,90,61,0.4)' }, 'pdfGlycCanvas');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(45, 90, 61);
          doc.text('CURVA GLICEMICA', cx, y);
          // Square frame
          doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2);
          doc.rect(cx, y + 1.5, chartSize, chartSize, 'S');
          doc.addImage(glycImg, 'PNG', cx + 0.5, y + 2, chartSize - 1, chartSize - 1);
          cx += chartSize + chartGap;
        } catch(e) { console.warn('Glyc chart error:', e); }
      }

      if (hasIns && state.insValues.some(v => v > 0)) {
        try {
          if (!hasGlyc) cx = M + (usable - chartSize) / 2;
          const insImg = await renderChartToImage(state.insTimes, state.insValues, state.insRefs,
            { label: 'Insulinemia', unit: insUnit, color: '#c4563a', refColor: 'rgba(196,86,58,0.12)', borderRef: 'rgba(196,86,58,0.35)' }, 'pdfInsCanvas');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(196, 86, 58);
          doc.text('CURVA INSULINEMICA', cx, y);
          doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2);
          doc.rect(cx, y + 1.5, chartSize, chartSize, 'S');
          doc.addImage(insImg, 'PNG', cx + 0.5, y + 2, chartSize - 1, chartSize - 1);
        } catch(e) { console.warn('Ins chart error:', e); }
      }
      y += chartSize + 5;
    }

    // ── Notes ──
    const notes = document.getElementById('pdf-notes').value;
    if (notes) {
      if (y + 8 > H - 12) { doc.addPage(); y = M; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(90, 90, 90);
      doc.text('NOTE:', M, y); y += 2.5;
      doc.setFont('helvetica', 'normal');
      doc.splitTextToSize(notes, usable).forEach(l => { doc.text(l, M, y); y += 2.5; });
    }

    // ── Footer ──
    const tp = doc.internal.getNumberOfPages();
    for (let p = 1; p <= tp; p++) {
      doc.setPage(p); doc.setFontSize(5.5); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'italic');
      doc.text('Generato il ' + new Date().toLocaleDateString('it-IT') + ' — I risultati devono essere interpretati dal medico nel contesto clinico del paziente.', W / 2, H - 6, { align: 'center' });
      doc.text('Pag. ' + p + '/' + tp, W - M, H - 6, { align: 'right' });
    }

    // ── Save ──
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

    // Auto-save report to DB
    autoSaveReport(doc.output('datauristring'));

    btn.innerHTML = '✅ PDF generato!';
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
    <h3 style="font-size:14px;font-weight:600;color:var(--primary)">📄 ${filename}</h3>
    <div><a href="${url}" download="${filename}" class="btn btn-primary btn-sm" style="text-decoration:none;margin-right:8px">⬇ Scarica</a><a href="${url}" target="_blank" class="btn btn-outline btn-sm" style="text-decoration:none">↗ Apri</a></div>
  </div><iframe src="${url}" style="width:100%;height:500px;border:1px solid var(--border);border-radius:8px;"></iframe>`;
  document.getElementById('section-pdf').appendChild(p); p.scrollIntoView({ behavior: 'smooth' });
}

function showPdfError(msg) {
  let ex = document.getElementById('pdf-error-panel'); if (ex) ex.remove();
  const p = document.createElement('div'); p.id = 'pdf-error-panel';
  p.style.cssText = 'margin-top:16px;background:var(--danger-pale);border:1.5px solid var(--danger);border-radius:12px;padding:16px;';
  p.innerHTML = `<h3 style="font-size:14px;font-weight:600;color:var(--danger);margin-bottom:8px">⚠️ Errore generazione PDF</h3>
    <p style="font-size:13px;color:var(--text-secondary)">${msg}</p>
    <p style="font-size:12px;color:var(--text-muted);margin-top:6px">Suggerimento: scarica il file HTML e aprilo direttamente nel browser (Chrome/Firefox/Edge).</p>`;
  document.getElementById('section-pdf').appendChild(p);
}
