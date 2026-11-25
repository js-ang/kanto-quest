// Battle screen: renders the arena, plays back engine events, and handles the player's choices.

const BATTLE_BG = {
  route1: 'grass', viridian: 'forest', mtmoon: 'cave', cerulean: 'grass', rocktunnel: 'cave', vermilion: 'water',
  celadon: 'grass', tower: 'night', safari: 'grass', powerplant: 'night', seafoam: 'water', cinnabar: 'night',
  victory: 'cave', ceruleancave: 'cave', gym: 'gym', league: 'league',
};

// opts: { kind: 'wild'|'trainer', enemy: [mons], trainer: {title, reward, intro}, bg, onEnd(result) => bool (true = it took over) }
function startBattle(opts) {
  const b = new Battle({ kind: opts.kind, playerParty: S.party, enemyParty: opts.enemy, trainer: opts.trainer, bag: S.bag });
  const startLevels = new Map(S.party.map((m) => [m.uid, m.level]));
  ui.screen = 'battle';
  ui.battle = { b, opts, startLevels, menu: 'busy', skip: null, view: { p: {}, e: {} } };
  markSeen(opts.enemy[0].id);
  renderBattle();
  const intro = [];
  if (opts.kind === 'wild') {
    const p = POKEMON[opts.enemy[0].id];
    intro.push({ t: 'send', side: 'e', mon: opts.enemy[0] });
    intro.push({ t: 'msg', text: p.legendary ? `The legendary ${p.name} appeared!` : `A wild ${p.name} appeared!` });
  } else {
    intro.push({ t: 'msg', text: opts.trainer.intro || `${opts.trainer.title} wants to battle!` });
    intro.push({ t: 'send', side: 'e', mon: opts.enemy[0] });
    intro.push({ t: 'msg', text: `${opts.trainer.title} sent out ${monName(opts.enemy[0])}!` });
  }
  intro.push({ t: 'send', side: 'p', mon: b.active('p') });
  intro.push({ t: 'msg', text: `Go, ${monName(b.active('p'))}!` });
  play(intro).then(afterEvents);
}

function renderBattle() {
  const { opts } = ui.battle;
  const bg = BATTLE_BG[opts.bg] || 'grass';
  document.getElementById('app').innerHTML = `
    <div class="battle bg-${bg}">
      <div class="arena">
        <div class="infobox enemy" id="info-e"></div>
        <div class="pad enemy"><div class="shadow"></div><img id="spr-e" class="bsprite" alt=""></div>
        <div class="pad player"><div class="shadow"></div><img id="spr-p" class="bsprite back" alt=""></div>
        <div class="infobox player" id="info-p"></div>
        ${opts.kind === 'trainer' ? `<div class="enemy-balls" id="balls-e"></div>` : ''}
      </div>
      <div class="battle-bottom">
        <div class="textbox" id="btext" title="Click to speed up"></div>
        <div class="controls" id="bctrl"></div>
      </div>
    </div>`;
  document.getElementById('btext').addEventListener('click', () => ui.battle && ui.battle.skip && ui.battle.skip());
}

function setSprite(side, id) {
  const img = document.getElementById('spr-' + side);
  if (!img) return;
  img.classList.remove('faint', 'broken', 'enter');
  img.onerror = () => img.classList.add('broken');
  img.src = spriteUrl(id, side === 'p');
  img.alt = POKEMON[id].name;
  void img.offsetWidth;
  img.classList.add('enter');
}

function updateInfo(side) {
  const v = ui.battle.view[side];
  const el = document.getElementById('info-' + side);
  if (!el || !v.mon) return;
  const mon = v.mon;
  const max = mon.stats.hp;
  const shownId = v.tfId || mon.id;
  const caught = side === 'e' && ui.battle.opts.kind === 'wild' && S.dex.caught[mon.id] ? '<span class="caught-icon" title="Caught before">◓</span>' : '';
  el.innerHTML = `
    <div class="info-top"><b>${POKEMON[shownId].name}</b>${caught}<span class="lv">Lv${mon.level}</span></div>
    <div class="info-types">${typeBadges(POKEMON[shownId].types)} ${statusChip(mon.status)}</div>
    <div class="hprow"><span class="hplabel">HP</span>${hpBar(v.hp, max)}</div>
    ${side === 'p' ? `<div class="hpnum">${Math.max(0, Math.round(v.hp))} / ${max}</div>
      <div class="bar xp"><div class="fill" style="width:${(xpFrac(mon) * 100).toFixed(1)}%"></div></div>` : ''}`;
  if (side === 'e') updateEnemyBalls();
}

