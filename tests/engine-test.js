// Headless sanity test for the data and battle engine. Run: node tests/engine-test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = vm.createContext({ console, Math, Date, JSON, Set, Map });
for (const f of ['data/types.js', 'data/pokemon.js', 'data/moves.js', 'data/world.js', 'engine/core.js', 'engine/battle.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const run = (code) => vm.runInContext(code, ctx);
let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log('FAIL:', msg); } };

const result = run(`(() => {
  const out = { problems: [] };
  // 1. Data integrity
  if (POKEMON.length !== 152) out.problems.push('expected 151 Pokémon, got ' + (POKEMON.length - 1));
  for (const p of POKEMON.slice(1)) {
    for (const t of p.types) if (!TYPE_CHART[t]) out.problems.push(p.name + ' has unknown type ' + t);
    for (const e of p.evolutions) if (!POKEMON[e.to]) out.problems.push(p.name + ' evolves into missing id ' + e.to);
    const ls = learnsetOf(p.id);
    if (!ls.length) out.problems.push(p.name + ' has no moves');
    for (const [lv, m] of ls) if (!MOVES[m]) out.problems.push(p.name + ' learns unknown move ' + m);
  }
  for (const g of [...GYMS, ...ELITE_FOUR]) for (const [id] of g.team) if (!POKEMON[id]) out.problems.push(g.leader + ' bad id ' + id);

  // 2. Every Pokémon obtainable (starters are given, so all 151 should be in some location or legendary slot)
  const obtainable = new Set();
  for (const l of LOCATIONS) {
    for (const p of locationPool(l)) obtainable.add(p.id);
    if (l.legendary) obtainable.add(l.legendary.id);
    if (l.legendary2) obtainable.add(l.legendary2.id);
  }
  out.missing = POKEMON.slice(1).filter(p => !obtainable.has(p.id)).map(p => p.name);

  // 3. Encounter distribution on Route 1 and Cerulean Cave
  const dist = (loc, n) => { const c = {}; for (let i = 0; i < n; i++) { const m = rollEncounter(loc, new Set()); c[POKEMON[m.id].name] = (c[POKEMON[m.id].name] || 0) + 1; } return Object.entries(c).sort((a,b)=>b[1]-a[1]); };
  out.route1 = dist(LOCATIONS[0], 5000);
  const cave = dist(LOCATIONS.find(l => l.id === 'ceruleancave'), 20000);
  out.caveTop = cave.slice(0, 5);
  out.caveRare = cave.filter(([n]) => ['Mewtwo','Mew','Dragonite','Snorlax','Pidgey','Caterpie'].includes(n));
  out.legendChance = LOCATIONS.filter(l => l.legendary).map(l => l.name + ': ' + legendaryChance(l).toFixed(3) + '%');
  // Legendary must be rarer than every regular species in its location
  for (const l of LOCATIONS.filter(l => l.legendary)) {
    const pool = locationPool(l); const tot = pool.reduce((s, p) => s + encounterWeight(p), 0);
    const rarest = Math.min(...pool.map(p => encounterWeight(p) / tot)) * 100;
    if (legendaryChance(l) > rarest) out.problems.push(l.name + ' legendary not rarest');
  }

  // 4. Random battles: no crashes, always terminate
  let turns = 0, results = {};
  for (let i = 0; i < 1500; i++) {
    const rid = () => 1 + Math.floor(Math.random() * 151);
    const lv = 5 + Math.floor(Math.random() * 60);
    const party = [createPokemon(rid(), lv), createPokemon(rid(), lv), createPokemon(rid(), lv)];
    const enemy = [createPokemon(rid(), lv), createPokemon(rid(), lv)];
    const kind = i % 2 ? 'wild' : 'trainer';
    const b = new Battle({ kind, playerParty: party, enemyParty: kind === 'wild' ? [enemy[0]] : enemy, trainer: { title: 'Tester' }, bag: { pokeball: 50, potion: 5 } });
    let n = 0;
    while (b.state !== 'over' && n < 400) {
      n++;
      if (b.state === 'forceSwitch') { b.turn({ type: 'switch', idx: party.findIndex(m => m.hp > 0) }); continue; }
      const r = Math.random();
      if (kind === 'wild' && r < 0.08) b.turn({ type: 'ball', item: 'pokeball' });
      else if (r < 0.1 && b.bag.potion > 0) b.turn({ type: 'item', item: 'potion', target: b.sides.p.active });
      else if (r < 0.13) {
        const idx = party.findIndex((m, j) => m.hp > 0 && j !== b.sides.p.active);
        if (idx >= 0) b.turn({ type: 'switch', idx }); else b.turn({ type: 'move', idx: 0 });
      } else {
        const moves = b.movesOf('p');
        const usable = moves.map((m, j) => j).filter(j => moves[j].pp > 0);
        b.turn({ type: 'move', idx: usable.length ? usable[Math.floor(Math.random() * usable.length)] : -1 });
      }
      for (const e of b.events) if (e.t === 'msg' && /undefined|NaN/.test(e.text)) out.problems.push('bad text: ' + e.text);
    }
    if (b.state !== 'over') out.problems.push('battle did not finish: ' + party.map(monName) + ' vs ' + enemy.map(monName));
    for (const m of [...party, ...enemy]) if (!(m.hp >= 0 && m.hp <= m.stats.hp) || Number.isNaN(m.hp)) out.problems.push('bad hp ' + monName(m) + ' ' + m.hp);
    turns += n; results[b.result] = (results[b.result] || 0) + 1;
  }
  out.avgTurns = (turns / 1500).toFixed(1);
  out.results = results;

  // 5. Damage sanity: L50 Charizard Flamethrower vs L50 Venusaur
  const c = createPokemon(6, 50), v = createPokemon(3, 50);
  const b = new Battle({ kind: 'wild', playerParty: [c], enemyParty: [v], bag: {} });
  const d = b.calcDamage('p', 'e', MOVES.flamethrower, { roll: 1 });
  out.charVsVenu = d.dmg + ' / ' + v.stats.hp + ' HP (x' + d.eff + ')';

  // 6. XP & level-up & evolution
  const s = createPokemon(7, 5);
  gainXp(s, xpForLevel(16) - s.xp);
  out.squirtle16 = s.level + ' evo->' + (levelEvolution(s) ? POKEMON[levelEvolution(s)].name : 'none');

  // 7. Catch rates
  out.catchRates = [16, 25, 1, 143, 149, 150].map(id => POKEMON[id].name + ':' + POKEMON[id].catchRate + ' (' + rarityOf(POKEMON[id]) + ')');
  out.trainers = locationTrainers(LOCATIONS[0]).map(t => t.cls + ' ' + t.name + ' ' + JSON.stringify(t.team));
  return out;
})()`);

for (const p of result.problems.slice(0, 30)) check(false, p);
check(result.missing.length === 0, 'not obtainable: ' + result.missing.join(', '));
console.log(JSON.stringify(result, null, 1).slice(0, 4000));
console.log(failures ? `\n${failures} problem(s)` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
