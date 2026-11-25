// Shared UI state, saving, HTML helpers, modals, and the move-learning / evolution flows.

const SAVE_KEY = 'kanto-quest-save-v1';
let S = null; // the saved game state
const ui = { screen: 'title', tab: 'explore', loc: 'route1', battle: null };

function newGameState(starterId) {
  const starter = createPokemon(starterId, 5, { strong: true });
  return {
    version: 1, starter: starterId, party: [starter], pc: [],
    bag: { pokeball: 5, potion: 3 }, money: 3000, badges: 0, champion: false,
    dex: { seen: { [starterId]: 1 }, caught: { [starterId]: 1 } }, beaten: {},
  };
}

function saveGame() {
  if (!S) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const st = JSON.parse(raw);
    for (const m of [...st.party, ...st.pc]) { _uid = Math.max(_uid, m.uid); m.stats = calcStats(m); }
    return st;
  } catch (e) { return null; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

function markSeen(id) { S.dex.seen[id] = 1; }
function markCaught(id) { S.dex.seen[id] = 1; S.dex.caught[id] = 1; }
function caughtSet() { return new Set(Object.keys(S.dex.caught).map(Number)); }
function locUnlocked(loc) { return S.badges >= loc.badges && (!loc.champion || S.champion); }

// ---------- HTML helpers ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const typeBadge = (t) => `<span class="type" style="--c:${TYPE_COLORS[t]}">${t}</span>`;
const typeBadges = (types) => types.map(typeBadge).join('');
const money = (n) => `₽${n.toLocaleString()}`;
const STATUS_LABEL = { brn: 'BRN', psn: 'PSN', par: 'PAR', slp: 'SLP', frz: 'FRZ' };
const statusChip = (s) => (s ? `<span class="status st-${s}">${STATUS_LABEL[s]}</span>` : '');

function spriteImg(id, { back = false, cls = '', silhouette = false } = {}) {
  return `<img class="sprite ${cls}${silhouette ? ' silhouette' : ''}" src="${spriteUrl(id, back)}" alt="${esc(POKEMON[id].name)}" loading="lazy" onerror="this.classList.add('broken')">`;
}
function hpColor(frac) { return frac > 0.5 ? 'hp-good' : frac > 0.2 ? 'hp-mid' : 'hp-low'; }
function hpBar(hp, max) {
  const f = Math.max(0, hp / max);
  return `<div class="bar hp"><div class="fill ${hpColor(f)}" style="width:${(f * 100).toFixed(1)}%"></div></div>`;
}
function xpFrac(mon) {
  if (mon.level >= 100) return 1;
  const a = xpForLevel(mon.level), b = xpForLevel(mon.level + 1);
  return Math.max(0, Math.min(1, (mon.xp - a) / (b - a)));
}
function moveChip(slot) {
  const mv = MOVES[slot.id];
  const pow = mv.cat === 'X' ? 'Status' : mv.fixed ? 'Lv dmg' : `Pow ${mv.pow}`;
  return `<div class="movechip" style="--c:${TYPE_COLORS[mv.type]}"><b>${mv.name}</b><small>${mv.type} · ${pow} · PP ${slot.pp}/${mv.pp}</small></div>`;
}

// ---------- Toast ----------
let _toastTimer = null;
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ---------- Modal ----------
// buttons: [{ label, value, cls, disabled }]. Resolves with the clicked button's value.
function modal({ title, body = '', buttons = [{ label: 'OK', value: true }], wide = false, dismissable = false }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
      ${title ? `<h2>${title}</h2>` : ''}<div class="modal-body">${body}</div>
      <div class="modal-buttons">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-mi="${i}" ${b.disabled ? 'disabled' : ''}>${b.label}</button>`).join('')}</div>
    </div>`;
    const close = (v) => { wrap.remove(); resolve(v); };
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mi]');
      if (btn && !btn.disabled) close(buttons[+btn.dataset.mi].value);
      else if (dismissable && e.target === wrap) close(null);
    });
    document.body.appendChild(wrap);
    const first = wrap.querySelector('[data-mi]:not([disabled])');
    if (first) first.focus();
  });
}
const alertModal = (title, body) => modal({ title, body });
const confirmModal = (title, body, yes = 'Yes', no = 'No') =>
  modal({ title, body, buttons: [{ label: yes, value: true, cls: 'primary' }, { label: no, value: false }] });

