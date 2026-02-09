/* presets.js — Preset Cards & Selection */

function renderPresets() {
  const grid = document.getElementById('preset-grid');
  grid.innerHTML = PRESETS.map(p => `
    <div class="preset-card ${state.preset === p.id ? 'active' : ''}" onclick="selectPreset('${p.id}')">
      <div class="preset-name">${p.name}</div>
      <div class="preset-desc">${p.desc}</div>
      <span class="preset-points">${p.points} punti</span>
      ${p.pregnant ? '<span class="badge badge-warning" style="margin-left:6px">Gravidanza</span>' : ''}
    </div>
  `).join('');
}

function selectPreset(id) {
  state.preset = id;
  const p = PRESETS.find(x => x.id === id);

  if (p.pregnant) {
    document.getElementById('toggle-pregnant').checked = true;
    state.isPregnant = true;
  }

  if (p.type === 'combined') {
    state.isCombined = true;
    document.getElementById('toggle-combined').checked = true;
    state.glycTimes = [...p.glycTimes];
    state.insTimes = [...p.insTimes];
  } else if (p.type === 'ins') {
    state.isCombined = false;
    document.getElementById('toggle-combined').checked = false;
    state.insTimes = [...p.times];
    state.glycTimes = [];
  } else {
    state.glycTimes = [...p.times];
    if (state.isCombined) {
      state.insTimes = [...p.times];
    } else {
      state.insTimes = [];
    }
  }

  updateTimesInputs();
  updateRefs();
  renderPresets();
}
