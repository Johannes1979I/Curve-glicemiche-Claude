/* data-entry.js — Data Tables & Validation */

function renderDataTables() {
  const glycUnit = document.getElementById('cfg-glyc-unit').value;
  const insUnit = document.getElementById('cfg-ins-unit').value;

  const glycSection = document.getElementById('data-glyc-section');
  const glycBody = document.querySelector('#data-glyc-table tbody');
  if (state.glycTimes.length > 0) {
    glycSection.classList.remove('hidden');
    glycBody.innerHTML = state.glycTimes.map((t, i) => {
      const ref = state.glycRefs[t] || { min: '-', max: '-' };
      const prevVal = state.glycValues[i] || '';
      return `<tr>
        <td style="font-weight:600;white-space:nowrap">${t === 0 ? 'Basale (T0)' : `T${t}' (${t} min)`}</td>
        <td><input type="number" step="0.1" id="glyc-val-${i}" value="${prevVal}" placeholder="—" onchange="checkValue(this, ${t}, 'glyc')"> <span style="font-size:12px;color:var(--text-muted)">${glycUnit}</span></td>
        <td class="ref-range">${ref.min} – ${ref.max} ${glycUnit}</td>
        <td id="glyc-status-${i}">—</td>
      </tr>`;
    }).join('');
  } else { glycSection.classList.add('hidden'); }

  const insSection = document.getElementById('data-ins-section');
  const insBody = document.querySelector('#data-ins-table tbody');
  if (state.insTimes.length > 0) {
    insSection.classList.remove('hidden');
    insBody.innerHTML = state.insTimes.map((t, i) => {
      const ref = state.insRefs[t] || { min: '-', max: '-' };
      const prevVal = state.insValues[i] || '';
      return `<tr>
        <td style="font-weight:600;white-space:nowrap">${t === 0 ? 'Basale (T0)' : `T${t}' (${t} min)`}</td>
        <td><input type="number" step="0.01" id="ins-val-${i}" value="${prevVal}" placeholder="—" onchange="checkValue(this, ${t}, 'ins')"> <span style="font-size:12px;color:var(--text-muted)">${insUnit}</span></td>
        <td class="ref-range">${ref.min} – ${ref.max} ${insUnit}</td>
        <td id="ins-status-${i}">—</td>
      </tr>`;
    }).join('');
  } else { insSection.classList.add('hidden'); }
}

function checkValue(input, time, type) {
  const val = parseFloat(input.value);
  if (isNaN(val)) return;
  const refs = type === 'glyc' ? state.glycRefs : state.insRefs;
  const ref = refs[time];
  if (!ref) return;
  const times = type === 'glyc' ? state.glycTimes : state.insTimes;
  const idx = times.indexOf(time);
  const statusEl = document.getElementById(`${type}-status-${idx}`);
  if (val < ref.min) statusEl.innerHTML = '<span class="badge badge-warning">↓ Basso</span>';
  else if (val > ref.max) statusEl.innerHTML = '<span class="badge badge-danger">↑ Alto</span>';
  else statusEl.innerHTML = '<span class="badge badge-success">Normale</span>';
}
