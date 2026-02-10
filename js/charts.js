/* charts.js — Chart.js Rendering (screen + PDF export) */

function renderCharts() {
  if (state.glycChart) state.glycChart.destroy();
  if (state.insChart) state.insChart.destroy();

  if (state.glycTimes.length > 0) {
    document.getElementById('glyc-chart-container').classList.remove('hidden');
    const ctx = document.getElementById('glycChart').getContext('2d');
    state.glycChart = createCurveChart(ctx, state.glycTimes, state.glycValues, state.glycRefs, {
      label: 'Glicemia', unit: document.getElementById('cfg-glyc-unit').value,
      color: '#2d5a3d', refColor: 'rgba(45,90,61,0.12)', borderRef: 'rgba(45,90,61,0.35)',
    });
  }

  const insCard = document.getElementById('ins-chart-card');
  if (state.insTimes.length > 0) {
    insCard.classList.remove('hidden');
    const ctx2 = document.getElementById('insChart').getContext('2d');
    state.insChart = createCurveChart(ctx2, state.insTimes, state.insValues, state.insRefs, {
      label: 'Insulinemia', unit: document.getElementById('cfg-ins-unit').value,
      color: '#2980b9', refColor: 'rgba(41,128,185,0.10)', borderRef: 'rgba(41,128,185,0.30)',
    });
  } else { insCard.classList.add('hidden'); }
}

function createCurveChart(ctx, times, values, refs, opts) {
  const labels = times.map(t => t === 0 ? 'Basale' : t + '\'');
  const refMin = times.map(t => refs[t]?.min || 0);
  const refMax = times.map(t => refs[t]?.max || 0);
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [
      { label: opts.label + ' (risultato)', data: values, borderColor: opts.color, backgroundColor: opts.color + '20', borderWidth: 3, pointRadius: 6, pointBackgroundColor: opts.color, pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 8, fill: false, tension: 0.4, cubicInterpolationMode: 'monotone' },
      { label: 'Limite superiore rif.', data: refMax, borderColor: opts.borderRef, borderWidth: 2, borderDash: [6,4], pointRadius: 3, pointBackgroundColor: opts.borderRef, fill: '+1', backgroundColor: opts.refColor, tension: 0.4, cubicInterpolationMode: 'monotone' },
      { label: 'Limite inferiore rif.', data: refMin, borderColor: opts.borderRef, borderWidth: 2, borderDash: [6,4], pointRadius: 3, pointBackgroundColor: opts.borderRef, fill: false, tension: 0.4, cubicInterpolationMode: 'monotone' },
    ]},
    options: {
      responsive: true, maintainAspectRatio: true, aspectRatio: 2,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 12 }, usePointStyle: true, padding: 16 } },
        tooltip: { backgroundColor: '#1a1a1a', titleFont: { family: 'DM Sans', size: 13 }, bodyFont: { family: 'DM Sans', size: 12 }, padding: 12, cornerRadius: 8,
          callbacks: { label: c => c.dataset.label + ': ' + c.parsed.y + ' ' + opts.unit } }
      },
      scales: {
        x: { title: { display: true, text: 'Tempo (minuti)', font: { family: 'DM Sans', size: 13, weight: '600' }, color: '#5a5a5a' }, grid: { color: '#f0f0f0' }, ticks: { font: { family: 'DM Sans', size: 12 } } },
        y: { title: { display: true, text: opts.label + ' (' + opts.unit + ')', font: { family: 'DM Sans', size: 13, weight: '600' }, color: '#5a5a5a' }, grid: { color: '#f0f0f0' }, ticks: { font: { family: 'DM Sans', size: 12 } }, beginAtZero: true }
      }
    }
  });
}

/* Render chart to hidden square canvas for PDF — returns PNG data URL */
async function renderChartToImage(times, values, refs, opts, canvasId) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.getElementById(canvasId);
      canvas.width = 460; canvas.height = 440;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 460, 440);
      const labels = times.map(t => t === 0 ? 'Basale' : t + "'");
      const refMin = times.map(t => refs[t]?.min || 0);
      const refMax = times.map(t => refs[t]?.max || 0);
      const chart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [
          { label: opts.label, data: [...values], borderColor: opts.color, backgroundColor: opts.color, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: opts.color, pointBorderColor: '#fff', pointBorderWidth: 1.5, fill: false, tension: 0.4, cubicInterpolationMode: 'monotone' },
          { label: 'Lim. sup.', data: [...refMax], borderColor: opts.borderRef, borderWidth: 1.5, borderDash: [5,3], pointRadius: 2, pointBackgroundColor: opts.borderRef, fill: '+1', backgroundColor: opts.refColor, tension: 0.4, cubicInterpolationMode: 'monotone' },
          { label: 'Lim. inf.', data: [...refMin], borderColor: opts.borderRef, borderWidth: 1.5, borderDash: [5,3], pointRadius: 2, pointBackgroundColor: opts.borderRef, fill: false, tension: 0.4, cubicInterpolationMode: 'monotone' },
        ]},
        options: {
          responsive: false, animation: { duration: 0 },
          plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, usePointStyle: true, padding: 8, boxWidth: 8 } } },
          scales: {
            x: { title: { display: true, text: 'Tempo', font: { size: 9, weight: 'bold' } }, grid: { color: '#eee' }, ticks: { font: { size: 8 } } },
            y: { title: { display: true, text: opts.label + ' (' + opts.unit + ')', font: { size: 9, weight: 'bold' } }, grid: { color: '#eee' }, ticks: { font: { size: 8 } }, beginAtZero: true }
          }
        }
      });
      setTimeout(() => {
        try { const url = canvas.toDataURL('image/png'); chart.destroy(); resolve(url); }
        catch(e) { chart.destroy(); reject(e); }
      }, 500);
    } catch(e) { reject(e); }
  });
}