// Pick a party member. filter(mon) → true if selectable. Returns index or null.
function pickPartyMember(title, filter, note = '') {
  const body = `${note ? `<p>${note}</p>` : ''}<div class="pick-list">${S.party.map((m, i) => {
    const ok = filter(m);
    return `<button class="pick ${ok ? '' : 'disabled'}" data-pick="${i}" ${ok ? '' : 'disabled'}>
      ${spriteImg(m.id, { cls: 'mini' })}<span><b>${monName(m)}</b> Lv${m.level} ${statusChip(m.status)}<br>
      <small>HP ${m.hp}/${m.stats.hp}</small></span></button>`;
  }).join('')}</div>`;
  return new Promise((resolve) => {
    modal({ title, body, buttons: [{ label: 'Cancel', value: null }] }).then(resolve);
    const wrap = document.querySelector('.modal-wrap:last-child');
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (b && !b.disabled) { wrap.remove(); resolve(+b.dataset.pick); }
    });
  });
}

// ---------- Move learning ----------
async function learnMoveFlow(mon, moveId) {
  const mv = MOVES[moveId];
  if (mon.moves.some((m) => m.id === moveId)) return;
  if (mon.moves.length < 4) {
    mon.moves.push({ id: moveId, pp: mv.pp });
    await alertModal('New move!', `<p><b>${monName(mon)}</b> learned <b>${mv.name}</b>!</p>`);
    return;
  }
  const buttons = mon.moves.map((m, i) => ({ label: `Forget ${MOVES[m.id].name}`, value: i }));
  buttons.push({ label: `Don't learn ${mv.name}`, value: -1, cls: 'ghost' });
  const body = `<p><b>${monName(mon)}</b> wants to learn <b>${mv.name}</b>, but it already knows 4 moves.</p>
    <div class="movegrid">${moveChip({ id: moveId, pp: mv.pp })}</div><p>Current moves:</p>
    <div class="movegrid">${mon.moves.map(moveChip).join('')}</div>`;
  const choice = await modal({ title: 'Learn a new move?', body, buttons, wide: true });
  if (choice >= 0) {
    const old = MOVES[mon.moves[choice].id].name;
    mon.moves[choice] = { id: moveId, pp: mv.pp };
    await alertModal('1, 2 and… Poof!', `<p>${monName(mon)} forgot ${old} and learned <b>${mv.name}</b>!</p>`);
  }
}

// ---------- Evolution ----------
async function evolveFlow(mon, toId) {
  const from = monName(mon);
  const go = await modal({
    title: 'What?',
    body: `<div class="evo">${spriteImg(mon.id, { cls: 'big pulse' })}</div><p><b>${from}</b> is evolving!</p>`,
    buttons: [{ label: 'Let it evolve', value: true, cls: 'primary' }, { label: 'Stop', value: false }],
  });
  if (!go) { toast(`${from} did not evolve.`); return false; }
  evolve(mon, toId);
  markCaught(toId);
  await alertModal('Congratulations!', `<div class="evo">${spriteImg(toId, { cls: 'big' })}</div>
    <p>Your <b>${from}</b> evolved into <b>${POKEMON[toId].name}</b>!</p>`);
  const newMove = evolutionMove(mon);
  if (newMove) await learnMoveFlow(mon, newMove);
  return true;
}

// Party slot first-alive helper.
function firstAlive() { return S.party.findIndex((m) => m.hp > 0); }
