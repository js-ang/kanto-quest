// Battle screen in the style of FireRed/LeafGreen: drawn backdrops and platforms, sliding intro,
// Poké Ball send-outs, typewriter text, type-based move effects, and the classic command boxes.

const BATTLE_BG = {
  route1: 'grass', viridian: 'forest', mtmoon: 'cave', cerulean: 'grass', rocktunnel: 'cave', vermilion: 'water',
  celadon: 'grass', tower: 'night', safari: 'grass', powerplant: 'night', seafoam: 'water', cinnabar: 'night',
  victory: 'cave', ceruleancave: 'cave', gym: 'gym', league: 'league',
};
const $id = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// opts: { kind: 'wild'|'trainer', enemy: [mons], trainer: {title, sprite, reward, intro}, bg, onEnd(result) => bool (true = it took over) }
function startBattle(opts) {
  const b = new Battle({ kind: opts.kind, playerParty: S.party, enemyParty: opts.enemy, trainer: opts.trainer, bag: S.bag });
  const startLevels = new Map(S.party.map((m) => [m.uid, m.level]));
  ui.screen = 'battle';
  ui.battle = { b, opts, startLevels, menu: 'busy', skip: null, view: { p: {}, e: {} }, moveHover: 0 };
  markSeen(opts.enemy[0].id);
  renderBattle();
  const lead = b.active('p');
  const intro = [{ t: 'pause', ms: 950 }]; // platforms slide in
  if (opts.kind === 'wild') {
    const p = POKEMON[opts.enemy[0].id];
    intro.push({ t: 'reveal' });
    intro.push({ t: 'msg', text: p.legendary ? `The legendary ${p.name} appeared!` : `A wild ${p.name} appeared!` });
  } else {
    intro.push({ t: 'msg', text: opts.trainer.intro || `${opts.trainer.title} would like to battle!` });
    intro.push({ t: 'trainerOut' });
    intro.push({ t: 'msg', text: `${opts.trainer.title} sent out ${monName(opts.enemy[0])}!`, hold: 150 });
    intro.push({ t: 'send', side: 'e', mon: opts.enemy[0] });
  }
  intro.push({ t: 'msg', text: `Go! ${monName(lead)}!`, hold: 150 });
  intro.push({ t: 'send', side: 'p', mon: lead });
  play(intro).then(afterEvents);
}

function renderBattle() {
  const { opts, b } = ui.battle;
  const bg = BATTLE_BG[opts.bg] || 'grass';
  const wildMon = opts.kind === 'wild' ? opts.enemy[0] : null;
  $id('app').innerHTML = `
    <div class="battle">
      <div class="arena" id="arena">
        ${backdropSvg(bg)}
        <div class="pad enemy intro" id="pad-e">${platformSvg(bg)}
          <div class="spr-wrap"><img id="spr-e" class="bsprite ${wildMon ? 'shadowed' : 'gone'}" alt="" ${wildMon ? `src="${spriteUrl(wildMon.id)}"` : ''}></div>
          ${opts.kind === 'trainer' && opts.trainer.sprite ? `<img id="trainer-e" class="trainer-spr" src="${opts.trainer.sprite}" alt="" onerror="this.remove()">` : ''}
        </div>
        <div class="pad player intro" id="pad-p">${platformSvg(bg)}
          <div class="spr-wrap"><img id="spr-p" class="bsprite back gone" alt=""></div>
        </div>
        <div class="infobox enemy hidden" id="info-e"></div>
        <div class="infobox player hidden" id="info-p"></div>
        ${opts.kind === 'trainer' ? `<div class="enemy-balls" id="balls-e">${b.sides.e.party.map(() => '<span class="pball"></span>').join('')}</div>` : ''}
        <div class="fx-layer" id="fx"></div>
      </div>
      <div class="battle-bottom mode-busy" id="bbottom">
        <div class="textbox" id="btext"><span id="btext-inner"></span><span class="more" id="bmore">▼</span></div>
        <div class="controls" id="bctrl"></div>
      </div>
    </div>`;
  const skip = () => ui.battle && ui.battle.skip && ui.battle.skip();
  $id('btext').addEventListener('click', skip);
  $id('arena').addEventListener('click', skip);
  for (const img of document.querySelectorAll('.bsprite')) img.onerror = () => img.classList.add('broken');
}

