// Hand-drawn, FireRed-style battle backdrops and platforms (inline SVG, 240×112 like the GBA battle view).

function _stripes(y0, y1, color, opacity) {
  // Horizontal ground stripes that get farther apart toward the viewer (fake perspective).
  let out = '', y = y0, gap = 2;
  while (y < y1) {
    out += `<rect x="0" y="${y.toFixed(1)}" width="240" height="${(gap * 0.45).toFixed(1)}" fill="${color}" opacity="${opacity}"/>`;
    y += gap; gap *= 1.22;
  }
  return out;
}
function _treeLine(y, colors, r0, step, seed) {
  let out = '';
  for (let x = -6, i = 0; x < 250; x += step, i++) {
    const r = r0 + ((i * 7 + seed) % 4);
    out += `<circle cx="${x}" cy="${y - r * 0.4}" r="${r}" fill="${colors[0]}"/>`;
    out += `<circle cx="${x - r * 0.3}" cy="${y - r * 0.75}" r="${r * 0.45}" fill="${colors[1]}"/>`;
  }
  return out + `<rect x="0" y="${y - 1}" width="240" height="${r0 + 2}" fill="${colors[0]}"/>`;
}

const BACKDROPS = {
  grass: () => `
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe7ff"/><stop offset="1" stop-color="#f3fbe6"/></linearGradient></defs>
    <rect width="240" height="52" fill="url(#sky)"/>
    <ellipse cx="40" cy="14" rx="18" ry="5" fill="#fff" opacity=".85"/><ellipse cx="52" cy="11" rx="10" ry="5" fill="#fff" opacity=".85"/>
    <ellipse cx="180" cy="20" rx="22" ry="5" fill="#fff" opacity=".8"/><ellipse cx="168" cy="17" rx="10" ry="4" fill="#fff" opacity=".8"/>
    <polygon points="0,44 30,30 60,40 95,26 130,40 165,28 200,38 240,30 240,48 0,48" fill="#9fd0a8"/>
    ${_treeLine(48, ['#3d8a3a', '#5cae4c'], 7, 11, 1)}
    <rect y="52" width="240" height="60" fill="#8fd06a"/>
    ${_stripes(52, 112, '#b4e488', 0.7)}`,
  forest: () => `
    <rect width="240" height="56" fill="#2f5a2c"/>
    ${[10, 48, 92, 140, 186, 228].map((x, i) => `<rect x="${x - 4}" y="10" width="8" height="46" fill="#5a3d22"/><rect x="${x - 4}" y="10" width="3" height="46" fill="#6e4c2c"/>`).join('')}
    ${_treeLine(22, ['#24481f', '#3b6d30'], 12, 16, 3)}
    ${_treeLine(54, ['#3a7a32', '#57a246'], 8, 12, 5)}
    <rect y="56" width="240" height="56" fill="#6eae4e"/>
    ${_stripes(56, 112, '#86c460', 0.75)}`,
  cave: () => `
    <defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2d22"/><stop offset="1" stop-color="#6e5640"/></linearGradient></defs>
    <rect width="240" height="54" fill="url(#wall)"/>
    ${[12, 40, 75, 110, 150, 190, 222].map((x, i) => `<polygon points="${x - 7},0 ${x + 7},0 ${x},${10 + (i % 3) * 6}" fill="#2a2018"/>`).join('')}
    <polygon points="0,54 0,34 20,28 44,38 70,26 98,36 124,24 152,36 180,28 206,38 240,30 240,54" fill="#7d6448"/>
    <polygon points="0,54 0,44 30,40 60,46 90,40 120,47 150,41 185,47 215,42 240,46 240,54" fill="#5c4733"/>
    <rect y="54" width="240" height="58" fill="#a48a62"/>
    ${_stripes(54, 112, '#b89e74', 0.7)}
    ${[[30, 70], [200, 66], [120, 100], [215, 96], [70, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.4" fill="#7d6448"/>`).join('')}`,
  water: () => `
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd2ff"/><stop offset="1" stop-color="#e6f6ff"/></linearGradient></defs>
    <rect width="240" height="46" fill="url(#sky)"/>
    <ellipse cx="60" cy="16" rx="20" ry="5" fill="#fff" opacity=".85"/><ellipse cx="190" cy="12" rx="16" ry="4" fill="#fff" opacity=".85"/>
    <rect y="46" width="240" height="66" fill="#3f98dc"/>
    ${_stripes(46, 112, '#7cc4f2', 0.6)}
    ${[[20, 58], [70, 64], [150, 56], [200, 70], [110, 84], [30, 96], [180, 100]].map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="1" fill="#e6f6ff" opacity=".8"/>`).join('')}`,
  night: () => `
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16132e"/><stop offset="1" stop-color="#3d3566"/></linearGradient></defs>
    <rect width="240" height="54" fill="url(#sky)"/>
    ${[[20, 8], [60, 18], [100, 6], [150, 14], [210, 9], [185, 24], [35, 28]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.5" height="1.5" fill="#fff" opacity=".8"/>`).join('')}
    <circle cx="200" cy="16" r="7" fill="#f3efc8"/><circle cx="203" cy="14" r="6" fill="#16132e" opacity=".35"/>
    ${[18, 70, 130, 176, 226].map((x, i) => `<rect x="${x - 7}" y="${18 + (i % 2) * 6}" width="14" height="40" fill="#2a2448"/><rect x="${x - 9}" y="${16 + (i % 2) * 6}" width="18" height="4" fill="#352d5a"/>`).join('')}
    <rect y="54" width="240" height="58" fill="#5a5280"/>
    ${_stripes(54, 112, '#6b6392', 0.8)}`,
  gym: () => `
    <rect width="240" height="50" fill="#e9dcc0"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 30 + 3}" y="6" width="24" height="34" fill="#f3e9d2" stroke="#cdbb95" stroke-width="1"/>`).join('')}
    <rect y="40" width="240" height="10" fill="#b39a6e"/><rect y="40" width="240" height="2" fill="#8c7650"/>
    <rect y="50" width="240" height="62" fill="#d8c49c"/>
    ${_stripes(50, 112, '#c4ad80', 0.8)}
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${120 + (i - 6) * 9}" y1="50" x2="${120 + (i - 6) * 40}" y2="112" stroke="#c4ad80" stroke-width=".8"/>`).join('')}`,
  league: () => `
    <defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1640"/><stop offset="1" stop-color="#5a3584"/></linearGradient></defs>
    <rect width="240" height="52" fill="url(#wall)"/>
    ${[20, 70, 120, 170, 220].map((x) => `<rect x="${x - 6}" y="4" width="12" height="48" fill="#3c2260"/><rect x="${x - 8}" y="4" width="16" height="4" fill="#d9b24c"/><rect x="${x - 8}" y="46" width="16" height="4" fill="#d9b24c"/>`).join('')}
    <rect y="50" width="240" height="3" fill="#d9b24c"/>
    <rect y="53" width="240" height="59" fill="#b38d34"/>
    ${_stripes(53, 112, '#caa448', 0.85)}`,
};

