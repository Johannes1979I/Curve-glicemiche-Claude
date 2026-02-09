/* init.js — Startup, Library Check & Utilities */

function init() {
  renderPresets();
  document.getElementById('pt-data-esame').value = new Date().toISOString().split('T')[0];
}

function checkLibraries() {
  const el = document.getElementById('lib-status');
  if (!el) return;
  const hasChart = typeof Chart !== 'undefined';
  const hasJsPdf = window.jspdf && window.jspdf.jsPDF;

  if (hasChart && hasJsPdf) {
    el.innerHTML = '<div style="padding:10px 14px;background:var(--success-pale);border-radius:8px;font-size:13px;color:var(--success);font-weight:500">✅ Librerie caricate — PDF pronto</div>';
  } else {
    let missing = [];
    if (!hasChart) missing.push('Chart.js');
    if (!hasJsPdf) missing.push('jsPDF');
    el.innerHTML = `<div style="padding:14px;background:var(--warning-pale);border:1px solid var(--warning);border-radius:8px;font-size:13px">
      <strong style="color:var(--warning)">⚠️ Librerie non disponibili: ${missing.join(', ')}</strong><br>
      <span style="color:var(--text-secondary)">Scarica il file HTML e aprilo nel browser per la piena funzionalità.</span>
    </div>`;
  }
}

function downloadHTML() {
  try {
    const html = document.documentElement.outerHTML;
    const blob = new Blob(['<!DOCTYPE html>\n' + html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Curve_Glicemiche_Insulinemiche.html';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  } catch(e) { alert('Usa Ctrl+S o Cmd+S per salvare la pagina.'); }
}

// ── Bootstrap ──
init();

window.addEventListener('load', function() {
  setTimeout(checkLibraries, 1500);
  loadSettingsFromStorage();

  // Auto-save settings on field changes
  ['pdf-title', 'methodology', 'cfg-glucose-load', 'cfg-glyc-unit', 'cfg-ins-unit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        if (document.getElementById('toggle-save-settings')?.checked) saveSettingsToStorage();
      });
    }
  });
});