// ---------- Text ----------
function setText(text) { const el = $id('btext-inner'); if (el) el.textContent = text; showMore(false); }
function showMore(on) { const m = $id('bmore'); if (m) m.classList.toggle('on', on); }

function typeText(text) {
  return new Promise((resolve) => {
    const el = $id('btext-inner');
    const B = ui.battle;
    if (!el || !B) return resolve();
    showMore(false);
    let i = 0;
    const finish = () => { clearTimeout(B.typer); el.textContent = text; B.skip = null; resolve(); };
    const tick = () => {
      if (ui.battle !== B) return resolve();
      i += 1;
      el.textContent = text.slice(0, i);
      if (i >= text.length) return finish();
      B.typer = setTimeout(tick, 18);
    };
    B.skip = finish;
    tick();
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    const B = ui.battle;
    const t = setTimeout(done, ms);
    function done() { clearTimeout(t); if (B) B.skip = null; resolve(); }
    if (B) B.skip = done;
  });
}

// ---------- Info boxes ----------
function updateInfo(side) {
  const v = ui.battle.view[side];
  const el = $id('info-' + side);
  if (!el || !v.mon) return;
  const mon = v.mon;
  const shownId = v.tfId || mon.id;
  const caught = side === 'e' && ui.battle.opts.kind === 'wild' && S.dex.caught[mon.id] ? '<span class="caught-icon" title="Caught before"></span>' : '';
  el.innerHTML = `
    <div class="ib-name"><span>${POKEMON[shownId].name}</span>${caught}<span class="ib-lv">Lv${mon.level}</span></div>
    <div class="ib-sub">${typeBadges(POKEMON[shownId].types)} ${statusChip(mon.status)}</div>
    <div class="ib-hp"><span class="hp-tag">HP</span><div class="bar hp"><div class="fill"></div></div></div>
    ${side === 'p' ? `<div class="ib-num"></div>
      <div class="ib-exp"><span class="exp-tag">EXP</span><div class="bar xp"><div class="fill" style="width:${(xpFrac(mon) * 100).toFixed(1)}%"></div></div></div>` : ''}`;
  setHpVisual(side, v.hp);
  if (side === 'e') updateEnemyBalls();
}

function setHpVisual(side, hp) {
  const v = ui.battle.view[side];
  const el = $id('info-' + side);
  if (!el || !v.mon) return;
  const max = v.mon.stats.hp;
  const f = Math.max(0, hp / max);
  const fill = el.querySelector('.bar.hp .fill');
  fill.style.width = (f * 100).toFixed(1) + '%';
  fill.className = 'fill ' + hpColor(f);
  const num = el.querySelector('.ib-num');
  if (num) num.textContent = `${Math.max(0, Math.round(hp))}/ ${max}`;
}

// Drain or fill the HP bar smoothly, counting the number like the GBA games.
function animateHp(side, to) {
  return new Promise((resolve) => {
    const v = ui.battle.view[side];
    const from = v.hp;
    const max = v.mon.stats.hp;
    const dur = Math.min(1100, 250 + (Math.abs(to - from) / max) * 900);
    const start = performance.now();
    const B = ui.battle;
    const step = (now) => {
      if (ui.battle !== B) return resolve();
      const k = Math.min(1, (now - start) / dur);
      v.hp = from + (to - from) * k;
      setHpVisual(side, v.hp);
      if (k < 1) requestAnimationFrame(step); else { v.hp = to; resolve(); }
    };
    requestAnimationFrame(step);
  });
}

function updateEnemyBalls() {
  const el = $id('balls-e');
  if (!el) return;
  el.innerHTML = ui.battle.b.sides.e.party.map((m) => `<span class="pball ${m.hp > 0 ? '' : 'out'}"></span>`).join('');
}

