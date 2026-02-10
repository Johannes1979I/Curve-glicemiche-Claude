/* database.js — Patient & Report Archive (localStorage) */

const DB_KEY = 'curveReport_archive';

function getArchive() {
  try { const raw = localStorage.getItem(DB_KEY); return raw ? JSON.parse(raw) : []; }
  catch(e) { return []; }
}

function saveArchive(archive) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(archive)); }
  catch(e) { console.warn('Archive save error:', e); }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function saveReportToArchive() {
  const archive = getArchive();
  const preset = state.preset ? PRESETS.find(p => p.id === state.preset) : null;
  const record = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    patient: {
      cognome: document.getElementById('pt-cognome').value || '',
      nome: document.getElementById('pt-nome').value || '',
      dob: document.getElementById('pt-dob').value || '',
      sesso: document.getElementById('pt-sesso').value || 'M',
      cf: document.getElementById('pt-cf').value || '',
      dataEsame: document.getElementById('pt-data-esame').value || '',
      medico: document.getElementById('pt-medico').value || '',
      accettazione: document.getElementById('pt-accettazione').value || '',
    },
    config: {
      preset: state.preset,
      presetName: preset ? preset.name : 'Personalizzato',
      isPregnant: state.isPregnant,
      isCombined: state.isCombined,
      glucoseLoad: document.getElementById('cfg-glucose-load').value,
      glycUnit: document.getElementById('cfg-glyc-unit').value,
      insUnit: document.getElementById('cfg-ins-unit').value,
      glycTimes: [...state.glycTimes],
      insTimes: [...state.insTimes],
    },
    results: {
      glycValues: [...state.glycValues],
      insValues: [...state.insValues],
      glycRefs: JSON.parse(JSON.stringify(state.glycRefs)),
      insRefs: JSON.parse(JSON.stringify(state.insRefs)),
    },
    methodology: document.getElementById('methodology').value || '',
    notes: document.getElementById('pdf-notes').value || '',
  };
  archive.unshift(record);
  saveArchive(archive);
  return record;
}

function autoSaveReport(pdfDataUri) {
  const record = saveReportToArchive();
  try { localStorage.setItem('curveReport_pdf_' + record.id, pdfDataUri); }
  catch(e) { console.warn('PDF cache too large'); }
}

function loadReport(id) {
  const archive = getArchive();
  const rec = archive.find(r => r.id === id);
  if (!rec) { alert('Referto non trovato.'); return; }

  document.getElementById('pt-cognome').value = rec.patient.cognome;
  document.getElementById('pt-nome').value = rec.patient.nome;
  document.getElementById('pt-dob').value = rec.patient.dob;
  document.getElementById('pt-sesso').value = rec.patient.sesso;
  document.getElementById('pt-cf').value = rec.patient.cf;
  document.getElementById('pt-data-esame').value = rec.patient.dataEsame;
  document.getElementById('pt-medico').value = rec.patient.medico;
  document.getElementById('pt-accettazione').value = rec.patient.accettazione;

  state.isPregnant = rec.config.isPregnant;
  state.isCombined = rec.config.isCombined;
  state.glycTimes = [...rec.config.glycTimes];
  state.insTimes = [...rec.config.insTimes];
  state.glycValues = [...rec.results.glycValues];
  state.insValues = [...rec.results.insValues];
  state.glycRefs = JSON.parse(JSON.stringify(rec.results.glycRefs));
  state.insRefs = JSON.parse(JSON.stringify(rec.results.insRefs));

  document.getElementById('toggle-combined').checked = state.isCombined;
  document.getElementById('cfg-glucose-load').value = rec.config.glucoseLoad;
  document.getElementById('cfg-glyc-unit').value = rec.config.glycUnit;
  document.getElementById('cfg-ins-unit').value = rec.config.insUnit;
  document.getElementById('methodology').value = rec.methodology;
  document.getElementById('pdf-notes').value = rec.notes || '';

  if (rec.config.preset) { state.preset = rec.config.preset; renderPresets(); }
  updateTimesInputs();
  renderDataTables();

  rec.results.glycValues.forEach((v, i) => {
    const el = document.getElementById('glyc-val-' + i);
    if (el && v) { el.value = v; checkValue(el, state.glycTimes[i], 'glyc'); }
  });
  rec.results.insValues.forEach((v, i) => {
    const el = document.getElementById('ins-val-' + i);
    if (el && v) { el.value = v; checkValue(el, state.insTimes[i], 'ins'); }
  });

  showSection('data');
}

