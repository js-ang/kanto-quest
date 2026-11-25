// Core helpers: random numbers, creating Pokémon, stats, experience, evolution, encounters, trainers.

const RNG = {
  next: Math.random,
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); },
  chance(pct) { return this.next() * 100 < pct; },
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; },
  weighted(items, weightFn) {
    const total = items.reduce((s, it) => s + weightFn(it), 0);
    let r = this.next() * total;
    for (const it of items) { r -= weightFn(it); if (r <= 0) return it; }
    return items[items.length - 1];
  },
};

// Small seeded RNG so a location's trainers stay the same every time you visit.
function seededRng(seedStr) {
  let h = 1779033703;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353), h = (h << 13) | (h >>> 19);
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return t / 4294967296;
  };
}
function withRng(rngFn, fn) {
  const prev = RNG.next; RNG.next = rngFn;
  try { return fn(); } finally { RNG.next = prev; }
}

let _uid = Date.now();
const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_NAMES = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };

// Medium-fast experience curve.
function xpForLevel(lv) { return lv <= 1 ? 0 : lv * lv * lv; }

function calcStats(mon) {
  const b = POKEMON[mon.id].base;
  const L = mon.level;
  const s = {};
  for (const k of STAT_KEYS) {
    const core = Math.floor(((2 * b[k] + mon.ivs[k]) * L) / 100);
    s[k] = k === 'hp' ? core + L + 10 : core + 5;
  }
  return s;
}

// Moves a species knows at a level: the last 4 it learned.
function defaultMoves(id, level) {
  const known = learnsetOf(id).filter(([lv]) => lv <= level).map(([, m]) => m);
  return known.slice(-4).map((m) => ({ id: m, pp: MOVES[m].pp }));
}

function createPokemon(id, level, opts = {}) {
  const ivs = {};
  for (const k of STAT_KEYS) ivs[k] = opts.strong ? RNG.int(20, 31) : RNG.int(0, 31);
  const mon = { uid: ++_uid, id, level, xp: xpForLevel(level), ivs, moves: defaultMoves(id, level), status: null, slp: 0 };
  mon.stats = calcStats(mon);
  mon.hp = mon.stats.hp;
  return mon;
}

function monName(mon) { return POKEMON[mon.id].name; }

function healMon(mon) {
  mon.stats = calcStats(mon);
  mon.hp = mon.stats.hp;
  mon.status = null; mon.slp = 0;
  for (const m of mon.moves) m.pp = MOVES[m.id].pp;
}

// Experience a defeated Pokémon gives.
function xpYield(defeated, trainer) {
  const p = POKEMON[defeated.id];
  return Math.max(1, Math.floor(((p.bst / 3) * defeated.level / 7) * (trainer ? 1.5 : 1)));
}

// Adds XP. Returns a list of events: {levelUp: n} and {learn: moveId}. Moves are learned automatically
// when there's room; otherwise they're returned as {learnPending: moveId} for the UI to ask about.
function gainXp(mon, amount) {
  const events = [];
  if (mon.level >= 100) return events;
  mon.xp += amount;
  while (mon.level < 100 && mon.xp >= xpForLevel(mon.level + 1)) {
    const oldMax = mon.stats.hp;
    mon.level++;
    mon.stats = calcStats(mon);
    mon.hp = Math.min(mon.stats.hp, mon.hp + (mon.stats.hp - oldMax));
    events.push({ levelUp: mon.level });
    for (const [lv, m] of learnsetOf(mon.id)) {
      if (lv !== mon.level || mon.moves.some((x) => x.id === m)) continue;
      if (mon.moves.length < 4) { mon.moves.push({ id: m, pp: MOVES[m].pp }); events.push({ learn: m }); }
      else events.push({ learnPending: m });
    }
  }
  return events;
}

// Level-based evolution target (or null).
function levelEvolution(mon) {
  const e = POKEMON[mon.id].evolutions.find((x) => x.level && mon.level >= x.level);
  return e ? e.to : null;
}
function stoneEvolution(mon, itemName) {
  const e = POKEMON[mon.id].evolutions.find((x) => x.item === itemName);
  return e ? e.to : null;
}
function evolve(mon, toId) {
  const hpLost = mon.stats.hp - mon.hp;
  mon.id = toId;
  mon.stats = calcStats(mon);
  mon.hp = Math.max(mon.hp > 0 ? 1 : 0, mon.stats.hp - hpLost);
}
// Strongest move the new species can learn at its level that it doesn't know (offered after evolving).
function evolutionMove(mon) {
  const known = new Set(mon.moves.map((m) => m.id));
  const options = learnsetOf(mon.id).filter(([lv, m]) => lv <= mon.level && !known.has(m) && MOVES[m].cat !== 'X');
  options.sort((a, b) => MOVES[b[1]].pow - MOVES[a[1]].pow);
  return options.length ? options[0][1] : null;
}
// All moves a Pokémon could relearn at its level.
function relearnableMoves(mon) {
  const known = new Set(mon.moves.map((m) => m.id));
  return learnsetOf(mon.id).filter(([lv, m]) => lv <= mon.level && !known.has(m)).map(([, m]) => m);
}

