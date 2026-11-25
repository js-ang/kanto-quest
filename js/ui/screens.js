// Title, starter selection, and the hub (explore, gyms, party, bag, PC, Pokédex, mart).

function render() {
  const app = document.getElementById('app');
  if (ui.screen === 'title') app.innerHTML = titleScreen();
  else if (ui.screen === 'starter') app.innerHTML = starterScreen();
  else if (ui.screen === 'hub') app.innerHTML = hubScreen();
}

// ---------- Title & starter ----------
function titleScreen() {
  const can = hasSave();
  return `<div class="title-screen">
    <div class="title-sprites">${[25, 6, 9, 3].map((id) => spriteImg(id, { cls: 'big' })).join('')}</div>
    <h1 class="logo">Kanto Quest</h1>
    <p class="tagline">Catch all 151. Earn 8 badges. Become Champion.</p>
    <div class="title-buttons">
      ${can ? `<button class="btn primary big" data-act="continue">Continue</button>` : ''}
      <button class="btn ${can ? '' : 'primary'} big" data-act="newgame">New Game</button>
    </div>
  </div>`;
}

const STARTER_BLURB = {
  1: 'A strange seed was planted on its back at birth. Steady and sturdy.',
  4: 'The flame on its tail shows its life force. Fast and fierce.',
  7: 'It shelters in its shell, then strikes back with water. Tough and reliable.',
};
function starterScreen() {
  return `<div class="starter-screen">
    <h1 class="logo small">Choose your partner</h1>
    <p class="tagline">Professor Oak holds out three Poké Balls…</p>
    <div class="starter-cards">${[1, 4, 7].map((id) => {
      const p = POKEMON[id];
      return `<button class="starter-card" data-act="pickstarter" data-id="${id}" style="--c:${TYPE_COLORS[p.types[0]]}">
        ${spriteImg(id, { cls: 'big' })}<h3>${p.name}</h3><div>${typeBadges(p.types)}</div><p>${STARTER_BLURB[id]}</p></button>`;
    }).join('')}</div>
  </div>`;
}

// ---------- Hub ----------
const TABS = [['explore', 'Explore'], ['gyms', 'Gyms'], ['party', 'Party'], ['bag', 'Bag'], ['pc', 'PC'], ['dex', 'Pokédex'], ['mart', 'Poké Mart']];