// ---------- Animations ----------
function restartClass(el, cls, ms) {
  if (!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  if (ms) setTimeout(() => el.classList.remove(cls), ms);
}

// Center of a side's Pokémon, as % of the arena.
function spriteCenter(side) {
  const arena = $id('arena'), img = $id('spr-' + side);
  const a = arena.getBoundingClientRect(), r = img.getBoundingClientRect();
  return { x: ((r.left + r.width / 2 - a.left) / a.width) * 100, y: ((r.top + r.height * 0.55 - a.top) / a.height) * 100 };
}

const FX_STYLE = {
  Fire: 'flame', Water: 'drop', Grass: 'leaf', Electric: 'bolt', Ice: 'shard', Psychic: 'ring', Ghost: 'ring',
  Poison: 'bubble', Ground: 'rock', Rock: 'rock', Fighting: 'impact', Normal: 'impact', Flying: 'slash', Bug: 'slash',
  Dragon: 'ring', Steel: 'impact', Dark: 'slash', sleep: 'zzz',
};
function spawnFx(side, type, count = 10) {
  const layer = $id('fx');
  if (!layer) return;
  const { x, y } = spriteCenter(side);
  const style = FX_STYLE[type] || 'impact';
  const box = document.createElement('div');
  box.className = `fx fx-${style}`;
  box.style.left = x + '%';
  box.style.top = y + '%';
  box.style.setProperty('--c', type === 'sleep' ? '#9fb3c8' : TYPE_COLORS[type] || '#fff');
  let html = style === 'zzz' ? '' : '<b></b>';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * 360 + Math.random() * 30;
    const d = 6 + Math.random() * 7;
    const ox = (Math.random() - 0.5) * 12;
    html += `<i style="--a:${a.toFixed(0)}deg;--d:${d.toFixed(1)}cqw;--ox:${ox.toFixed(1)}cqw;animation-delay:${(Math.random() * 160).toFixed(0)}ms">${style === 'zzz' ? 'z' : ''}</i>`;
  }
  box.innerHTML = html;
  layer.appendChild(box);
  setTimeout(() => box.remove(), 1100);
}

function statFx(side, up) {
  const layer = $id('fx');
  if (!layer) return;
  const { x, y } = spriteCenter(side);
  const box = document.createElement('div');
  box.className = `fx statfx ${up ? 'up' : 'down'}`;
  box.style.left = x + '%';
  box.style.top = y + '%';
  box.innerHTML = Array.from({ length: 7 }, (_, i) => `<i style="--ox:${((i - 3) * 2.6).toFixed(1)}cqw;animation-delay:${(i % 3) * 110}ms">${up ? '▲' : '▼'}</i>`).join('');
  layer.appendChild(box);
  restartClass($id('spr-' + side), up ? 'tint-up' : 'tint-down', 700);
  setTimeout(() => box.remove(), 1000);
}

async function throwBall(side) {
  const layer = $id('fx');
  const target = spriteCenter(side);
  const ball = document.createElement('div');
  ball.className = `ball-throw from-${side}`;
  ball.style.setProperty('--tx', target.x + '%');
  ball.style.setProperty('--ty', (target.y + 6) + '%');
  layer.appendChild(ball);
  await sleep(480);
  ball.remove();
  const pop = document.createElement('div');
  pop.className = 'ball-pop';
  pop.style.left = target.x + '%';
  pop.style.top = (target.y + 6) + '%';
  layer.appendChild(pop);
  setTimeout(() => pop.remove(), 500);
}

// Ball flies at the wild Pokémon, pulls it in, wobbles, then holds or bursts open.
async function catchAnim(caught, shakes) {
  const layer = $id('fx');
  const img = $id('spr-e');
  const target = spriteCenter('e');
  const ball = document.createElement('div');
  ball.className = 'ball-throw catch-throw';
  ball.style.setProperty('--tx', target.x + '%');
  ball.style.setProperty('--ty', target.y + '%');
  layer.appendChild(ball);
  await sleep(500);
  ball.classList.remove('catch-throw');
  ball.style.left = target.x + '%';
  ball.style.top = target.y + '%';
  restartClass(img, 'recall');
  await sleep(450);
  img.classList.add('gone');
  ball.classList.add('drop');
  await sleep(380);
  for (let i = 0; i < shakes; i++) { restartClass(ball, 'wobble'); await sleep(650); }
  if (caught) {
    ball.classList.add('caught');
    await sleep(500);
  } else {
    ball.remove();
    const pop = document.createElement('div');
    pop.className = 'ball-pop';
    pop.style.left = target.x + '%';
    pop.style.top = (target.y + 14) + '%';
    layer.appendChild(pop);
    setTimeout(() => pop.remove(), 500);
    img.classList.remove('recall', 'gone');
    restartClass(img, 'appear', 450);
    await sleep(420);
  }
  if (caught) setTimeout(() => ball.remove(), 3000);
}