function updateEnemyBalls() {
  const el = document.getElementById('balls-e');
  if (!el) return;
  el.innerHTML = ui.battle.b.sides.e.party.map((m) => `<span class="pball ${m.hp > 0 ? '' : 'out'}"></span>`).join('');
}

function setText(text) { const el = document.getElementById('btext'); if (el) el.textContent = text; }

function wait(ms) {
  return new Promise((resolve) => {
    const t = setTimeout(done, ms);
    function done() { clearTimeout(t); if (ui.battle) ui.battle.skip = null; resolve(); }
    if (ui.battle) ui.battle.skip = done;
  });
}

function animate(side, cls, ms) {
  const img = document.getElementById('spr-' + side);
  if (!img) return;
  img.classList.remove(cls); void img.offsetWidth; img.classList.add(cls);
  setTimeout(() => img.classList.remove(cls), ms);
}

async function play(events) {
  const view = ui.battle.view;
  for (const e of events) {
    if (!ui.battle) return;
    switch (e.t) {
      case 'msg': setText(e.text); await wait(950); break;
      case 'hp': view[e.side].hp = e.hp; updateInfo(e.side); await wait(450); break;
      case 'send':
        view[e.side] = { mon: e.mon, hp: e.mon.hp, tfId: e.tfId || null };
        if (e.side === 'e') markSeen(e.mon.id);
        setSprite(e.side, e.tfId || e.mon.id); updateInfo(e.side); await wait(350); break;
      case 'faint': {
        const img = document.getElementById('spr-' + e.side);
        if (img) img.classList.add('faint');
        if (e.side === 'e') updateEnemyBalls();
        await wait(500); break;
      }
      case 'hit': animate(e.side, 'hit', 500); await wait(250); break;
      case 'attack': animate(e.side, e.side === 'p' ? 'lunge-p' : 'lunge-e', 350); await wait(200); break;
      case 'refresh': updateInfo('p'); updateInfo('e'); break;
    }
  }
}

function afterEvents() {
  if (!ui.battle) return;
  const b = ui.battle.b;
  if (b.state === 'over') { finishBattle(); return; }
  ui.battle.menu = b.state === 'forceSwitch' ? 'party' : 'main';
  if (b.state === 'forceSwitch') setText('Choose your next Pokémon.');
  else setText(`What will ${monName(b.active('p'))} do?`);
  renderControls();
}

async function doAction(action) {
  ui.battle.menu = 'busy';
  renderControls();
  const events = ui.battle.b.turn(action);
  await play(events);
  afterEvents();
}

