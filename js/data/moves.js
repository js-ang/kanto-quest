// Moves. cat: P = physical, S = special, X = status.
// Optional fields:
//   prio      priority bracket (Quick Attack = 1)
//   status    { s: 'brn'|'psn'|'par'|'slp'|'frz', chance }  (chance 100 for pure status moves)
//   stat      { who: 'foe'|'self', ch: { atk: -1, ... }, chance }
//   recoil    fraction of damage dealt taken back
//   drain     fraction of damage dealt restored
//   crit      true = high critical-hit ratio
//   flinch    percent chance to flinch (only if the user moves first)
//   fixed     'level' = deals damage equal to the user's level
//   special   'transform' | 'splash' | 'haze'
const MOVES = {};
function M(id, name, type, cat, pow, acc, pp, extra = {}) {
  MOVES[id] = { id, name, type, cat, pow, acc, pp, prio: 0, ...extra };
}

// --- Normal
M('tackle', 'Tackle', 'Normal', 'P', 40, 100, 35);
M('quickattack', 'Quick Attack', 'Normal', 'P', 40, 100, 30, { prio: 1 });
M('headbutt', 'Headbutt', 'Normal', 'P', 70, 100, 15, { flinch: 30 });
M('bodyslam', 'Body Slam', 'Normal', 'P', 85, 100, 15, { status: { s: 'par', chance: 30 } });
M('doubleedge', 'Double-Edge', 'Normal', 'P', 120, 100, 15, { recoil: 0.33 });
M('swift', 'Swift', 'Normal', 'S', 60, 0, 20);
M('triattack', 'Tri Attack', 'Normal', 'S', 80, 100, 10);
M('hypervoice', 'Hyper Voice', 'Normal', 'S', 90, 100, 10);
M('hyperbeam', 'Hyper Beam', 'Normal', 'S', 130, 90, 5);
M('growl', 'Growl', 'Normal', 'X', 0, 100, 40, { stat: { who: 'foe', ch: { atk: -1 }, chance: 100 } });
M('tailwhip', 'Tail Whip', 'Normal', 'X', 0, 100, 30, { stat: { who: 'foe', ch: { def: -1 }, chance: 100 } });
M('sing', 'Sing', 'Normal', 'X', 0, 55, 15, { status: { s: 'slp', chance: 100 } });
M('swordsdance', 'Swords Dance', 'Normal', 'X', 0, 0, 20, { stat: { who: 'self', ch: { atk: 2 }, chance: 100 } });
M('harden', 'Harden', 'Normal', 'X', 0, 0, 30, { stat: { who: 'self', ch: { def: 1 }, chance: 100 } });
M('defensecurl', 'Defense Curl', 'Normal', 'X', 0, 0, 40, { stat: { who: 'self', ch: { def: 1 }, chance: 100 } });
M('splash', 'Splash', 'Normal', 'X', 0, 0, 40, { special: 'splash' });
M('transform', 'Transform', 'Normal', 'X', 0, 0, 10, { special: 'transform' });
M('struggle', 'Struggle', 'Normal', 'P', 50, 0, 1, { recoil: 0.25, typeless: true });
// --- Fire
M('ember', 'Ember', 'Fire', 'S', 40, 100, 25, { status: { s: 'brn', chance: 10 } });
M('firefang', 'Fire Fang', 'Fire', 'P', 65, 95, 15, { status: { s: 'brn', chance: 10 } });
M('flameburst', 'Flame Burst', 'Fire', 'S', 70, 100, 15);
M('firepunch', 'Fire Punch', 'Fire', 'P', 75, 100, 15, { status: { s: 'brn', chance: 10 } });
M('flamethrower', 'Flamethrower', 'Fire', 'S', 90, 100, 15, { status: { s: 'brn', chance: 10 } });
M('flareblitz', 'Flare Blitz', 'Fire', 'P', 120, 100, 15, { recoil: 0.33, status: { s: 'brn', chance: 10 } });
M('fireblast', 'Fire Blast', 'Fire', 'S', 110, 85, 5, { status: { s: 'brn', chance: 10 } });
M('willowisp', 'Will-O-Wisp', 'Fire', 'X', 0, 85, 15, { status: { s: 'brn', chance: 100 } });
// --- Water
M('aquajet', 'Aqua Jet', 'Water', 'P', 40, 100, 20, { prio: 1 });
M('watergun', 'Water Gun', 'Water', 'S', 40, 100, 25);
M('razorshell', 'Razor Shell', 'Water', 'P', 75, 95, 10, { stat: { who: 'foe', ch: { def: -1 }, chance: 50 } });
M('bubblebeam', 'Bubble Beam', 'Water', 'S', 65, 100, 20, { stat: { who: 'foe', ch: { spe: -1 }, chance: 10 } });
M('waterfall', 'Waterfall', 'Water', 'P', 80, 100, 15, { flinch: 20 });
M('surf', 'Surf', 'Water', 'S', 90, 100, 15);
M('crabhammer', 'Crabhammer', 'Water', 'P', 100, 90, 10, { crit: true });
M('hydropump', 'Hydro Pump', 'Water', 'S', 110, 80, 5);
M('withdraw', 'Withdraw', 'Water', 'X', 0, 0, 40, { stat: { who: 'self', ch: { def: 1 }, chance: 100 } });
// --- Grass
M('vinewhip', 'Vine Whip', 'Grass', 'P', 45, 100, 25);
M('megadrain', 'Mega Drain', 'Grass', 'S', 40, 100, 15, { drain: 0.5 });
M('razorleaf', 'Razor Leaf', 'Grass', 'P', 55, 95, 25, { crit: true });
M('magicalleaf', 'Magical Leaf', 'Grass', 'S', 60, 0, 20);
M('seedbomb', 'Seed Bomb', 'Grass', 'P', 80, 100, 15);
M('gigadrain', 'Giga Drain', 'Grass', 'S', 75, 100, 10, { drain: 0.5 });
M('powerwhip', 'Power Whip', 'Grass', 'P', 120, 85, 10);
M('solarbeam', 'Solar Beam', 'Grass', 'S', 120, 100, 10);
M('sleeppowder', 'Sleep Powder', 'Grass', 'X', 0, 75, 15, { status: { s: 'slp', chance: 100 } });
// --- Electric
M('thundershock', 'Thunder Shock', 'Electric', 'S', 40, 100, 30, { status: { s: 'par', chance: 10 } });
M('spark', 'Spark', 'Electric', 'P', 65, 100, 20, { status: { s: 'par', chance: 30 } });
M('shockwave', 'Shock Wave', 'Electric', 'S', 60, 0, 20);
M('thunderpunch', 'Thunder Punch', 'Electric', 'P', 75, 100, 15, { status: { s: 'par', chance: 10 } });
M('thunderbolt', 'Thunderbolt', 'Electric', 'S', 90, 100, 15, { status: { s: 'par', chance: 10 } });
M('wildcharge', 'Wild Charge', 'Electric', 'P', 90, 100, 15, { recoil: 0.25 });
M('thunder', 'Thunder', 'Electric', 'S', 110, 70, 10, { status: { s: 'par', chance: 30 } });
M('thunderwave', 'Thunder Wave', 'Electric', 'X', 0, 90, 20, { status: { s: 'par', chance: 100 } });
// --- Ice
M('iceshard', 'Ice Shard', 'Ice', 'P', 40, 100, 30, { prio: 1 });
M('powdersnow', 'Powder Snow', 'Ice', 'S', 40, 100, 25, { status: { s: 'frz', chance: 10 } });
M('icefang', 'Ice Fang', 'Ice', 'P', 65, 95, 15, { status: { s: 'frz', chance: 10 } });
M('aurorabeam', 'Aurora Beam', 'Ice', 'S', 65, 100, 20, { stat: { who: 'foe', ch: { atk: -1 }, chance: 10 } });
M('icepunch', 'Ice Punch', 'Ice', 'P', 75, 100, 15, { status: { s: 'frz', chance: 10 } });
M('icebeam', 'Ice Beam', 'Ice', 'S', 90, 100, 10, { status: { s: 'frz', chance: 10 } });
M('iciclecrash', 'Icicle Crash', 'Ice', 'P', 85, 90, 10, { flinch: 30 });
M('blizzard', 'Blizzard', 'Ice', 'S', 110, 70, 5, { status: { s: 'frz', chance: 10 } });
M('haze', 'Haze', 'Ice', 'X', 0, 0, 30, { special: 'haze' });
// --- Fighting
M('rocksmash', 'Rock Smash', 'Fighting', 'P', 40, 100, 15, { stat: { who: 'foe', ch: { def: -1 }, chance: 50 } });
M('vacuumwave', 'Vacuum Wave', 'Fighting', 'S', 40, 100, 30, { prio: 1 });
M('lowsweep', 'Low Sweep', 'Fighting', 'P', 65, 100, 20, { stat: { who: 'foe', ch: { spe: -1 }, chance: 100 } });
M('brickbreak', 'Brick Break', 'Fighting', 'P', 75, 100, 15);
M('aurasphere', 'Aura Sphere', 'Fighting', 'S', 80, 0, 20);
M('crosschop', 'Cross Chop', 'Fighting', 'P', 100, 80, 5, { crit: true });
M('closecombat', 'Close Combat', 'Fighting', 'P', 120, 100, 5, { stat: { who: 'self', ch: { def: -1, spd: -1 }, chance: 100 } });
M('focusblast', 'Focus Blast', 'Fighting', 'S', 120, 70, 5);
M('bulkup', 'Bulk Up', 'Fighting', 'X', 0, 0, 20, { stat: { who: 'self', ch: { atk: 1, def: 1 }, chance: 100 } });
// --- Poison
M('poisonsting', 'Poison Sting', 'Poison', 'P', 35, 100, 35, { status: { s: 'psn', chance: 30 } });
M('acid', 'Acid', 'Poison', 'S', 40, 100, 30, { stat: { who: 'foe', ch: { spd: -1 }, chance: 10 } });
M('poisontail', 'Poison Tail', 'Poison', 'P', 50, 100, 25, { crit: true, status: { s: 'psn', chance: 10 } });
M('venoshock', 'Venoshock', 'Poison', 'S', 65, 100, 10);
M('poisonjab', 'Poison Jab', 'Poison', 'P', 80, 100, 20, { status: { s: 'psn', chance: 30 } });
M('sludgebomb', 'Sludge Bomb', 'Poison', 'S', 90, 100, 10, { status: { s: 'psn', chance: 30 } });
M('gunkshot', 'Gunk Shot', 'Poison', 'P', 120, 80, 5, { status: { s: 'psn', chance: 30 } });
M('sludgewave', 'Sludge Wave', 'Poison', 'S', 95, 100, 10, { status: { s: 'psn', chance: 10 } });
M('toxic', 'Toxic', 'Poison', 'X', 0, 90, 10, { status: { s: 'psn', chance: 100 } });
// --- Ground
M('mudshot', 'Mud Shot', 'Ground', 'S', 45, 95, 15, { stat: { who: 'foe', ch: { spe: -1 }, chance: 100 } });
M('bulldoze', 'Bulldoze', 'Ground', 'P', 60, 100, 20, { stat: { who: 'foe', ch: { spe: -1 }, chance: 100 } });
M('mudbomb', 'Mud Bomb', 'Ground', 'S', 65, 85, 10);
M('dig', 'Dig', 'Ground', 'P', 80, 100, 10);
M('earthpower', 'Earth Power', 'Ground', 'S', 90, 100, 10, { stat: { who: 'foe', ch: { spd: -1 }, chance: 10 } });
M('earthquake', 'Earthquake', 'Ground', 'P', 100, 100, 10);
// --- Flying
M('peck', 'Peck', 'Flying', 'P', 35, 100, 35);
M('gust', 'Gust', 'Flying', 'S', 40, 100, 35);
M('wingattack', 'Wing Attack', 'Flying', 'P', 60, 100, 35);
M('aircutter', 'Air Cutter', 'Flying', 'S', 60, 95, 25, { crit: true });
M('drillpeck', 'Drill Peck', 'Flying', 'P', 80, 100, 20);
M('airslash', 'Air Slash', 'Flying', 'S', 75, 95, 15, { flinch: 30 });
M('bravebird', 'Brave Bird', 'Flying', 'P', 120, 100, 15, { recoil: 0.33 });
M('hurricane', 'Hurricane', 'Flying', 'S', 110, 70, 10);
M('agility', 'Agility', 'Psychic', 'X', 0, 0, 30, { stat: { who: 'self', ch: { spe: 2 }, chance: 100 } });
// --- Psychic
M('confusion', 'Confusion', 'Psychic', 'S', 50, 100, 25);
M('psychocut', 'Psycho Cut', 'Psychic', 'P', 70, 100, 20, { crit: true });
M('psybeam', 'Psybeam', 'Psychic', 'S', 65, 100, 20);
M('zenheadbutt', 'Zen Headbutt', 'Psychic', 'P', 80, 90, 15, { flinch: 20 });
M('psyshock', 'Psyshock', 'Psychic', 'S', 80, 100, 10);
M('psychic', 'Psychic', 'Psychic', 'S', 90, 100, 10, { stat: { who: 'foe', ch: { spd: -1 }, chance: 10 } });
M('psystrike', 'Psystrike', 'Psychic', 'S', 100, 100, 10);
M('hypnosis', 'Hypnosis', 'Psychic', 'X', 0, 60, 20, { status: { s: 'slp', chance: 100 } });
M('amnesia', 'Amnesia', 'Psychic', 'X', 0, 0, 20, { stat: { who: 'self', ch: { spd: 2 }, chance: 100 } });
M('calmmind', 'Calm Mind', 'Psychic', 'X', 0, 0, 20, { stat: { who: 'self', ch: { spa: 1, spd: 1 }, chance: 100 } });
// --- Bug
M('furycutter', 'Fury Cutter', 'Bug', 'P', 40, 95, 20);
M('strugglebug', 'Struggle Bug', 'Bug', 'S', 50, 100, 20, { stat: { who: 'foe', ch: { spa: -1 }, chance: 100 } });
M('bugbite', 'Bug Bite', 'Bug', 'P', 60, 100, 20);
M('signalbeam', 'Signal Beam', 'Bug', 'S', 75, 100, 15);
M('xscissor', 'X-Scissor', 'Bug', 'P', 80, 100, 15);
M('bugbuzz', 'Bug Buzz', 'Bug', 'S', 90, 100, 10, { stat: { who: 'foe', ch: { spd: -1 }, chance: 10 } });
M('megahorn', 'Megahorn', 'Bug', 'P', 120, 85, 10);
M('stringshot', 'String Shot', 'Bug', 'X', 0, 95, 40, { stat: { who: 'foe', ch: { spe: -2 }, chance: 100 } });
// --- Rock
M('rockthrow', 'Rock Throw', 'Rock', 'P', 50, 90, 15);
M('rocktomb', 'Rock Tomb', 'Rock', 'P', 60, 95, 15, { stat: { who: 'foe', ch: { spe: -1 }, chance: 100 } });
M('ancientpower', 'Ancient Power', 'Rock', 'S', 60, 100, 5);
M('rockslide', 'Rock Slide', 'Rock', 'P', 75, 90, 10, { flinch: 30 });
M('powergem', 'Power Gem', 'Rock', 'S', 80, 100, 20);
M('stoneedge', 'Stone Edge', 'Rock', 'P', 100, 80, 5, { crit: true });
// --- Ghost
M('lick', 'Lick', 'Ghost', 'P', 30, 100, 30, { status: { s: 'par', chance: 30 } });
M('shadowsneak', 'Shadow Sneak', 'Ghost', 'P', 40, 100, 30, { prio: 1 });
M('nightshade', 'Night Shade', 'Ghost', 'S', 1, 100, 15, { fixed: 'level' });
M('shadowpunch', 'Shadow Punch', 'Ghost', 'P', 60, 0, 20);
M('shadowclaw', 'Shadow Claw', 'Ghost', 'P', 70, 100, 15, { crit: true });
M('shadowball', 'Shadow Ball', 'Ghost', 'S', 80, 100, 15, { stat: { who: 'foe', ch: { spd: -1 }, chance: 20 } });
M('phantomforce', 'Phantom Force', 'Ghost', 'P', 90, 100, 10);
// --- Dragon
M('twister', 'Twister', 'Dragon', 'S', 40, 100, 20, { flinch: 20 });
M('dragontail', 'Dragon Tail', 'Dragon', 'P', 60, 90, 10);
M('dragonbreath', 'Dragon Breath', 'Dragon', 'S', 60, 100, 20, { status: { s: 'par', chance: 30 } });
M('dragonclaw', 'Dragon Claw', 'Dragon', 'P', 80, 100, 15);
M('dragonpulse', 'Dragon Pulse', 'Dragon', 'S', 85, 100, 10);
M('outrage', 'Outrage', 'Dragon', 'P', 120, 100, 10);
M('dracometeor', 'Draco Meteor', 'Dragon', 'S', 130, 90, 5, { stat: { who: 'self', ch: { spa: -2 }, chance: 100 } });
M('dragondance', 'Dragon Dance', 'Dragon', 'X', 0, 0, 20, { stat: { who: 'self', ch: { atk: 1, spe: 1 }, chance: 100 } });
// --- Steel
M('metalclaw', 'Metal Claw', 'Steel', 'P', 50, 95, 35);
M('mirrorshot', 'Mirror Shot', 'Steel', 'S', 65, 85, 10);
M('steelwing', 'Steel Wing', 'Steel', 'P', 70, 90, 25);
M('ironhead', 'Iron Head', 'Steel', 'P', 80, 100, 15, { flinch: 30 });
M('flashcannon', 'Flash Cannon', 'Steel', 'S', 80, 100, 10);
M('irontail', 'Iron Tail', 'Steel', 'P', 100, 75, 15);
M('irondefense', 'Iron Defense', 'Steel', 'X', 0, 0, 15, { stat: { who: 'self', ch: { def: 2 }, chance: 100 } });
// --- Dark (coverage for single-type Normal Pokémon)
M('bite', 'Bite', 'Dark', 'P', 60, 100, 25, { flinch: 30 });
M('snarl', 'Snarl', 'Dark', 'S', 55, 95, 15, { stat: { who: 'foe', ch: { spa: -1 }, chance: 100 } });
M('feintattack', 'Feint Attack', 'Dark', 'P', 60, 0, 20);
M('crunch', 'Crunch', 'Dark', 'P', 80, 100, 15, { stat: { who: 'foe', ch: { def: -1 }, chance: 20 } });
M('darkpulse', 'Dark Pulse', 'Dark', 'S', 80, 100, 15, { flinch: 20 });
M('nightslash', 'Night Slash', 'Dark', 'P', 70, 100, 15, { crit: true });

