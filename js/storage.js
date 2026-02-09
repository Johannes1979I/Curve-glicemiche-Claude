/* storage.js — Persistent Settings (localStorage) */

function handleHeaderUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    state.headerImage = ev.target.result;
    applyHeaderPreview();
    if (document.getElementById('toggle-save-settings')?.checked) saveSettingsToStorage();
  };
  reader.readAsDataURL(file);
}

function applyHeaderPreview() {
  const preview = document.getElementById('header-preview');
  preview.src = state.headerImage;
  preview.classList.remove('hidden');
  document.getElementById('upload-placeholder').style.display = 'none';
  document.getElementById('header-upload-area').classList.add('has-image');
  document.getElementById('btn-remove-header').style.display = 'inline-flex';
}

function removeHeader() {
  state.headerImage = null;
  document.getElementById('header-preview').classList.add('hidden');
  document.getElementById('upload-placeholder').style.display = 'block';
  document.getElementById('header-upload-area').classList.remove('has-image');
  document.getElementById('btn-remove-header').style.display = 'none';
  document.getElementById('header-file').value = '';
  if (document.getElementById('toggle-save-settings')?.checked) saveSettingsToStorage();
}

function saveSettingsToStorage() {
  try {
    const settings = {
      headerImage: state.headerImage || null,
      pdfTitle: document.getElementById('pdf-title').value,
      methodology: document.getElementById('methodology').value,
      glucoseLoad: document.getElementById('cfg-glucose-load').value,
      glycUnit: document.getElementById('cfg-glyc-unit').value,
      insUnit: document.getElementById('cfg-ins-unit').value,
      saveEnabled: true,
    };
    localStorage.setItem('curveReport_settings', JSON.stringify(settings));
    showSaveConfirmation();
  } catch(e) { console.warn('Save error:', e); }
}

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem('curveReport_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    const toggle = document.getElementById('toggle-save-settings');
    if (toggle) toggle.checked = true;
    if (s.headerImage) { state.headerImage = s.headerImage; applyHeaderPreview(); }
    if (s.pdfTitle) document.getElementById('pdf-title').value = s.pdfTitle;
    if (s.methodology) document.getElementById('methodology').value = s.methodology;
    if (s.glucoseLoad) document.getElementById('cfg-glucose-load').value = s.glucoseLoad;
    if (s.glycUnit) document.getElementById('cfg-glyc-unit').value = s.glycUnit;
    if (s.insUnit) document.getElementById('cfg-ins-unit').value = s.insUnit;
    const st = document.getElementById('save-status');
    if (st) { st.innerHTML = '<span style="color:var(--success);font-size:12px;font-weight:500">✅ Impostazioni ripristinate</span>'; setTimeout(() => { st.innerHTML = ''; }, 3000); }
  } catch(e) { console.warn('Load error:', e); }
}

function clearSettingsFromStorage() {
  try {
    localStorage.removeItem('curveReport_settings');
    const st = document.getElementById('save-status');
    if (st) { st.innerHTML = '<span style="color:var(--accent);font-size:12px;font-weight:500">🗑️ Impostazioni cancellate</span>'; setTimeout(() => { st.innerHTML = ''; }, 3000); }
  } catch(e) { console.warn('Clear error:', e); }
}

function onSaveToggleChange() {
  if (document.getElementById('toggle-save-settings').checked) saveSettingsToStorage();
  else clearSettingsFromStorage();
}

function showSaveConfirmation() {
  const st = document.getElementById('save-status');
  if (st) { st.innerHTML = '<span style="color:var(--success);font-size:12px;font-weight:500">💾 Salvato</span>'; setTimeout(() => { st.innerHTML = ''; }, 2000); }
}