function deleteReport(id) {
  if (!confirm('Eliminare questo referto dall\'archivio?')) return;
  let archive = getArchive();
  archive = archive.filter(r => r.id !== id);
  saveArchive(archive);
  try { localStorage.removeItem('curveReport_pdf_' + id); } catch(e) {}
  renderArchive();
}

function downloadSavedPdf(id) {
  const archive = getArchive();
  const rec = archive.find(r => r.id === id);
  if (!rec) return;
  const pdfData = localStorage.getItem('curveReport_pdf_' + id);
  if (pdfData) {
    const a = document.createElement('a');
    a.href = pdfData;
    a.download = 'Referto_Curva_' + rec.patient.cognome + '_' + rec.patient.nome + '.pdf';
    document.body.appendChild(a); a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  } else {
    alert('PDF non in cache. Ricaricare il referto e rigenerare il PDF.');
  }
}

function exportArchive() {
  const archive = getArchive();
  if (archive.length === 0) { alert('Archivio vuoto.'); return; }
  const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'archivio_referti_' + new Date().toISOString().split('T')[0] + '.json';
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function importArchive(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Formato non valido');
      const existing = getArchive();
      const ids = new Set(existing.map(r => r.id));
      let added = 0;
      imported.forEach(rec => { if (!ids.has(rec.id)) { existing.unshift(rec); added++; } });
      saveArchive(existing);
      renderArchive();
      alert('Importati ' + added + ' referti nuovi (su ' + imported.length + ' totali).');
    } catch(err) { alert('Errore importazione: ' + err.message); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function renderArchive() {
  const archive = getArchive();
  const statsEl = document.getElementById('archive-stats');
  const listEl = document.getElementById('archive-list');

  const totalPatients = new Set(archive.map(r => (r.patient.cognome + r.patient.nome + r.patient.cf).toLowerCase())).size;
  statsEl.innerHTML = `
    <div class="db-stat"><div class="db-stat-num">${archive.length}</div><div class="db-stat-label">Referti</div></div>
    <div class="db-stat"><div class="db-stat-num">${totalPatients}</div><div class="db-stat-label">Pazienti</div></div>
    <div class="db-stat"><div class="db-stat-num">${archive.filter(r => r.config.isPregnant).length}</div><div class="db-stat-label">Gravidanza</div></div>
  `;

  if (archive.length === 0) {
    listEl.innerHTML = '<div class="db-empty"><div class="db-empty-icon">🗃️</div><div>Nessun referto archiviato</div><div style="font-size:13px;margin-top:4px">I referti verranno salvati automaticamente alla generazione del PDF</div></div>';
    return;
  }

  const search = (document.getElementById('archive-search')?.value || '').toLowerCase();
  let filtered = archive;
  if (search) {
    filtered = archive.filter(r =>
      (r.patient.cognome + ' ' + r.patient.nome + ' ' + r.patient.cf + ' ' + r.patient.dataEsame + ' ' + r.config.presetName)
        .toLowerCase().includes(search)
    );
  }

  listEl.innerHTML = filtered.map(r => {
    const date = r.patient.dataEsame || r.timestamp.split('T')[0];
    const tags = [];
    if (r.config.glycTimes?.length) tags.push('<span class="db-tag db-tag-glyc">Glicemica</span>');
    if (r.config.insTimes?.length) tags.push('<span class="db-tag db-tag-ins">Insulinemica</span>');
    if (r.config.isPregnant) tags.push('<span class="db-tag db-tag-preg">Gravidanza</span>');
    return `<div class="db-item">
      <div class="db-item-info" onclick="loadReport('${r.id}')">
        <div class="db-item-name">${r.patient.cognome || '—'} ${r.patient.nome || ''}</div>
        <div class="db-item-meta">${date} · ${r.config.presetName || 'Custom'} ${tags.join('')}</div>
      </div>
      <div class="db-item-actions">
        <button class="btn btn-outline btn-sm" onclick="loadReport('${r.id}')" title="Carica">📂</button>
        <button class="btn btn-outline btn-sm" onclick="downloadSavedPdf('${r.id}')" title="PDF">📄</button>
        <button class="btn btn-danger-outline btn-sm" onclick="deleteReport('${r.id}')" title="Elimina">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function clearArchive() {
  if (!confirm('⚠️ Eliminare TUTTI i referti archiviati? Azione irreversibile.')) return;
  if (!confirm('Conferma definitiva: eliminare tutto?')) return;
  const archive = getArchive();
  archive.forEach(r => { try { localStorage.removeItem('curveReport_pdf_' + r.id); } catch(e) {} });
  localStorage.removeItem(DB_KEY);
  renderArchive();
}
