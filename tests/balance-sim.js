// Simulates full playthroughs to measure pacing. Run: node tests/balance-sim.js [runs]
// The simulated player grinds in the newest unlocked location, catches strong Pokémon it meets,
// beats the location's trainers, and challenges the next gym whenever its team looks ready.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = vm.createContext({ console, Math, Date, JSON, Set, Map });
for (const f of ['data/types.js', 'data/pokemon.js', 'data/moves.js', 'data/world.js', 'engine/core.js', 'engine/battle.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const RUNS = +(process.argv[2] || 12);

const out = vm.runInContext(`(() => {
  const clone = (x) => JSON.parse(JSON.stringify(x));

  // Greedy player: best damaging move; send the healthiest Pokémon with the best matchup when forced to switch.
  function bestMove(b) {
    const mv = b.movesOf('p'); let best = -1, bs = -1;
    mv.forEach((m, i) => { if (m.pp <= 0) return; const M = MOVES[m.id];
      const d = M.cat === 'X' ? 0 : b.calcDamage('p', 'e', M, { roll: 0.92 }).dmg * ((M.acc || 100) / 100);
      if (d > bs) { bs = d; best = i; } });
    return best;
  }
  function bestSwitch(b, party) {
    let best = -1, bs = -1e9;
    party.forEach((m, i) => { if (m.hp <= 0 || i === b.sides.p.active) return;
      const off = Math.max(...POKEMON[m.id].types.map(t => typeEffectiveness(t, b.types('e'))));
      const def = Math.max(...b.types('e').map(t => typeEffectiveness(t, POKEMON[m.id].types)));
      const s = m.level * 2 + off * 10 - def * 10 + m.hp / m.stats.hp * 5;
      if (s > bs) { bs = s; best = i; } });
    return best;
  }
  function fight(party, enemy, kind, st) {
    if (!party.some(m => m.hp > 0)) return 'lose';
    const b = new Battle({ kind, playerParty: party, enemyParty: enemy, trainer: { title: 'T' }, bag: st.bag });
    let n = 0;
    while (b.state !== 'over' && n++ < 300) {
      if (b.state === 'forceSwitch') { b.turn({ type: 'switch', idx: bestSwitch(b, party) }); continue; }
      const a = b.active('p');
      if (a.hp < a.stats.hp * 0.25 && st.bag.superpotion > 0 && kind === 'trainer') { b.turn({ type: 'item', item: 'superpotion', target: b.sides.p.active }); continue; }
      if (a.hp < a.stats.hp * 0.25 && st.bag.potion > 0 && kind === 'trainer') { b.turn({ type: 'item', item: 'potion', target: b.sides.p.active }); continue; }
      b.turn({ type: 'move', idx: bestMove(b) });
    }
    party.forEach(m => { delete m._fainted; });
    // Accept new moves like a sensible player: replace a status move or the weakest move.
    for (const { mon, move } of b.pendingLearn) {
      if (mon.moves.some(x => x.id === move)) continue;
      const score = (id) => (MOVES[id].cat === 'X' ? 0 : MOVES[id].pow);
      let worst = 0; mon.moves.forEach((x, i) => { if (score(x.id) < score(mon.moves[worst].id)) worst = i; });
      if (score(move) > score(mon.moves[worst].id)) mon.moves[worst] = { id: move, pp: MOVES[move].pp };
    }
    // Evolve after battle
    for (const m of party) { const to = levelEvolution(m); if (to) evolve(m, to); }
    return b.result;
  }
  function tryCatchWild(st, wild) {
    // Weaken to ~30% then throw up to 4 balls.
    const w = clone(wild); w.hp = Math.max(1, Math.floor(w.stats.hp * 0.3));
    const ball = st.bag.ultraball > 0 ? 'ultraball' : st.bag.greatball > 0 ? 'greatball' : 'pokeball';
    for (let i = 0; i < 4 && st.bag[ball] > 0; i++) { st.bag[ball]--; if (tryCatch(w, ITEMS[ball].ball)) return true; }
    return false;
  }
  const teamPower = (party) => party.reduce((s, m) => s + m.level, 0) / party.length;

  function playthrough(starter) {
    const st = { party: [createPokemon(starter, 5, { strong: true })], money: 3000, badges: 0,
      bag: { pokeball: 5, potion: 3 }, wild: 0, log: [], beaten: {} };
    const shop = () => {
      const ball = st.badges >= 4 ? 'ultraball' : st.badges >= 2 ? 'greatball' : 'pokeball';
      while (st.money > 3000 && (st.bag[ball] || 0) < 10) { st.money -= ITEMS[ball].price; st.bag[ball] = (st.bag[ball] || 0) + 1; }
      const pot = st.badges >= 1 ? 'superpotion' : 'potion';
      while (st.money > 2000 && (st.bag[pot] || 0) < 5) { st.money -= ITEMS[pot].price; st.bag[pot] = (st.bag[pot] || 0) + 1; }
    };
    const stages = [...GYMS.map((g, i) => ({ g, i })), { league: true }];
    let attempts = 0, wildAtStage = 0;
    for (const stage of stages) {
      attempts = 0; wildAtStage = 0;
      while (true) {
        const locs = LOCATIONS.filter(l => st.badges >= l.badges && !l.champion);
        const loc = locs[locs.length - 1];
        // Route trainers once
        for (const t of locationTrainers(loc)) {
          if (st.beaten[t.key]) continue;
          st.party.forEach(healMon);
          if (fight(st.party, buildTeam(t.team), 'trainer', st) === 'win') { st.beaten[t.key] = 1; st.money += Math.max(...t.team.map(x => x[1])) * 30; }
          st.party.forEach(healMon);
        }
        // Challenge when ready (every 10 wild battles, or immediately the first time)
        if (wildAtStage % 10 === 0) {
          attempts++;
          shop();
          const trial = clone(st.party); trial.forEach(healMon);
          const teams = stage.league ? [...ELITE_FOUR.map(e => e.team), championTeam(starter)] : [stage.g.team];
          const strong = !stage.league && stage.i >= 4;
          let won = true;
          for (const t of teams) {
            if (fight(trial, buildTeam(t, strong), 'trainer', st) !== 'win') { won = false; break; }
            if (stage.league) trial.forEach(healMon);
          }
          if (won) {
            st.party = trial; st.party.forEach(healMon);
            st.log.push({ stage: stage.league ? 'League' : stage.g.leader, wild: wildAtStage, attempts, avgLv: +teamPower(st.party).toFixed(1),
              lead: Math.max(...st.party.map(m => m.level)), size: st.party.length, money: st.money });
            if (!stage.league) { st.badges++; st.money += Math.max(...stage.g.team.map(x => x[1])) * 100; }
            break;
          }
          st.money = Math.floor(st.money / 2);
          if (attempts > 60) { st.log.push({ stage: stage.league ? 'League' : stage.g.leader, stuck: true, avgLv: +teamPower(st.party).toFixed(1) }); return st; }
        }
        // Wild battle
        st.party.forEach(healMon);
        const wild = rollEncounter(loc, new Set());
        st.wild++; wildAtStage++;
        const weakest = st.party.reduce((a, m) => (POKEMON[m.id].bst < POKEMON[a.id].bst ? m : a), st.party[0]);
        if ((st.party.length < 6 || POKEMON[wild.id].bst > POKEMON[weakest.id].bst + 60) && tryCatchWild(st, wild)) {
          wild.hp = wild.stats.hp;
          if (st.party.length < 6) st.party.push(wild); else st.party[st.party.indexOf(weakest)] = wild;
          continue;
        }
        fight(st.party, [wild], 'wild', st);
      }
    }
    return st;
  }

  const results = {};
  for (const starter of [1, 4, 7]) {
    results[POKEMON[starter].name] = [];
    for (let r = 0; r < ${RUNS}; r++) results[POKEMON[starter].name].push(playthrough(starter).log);
  }
  return results;
})()`, ctx);

// Summarize: average wild battles, attempts and levels per stage.
for (const [starter, runs] of Object.entries(out)) {
  console.log(`\n== ${starter} (${runs.length} runs) ==`);
  const stages = runs[0].map((s) => s.stage);
  const all = ['Brock', 'Misty', 'Lt. Surge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni', 'League'];
  for (const name of all) {
    const rows = runs.map((r) => r.find((s) => s.stage === name)).filter(Boolean);
    if (!rows.length) continue;
    const stuck = rows.filter((r) => r.stuck).length;
    const ok = rows.filter((r) => !r.stuck);
    const avg = (k) => (ok.reduce((s, r) => s + r[k], 0) / Math.max(1, ok.length)).toFixed(1);
    console.log(`${name.padEnd(10)} wild ${avg('wild').padStart(6)}  attempts ${avg('attempts').padStart(5)}  avgLv ${avg('avgLv').padStart(5)}  topLv ${avg('lead').padStart(5)}  party ${avg('size')}  ${stuck ? `STUCK ${stuck}/${rows.length}` : ''}`);
  }
}
