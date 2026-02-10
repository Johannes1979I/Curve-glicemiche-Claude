/* presets.js — Preset Cards, Custom Curve Builder & Selection */

function renderPresets() {
  const grid = document.getElementById('preset-grid');
  grid.innerHTML = PRESETS.map(p => {
    const isCustom = p.id === 'custom';
    const pointLabel = isCustom ? (state.customCurve ? state.customCurve.points + ' punti' : '?') : p.points + ' punti';
    return `
    <div class="preset-card ${state.preset === p.id ? 'active' : ''}" onclick="${isCustom ? 'showCustomCurvePanel()' : "selectPreset('" + p.id + "')"}">
      <div class="preset-name">${p.name}</div>
      <div class="preset-desc">${p.desc}</div>
      <span class="preset-points">${pointLabel}</span>
      ${p.pregnant ? '<span class="badge badge-warning" style="margin-left:6px">Gravidanza</span>' : ''}
      ${isCustom ? '<span class="badge" style="margin-left:6px;background:#e0d4f5;color:#6b3fa0">Libera</span>' : ''}
    </div>`;
  }).join('');

  // Show/hide custom panel
  const cp = document.getElementById('custom-curve-panel');
  if (cp) cp.classList.toggle('hidden', state.preset !== 'custom');
}

function selectPreset(id) {
  state.preset = id;
  const p = PRESETS.find(x => x.id === id);
  if (!p) return;

  // Pregnancy auto-set from the dedicated preset
  if (p.pregnant) {
    state.isPregnant = true;
  } else {
    state.isPregnant = false;
  }

  if (p.type === 'custom') {
    // Handled by applyCustomCurve
    return;
  }

  state.glycTimes = [...p.times];
  if (state.isCombined) {
    state.insTimes = [...p.times];
  } else {
    state.insTimes = [];
  }

  updateTimesInputs();
  updateRefs();
  renderPresets();
}

/* ── Custom Curve Panel ── */
function showCustomCurvePanel() {
  state.preset = 'custom';
  renderPresets();
  // Pre-fill from previous custom or default
  const panel = document.getElementById('custom-curve-panel');
  if (panel) {
    panel.classList.remove('hidden');
    if (!document.getElementById('cc-num-points').value) {
      document.getElementById('cc-num-points').value = 5;
      onCustomPointsChange();
    }
  }
}

function onCustomPointsChange() {
  const n = parseInt(document.getElementById('cc-num-points').value) || 3;
  const clamped = Math.max(2, Math.min(10, n));
  document.getElementById('cc-num-points').value = clamped;

  // Generate default times based on number of points
  const defaultTimesets = {
    2: [0, 120],
    3: [0, 60, 120],
    4: [0, 30, 60, 120],
    5: [0, 30, 60, 90, 120],
    6: [0, 30, 60, 90, 120, 180],
    7: [0, 15, 30, 60, 90, 120, 180],
    8: [0, 15, 30, 45, 60, 90, 120, 180],
    9: [0, 15, 30, 45, 60, 90, 120, 150, 180],
    10: [0, 15, 30, 45, 60, 90, 120, 150, 180, 240],
  };
  const times = defaultTimesets[clamped] || defaultTimesets[5];

  // Generate time input fields
  const container = document.getElementById('cc-times-container');
  container.innerHTML = times.map((t, i) => `
    <div class="cc-time-field">
      <label>Punto ${i + 1}</label>
      <div style="display:flex;align-items:center;gap:4px">
        <input type="number" class="cc-time-input" id="cc-time-${i}" value="${t}" min="0" max="480" style="width:70px">
        <span style="font-size:12px;color:var(--text-muted)">min</span>
      </div>
    </div>
  `).join('');
}

function applyCustomCurve() {
  const n = parseInt(document.getElementById('cc-num-points').value) || 3;
  const times = [];
  for (let i = 0; i < n; i++) {
    const inp = document.getElementById(`cc-time-${i}`);
    if (inp) times.push(Math.max(0, parseInt(inp.value) || 0));
  }
  // Sort and deduplicate
  const sorted = [...new Set(times)].sort((a, b) => a - b);
  if (sorted.length < 2) { alert('Servono almeno 2 tempi diversi.'); return; }

  state.customCurve = { points: sorted.length, times: sorted };
  state.preset = 'custom';
  state.isPregnant = false;
  state.glycTimes = [...sorted];

  // Carry over to insulin if combined
  if (state.isCombined) {
    state.insTimes = [...sorted];
  } else {
    state.insTimes = [];
  }

  updateTimesInputs();
  updateRefs();
  renderPresets();

  // Feedback
  const desc = sorted.map(t => t === 0 ? 'basale' : t + "'").join(', ');
  document.getElementById('cc-feedback').textContent = 'Configurata: ' + sorted.length + ' punti — ' + desc;
  document.getElementById('cc-feedback').classList.remove('hidden');
}
