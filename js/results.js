/* results.js — Results Summary & Interpretation */

function renderResultsSummary() {
  const content = document.getElementById('results-summary-content');
  let html = '';
  let overallStatus = 'normal';
  const glycUnit = document.getElementById('cfg-glyc-unit').value;
  const insUnit = document.getElementById('cfg-ins-unit').value;

  if (state.glycTimes.length > 0) {
    html += '<h3 style="font-size:15px;font-weight:600;color:var(--primary);margin-bottom:12px">Curva Glicemica</h3>';
    html += '<table class="data-table"><thead><tr><th>Tempo</th><th>Risultato</th><th>Val. Rif.</th><th>Esito</th></tr></thead><tbody>';
    state.glycTimes.forEach((t, i) => {
      const v = state.glycValues[i]; const ref = state.glycRefs[t];
      let status = 'Normale', cls = 'status-normal';
      if (v < ref.min) { status = '↓ Inferiore'; cls = 'status-warning'; overallStatus = 'warning'; }
      if (v > ref.max) { status = '↑ Superiore'; cls = 'status-danger'; overallStatus = 'danger'; }
      html += `<tr><td style="font-weight:600">${t === 0 ? 'Basale' : t + '\''}</td><td style="font-variant-numeric:tabular-nums">${v} ${glycUnit}</td><td class="ref-range">${ref.min} – ${ref.max} ${glycUnit}</td><td class="${cls}">${status}</td></tr>`;
    });
    html += '</tbody></table>';

    const t120idx = state.glycTimes.indexOf(120);
    const t0idx = state.glycTimes.indexOf(0);
    if (t120idx >= 0) {
      const v120 = state.glycValues[t120idx];
      let diag = '';
      if (state.isPregnant) {
        const v0 = t0idx >= 0 ? state.glycValues[t0idx] : 0;
        const t60idx = state.glycTimes.indexOf(60);
        const v60 = t60idx >= 0 ? state.glycValues[t60idx] : 0;
        let gdm = false;
        if (v0 >= 92) gdm = true; if (v60 >= 180) gdm = true; if (v120 >= 153) gdm = true;
        diag = gdm
          ? '<div class="results-summary danger" style="margin-top:12px"><strong>⚠️ Criteri IADPSG:</strong> Almeno un valore supera i limiti per diabete gestazionale. Si consiglia valutazione specialistica.</div>'
          : '<div class="results-summary normal" style="margin-top:12px"><strong>✅ Criteri IADPSG:</strong> Tutti i valori rientrano nei limiti per lo screening del diabete gestazionale.</div>';
      } else {
        if (v120 < 140) diag = '<div class="results-summary normal" style="margin-top:12px"><strong>✅ Tolleranza glucidica normale</strong> — Glicemia a 120\' inferiore a 140 mg/dL.</div>';
        else if (v120 < 200) { diag = '<div class="results-summary warning" style="margin-top:12px"><strong>⚠️ Ridotta tolleranza al glucosio (IGT)</strong> — Glicemia a 120\' compresa tra 140 e 199 mg/dL. Condizione di pre-diabete.</div>'; overallStatus = 'warning'; }
        else { diag = '<div class="results-summary danger" style="margin-top:12px"><strong>🔴 Indicativo per Diabete Mellito</strong> — Glicemia a 120\' ≥ 200 mg/dL. Si consiglia conferma diagnostica.</div>'; overallStatus = 'danger'; }
      }
      html += '<div class="interpretation-block">' + diag + '</div>';
    }
  }

  if (state.insTimes.length > 0) {
    html += '<h3 style="font-size:15px;font-weight:600;color:var(--accent);margin:24px 0 12px">Curva Insulinemica</h3>';
    html += '<table class="data-table"><thead><tr><th>Tempo</th><th>Risultato</th><th>Val. Rif.</th><th>Esito</th></tr></thead><tbody>';
    state.insTimes.forEach((t, i) => {
      const v = state.insValues[i]; const ref = state.insRefs[t];
      let status = 'Normale', cls = 'status-normal';
      if (v < ref.min) { status = '↓ Inferiore'; cls = 'status-warning'; }
      if (v > ref.max) { status = '↑ Superiore'; cls = 'status-danger'; overallStatus = overallStatus === 'normal' ? 'warning' : overallStatus; }
      html += `<tr><td style="font-weight:600">${t === 0 ? 'Basale' : t + '\''}</td><td style="font-variant-numeric:tabular-nums">${v} ${insUnit}</td><td class="ref-range">${ref.min} – ${ref.max} ${insUnit}</td><td class="${cls}">${status}</td></tr>`;
    });
    html += '</tbody></table>';

    const t0ins = state.insValues[0] || 0;
    const peakVal = Math.max(...state.insValues);
    const peakIdx = state.insValues.indexOf(peakVal);
    const peakTime = state.insTimes[peakIdx];
    const t120idx_ins = state.insTimes.indexOf(120);
    const v120ins = t120idx_ins >= 0 ? state.insValues[t120idx_ins] : null;

    let insInterp = '';
    if (peakTime <= 60 && (v120ins === null || v120ins <= t0ins * 3))
      insInterp = '<div class="results-summary normal" style="margin-top:12px"><strong>✅ Pattern insulinemico normale</strong> — Picco entro 60\', ritorno verso valori basali a 120\'.</div>';
    else if (peakTime > 60)
      insInterp = '<div class="results-summary warning" style="margin-top:12px"><strong>⚠️ Picco insulinemico ritardato</strong> — Il picco si osserva a ' + peakTime + '\'. Possibile indicazione di insulino-resistenza.</div>';
    else if (v120ins && v120ins > t0ins * 3)
      insInterp = '<div class="results-summary warning" style="margin-top:12px"><strong>⚠️ Ritorno lento ai valori basali</strong> — Insulinemia a 120\' ancora elevata rispetto ai valori basali.</div>';
    html += '<div class="interpretation-block">' + insInterp + '</div>';
  }

  content.innerHTML = html;
  toggleInterpretationView();
}

function toggleInterpretationView() {
  const show = document.getElementById('show-interp-results').checked;
  document.querySelectorAll('.interpretation-block').forEach(el => { el.style.display = show ? 'block' : 'none'; });
  document.getElementById('pdf-include-interp').checked = show;
}

function syncInterpToggle(source) {
  if (source === 'pdf') {
    const show = document.getElementById('pdf-include-interp').checked;
    const rt = document.getElementById('show-interp-results');
    if (rt) rt.checked = show;
    document.querySelectorAll('.interpretation-block').forEach(el => { el.style.display = show ? 'block' : 'none'; });
  }
}