// Damaging moves each type teaches, by tier: [physical, special].
const TYPE_MOVES = {
  Normal:   [['quickattack', 'swift'], ['headbutt', 'swift'], ['bodyslam', 'triattack'], ['doubleedge', 'hyperbeam']],
  Fire:     [['ember', 'ember'], ['firefang', 'flameburst'], ['firepunch', 'flamethrower'], ['flareblitz', 'fireblast']],
  Water:    [['aquajet', 'watergun'], ['razorshell', 'bubblebeam'], ['waterfall', 'surf'], ['crabhammer', 'hydropump']],
  Grass:    [['vinewhip', 'megadrain'], ['razorleaf', 'magicalleaf'], ['seedbomb', 'gigadrain'], ['powerwhip', 'solarbeam']],
  Electric: [['thundershock', 'thundershock'], ['spark', 'shockwave'], ['thunderpunch', 'thunderbolt'], ['wildcharge', 'thunder']],
  Ice:      [['iceshard', 'powdersnow'], ['icefang', 'aurorabeam'], ['icepunch', 'icebeam'], ['iciclecrash', 'blizzard']],
  Fighting: [['rocksmash', 'vacuumwave'], ['lowsweep', 'vacuumwave'], ['brickbreak', 'aurasphere'], ['closecombat', 'focusblast']],
  Poison:   [['poisonsting', 'acid'], ['poisontail', 'venoshock'], ['poisonjab', 'sludgebomb'], ['gunkshot', 'sludgewave']],
  Ground:   [['mudshot', 'mudshot'], ['bulldoze', 'mudbomb'], ['dig', 'earthpower'], ['earthquake', 'earthpower']],
  Flying:   [['peck', 'gust'], ['wingattack', 'aircutter'], ['drillpeck', 'airslash'], ['bravebird', 'hurricane']],
  Psychic:  [['confusion', 'confusion'], ['psychocut', 'psybeam'], ['zenheadbutt', 'psyshock'], ['zenheadbutt', 'psychic']],
  Bug:      [['furycutter', 'strugglebug'], ['bugbite', 'signalbeam'], ['xscissor', 'bugbuzz'], ['megahorn', 'bugbuzz']],
  Rock:     [['rockthrow', 'rockthrow'], ['rocktomb', 'ancientpower'], ['rockslide', 'powergem'], ['stoneedge', 'powergem']],
  Ghost:    [['lick', 'nightshade'], ['shadowsneak', 'nightshade'], ['shadowclaw', 'shadowball'], ['phantomforce', 'shadowball']],
  Dragon:   [['twister', 'twister'], ['dragontail', 'dragonbreath'], ['dragonclaw', 'dragonpulse'], ['outrage', 'dracometeor']],
  Steel:    [['metalclaw', 'metalclaw'], ['steelwing', 'mirrorshot'], ['ironhead', 'flashcannon'], ['irontail', 'flashcannon']],
  Dark:     [['bite', 'snarl'], ['feintattack', 'snarl'], ['crunch', 'darkpulse'], ['nightslash', 'darkpulse']],
};