// ---------- Encounters ----------

// Encounter weight: drops steeply as base stat total rises, so strong Pokémon are rare.
function encounterWeight(p) {
  let w = Math.pow(300 / p.bst, 4);
  if (p.rare) w *= 0.3;
  return w;
}

const _poolCache = {};
function locationPool(loc) {
  if (_poolCache[loc.id]) return _poolCache[loc.id];
  const pool = loc.species ? loc.species.map((id) => POKEMON[id])
    : POKEMON.filter((p) => p && !p.legendary && p.bst <= loc.cap && p.bst >= (loc.minBst || 0) &&
      (!loc.types || p.types.some((t) => loc.types.includes(t))));
  for (const id of loc.extra || []) if (!pool.includes(POKEMON[id])) pool.push(POKEMON[id]);
  return (_poolCache[loc.id] = pool);
}

// Raise the level of an evolved Pokémon so it isn't below the level its pre-evolution evolves at.
function fitLevel(p, level) {
  let min = 1;
  let cur = p;
  while (cur.preEvo) {
    if (cur.preEvo.level) { min = Math.max(min, cur.preEvo.level); break; }
    min = Math.max(min, 20);
    cur = POKEMON[cur.preEvo.id];
  }
  return Math.max(level, min);
}

// Rolls a wild Pokémon for a location. `caught` is the set of species ids already caught (legendaries appear once).
// A legendary's chance is half that of the rarest regular Pokémon in the same place (at least 0.1%),
// so legendaries are always the rarest encounter.
function legendaryChance(loc) {
  const pool = locationPool(loc);
  const total = pool.reduce((s, p) => s + encounterWeight(p), 0);
  const rarest = Math.min(...pool.map((p) => encounterWeight(p) / total));
  return Math.max(0.1, rarest * 50); // percent
}

function rollEncounter(loc, caught) {
  for (const key of ['legendary', 'legendary2']) {
    const leg = loc[key];
    if (leg && !caught.has(leg.id) && RNG.chance(legendaryChance(loc))) {
      return createPokemon(leg.id, leg.level, { strong: true });
    }
  }
  const p = RNG.weighted(locationPool(loc), encounterWeight);
  const level = Math.min(100, fitLevel(p, RNG.int(loc.levels[0], loc.levels[1])));
  return createPokemon(p.id, level);
}

// Deterministic route trainers for a location.
function locationTrainers(loc) {
  return withRng(seededRng('trainers-' + loc.id), () => {
    const pool = locationPool(loc);
    return loc.trainers.map((cls, i) => {
      const size = Math.min(6, 1 + Math.floor((loc.badges + 1) / 3) + (i % 2));
      const team = [];
      for (let k = 0; k < size; k++) {
        const p = RNG.weighted(pool, encounterWeight);
        const lv = Math.min(100, fitLevel(p, loc.levels[1] - 1 + RNG.int(0, 2) + k));
        team.push([p.id, lv]);
      }
      return { key: loc.id + '-' + i, cls, name: TRAINER_NAMES[(RNG.int(0, TRAINER_NAMES.length - 1) + i * 7) % TRAINER_NAMES.length], team };
    });
  });
}

function buildTeam(spec, strong) {
  return spec.map(([id, lv]) => createPokemon(id, lv, { strong }));
}

// Catch check (simplified modern formula). Returns true if caught.
function tryCatch(mon, ballMult) {
  if (ballMult >= 255) return true;
  const p = POKEMON[mon.id];
  const statusBonus = mon.status === 'slp' || mon.status === 'frz' ? 2 : mon.status ? 1.5 : 1;
  const max = mon.stats.hp;
  const a = ((3 * max - 2 * mon.hp) * p.catchRate * ballMult * statusBonus) / (3 * max);
  return RNG.next() * 255 < Math.max(1, a);
}