function hubScreen() {
  const badgeIcons = GYMS.map((g, i) => `<span class="badge ${i < S.badges ? 'earned' : ''}" style="--c:${TYPE_COLORS[g.type]}" title="${g.badge}${i < S.badges ? '' : ' (not earned)'}"></span>`).join('');
  const caughtN = Object.keys(S.dex.caught).length;
  const body = { explore: exploreTab, gyms: gymsTab, party: partyTab, bag: bagTab, pc: pcTab, dex: dexTab, mart: martTab }[ui.tab]();
  return `<div class="hub">
    <header class="topbar">
      <div class="brand">Kanto Quest${S.champion ? ' <span class="champ">★ Champion</span>' : ''}</div>
      <div class="top-stats">
        <span class="stat-pill">${money(S.money)}</span>
        <span class="stat-pill">Pokédex ${caughtN}/151</span>
        <span class="badges">${badgeIcons}</span>
      </div>
      <div class="top-actions">
        <button class="btn heal" data-act="heal">Pokémon Center</button>
        <button class="btn ghost" data-act="save">Save</button>
      </div>
    </header>
    <nav class="tabs">${TABS.map(([k, label]) => `<button class="tab ${ui.tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${label}${k === 'party' ? ` <small>${S.party.length}/6</small>` : ''}</button>`).join('')}</nav>
    <main class="tab-body">${body}</main>
    <div class="party-strip">${S.party.map((m) => `<div class="strip-mon ${m.hp <= 0 ? 'fainted' : ''}" title="${esc(monName(m))} Lv${m.level}">
      ${spriteImg(m.id, { cls: 'mini' })}<div class="strip-info"><small>Lv${m.level}</small>${hpBar(m.hp, m.stats.hp)}</div></div>`).join('')}</div>
  </div>`;
}

// ----- Explore
function exploreTab() {
  const loc = LOCATIONS.find((l) => l.id === ui.loc) || LOCATIONS[0];
  const list = LOCATIONS.map((l) => {
    const open = locUnlocked(l);
    const req = l.champion ? 'Champion only' : `${l.badges} badge${l.badges === 1 ? '' : 's'}`;
    return `<button class="loc ${l.id === loc.id ? 'active' : ''} ${open ? '' : 'locked'}" data-act="loc" data-id="${l.id}">
      <b>${open ? '' : '🔒 '}${l.name}</b><small>${open ? `Lv ${l.levels[0]}–${l.levels[1]}` : `Needs ${req}`}</small></button>`;
  }).join('');
  return `<div class="explore">
    <aside class="loclist">${list}</aside>
    <section class="locdetail">${locationDetail(loc)}</section>
  </div>`;
}

function locationDetail(loc) {
  if (!locUnlocked(loc)) {
    return `<h2>${loc.name}</h2><p class="muted">${loc.desc}</p>
      <div class="locked-box">🔒 ${loc.champion ? 'Become the Pokémon League Champion to enter.' : `Earn ${loc.badges} gym badge${loc.badges === 1 ? '' : 's'} to travel here.`}</div>`;
  }
  const pool = locationPool(loc);
  const legends = [loc.legendary, loc.legendary2].filter(Boolean);
  const caughtN = pool.filter((p) => S.dex.caught[p.id]).length;
  const speciesHtml = pool.length > 60
    ? `<p class="muted">Every non-legendary Pokémon in Kanto can appear here.</p>`
    : `<div class="species-row">${pool.map((p) => speciesIcon(p.id)).join('')}${legends.map((l) => speciesIcon(l.id, true)).join('')}</div>`;
  const trainers = locationTrainers(loc);
  return `<div class="loc-head"><div><h2>${loc.name}</h2><p class="muted">${loc.desc}</p></div>
      <span class="stat-pill">Lv ${loc.levels[0]}–${loc.levels[1]}</span></div>
    <button class="btn primary big grass-btn" data-act="explore">🌿 Walk through the tall grass</button>
    <h3>Pokémon here <small class="muted">${caughtN}/${pool.length} caught</small></h3>
    ${speciesHtml}
    ${legends.length ? `<p class="legend-hint">✦ Rumors say a legendary Pokémon hides here…${legends.every((l) => S.dex.caught[l.id]) ? ' (caught!)' : ''}</p>` : ''}
    <h3>Trainers</h3>
    <div class="trainer-list">${trainers.map((t) => {
      const beat = S.beaten[t.key];
      return `<div class="trainer-card ${beat ? 'beaten' : ''}">
        <div><b>${t.cls} ${t.name}</b><small>${t.team.length} Pokémon · Lv ${Math.min(...t.team.map((x) => x[1]))}–${Math.max(...t.team.map((x) => x[1]))}</small></div>
        <button class="btn ${beat ? 'ghost' : 'primary'}" data-act="trainer" data-key="${t.key}">${beat ? 'Rematch' : 'Battle'}</button></div>`;
    }).join('')}</div>`;
}

function speciesIcon(id, legendary = false) {
  const caught = S.dex.caught[id], seen = S.dex.seen[id];
  const p = POKEMON[id];
  const label = seen ? `${p.name} · ${rarityOf(p)}${caught ? ' · caught' : ''}` : 'Unknown Pokémon';
  return `<button class="species ${caught ? 'caught' : seen ? 'seen' : 'unseen'} ${legendary ? 'legend' : ''}" data-act="dexinfo" data-id="${id}" title="${esc(label)}">
    ${seen ? spriteImg(id, { cls: 'mini', silhouette: !caught }) : '<span class="q">?</span>'}</button>`;
}

// ----- Gyms
function gymsTab() {
  const gyms = GYMS.map((g, i) => {
    const earned = i < S.badges, open = i === S.badges;
    const maxLv = Math.max(...g.team.map((x) => x[1]));
    return `<div class="gym-card ${earned ? 'earned' : ''} ${open ? 'open' : ''}" style="--c:${TYPE_COLORS[g.type]}">
      <div class="gym-badge"></div>
      <div class="gym-info"><small>${g.city} Gym</small><h3>${g.leader}</h3><div>${typeBadge(g.type)} <small>${g.team.length} Pokémon · up to Lv${maxLv}</small></div></div>
      ${earned ? `<span class="earned-tag">${g.badge} ✓</span>`
        : open ? `<button class="btn primary" data-act="gym" data-idx="${i}">Challenge</button>`
        : `<span class="muted">🔒 Needs ${i} badge${i === 1 ? '' : 's'}</span>`}
    </div>`;
  }).join('');
  const leagueOpen = S.badges >= 8;
  return `<div class="gyms">${gyms}</div>
    <div class="league-card ${leagueOpen ? 'open' : ''}">
      <div><h3>Pokémon League</h3><p class="muted">Face the Elite Four — ${ELITE_FOUR.map((e) => e.leader).join(', ')} — and then the Champion, back to back. Your team is healed between battles, but losing any battle sends you back to the start.</p></div>
      ${leagueOpen ? `<button class="btn primary big" data-act="league">${S.champion ? 'Defend your title' : 'Enter the League'}</button>` : `<span class="muted">🔒 Needs all 8 badges</span>`}
    </div>`;
}

// ----- Party
function partyTab() {
  return `<p class="muted">The first healthy Pokémon leads in battle. Use "Moves" to relearn moves from a Pokémon's level-up list.</p>
  <div class="party-grid">${S.party.map((m, i) => monCard(m, i)).join('')}</div>`;
}

function monCard(m, i) {
  const p = POKEMON[m.id];
  const next = m.level >= 100 ? '—' : `${xpForLevel(m.level + 1) - m.xp} to next level`;
  return `<div class="moncard ${m.hp <= 0 ? 'fainted' : ''}">
    <div class="mc-head">${spriteImg(m.id, { cls: 'med' })}
      <div class="mc-id"><h3>${p.name} <span class="lv">Lv${m.level}</span></h3>
        <div>${typeBadges(p.types)} ${statusChip(m.status)}${m.hp <= 0 ? '<span class="status st-fnt">FNT</span>' : ''}</div>
        <div class="hprow">${hpBar(m.hp, m.stats.hp)}<small>${m.hp}/${m.stats.hp}</small></div>
        <div class="bar xp"><div class="fill" style="width:${(xpFrac(m) * 100).toFixed(1)}%"></div></div><small class="muted">${next}</small>
      </div></div>
    <div class="mc-stats">${STAT_KEYS.slice(1).map((k) => `<span><small>${STAT_NAMES[k]}</small><b>${m.stats[k]}</b></span>`).join('')}</div>
    <div class="movegrid">${m.moves.map(moveChip).join('')}</div>
    <div class="mc-actions">
      ${i > 0 ? `<button class="btn small" data-act="lead" data-idx="${i}">Make lead</button>` : '<span class="lead-tag">Lead</span>'}
      <button class="btn small ghost" data-act="relearn" data-idx="${i}">Moves</button>
      ${S.party.length > 1 ? `<button class="btn small ghost" data-act="deposit" data-idx="${i}">To PC</button>` : ''}
    </div>
  </div>`;
}

// ----- Bag
function bagTab() {
  const keys = Object.keys(S.bag).filter((k) => S.bag[k] > 0);
  if (!keys.length) return '<p class="muted">Your bag is empty. Visit the Poké Mart!</p>';
  return `<div class="bag-list">${keys.map((k) => {
    const it = ITEMS[k];
    const usable = it.kind !== 'ball';
    return `<div class="bag-row"><div><b>${it.name}</b> <span class="muted">×${S.bag[k]}</span><br><small class="muted">${it.desc}</small></div>
      ${usable ? `<button class="btn small" data-act="useitem" data-item="${k}">Use</button>` : '<small class="muted">Use in battle</small>'}</div>`;
  }).join('')}</div>`;
}

// ----- PC
function pcTab() {
  if (!S.pc.length) return '<p class="muted">Your PC box is empty. Pokémon you catch with a full party are sent here.</p>';
  return `<p class="muted">${S.pc.length} Pokémon in storage. Your party holds up to 6.</p>
  <div class="pc-grid">${S.pc.map((m, i) => `<div class="pc-mon">${spriteImg(m.id, { cls: 'med' })}
    <b>${monName(m)}</b><small>Lv${m.level}</small>
    <button class="btn small" data-act="withdraw" data-idx="${i}" ${S.party.length >= 6 ? 'disabled title="Party is full"' : ''}>Withdraw</button></div>`).join('')}</div>`;
}

// ----- Pokédex
function dexTab() {
  const seenN = Object.keys(S.dex.seen).length, caughtN = Object.keys(S.dex.caught).length;
  const cells = POKEMON.slice(1).map((p) => {
    const caught = S.dex.caught[p.id], seen = S.dex.seen[p.id];
    return `<button class="dex-cell ${caught ? 'caught' : seen ? 'seen' : 'unseen'}" data-act="dexinfo" data-id="${p.id}">
      <small>#${String(p.id).padStart(3, '0')}</small>
      ${seen ? spriteImg(p.id, { cls: 'mini', silhouette: !caught }) : '<span class="q">?</span>'}
      <span class="dex-name">${seen ? p.name : '???'}</span></button>`;
  }).join('');
  return `<p class="muted">Seen ${seenN} · Caught ${caughtN} of 151</p><div class="dex-grid">${cells}</div>`;
}

function dexInfo(id) {
  const p = POKEMON[id];
  if (!S.dex.seen[id]) { alertModal('???', '<p>You haven\'t seen this Pokémon yet.</p>'); return; }
  const where = LOCATIONS.filter((l) => locationPool(l).includes(p) || (l.legendary && l.legendary.id === id) || (l.legendary2 && l.legendary2.id === id));
  const evo = p.evolutions.map((e) => `${POKEMON[e.to].name} (${e.level ? 'Lv ' + e.level : e.item})`).join(', ');
  const maxStat = 160;
  const stats = STAT_KEYS.map((k) => `<div class="statbar"><small>${STAT_NAMES[k]}</small><div class="bar"><div class="fill" style="width:${Math.min(100, (p.base[k] / maxStat) * 100)}%"></div></div><b>${p.base[k]}</b></div>`).join('');
  alertModal(`#${String(id).padStart(3, '0')} ${p.name}`, `
    <div class="dex-info"><div class="dex-art">${spriteImg(id, { cls: 'big', silhouette: !S.dex.caught[id] })}</div>
      <div><div>${typeBadges(p.types)}</div>
      <p><b>Rarity:</b> ${rarityOf(p)} · <b>Catch rate:</b> ${p.catchRate} · <b>Base total:</b> ${p.bst}</p>
      ${evo ? `<p><b>Evolves into:</b> ${evo}</p>` : ''}
      <p><b>Found in:</b> ${where.length ? where.map((l) => l.name).join(', ') : 'Starter only'}</p></div></div>
    <div class="statbars">${stats}</div>`);
}

// ----- Mart
function martTab() {
  return `<p class="muted">You have ${money(S.money)}. More items unlock as you earn badges.</p>
  <div class="bag-list">${SHOP_ORDER.map((k) => {
    const it = ITEMS[k];
    const locked = (it.badges || 0) > S.badges;
    return `<div class="bag-row ${locked ? 'locked' : ''}"><div><b>${it.name}</b> <span class="muted">${money(it.price)}</span> <small class="muted">(own ${S.bag[k] || 0})</small><br>
      <small class="muted">${locked ? `🔒 Needs ${it.badges} badge${it.badges === 1 ? '' : 's'}` : it.desc}</small></div>
      ${locked ? '' : `<div class="buy">${[1, 5, 10].map((q) => `<button class="btn small" data-act="buy" data-item="${k}" data-q="${q}" ${S.money < it.price * q ? 'disabled' : ''}>×${q}</button>`).join('')}</div>`}</div>`;
  }).join('')}</div>`;
}

// ---------- Actions ----------
const ACT = {
  continue() { S = loadGame(); if (!S) { toast('Could not load the save.'); return; } ui.screen = 'hub'; render(); },
  async newgame() {
    if (hasSave() && !(await confirmModal('Start over?', '<p>This will erase your current save.</p>', 'Erase and start', 'Cancel'))) return;
    ui.screen = 'starter'; render();
  },
  async pickstarter(d) {
    const id = +d.id;
    const ok = await confirmModal(`Choose ${POKEMON[id].name}?`, `<div class="evo">${spriteImg(id, { cls: 'big' })}</div><p>So, you want the ${POKEMON[id].types[0]}-type Pokémon, ${POKEMON[id].name}?</p>`);
    if (!ok) return;
    S = newGameState(id);
    ui.tab = 'explore'; ui.loc = 'route1'; ui.screen = 'hub';
    saveGame(); render();
    await alertModal('Professor Oak', `<p>${POKEMON[id].name} is yours! I've also given you <b>5 Poké Balls</b>, <b>3 Potions</b> and <b>₽3,000</b>.</p>
      <p>Weaken wild Pokémon, then throw a ball to catch them. Strong Pokémon are rarer and harder to catch — legendaries most of all.</p>
      <p>Pewter City's gym leader, Brock, is waiting. Good luck!</p>`);
  },
  tab(d) { ui.tab = d.tab; render(); },
  loc(d) { ui.loc = d.id; render(); },
  heal() { S.party.forEach(healMon); saveGame(); render(); toast('Your Pokémon are fully healed!'); },
  save() { saveGame(); toast('Game saved.'); },
  dexinfo(d) { dexInfo(+d.id); },

  async explore() {
    const loc = LOCATIONS.find((l) => l.id === ui.loc);
    if (firstAlive() < 0) { toast('Your Pokémon need rest! Visit the Pokémon Center.'); return; }
    if (RNG.chance(10)) { // found an item instead of a Pokémon
      const finds = ['potion', 'pokeball'];
      if (S.badges >= 1) finds.push('superpotion');
      if (S.badges >= 2) finds.push('greatball', 'revive');
      if (S.badges >= 4) finds.push('ultraball', 'hyperpotion');
      if (RNG.chance(25)) {
        const amt = 100 * RNG.int(1, 3) * (S.badges + 1);
        S.money += amt; toast(`You found ${money(amt)} on the ground!`);
      } else {
        const it = RNG.pick(finds);
        S.bag[it] = (S.bag[it] || 0) + 1; toast(`You found a ${ITEMS[it].name}!`);
      }
      saveGame(); render(); return;
    }
    const wild = rollEncounter(loc, caughtSet());
    startBattle({ kind: 'wild', enemy: [wild], bg: loc.id });
  },

  trainer(d) {
    const loc = LOCATIONS.find((l) => l.id === ui.loc);
    const t = locationTrainers(loc).find((x) => x.key === d.key);
    if (firstAlive() < 0) { toast('Your Pokémon need rest! Visit the Pokémon Center.'); return; }
    const rematch = !!S.beaten[t.key];
    const maxLv = Math.max(...t.team.map((x) => x[1]));
    const title = `${t.cls} ${t.name}`;
    startBattle({
      kind: 'trainer', enemy: buildTeam(t.team), bg: loc.id,
      trainer: { title, reward: Math.floor(maxLv * 30 * (rematch ? 0.5 : 1)) },
      onEnd(result) { if (result === 'win') S.beaten[t.key] = 1; saveGame(); return false; },
    });
  },

  gym(d) {
    const i = +d.idx;
    const g = GYMS[i];
    if (firstAlive() < 0) { toast('Heal your Pokémon before challenging a gym!'); return; }
    const maxLv = Math.max(...g.team.map((x) => x[1]));
    startBattle({
      kind: 'trainer', enemy: buildTeam(g.team, i >= 4), bg: 'gym',
      trainer: { title: `Leader ${g.leader}`, reward: maxLv * 100, intro: `${g.city} Gym Leader ${g.leader} wants to battle!` },
      async onEnd(result) {
        if (result !== 'win') return false;
        S.badges = Math.max(S.badges, i + 1);
        saveGame();
        ui.screen = 'hub'; render();
        const unlocked = LOCATIONS.filter((l) => l.badges === i + 1 && !l.champion).map((l) => l.name);
        await alertModal(`You earned the ${g.badge}!`, `<div class="evo"><span class="badge earned huge" style="--c:${TYPE_COLORS[g.type]}"></span></div>
          <p>${g.leader}: "You've proven yourself. Take this ${g.badge}!"</p>
          ${unlocked.length ? `<p>New areas: <b>${unlocked.join(', ')}</b></p>` : ''}
          ${i === 7 ? '<p>You have all 8 badges! The Pokémon League awaits.</p>' : ''}`);
        return true;
      },
    });
  },

  async league() {
    if (firstAlive() < 0) { toast('Heal your Pokémon first!'); return; }
    const ok = await confirmModal('Enter the Pokémon League?', '<p>You will face 5 trainers in a row. Your team is healed between battles, but one loss and you start over.</p>', 'Let\'s go!', 'Not yet');
    if (ok) leagueBattle(0);
  },

  lead(d) { const i = +d.idx; const [m] = S.party.splice(i, 1); S.party.unshift(m); saveGame(); render(); },
  deposit(d) {
    if (S.party.length <= 1) return;
    const [m] = S.party.splice(+d.idx, 1); S.pc.push(m);
    if (firstAlive() < 0) { S.party.push(S.pc.pop()); toast('You need at least one healthy Pokémon in your party.'); }
    saveGame(); render();
  },
  withdraw(d) { if (S.party.length >= 6) return; const [m] = S.pc.splice(+d.idx, 1); S.party.push(m); saveGame(); render(); },

  async relearn(d) {
    const mon = S.party[+d.idx];
    const options = relearnableMoves(mon);
    if (!options.length) { toast(`${monName(mon)} has no other moves to learn yet.`); return; }
    const body = `<p>Pick a move for <b>${monName(mon)}</b> to learn. It can learn any move from its level-up list up to level ${mon.level}.</p>
      <div class="movegrid">${options.map((m) => moveChip({ id: m, pp: MOVES[m].pp })).join('')}</div>`;
    const choice = await modal({ title: 'Move Reminder', body, wide: true,
      buttons: [...options.map((m) => ({ label: MOVES[m].name, value: m })), { label: 'Cancel', value: null, cls: 'ghost' }] });
    if (!choice) return;
    await learnMoveFlow(mon, choice);
    saveGame(); render();
  },

  async useitem(d) {
    const id = d.item, it = ITEMS[id];
    if (it.kind === 'stone') {
      const idx = await pickPartyMember(`Use ${it.name} on…`, (m) => !!stoneEvolution(m, it.name), 'Only Pokémon that react to this stone can be chosen.');
      if (idx === null) return;
      const mon = S.party[idx];
      S.bag[id]--;
      const evolved = await evolveFlow(mon, stoneEvolution(mon, it.name));
      if (!evolved) S.bag[id]++;
    } else {
      const filter = it.kind === 'revive' ? (m) => m.hp <= 0 : it.kind === 'cure' ? (m) => m.hp > 0 && !!m.status : (m) => m.hp > 0 && m.hp < m.stats.hp;
      const idx = await pickPartyMember(`Use ${it.name} on…`, filter);
      if (idx === null) return;
      const mon = S.party[idx];
      S.bag[id]--;
      if (it.kind === 'heal') mon.hp = Math.min(mon.stats.hp, mon.hp + it.heal);
      else if (it.kind === 'cure') { mon.status = null; mon.slp = 0; }
      else if (it.kind === 'revive') mon.hp = Math.floor(mon.stats.hp / 2);
      toast(`Used ${it.name} on ${monName(mon)}.`);
    }
    saveGame(); render();
  },

  buy(d) {
    const it = ITEMS[d.item], q = +d.q;
    if (S.money < it.price * q) return;
    S.money -= it.price * q;
    S.bag[d.item] = (S.bag[d.item] || 0) + q;
    saveGame(); render();
    toast(`Bought ${q} × ${it.name}.`);
  },
};