// The status move each type teaches.
const TYPE_STATUS_MOVE = {
  Normal: 'sing', Fire: 'willowisp', Water: 'withdraw', Grass: 'sleeppowder', Electric: 'thunderwave',
  Ice: 'haze', Fighting: 'bulkup', Poison: 'toxic', Ground: 'defensecurl', Flying: 'agility',
  Psychic: 'calmmind', Bug: 'stringshot', Rock: 'harden', Ghost: 'hypnosis', Dragon: 'dragondance',
  Steel: 'irondefense', Dark: 'swordsdance',
};

// Species with hand-written learnsets.
const LEARNSET_OVERRIDES = {
  10: [[1, 'tackle'], [1, 'stringshot'], [9, 'bugbite']],
  11: [[1, 'tackle'], [1, 'harden']],
  13: [[1, 'poisonsting'], [1, 'stringshot'], [9, 'bugbite']],
  14: [[1, 'poisonsting'], [1, 'harden']],
  129: [[1, 'splash'], [15, 'tackle']],
  132: [[1, 'transform']],
};

// Extra moves added on top of a generated learnset.
const EXTRA_MOVES = {
  4: [[10, 'metalclaw']], 5: [[10, 'metalclaw']], 6: [[10, 'metalclaw']], // Charmander line: answer to Brock, as in FireRed
  150: [[60, 'psystrike']],
};

