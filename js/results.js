/* results.js — Results Summary & Diagnostic Interpretation
   Criteria: ADA Standards of Care 2026 + IDF Position Statement 2024 */

function renderResultsSummary() {
  const content = document.getElementById('results-summary-content');
  let html = '';
  let overallStatus = 'normal';
  const glycUnit = document.getElementById('cfg-glyc-unit').value;
  const insUnit = document.getElementById('cfg-ins-unit').value;

  /* ═══ GLYCEMIC CURVE ═══ */
  if (state.glycTimes.length > 0) {
    html += '<h3 style="font-size:15px;font-weight:600;color:var(--primary);margin-bottom:12px">Curva Glicemica</h3>';
    html += '<table class="data-table"><thead><tr><th>Tempo</th><th>Risultato</th><th>Val. Rif.</th><th>Esito</th></tr></thead><tbody>';
    state.glycTimes.forEach((t, i) => {
      const v = state.glycValues[i]; const ref = state.glycRefs[t];
      let status = 'Normale', cls = 'status-normal';
      if (v < ref.min) { status = '↓ Inferiore'; cls = 'status-warning'; overallStatus = 'warning'; }
      if (v > ref.max) { status = '↑ Superiore'; cls = 'status-danger'; overallStatus = 'danger'; }
      html += `<tr><td style="font-weight:600">${t === 0 ? 'Basale' : t + '\''}</td><td style="font-variant-numeric:tabular-nums">${v} ${glycUnit}</td><td class="ref-range">${ref.min} - ${ref.max} ${glycUnit}</td><td class="${cls}">${status}</td></tr>`;
    });
    html += '</tbody></table>';

    /* ── Diagnostic Interpretation ── */
    html += '<div class="interpretation-block">';

    const t0idx = state.glycTimes.indexOf(0);
    const t60idx = state.glycTimes.indexOf(60);
    const t120idx = state.glycTimes.indexOf(120);
    const v0 = t0idx >= 0 ? state.glycValues[t0idx] : null;
    const v60 = t60idx >= 0 ? state.glycValues[t60idx] : null;
    const v120 = t120idx >= 0 ? state.glycValues[t120idx] : null;

    if (state.isPregnant) {
      /* ── GDM — IADPSG / ADA 2026 ── */
      let gdm = false;
      const alerts = [];
      if (v0 !== null && v0 >= DIAG.gdm_fasting) { gdm = true; alerts.push('basale ≥' + DIAG.gdm_fasting + ' mg/dL'); }
      if (v60 !== null && v60 >= DIAG.gdm_60)     { gdm = true; alerts.push('60\' ≥' + DIAG.gdm_60 + ' mg/dL'); }
      if (v120 !== null && v120 >= DIAG.gdm_120)   { gdm = true; alerts.push('120\' ≥' + DIAG.gdm_120 + ' mg/dL'); }

      if (gdm) {
        html += `<div class="results-summary danger" style="margin-top:12px"><strong>CRITERI IADPSG / ADA 2026 — Diabete Gestazionale</strong><br>Almeno un valore supera i limiti diagnostici (${alerts.join('; ')}). Diagnosi di GDM: e sufficiente un singolo valore alterato su OGTT 75g. Si consiglia invio a valutazione diabetologica/endocrinologica.</div>`;
        overallStatus = 'danger';
      } else {
        html += '<div class="results-summary normal" style="margin-top:12px"><strong>CRITERI IADPSG / ADA 2026 — Screening GDM Negativo</strong><br>Tutti i valori rientrano nei limiti per lo screening del diabete gestazionale (OGTT 75g).</div>';
      }
    } else {
      /* ── Non-pregnancy: ADA 2026 + IDF 2024 ── */
      const findings = [];

      // Fasting glucose (ADA 2026)
      if (v0 !== null) {
        if (v0 >= DIAG.fasting_diabetes) {
          findings.push({ level: 'danger', text: 'Glicemia a digiuno ≥' + DIAG.fasting_diabetes + ' mg/dL (' + v0 + ' mg/dL) — indicativa per Diabete Mellito (ADA 2026). Necessaria conferma diagnostica.' });
        } else if (v0 >= DIAG.fasting_ifg) {
          findings.push({ level: 'warning', text: 'Glicemia a digiuno ' + v0 + ' mg/dL — Alterata glicemia a digiuno (IFG, 100-125 mg/dL). Condizione di pre-diabete (ADA 2026).' });
        } else if (v0 < (state.glycRefs[0] || {}).min) {
          findings.push({ level: 'warning', text: 'Ipoglicemia a digiuno: ' + v0 + ' mg/dL (<' + ((state.glycRefs[0] || {}).min || 60) + ' mg/dL). Possibili cause: digiuno prolungato, iperinsulinismo endogeno, insufficienza surrenalica, epatopatia. Si raccomanda approfondimento clinico.' });
        }
      }

      // 1-hour glucose — IDF 2024 Position Statement
      if (v60 !== null) {
        if (v60 >= DIAG.t60_diabetes) {
          findings.push({ level: 'danger', text: 'Glicemia a 60\' ≥' + DIAG.t60_diabetes + ' mg/dL (' + v60 + ' mg/dL) — indicativa per Diabete Tipo 2 secondo i nuovi criteri IDF 2024 (1-h PG, Position Statement ATTD Firenze 2024).' });
        } else if (v60 >= DIAG.t60_ih) {
          findings.push({ level: 'warning', text: 'Glicemia a 60\' ≥' + DIAG.t60_ih + ' mg/dL (' + v60 + ' mg/dL) — Iperglicemia Intermedia (IH) secondo criteri IDF 2024 (1-h PG). Rischio aumentato di progressione a diabete tipo 2; raccomandate modifiche dello stile di vita.' });
        }
      }

      // 2-hour glucose — ADA 2026
      if (v120 !== null) {
        if (v120 >= DIAG.t120_diabetes) {
          findings.push({ level: 'danger', text: 'Glicemia a 120\' ≥' + DIAG.t120_diabetes + ' mg/dL (' + v120 + ' mg/dL) — indicativa per Diabete Mellito (ADA 2026). Si consiglia conferma diagnostica.' });
        } else if (v120 >= DIAG.t120_igt) {
          findings.push({ level: 'warning', text: 'Glicemia a 120\' ' + v120 + ' mg/dL — Ridotta tolleranza al glucosio (IGT, 140-199 mg/dL). Condizione di pre-diabete (ADA 2026).' });
        }
        if (v120 < 55) {
          findings.push({ level: 'warning', text: 'Ipoglicemia reattiva a 120\': ' + v120 + ' mg/dL (<55 mg/dL). Valore suggestivo per ipoglicemia post-prandiale. Valutare correlazione con sintomatologia.' });
        }
      }

      // Summary
      if (findings.length === 0) {
        html += '<div class="results-summary normal" style="margin-top:12px"><strong>Tolleranza glucidica normale</strong> — Tutti i valori rientrano nei limiti di normalita secondo i criteri ADA 2026 e IDF 2024.</div>';
      } else {
        const maxLevel = findings.some(f => f.level === 'danger') ? 'danger' : 'warning';
        overallStatus = maxLevel;
        findings.forEach(f => {
          html += `<div class="results-summary ${f.level}" style="margin-top:8px">${f.level === 'danger' ? '<strong>ATTENZIONE</strong> — ' : '<strong>NOTA</strong> — '}${f.text}</div>`;
        });
      }
    }
    html += '</div>'; // .interpretation-block

    // Reference sources footnote
    html += '<div style="margin-top:10px;padding:8px 12px;background:#f8f9fa;border-radius:6px;font-size:11px;color:#666;line-height:1.5">';
    html += '<strong>Fonti:</strong> ';
    if (state.isPregnant) {
      html += 'Criteri IADPSG confermati in ADA Standards of Care 2026, Diabetes Care 49(Suppl 1), Jan 2026.';
    } else {
      html += 'ADA Standards of Care 2026, Diabetes Care 49(Suppl 1), Jan 2026';
      if (v60 !== null) html += ' | IDF Position Statement 2024 (1-h PG), Diabetes Research and Clinical Practice, Mar 2024 (ATTD Florence)';
      html += '.';
    }
    html += '</div>';
  }

  /* ═══ INSULIN CURVE ═══ */
  if (state.insTimes.length > 0) {
    html += '<h3 style="font-size:15px;font-weight:600;color:var(--accent);margin:24px 0 12px">Curva Insulinemica</h3>';
    html += '<table class="data-table"><thead><tr><th>Tempo</th><th>Risultato</th><th>Val. Rif.</th><th>Esito</th></tr></thead><tbody>';
    state.insTimes.forEach((t, i) => {
      const v = state.insValues[i]; const ref = state.insRefs[t];
      let status = 'Normale', cls = 'status-normal';
      if (v < ref.min) { status = '↓ Inferiore'; cls = 'status-warning'; }
      if (v > ref.max) { status = '↑ Superiore'; cls = 'status-danger'; overallStatus = overallStatus === 'normal' ? 'warning' : overallStatus; }
      html += `<tr><td style="font-weight:600">${t === 0 ? 'Basale' : t + '\''}</td><td style="font-variant-numeric:tabular-nums">${v} ${insUnit}</td><td class="ref-range">${ref.min} - ${ref.max} ${insUnit}</td><td class="${cls}">${status}</td></tr>`;
    });
    html += '</tbody></table>';

    // Insulin pattern analysis (Kraft patterns / SIE consensus)
    const t0ins = state.insValues[0] || 0;
    const peakVal = Math.max(...state.insValues);
    const peakIdx = state.insValues.indexOf(peakVal);
    const peakTime = state.insTimes[peakIdx];
    const t120idx_ins = state.insTimes.indexOf(120);
    const v120ins = t120idx_ins >= 0 ? state.insValues[t120idx_ins] : null;

    html += '<div class="interpretation-block">';
    const insFindings = [];

    // Fasting hyperinsulinemia
    if (t0ins > 25) {
      insFindings.push({ level: 'warning', text: 'Iperinsulinemia basale (' + t0ins + ' µUI/mL > 25 µUI/mL) — suggestiva per insulino-resistenza.' });
    }

    // Fasting hypoinsulinemia
    if (t0ins > 0 && t0ins < (state.insRefs[0] || {}).min) {
      insFindings.push({ level: 'warning', text: 'Ipoinsulinemia basale: ' + t0ins + ' µUI/mL (<' + ((state.insRefs[0] || {}).min || 2) + ' µUI/mL). Possibile ridotta riserva beta-cellulare o deficit insulinico iniziale (LADA). Raccomandato dosaggio anticorpi anti-GAD, anti-IA2 e C-peptide.' });
    }

    // Insufficient insulin response
    if (peakVal < 20 && state.insTimes.length >= 2) {
      insFindings.push({ level: 'danger', text: 'Risposta insulinica insufficiente: picco massimo ' + peakVal + ' µUI/mL (<20). Risposta beta-cellulare marcatamente ridotta. Sospetto deficit secretorio (LADA, MODY). Raccomandato dosaggio C-peptide e anticorpi anti-GAD.' });
    }

    // Peak timing (Kraft pattern analysis)
    if (peakTime <= 60) {
      // Normal peak timing
      if (v120ins !== null && v120ins <= t0ins * 2.5) {
        insFindings.push({ level: 'normal', text: 'Pattern insulinemico normale — Picco a ' + peakTime + '\' con adeguato ritorno verso valori basali a 120\'.' });
      } else if (v120ins !== null && v120ins > t0ins * 3) {
        insFindings.push({ level: 'warning', text: 'Ritorno lento ai valori basali — Insulinemia a 120\' (' + v120ins + ' µUI/mL) ancora elevata rispetto al basale (' + t0ins + ' µUI/mL). Possibile iperinsulinismo compensatorio.' });
      } else {
        insFindings.push({ level: 'normal', text: 'Pattern insulinemico nella norma — Picco a ' + peakTime + '\'.' });
      }
    } else if (peakTime > 60 && peakTime <= 120) {
      insFindings.push({ level: 'warning', text: 'Picco insulinemico ritardato a ' + peakTime + '\' — Il picco fisiologico atteso e entro 30-60\'. Possibile indicazione di insulino-resistenza o ridotta funzione beta-cellulare precoce.' });
    } else if (peakTime > 120) {
      insFindings.push({ level: 'danger', text: 'Picco insulinemico marcatamente ritardato a ' + peakTime + '\' — Pattern patologico suggestivo per significativa insulino-resistenza e/o disfunzione beta-cellulare (Kraft pattern IV).' });
    }

    // Excessive peak
    if (peakVal > 150) {
      insFindings.push({ level: 'warning', text: 'Picco insulinemico elevato (' + peakVal + ' µUI/mL) — Iperinsulinismo compensatorio, indice di aumentata resistenza insulinica periferica.' });
    }

    if (insFindings.length === 0) {
      html += '<div class="results-summary normal" style="margin-top:12px"><strong>Pattern insulinemico nella norma</strong></div>';
    } else {
      insFindings.forEach(f => {
        const cls = f.level === 'normal' ? 'normal' : f.level;
        const prefix = f.level === 'danger' ? 'ATTENZIONE' : f.level === 'warning' ? 'NOTA' : 'OK';
        html += `<div class="results-summary ${cls}" style="margin-top:8px"><strong>${prefix}</strong> — ${f.text}</div>`;
      });
    }
    html += '</div>'; // .interpretation-block
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