async function sendOut(e) {
  const view = ui.battle.view;
  view[e.side] = { mon: e.mon, hp: e.mon.hp, tfId: e.tfId || null };
  if (e.side === 'e') markSeen(e.mon.id);
  const img = $id('spr-' + e.side);
  if (e.tfId) { // Transform: flash and swap
    restartClass(img, 'flash', 500);
    await sleep(220);
    img.src = spriteUrl(e.tfId, e.side === 'p');
    updateInfo(e.side);
    await sleep(300);
    return;
  }
  img.classList.remove('faint', 'broken', 'appear', 'recall', 'shadowed');
  img.classList.add('gone');
  img.src = spriteUrl(e.mon.id, e.side === 'p');
  await throwBall(e.side);
  img.classList.remove('gone');
  restartClass(img, 'appear', 450);
  updateInfo(e.side);
  $id('info-' + e.side).classList.remove('hidden');
  await sleep(420);
}

async function play(events) {
  const view = ui.battle.view;
  for (const e of events) {
    if (!ui.battle) return;
    switch (e.t) {
      case 'pause': await sleep(e.ms); break;
      case 'msg': await typeText(e.text); await wait(e.hold != null ? e.hold : 650); break;
      case 'reveal': {
        const mon = ui.battle.opts.enemy[0];
        view.e = { mon, hp: mon.hp, tfId: null };
        $id('spr-e').classList.remove('shadowed');
        updateInfo('e');
        $id('info-e').classList.remove('hidden');
        restartClass($id('spr-e'), 'cry', 600);
        await sleep(350);
        break;
      }
      case 'trainerOut': {
        const t = $id('trainer-e');
        if (t) { t.classList.add('leave'); await sleep(450); t.remove(); }
        break;
      }
      case 'send': await sendOut(e); break;
      case 'hp': await animateHp(e.side, e.hp); break;
      case 'faint': {
        const img = $id('spr-' + e.side);
        img.classList.add('faint');
        await sleep(550);
        $id('info-' + e.side).classList.add('hidden');
        if (e.side === 'e') updateEnemyBalls();
        await sleep(200);
        break;
      }
      case 'recall': {
        restartClass($id('spr-' + e.side), 'recall');
        $id('info-' + e.side).classList.add('hidden');
        await sleep(450);
        break;
      }
      case 'attack': {
        const mv = MOVES[e.move];
        ui.battle.lastMove = mv;
        if (mv.cat === 'P') { restartClass($id('spr-' + e.side), e.side === 'p' ? 'lunge-p' : 'lunge-e', 400); await sleep(260); }
        else if (mv.cat === 'S') { restartClass($id('spr-' + e.side), 'charge', 400); await sleep(250); }
        break;
      }
      case 'hit': {
        const mv = MOVES[e.move];
        spawnFx(e.side, mv.typeless ? 'Normal' : mv.type, e.eff > 1 ? 14 : 10);
        await sleep(180);
        restartClass($id('spr-' + e.side), 'hit', 600);
        if (e.eff > 1 || e.crit) restartClass($id('arena'), 'shake', 450);
        await sleep(380);
        break;
      }
      case 'stat': statFx(e.side, e.up); await sleep(550); break;
      case 'statusfx': {
        const type = { brn: 'Fire', psn: 'Poison', par: 'Electric', frz: 'Ice', slp: 'sleep' }[e.s];
        spawnFx(e.side, type, 7);
        await sleep(450);
        break;
      }
      case 'catch': await catchAnim(e.caught, e.shakes); break;
      case 'refresh': updateInfo('p'); updateInfo('e'); break;
    }
  }
}