// The League: Elite Four in order, then the Champion.
function leagueBattle(stage) {
  const isChamp = stage === ELITE_FOUR.length;
  const foe = isChamp ? { leader: 'Blue', team: championTeam(S.starter) } : ELITE_FOUR[stage];
  const maxLv = Math.max(...foe.team.map((x) => x[1]));
  startBattle({
    kind: 'trainer', enemy: buildTeam(foe.team), bg: 'league',
    trainer: {
      title: isChamp ? 'Champion Blue' : `Elite Four ${foe.leader}`,
      reward: maxLv * (isChamp ? 200 : 120),
      intro: isChamp ? 'Your rival Blue is the Champion! "I\'ve been waiting for you. Let\'s settle this!"' : `Elite Four ${foe.leader} wants to battle!`,
    },
    async onEnd(result) {
      if (result !== 'win') return false;
      if (!isChamp) {
        S.party.forEach(healMon);
        saveGame();
        ui.screen = 'hub'; render();
        const next = stage + 1 === ELITE_FOUR.length ? 'the Champion' : `Elite Four ${ELITE_FOUR[stage + 1].leader}`;
        await modal({ title: `${foe.leader} defeated!`, body: `<p>Your team rests and is fully healed.</p><p>Next up: <b>${next}</b>.</p>`,
          buttons: [{ label: 'Continue', value: true, cls: 'primary' }] });
        leagueBattle(stage + 1);
        return true;
      }
      const first = !S.champion;
      S.champion = true;
      if (first) S.bag.masterball = (S.bag.masterball || 0) + 1;
      saveGame();
      ui.screen = 'hub'; render();
      await alertModal('Hall of Fame!', `<p>You are the new Pokémon League Champion!</p>
        <div class="hof">${S.party.map((m) => `<div>${spriteImg(m.id, { cls: 'med' })}<small>${monName(m)} Lv${m.level}</small></div>`).join('')}</div>
        ${first ? '<p>Professor Oak gives you a <b>Master Ball</b>. Rumor has it a powerful Pokémon waits in <b>Cerulean Cave</b>, which is now open.</p>' : ''}`);
      return true;
    },
  });
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || ui.screen === 'battle') return;
  const fn = ACT[el.dataset.act];
  if (fn) fn(el.dataset, el);
});

render();
