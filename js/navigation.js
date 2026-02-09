/* navigation.js — Section Tabs & Navigation */

const SECTIONS = ['setup', 'data', 'results', 'pdf', 'archive'];

function showSection(id) {
  SECTIONS.forEach(s => {
    const el = document.getElementById('section-' + s);
    if (el) el.classList.add('hidden');
  });
  document.getElementById('section-' + id).classList.remove('hidden');
  document.querySelectorAll('.section-tab').forEach((tab, i) => {
    tab.classList.toggle('active', SECTIONS[i] === id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'archive') renderArchive();
}

function proceedToData() {
  const glycTimesStr = document.getElementById('cfg-glyc-times').value;
  const insTimesStr = document.getElementById('cfg-ins-times').value;
  if (glycTimesStr.trim()) state.glycTimes = glycTimesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  if (insTimesStr.trim()) state.insTimes = insTimesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  if (state.glycTimes.length === 0 && state.insTimes.length === 0) { alert('Seleziona un preset o inserisci i tempi di prelievo.'); return; }
  updateRefs();
  renderDataTables();
  showSection('data');
  const p = state.preset ? PRESETS.find(x => x.id === state.preset) : null;
  document.getElementById('data-curve-title').textContent = p ? p.name : 'Configurazione personalizzata';
}

function proceedToResults() {
  state.glycValues = state.glycTimes.map((_, i) => { const el = document.getElementById(`glyc-val-${i}`); return el ? parseFloat(el.value) || 0 : 0; });
  state.insValues = state.insTimes.map((_, i) => { const el = document.getElementById(`ins-val-${i}`); return el ? parseFloat(el.value) || 0 : 0; });
  showSection('results');
  renderCharts();
  renderResultsSummary();
}