// ---------- Controls ----------
function renderControls() {
  const el = document.getElementById('bctrl');
  if (!el) return;
  const { b, menu } = ui.battle;
  const back = `<button class="btn ghost" data-bact="back">Back</button>`;
  if (menu === 'busy') { el.innerHTML = ''; return; }
  if (menu === 'main') {
    el.innerHTML = `<div class="cmd-grid">
      <button class="btn cmd fight" data-bact="fight">Fight</button>
      <button class="btn cmd bag" data-bact="bag">Bag</button>
      <button class="btn cmd mons" data-bact="party">Pokémon</button>
      <button class="btn cmd run" data-bact="run" ${b.kind === 'trainer' ? 'disabled title="You can\'t run from a trainer battle"' : ''}>Run</button>
    </div>`;
  } else if (menu === 'fight') {
    const moves = b.movesOf('p');
    const anyPP = moves.some((m) => m.pp > 0);
    const foeTypes = b.types('e');
    el.innerHTML = `<div class="move-grid">${anyPP ? moves.map((slot, i) => {
      const mv = MOVES[slot.id];
      const eff = mv.cat === 'X' ? null : typeEffectiveness(mv.type, foeTypes);
      const hint = eff === null ? '' : eff === 0 ? 'No effect' : eff > 1 ? 'Super effective' : eff < 1 ? 'Not very effective' : '';
      return `<button class="btn move" style="--c:${TYPE_COLORS[mv.type]}" data-bact="move" data-idx="${i}" ${slot.pp <= 0 ? 'disabled' : ''}>
        <b>${mv.name}</b><small>${mv.type} · ${mv.cat === 'X' ? 'Status' : mv.cat === 'P' ? 'Physical' : 'Special'}${mv.pow > 1 ? ' · ' + mv.pow : ''}</small>
        <small>PP ${slot.pp}/${mv.pp}${hint ? ` · <em>${hint}</em>` : ''}</small></button>`;
    }).join('') : `<button class="btn move" style="--c:#888" data-bact="move" data-idx="-1"><b>Struggle</b><small>No PP left</small></button>`}</div>${back}`;
  } else if (menu === 'bag') {
    const usable = Object.keys(S.bag).filter((k) => S.bag[k] > 0 && ITEMS[k].kind !== 'stone' &&
      (ITEMS[k].kind !== 'ball' || b.kind === 'wild'));
    el.innerHTML = `<div class="item-list">${usable.length ? usable.map((k) =>
      `<button class="btn item" data-bact="item" data-item="${k}"><b>${ITEMS[k].name}</b><small>×${S.bag[k]} · ${ITEMS[k].desc}</small></button>`).join('')
      : '<p class="muted">No usable items.</p>'}</div>${back}`;
  } else if (menu === 'party') {
    const forced = b.state === 'forceSwitch';
    el.innerHTML = `<div class="item-list">${S.party.map((m, i) => {
      const isActive = i === b.sides.p.active;
      const ok = m.hp > 0 && !isActive;
      return `<button class="btn item partyrow" data-bact="switch" data-idx="${i}" ${ok ? '' : 'disabled'}>
        ${spriteImg(m.id, { cls: 'mini' })}<span><b>${monName(m)}</b> Lv${m.level} ${statusChip(m.status)}${isActive ? ' <em>(in battle)</em>' : ''}
        ${hpBar(m.hp, m.stats.hp)}<small>HP ${m.hp}/${m.stats.hp}</small></span></button>`;
    }).join('')}</div>${forced ? '' : back}`;
  }
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-bact]');
  if (!btn || btn.disabled || !ui.battle || ui.battle.menu === 'busy') return;
  const { b } = ui.battle;
  const act = btn.dataset.bact;
  if (act === 'back') { ui.battle.menu = 'main'; renderControls(); return; }
  if (act === 'fight' || act === 'bag' || act === 'party') { ui.battle.menu = act; renderControls(); return; }
  if (act === 'run') return doAction({ type: 'run' });
  if (act === 'move') return doAction({ type: 'move', idx: +btn.dataset.idx });
  if (act === 'switch') return doAction({ type: 'switch', idx: +btn.dataset.idx });
  if (act === 'item') {
    const id = btn.dataset.item;
    const item = ITEMS[id];
    if (item.kind === 'ball') return doAction({ type: 'ball', item: id });
    const filter = item.kind === 'revive' ? (m) => m.hp <= 0
      : item.kind === 'cure' ? (m) => m.hp > 0 && !!m.status
      : (m) => m.hp > 0 && m.hp < m.stats.hp;
    const idx = await pickPartyMember(`Use ${item.name} on…`, filter);
    if (idx === null) return;
    return doAction({ type: 'item', item: id, target: idx });
  }
});

// ---------- End of battle ----------
async function finishBattle() {
  const { b, opts, startLevels } = ui.battle;
  const result = b.result;
  const lines = [];
  if (result === 'caught') {
    const mon = b.active('e');
    delete mon._fainted;
    markCaught(mon.id);
    if (S.party.length < 6) { S.party.push(mon); lines.push(`${monName(mon)} joined your party!`); }
    else { S.pc.push(mon); lines.push(`Your party is full. ${monName(mon)} was sent to the PC.`); }
  } else if (result === 'win' && opts.trainer) {
    S.money += opts.trainer.reward;
    lines.push(`You defeated ${opts.trainer.title}!`);
    lines.push(`You got ${money(opts.trainer.reward)} for winning!`);
  } else if (result === 'lose') {
    const lost = Math.floor(S.money / 2);
    S.money -= lost;
    S.party.forEach(healMon);
    lines.push(`You blacked out and dropped ${money(lost)}...`);
    lines.push('You rushed back to the Pokémon Center. Your team is healed.');
  }
  for (const text of lines) { setText(text); await wait(1200); }

  // Moves that need a choice, then evolutions for anything that leveled up.
  if (result !== 'lose') {
    for (const { mon, move } of b.pendingLearn) await learnMoveFlow(mon, move);
    for (const mon of [...S.party]) {
      if (mon.level === startLevels.get(mon.uid)) continue;
      const to = levelEvolution(mon);
      if (to) await evolveFlow(mon, to);
    }
  }
  const battle = ui.battle;
  ui.battle = null;
  saveGame();
  const tookOver = battle.opts.onEnd ? await battle.opts.onEnd(result) : false;
  if (!tookOver) { ui.screen = 'hub'; render(); }
}