// Platform colors: [outer ring, rim, inner top, tuft]
const PLATFORMS = {
  grass: ['#4f9a3c', '#78bf55', '#c4ee96', '#3d8a3a'],
  forest: ['#3f7d31', '#5f9e45', '#9fd47a', '#2f6328'],
  cave: ['#6e5638', '#8f7450', '#cdb184', null],
  water: ['#2f86c8', '#7cc4f2', '#bfe6ff', null],
  night: ['#3d3660', '#5a5284', '#8c84b4', null],
  gym: ['#a89070', '#e9dcc0', '#fbf6ea', null],
  league: ['#8c6a22', '#e8c25c', '#f6e2a0', null],
};

function backdropSvg(biome) {
  const draw = BACKDROPS[biome] || BACKDROPS.grass;
  return `<svg class="backdrop" viewBox="0 0 240 112" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">${draw()}</svg>`;
}

function platformSvg(biome) {
  const [outer, rim, top, tuft] = PLATFORMS[biome] || PLATFORMS.grass;
  const tufts = tuft ? [[14, 15], [26, 22], [94, 21], [106, 14], [60, 26]].map(([x, y]) =>
    `<polygon points="${x - 3},${y} ${x},${y - 5} ${x + 3},${y}" fill="${tuft}"/><polygon points="${x + 1},${y} ${x + 4},${y - 4} ${x + 6},${y}" fill="${tuft}"/>`).join('') : '';
  const ripples = biome === 'water' ? `<ellipse cx="60" cy="15" rx="40" ry="7" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>` : '';
  return `<svg class="platform" viewBox="0 0 120 30" shape-rendering="crispEdges" aria-hidden="true">
    <ellipse cx="60" cy="16" rx="59" ry="13" fill="${outer}"/>
    <ellipse cx="60" cy="14" rx="55" ry="11" fill="${rim}"/>
    <ellipse cx="60" cy="13" rx="47" ry="8" fill="${top}"/>
    ${ripples}${tufts}</svg>`;
}