function afterEvents() {
  if (!ui.battle) return;
  const b = ui.battle.b;
  if (b.state === 'over') { finishBattle(); return; }
  ui.battle.menu = b.state === 'forceSwitch' ? 'party' : 'main';
  if (b.state === 'forceSwitch') setText('Bring out which Pokémon?');
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
function setMode(mode) { const el = $id('bbottom'); if (el) el.className = 'battle-bottom mode-' + mode; }

function moveInfoHtml(slot) {
  const mv = MOVES[slot.id];
  const { b } = ui.battle;
  const eff = mv.cat === 'X' ? null : typeEffectiveness(mv.type, b.types('e'));
  const hint = eff === null ? '' : eff === 0 ? 'No effect' : eff > 1 ? 'Super effective' : eff < 1 ? 'Not very effective' : '';
  return `<div class="mi-row"><span>PP</span><b class="${slot.pp <= mv.pp / 4 ? 'low' : ''}">${slot.pp}/${mv.pp}</b></div>
    <div class="mi-row"><span>TYPE/</span><b>${mv.type.toUpperCase()}</b></div>
    <div class="mi-sub">${mv.cat === 'X' ? 'Status' : `${mv.cat === 'P' ? 'Physical' : 'Special'} · ${mv.fixed ? 'Lv dmg' : 'Pow ' + mv.pow}`}${hint ? ` · <em>${hint}</em>` : ''}</div>`;
}

function renderControls() {
  const el = $id('bctrl');
  if (!el) return;
  const { b, menu } = ui.battle;
  const back = `<button class="gba-btn back" data-bact="back">Back</button>`;
  if (menu === 'busy') { setMode('busy'); el.innerHTML = ''; return; }
  if (menu === 'main') {
    setMode('cmd');
    el.innerHTML = `<div class="cmd-box">
      <button class="gba-btn" data-bact="fight">FIGHT</button>
      <button class="gba-btn" data-bact="bag">BAG</button>
      <button class="gba-btn" data-bact="party">POKéMON</button>
      <button class="gba-btn" data-bact="run" ${b.kind === 'trainer' ? 'disabled title="You can\'t run from a trainer battle"' : ''}>RUN</button>
    </div>`;
  } else if (menu === 'fight') {
    setMode('fight');
    const moves = b.movesOf('p');
    const anyPP = moves.some((m) => m.pp > 0);
    const hover = Math.min(ui.battle.moveHover, moves.length - 1);
    el.innerHTML = `<div class="move-box">${anyPP ? moves.map((slot, i) =>
      `<button class="gba-btn move" style="--c:${TYPE_COLORS[MOVES[slot.id].type]}" data-bact="move" data-idx="${i}" ${slot.pp <= 0 ? 'disabled' : ''}>${MOVES[slot.id].name.toUpperCase()}</button>`).join('')
      : `<button class="gba-btn move" style="--c:#888" data-bact="move" data-idx="-1">STRUGGLE</button>`}${back}</div>
      <div class="move-info" id="move-info">${anyPP ? moveInfoHtml(moves[hover]) : '<div class="mi-sub">No PP left!</div>'}</div>`;
  } else if (menu === 'bag') {
    setMode('list');
    const usable = Object.keys(S.bag).filter((k) => S.bag[k] > 0 && ITEMS[k].kind !== 'stone' &&
      (ITEMS[k].kind !== 'ball' || b.kind === 'wild'));
    el.innerHTML = `<div class="list-box">${usable.length ? usable.map((k) =>
      `<button class="gba-btn item" data-bact="item" data-item="${k}"><b>${ITEMS[k].name}</b><span>×${S.bag[k]}</span><small>${ITEMS[k].desc}</small></button>`).join('')
      : '<p class="muted">No usable items.</p>'}</div>${back}`;
  } else if (menu === 'party') {
    setMode('list');
    const forced = b.state === 'forceSwitch';
    el.innerHTML = `<div class="list-box party">${S.party.map((m, i) => {
      const isActive = i === b.sides.p.active;
      const ok = m.hp > 0 && !isActive;
      return `<button class="gba-btn item partyrow" data-bact="switch" data-idx="${i}" ${ok ? '' : 'disabled'}>
        ${spriteImg(m.id, { cls: 'mini' })}<span class="pr-main"><b>${monName(m)}</b> <small>Lv${m.level}</small> ${statusChip(m.status)}${isActive ? ' <em>in battle</em>' : ''}
        ${hpBar(m.hp, m.stats.hp)}<small>HP ${m.hp}/${m.stats.hp}</small></span></button>`;
    }).join('')}</div>${forced ? '' : back}`;
  }
}

document.addEventListener('mouseover', (e) => {
  const btn = e.target.closest('.gba-btn.move');
  if (!btn || !ui.battle || ui.battle.menu !== 'fight') return;
  const i = +btn.dataset.idx;
  if (i < 0) return;
  ui.battle.moveHover = i;
  const box = $id('move-info');
  if (box) box.innerHTML = moveInfoHtml(ui.battle.b.movesOf('p')[i]);
});

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-bact]');
  if (!btn || btn.disabled || !ui.battle || ui.battle.menu === 'busy') return;
  const act = btn.dataset.bact;
  if (act === 'back') { ui.battle.menu = 'main'; setText(`What will ${monName(ui.battle.b.active('p'))} do?`); renderControls(); return; }
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
  setMode('busy');
  for (const text of lines) { await typeText(text); showMore(true); await wait(1100); }

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
