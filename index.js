dscc.subscribeToData(draw, { transform: dscc.objectTransform });

let segmentA = null;
let segmentB = null;

function draw(data) {
  const container = document.getElementById('container');
  container.innerHTML = '';

  const rows = data.tables.DEFAULT;

  if (!rows || rows.length === 0) {
    container.innerHTML = 'No data';
    return;
  }

  // 👉 parse
  const parsed = rows.map(r => ({
    step: r.dimension[0],
    segment: r.dimension[1],
    value: Number(r.metric[0])
  }));

  const segments = [...new Set(parsed.map(d => d.segment))];

  // 👉 init selection
  if (!segmentA || !segments.includes(segmentA)) segmentA = segments[0];
  if (!segmentB || !segments.includes(segmentB)) segmentB = segments[1] || segments[0];

  // ---------- controls ----------
  const controls = document.createElement('div');
  controls.className = 'controls';

  controls.appendChild(createSelect(segments, segmentA, val => {
    segmentA = val;
    draw(data);
  }));

  controls.appendChild(createSelect(segments, segmentB, val => {
    segmentB = val;
    draw(data);
  }));

  container.appendChild(controls);

  // ---------- funnels ----------
  const funnelA = buildFunnel(parsed, segmentA);
  const funnelB = buildFunnel(parsed, segmentB);

  renderFunnel(container, funnelA, funnelB, data.style);
}

// ---------- helpers ----------

function createSelect(options, selected, onChange) {
  const select = document.createElement('select');

  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    opt.text = o;
    if (o === selected) opt.selected = true;
    select.appendChild(opt);
  });

  select.onchange = e => onChange(e.target.value);
  return select;
}

function buildFunnel(data, segment) {
  const filtered = data.filter(d => d.segment === segment);

  const map = {};
  filtered.forEach(d => {
    if (!map[d.step]) map[d.step] = 0;
    map[d.step] += d.value;
  });

  // ⚠️ порядок як є (НЕ сортуємо)
  return Object.keys(map).map(step => ({
    step,
    value: map[step]
  }));
}

function renderFunnel(container, a, b, style) {
  const wrapper = document.createElement('div');
  wrapper.className = 'funnels';

  wrapper.appendChild(createColumn(a, style.colorA.value.color));
  wrapper.appendChild(createColumn(b, style.colorB.value.color));

  container.appendChild(wrapper);
}

function createColumn(steps, color) {
  const col = document.createElement('div');
  col.className = 'col';

  const max = Math.max(...steps.map(s => s.value));
  const base = steps[0]?.value || 1;

  steps.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'step';

    const width = (s.value / max) * 100;
    div.style.width = width + '%';
    div.style.background = color;

    let text = `${s.step}: ${s.value}`;

    if (i > 0) {
      const prev = steps[i - 1].value;
      const conv = ((s.value / prev) * 100).toFixed(1);
      text += ` | ${conv}%`;
    }

    // 👉 cumulative
    const totalConv = ((s.value / base) * 100).toFixed(1);
    text += ` (${totalConv}%)`;

    div.innerText = text;

    col.appendChild(div);
  });

  return col;
}
