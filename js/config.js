/* config.js — Reference Values, Interpolation & Configuration */

function updateTimesInputs() {
  document.getElementById('cfg-glyc-times').value = state.glycTimes.join(', ');
  document.getElementById('cfg-ins-times').value = state.insTimes.join(', ');
}

function updateRefs() {
  const baseGlyc = state.isPregnant ? PREGNANT_GLYC_REFS : DEFAULT_GLYC_REFS;
  state.glycRefs = {};
  state.glycTimes.forEach(t => {
    state.glycRefs[t] = baseGlyc[t] || interpolateRef(t, baseGlyc);
  });
  state.insRefs = {};
  state.insTimes.forEach(t => {
    state.insRefs[t] = DEFAULT_INS_REFS[t] || interpolateRef(t, DEFAULT_INS_REFS);
  });
  renderRefEditor();
}

function interpolateRef(time, refs) {
  const times = Object.keys(refs).map(Number).sort((a,b) => a-b);
  if (time <= times[0]) return { ...refs[times[0]] };
  if (time >= times[times.length-1]) return { ...refs[times[times.length-1]] };
  let lo = times[0], hi = times[times.length-1];
  for (let i = 0; i < times.length - 1; i++) {
    if (time >= times[i] && time <= times[i+1]) { lo = times[i]; hi = times[i+1]; break; }
  }
  const ratio = (time - lo) / (hi - lo);
  return {
    min: Math.round(refs[lo].min + ratio * (refs[hi].min - refs[lo].min)),
    max: Math.round(refs[lo].max + ratio * (refs[hi].max - refs[lo].max)),
  };
}

function togglePregnant() {
  state.isPregnant = document.getElementById('toggle-pregnant').checked;
  updateRefs();
}

function toggleCombined() {
  state.isCombined = document.getElementById('toggle-combined').checked;
  if (state.isCombined && state.insTimes.length === 0) {
    state.insTimes = state.glycTimes.length ? [...state.glycTimes] : [0, 30, 60, 90, 120];
  }
  if (!state.isCombined) state.insTimes = [];
  updateTimesInputs();
  updateRefs();
}

function toggleRefEdit() {
  document.getElementById('ref-edit-panel').classList.toggle('hidden');
}

function renderRefEditor() {
  const glycEd = document.getElementById('ref-glyc-editor');
  const insEd = document.getElementById('ref-ins-editor');

  glycEd.innerHTML = state.glycTimes.map(t => `
    <div class="ref-edit-grid" style="margin-bottom:6px">
      <span class="time-label">${t === 0 ? 'Basale' : t + '\''}</span>
      <input type="number" id="ref-glyc-min-${t}" value="${state.glycRefs[t]?.min || 0}" placeholder="Min" style="padding:6px 8px;border:1px solid var(--border);border-radius:5px;font-size:13px">
      <input type="number" id="ref-glyc-max-${t}" value="${state.glycRefs[t]?.max || 0}" placeholder="Max" style="padding:6px 8px;border:1px solid var(--border);border-radius:5px;font-size:13px">
    </div>
  `).join('');

  insEd.innerHTML = state.insTimes.map(t => `
    <div class="ref-edit-grid" style="margin-bottom:6px">
      <span class="time-label">${t === 0 ? 'Basale' : t + '\''}</span>
      <input type="number" id="ref-ins-min-${t}" value="${state.insRefs[t]?.min || 0}" placeholder="Min" style="padding:6px 8px;border:1px solid var(--border);border-radius:5px;font-size:13px">
      <input type="number" id="ref-ins-max-${t}" value="${state.insRefs[t]?.max || 0}" placeholder="Max" style="padding:6px 8px;border:1px solid var(--border);border-radius:5px;font-size:13px">
    </div>
  `).join('');
}

function applyRefChanges() {
  state.glycTimes.forEach(t => {
    const mn = document.getElementById(`ref-glyc-min-${t}`);
    const mx = document.getElementById(`ref-glyc-max-${t}`);
    if (mn && mx) state.glycRefs[t] = { min: Number(mn.value), max: Number(mx.value) };
  });
  state.insTimes.forEach(t => {
    const mn = document.getElementById(`ref-ins-min-${t}`);
    const mx = document.getElementById(`ref-ins-max-${t}`);
    if (mn && mx) state.insRefs[t] = { min: Number(mn.value), max: Number(mx.value) };
  });
  alert('Valori di riferimento aggiornati!');
}

function resetRefs() {
  updateRefs();
  alert('Valori di riferimento ripristinati ai default.');
}