const TIER_LEVELS = [7, 18, 30, 44];

// Builds a species' learnset: [[level, moveId], ...] sorted by level.
// Every Pokémon learns moves of its own types (physical or special depending on which attack stat is higher),
// a status move for its type, and coverage moves if it only has one type.
const _learnsetCache = {};
function learnsetOf(id) {
  if (_learnsetCache[id]) return _learnsetCache[id];
  if (LEARNSET_OVERRIDES[id]) return (_learnsetCache[id] = LEARNSET_OVERRIDES[id]);
  const p = POKEMON[id];
  const b = p.base;
  const physical = b.atk >= b.spa;
  const mixed = Math.abs(b.atk - b.spa) <= 10;
  const list = [[1, 'tackle'], [1, b.def >= b.atk ? 'tailwhip' : 'growl']];
  const addType = (type, offset, tiers = [0, 1, 2, 3], levels = TIER_LEVELS) => {
    tiers.forEach((tier, i) => {
      const pair = TYPE_MOVES[type][tier];
      const lv = Math.max(1, levels[i] + offset);
      list.push([lv, pair[physical ? 0 : 1]]);
      if (mixed && tier >= 2) list.push([lv + 2, pair[physical ? 1 : 0]]);
    });
  };
  addType(p.types[0], 0);
  list.push([11, TYPE_STATUS_MOVE[p.types[0]]]);
  if (p.types[1]) {
    addType(p.types[1], 4);
    list.push([24, TYPE_STATUS_MOVE[p.types[1]]]);
  } else if (p.types[0] === 'Normal') {
    addType('Dark', 0, [0, 2], [14, 34]);
  } else {
    addType('Normal', 0, [1, 2], [22, 36]);
  }
  for (const extra of EXTRA_MOVES[id] || []) list.push(extra);
  // Sort and drop duplicates, keeping the earliest level.
  list.sort((a, b2) => a[0] - b2[0]);
  const seen = new Set();
  const out = list.filter(([, m]) => (seen.has(m) ? false : (seen.add(m), true)));
  return (_learnsetCache[id] = out);
}
